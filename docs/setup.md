# Setup

## Offline evaluation

Install the pinned Node and pnpm versions. Run `npm install --global pnpm@10.22.0` to install the package manager at the exact version in `packageManager`.

```sh
pnpm install --frozen-lockfile
pnpm check
pnpm build:offline
pnpm start:offline
```

Visit `http://localhost:3000/preview`. This path uses local synthetic documents and the application editor. It has no account, translation request, persistence or export integration. The offline runner replaces inherited service settings with `.env.example` and blocks external connections in the Node processes. Stop it with Ctrl+C.

`pnpm dev:offline` starts the same local preview with the development server. A normal build is retained for `start:offline`; remove only your own disposable `.next/` output after its final use.

## Connected application

1. Copy `.env.example` to `.env.local` and replace each placeholder with a setting for services you control. Keep this file out of Git.
2. Create a Supabase project or local instance. Apply `supabase/migrations/00000000000000_baseline.sql` to an empty Supabase database with the `pg_cron` and `wrappers` extensions available. The baseline creates the `documents` upload bucket used by `.env.example`. Configure authentication redirects for your application origin and a storage bucket matching the documented upload setting. Review the SQL policies and service-role boundary before use.
3. Configure Google OAuth for browser sign-in. Create a Google service account with access to the Docs and Drive APIs and its own export folders. Base64-encode the service-account JSON into the documented server setting. Do not give the browser the private key.
4. Configure OpenAI and Trigger.dev for translation tasks. `trigger.config.ts` declares the task directory, retries, time limit and MuPDF system package. Use the Trigger CLI with your own account; synchronize the validated server settings through your service configuration.
5. Configure Stripe products and checkout settings and route signed webhook events to `/api/payment/webhook`. Product prices are loaded through the application adapters. For the database analytics adapter, store your Stripe key in Supabase Vault under `STRIPE_SECRET_KEY` and call `public.install_stripe_secret()` as a database administrator. The foreign-data server starts with an inert key reference; do not query it until configured.
6. Configure Resend and verify your sender domain.
7. Run `pnpm dev`, or run `pnpm build` followed by `pnpm start` with the same environment.

The connected application makes outbound requests and can create billable work. Offline commands remain available without these services. Verto does not provision or deploy accounts automatically.

## Commands

| Command                 | Purpose                                                            |
| ----------------------- | ------------------------------------------------------------------ |
| `pnpm dev:offline`      | Local synthetic editor preview                                     |
| `pnpm build:offline`    | Production build with inert settings and an outbound-network guard |
| `pnpm start:offline`    | Serve that build locally                                           |
| `pnpm check`            | Format, lint, type and engine coverage checks                      |
| `pnpm test`             | Offline engine suite                                               |
| `pnpm test:coverage`    | Measured core-transform coverage                                   |
| `pnpm format`           | Apply the repository formatter                                     |
| `pnpm quality:markdown` | Check Markdown style                                               |
| `pnpm dev`              | Connected application development                                  |

## Troubleshooting

A configuration error names missing or invalid keys without printing their values. Use `.env.example` as the complete key list. If an offline build attempts an external connection, the network guard fails that request; inspect the import or prerender path rather than supplying a production credential.

Live provider access is outside the offline suite. Confirm permissions, callback origins, quotas and third-party licensing with the relevant service documentation.
