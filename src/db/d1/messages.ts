export interface NewMessage {
  id: string;
  route_id: string;
  resend_email_id: string;
  original_message_id: string | null;
  subject: string;
  direction: "inbound" | "outbound";
}

export async function findMessage(
  db: D1Database,
  resendEmailId: string,
): Promise<NewMessage | null> {
  return db
    .prepare(
      `SELECT id, route_id, resend_email_id,
              original_message_id, subject, direction
       FROM messages
       WHERE resend_email_id = ?`,
    )
    .bind(resendEmailId)
    .first<NewMessage>();
}

export async function createMessage(
  db: D1Database,
  message: NewMessage,
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO messages
       (id, route_id, resend_email_id, original_message_id,
        subject, direction)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      message.id,
      message.route_id,
      message.resend_email_id,
      message.original_message_id,
      message.subject,
      message.direction,
    )
    .run();
}

export async function updateMessageStatus(
  db: D1Database,
  id: string,
  status: "processing" | "sent" | "failed",
): Promise<void> {
  await db
    .prepare("UPDATE messages SET status = ? WHERE id = ?")
    .bind(status, id)
    .run();
}
