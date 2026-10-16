/**
 * Index
 */

import { resend } from "./email/resend-init";
import type { Env } from "./types";
import { createRoute, findRoute } from "./db/d1/routes";
import {
	createMessage,
	findMessage,
	updateMessageStatus,
} from "./db/d1/messages";

interface ReceivedEvent {
	type: string;
	data: {
		email_id: string;
		from: string;
		to: string[];
		subject?: string;
	};
}

interface ReceivedEmail {
	from: string;
	to: string[];
	cc?: string[];
	subject?: string;
	text?: string | null;
	html?: string | null;
	headers?: Record<string, string>;
	message_id?: string | null;
}

function emailAddress(value: string): string {
	const match = value.match(/<([^<>]+)>/);
	return (match?.[1] ?? value).trim().toLowerCase();
}

function conversationId(subject: string): string | null {
	const match = subject.match(
		/\b([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\b/i,
	);

	return match?.[1] ?? null;
}

function withConversationId(subject: string, id: string): string {
	if (conversationId(subject) === id) return subject;
	return `${subject} - ${id}`;
}

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		const url = new URL(request.url);

		if (request.method === "GET" && url.pathname === "/") {
			return Response.json({ service: "email-proxy", ok: true });
		}

		if (request.method !== "POST" || url.pathname !== "/resend-endpoint") {
			return new Response("Not found", { status: 404 });
		}

		const signatureHeaders = {
			id: request.headers.get("svix-id") ?? "",
			timestamp: request.headers.get("svix-timestamp") ?? "",
			signature: request.headers.get("svix-signature") ?? "",
		};

		const payload = await request.text();

		let event: ReceivedEvent;

		try {
			const client = resend(env);

			event = client.webhooks.verify({
				payload,
				headers: signatureHeaders,
				webhookSecret: env.RESEND_WEBHOOK_SECRET,
			}) as ReceivedEvent;
		} catch {
			return new Response("Invalid webhook signature", {
				status: 401,
			});
		}

		if (event.type !== "email.received") {
			return Response.json({ received: true });
		}

		const emailId = event.data?.email_id;

		if (!emailId) {
			return new Response("Missing email ID", { status: 400 });
		}

		// Basic idempotency: don't process an event we've already recorded.
		const existing = await findMessage(env.proxy_db, emailId);

		if (existing) {
			return Response.json({ received: true, duplicate: true });
		}

		const client = resend(env);

		const { data: email, error } = await client.emails.receiving.get(emailId);

		if (error || !email) {
			console.error("Unable to retrieve received email", error);
			return new Response("Could not retrieve email", {
				status: 502,
			});
		}

		const received = email as unknown as ReceivedEmail;
		const sender = emailAddress(received.from);
		const primary = env.PRIMARY_EMAIL.toLowerCase();
		const subject = received.subject?.trim() || "(no subject)";
		const idFromSubject = conversationId(subject);

		let route = idFromSubject
			? await findRoute(env.proxy_db, idFromSubject)
			: null;

		// Replies from your primary inbox must identify an existing route.
		if (sender === primary && !route) {
			return new Response("Unknown conversation", { status: 404 });
		}

		if (route && route.sender_address !== sender && sender !== primary) {
			return new Response("Sender does not match conversation", {
				status: 403,
			});
		}

		if (!route) {
			const proxyAddress = received.to?.[0];

			if (!proxyAddress) {
				return new Response("Missing recipient", { status: 400 });
			}

			if (sender === primary) {
				return new Response("Cannot start a conversation from the inbox", {
					status: 400,
				});
			}

			route = {
				id: crypto.randomUUID(),
				proxy_address: emailAddress(proxyAddress),
				sender_address: sender,
				active: 1,
			};

			await createRoute(env.proxy_db, route);
		}

		const outboundReply = sender === primary;
		const messageId = crypto.randomUUID();

		await createMessage(env.proxy_db, {
			id: messageId,
			route_id: route.id,
			resend_email_id: emailId,
			original_message_id: received.message_id ?? null,
			subject,
			direction: outboundReply ? "outbound" : "inbound",
		});

		try {
			const body =
				received.text ??
				received.html ??
				"(This email has no readable text body.)";

			const result = await client.emails.send({
				from: env.PROXY_FROM_EMAIL,
				to: outboundReply ? route.sender_address : primary,
				replyTo: outboundReply ? undefined : route.proxy_address,
				subject: outboundReply
					? subject
					: withConversationId(subject, route.id),
				text: outboundReply
					? body
					: [
							"New Proxied Email!",
							`From: ${received.from}`,
							`CC: ${(received.cc ?? []).join(", ") || "None"}`,
							"",
							"Contents:",
							body,
						].join("\n"),
			});

			if (result.error) {
				throw new Error(result.error.message);
			}

			await updateMessageStatus(env.proxy_db, messageId, "sent");

			return Response.json({
				received: true,
				conversation: route.id,
			});
		} catch (error) {
			console.error("Email delivery failed", error);

			await updateMessageStatus(env.proxy_db, messageId, "failed");

			return new Response("Email delivery failed", {
				status: 502,
			});
		}
	},
};
