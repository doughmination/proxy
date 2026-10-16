export interface Env {
  RESEND_API_KEY: string;
  RESEND_WEBHOOK_SECRET: string;

  PRIMARY_EMAIL: string;
  PROXY_FROM_EMAIL: string;
  ATTACHMENTS_BASE_URL: string;

  proxy_db: D1Database;
  BUCKET: R2Bucket;
}
