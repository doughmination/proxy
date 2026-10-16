# Resend email proxy

This is a proxy to allow me to us both my old and new email addresses, as my current inbox doesn't support multiple API keys or webhooks.


## My plan
```mermaid
flowchart TD
    %% People and inboxes
    Sender["External Sender"]
    Incoming["Incoming Email<br/>clove@doughmination.win"]
    Inbox["Your Main Inbox<br/>clove@doughmination.gay"]
    You["You"]

    %% Proxy infrastructure
    Worker["Cloudflare Worker<br/>Email Proxy"]
    D1[("Cloudflare D1<br/>Conversations & Messages")]
    R2[("Cloudflare R2<br/>Attachments")]
    Resend["Resend Email API"]

    %% Incoming flow
    Sender -->|"1. Sends email"| Incoming
    Incoming -->|"2. Inbound integration / webhook"| Worker
    Worker -->|"3. Create or resolve conversation UUID"| D1
    Worker -->|"4. Store attachments"| R2
    Worker -->|"5. Forward email"| Resend
    Resend -->|"6. Deliver forwarded email"| Inbox

    %% Reply flow
    You -->|"7. Reply to forwarded email"| Inbox
    Inbox -->|"8. Reply-To address on .win"| Incoming
    Incoming -->|"9. Inbound integration / webhook"| Worker
    Worker -->|"10. Validate sender and resolve UUID"| D1
    Worker -->|"11. Send reply to original sender"| Resend
    Resend -->|"12. Deliver reply"| Sender

    %% Optional bypass
    Inbox -.->|"Optional: direct reply bypasses proxy"| Sender

    %% Incoming flow: blue
    linkStyle 0,1,4,5 stroke:#3b82f6,stroke-width:2px

    %% Reply flow: green
    linkStyle 6,7,8,10,11 stroke:#22c55e,stroke-width:2px

    %% Database: purple
    linkStyle 2,9 stroke:#a855f7,stroke-width:2px

    %% Attachments: amber
    linkStyle 3 stroke:#f59e0b,stroke-width:2px

    %% Direct reply: grey dashed
    linkStyle 12 stroke:#94a3b8,stroke-width:2px,stroke-dasharray:5 5

    classDef external fill:#1e293b,stroke:#64748b,color:#f8fafc,stroke-width:2px
    classDef worker fill:#450a0a,stroke:#ef4444,color:#fff,stroke-width:2px
    classDef storage fill:#312e81,stroke:#818cf8,color:#fff,stroke-width:2px
    classDef service fill:#14532d,stroke:#4ade80,color:#fff,stroke-width:2px

    class Sender,Incoming,Inbox,You external
    class Worker worker
    class D1,R2 storage
    class Resend service
```