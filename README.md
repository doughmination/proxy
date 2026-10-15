# Resend email proxy

This is a proxy to allow me to us both my old and new email addresses, as my current inbox doesn't support multiple API keys or webhooks.


## My plan
```mermaid

flowchart TD
    Sender["External Sender"] -->|Email| Proxy["Email Proxy Worker"]

    Proxy -->|Create or resolve conversation UUID| D1[("Cloudflare D1")]
    Proxy -->|Store attachments| R2[("Cloudflare R2")]
    Proxy -->|Forward email| Resend["Resend"]
    Resend --> Inbox["Primary Email Inbox"]

    Inbox -->|Reply to proxy with conversation UUID| Proxy
    Proxy -->|Validate sender and resolve route| D1
    Proxy -->|Send reply to original sender| Resend
    Resend -->|Deliver reply| Sender

    Inbox -.->|Reply directly instead| Sender

    classDef external fill:#161a1d,stroke:#ba181b,color:#fff
    classDef storage fill:#161a1d,stroke:#e5383b,color:#fff
    class Sender,Inbox external
    class D1,R2 storage
```