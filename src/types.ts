/**
  * Types
  */

export interface Env {
    // Resend secrets
    RESEND_API_KEY: string;
    RESEND_WEBHOOK_SECRET: string;

    // Email routing
    PRIMARY_EMAIL: string;
    PROXY_FROM_EMAIL: string;
    PROXY_DOMAIN: string;
    ATTACHMENTS_BASE_URL: string;

    // Cloudflare storage
    proxy_db: D1Database;
    BUCKET: R2Bucket;
}
