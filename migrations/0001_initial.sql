
CREATE TABLE proxy_routes (
    id TEXT PRIMARY KEY,
    proxy_address TEXT NOT NULL,
    sender_address TEXT NOT NULL,
    active INTEGER NOT NULL DEFAULT 1
        CHECK (active IN (0, 1)),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_proxy_routes_sender
    ON proxy_routes(sender_address);

CREATE TABLE messages (
    id TEXT PRIMARY KEY,
    route_id TEXT NOT NULL,
    resend_email_id TEXT NOT NULL UNIQUE,
    original_message_id TEXT,
    subject TEXT,
    direction TEXT NOT NULL
        CHECK (direction IN ('inbound', 'outbound')),
    status TEXT NOT NULL DEFAULT 'processing'
        CHECK (status IN ('processing', 'sent', 'failed')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (route_id) REFERENCES proxy_routes(id)
);

CREATE INDEX idx_messages_route
    ON messages(route_id);
