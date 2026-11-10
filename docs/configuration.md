# Configuration

`src/env.ts` validates each setting at startup. There are no deployment credential defaults. Values in `.env.example` are inert placeholders and cannot authenticate. Browser settings are intentionally visible in the client bundle; all other settings stay on the server.

| Key                                                 | Scope   | Purpose                                                                       |
| --------------------------------------------------- | ------- | ----------------------------------------------------------------------------- |
| `NEXT_PUBLIC_APP_URL`                               | Browser | Application origin and callback URLs.                                         |
| `NEXT_PUBLIC_SUPABASE_URL`                          | Browser | Supabase API origin.                                                          |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`                     | Browser | Publishable Supabase key; database policies enforce access.                   |
| `NEXT_PUBLIC_FILE_UPLOAD_BUCKET`                    | Browser | Upload storage bucket name.                                                   |
| `NEXT_PUBLIC_FILE_UPLOAD_BUCKET_ALLOWED_MIME_TYPES` | Browser | Comma-separated MIME types accepted by the uploader.                          |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID`                      | Browser | Google OAuth web client ID.                                                   |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`                | Browser | Stripe publishable key.                                                       |
| `NEXT_PUBLIC_DISABLE_GOOGLE_ONE_TAP`                | Browser | Boolean string controlling One Tap during development.                        |
| `NEXT_PUBLIC_ENABLE_REACT_QUERY_DEVTOOLS`           | Browser | Boolean string enabling query inspection during development.                  |
| `SUPABASE_SERVICE_ROLE_KEY`                         | Server  | Privileged database and storage key. Never expose to the browser.             |
| `TRIGGER_PROJECT_REF`                               | Server  | Task project reference for your installation.                                 |
| `TRIGGER_SECRET_KEY`                                | Server  | Trigger.dev server API credential.                                            |
| `STRIPE_SECRET_KEY`                                 | Server  | Stripe server credential.                                                     |
| `STRIPE_WEBHOOK_SECRET`                             | Server  | Signing secret for the configured webhook endpoint.                           |
| `RESEND_API_KEY`                                    | Server  | Resend server credential.                                                     |
| `RESEND_FROM_EMAIL`                                 | Server  | Verified sender email address.                                                |
| `OPEN_AI_API_KEY`                                   | Server  | OpenAI API credential for vision, translation and verification.               |
| `GOOGLE_APPLICATION_CREDENTIALS_JSON_BASE64`        | Server  | Base64-encoded Google service-account JSON with client_email and private_key. |
| `DEBUG_GOOGLE_DOCS_GENERATION`                      | Server  | Boolean string enabling document generation diagnostics.                      |

Boolean settings accept only `true` or `false`. URLs must be absolute. Empty values fail validation. Google credentials are parsed and shape-checked when an export adapter is first created; builds do not initialize that adapter.

`NODE_ENV` is supplied by the framework. Node and Next.js also own their runtime settings; application code does not use them as service credentials.

`pnpm build:offline`, `pnpm dev:offline` and `pnpm start:offline` explicitly use `.env.example` and a process-level outbound-network guard. They do not weaken configuration validation for connected application commands.
