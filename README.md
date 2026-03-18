# pipemailer

## Cloudflare Pages/Workers deploy command setup

Keep `wrangler.jsonc` unchanged with:

- `assets.directory: "dist"`

In Cloudflare project settings, use one of these command setups so `dist/` is created before deployment:

- **Build command:** `npm run build`
- **Deploy command:** `npx wrangler deploy`

If your Cloudflare UI only exposes a single deploy/build command field, use:

- `npm run build && npx wrangler deploy`

### Expected deploy log checks

After saving the command settings and triggering a deploy, verify logs include:

1. Vite build completed successfully.
2. `dist/` directory exists (build output produced).
3. Wrangler deploy finished without an `assets.directory` error.
