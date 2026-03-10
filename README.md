## Usage

```bash
$ bun install
```

## Available Scripts

In the project directory, you can run:

### `bun run dev`

Runs the app in the development mode.<br>
Open [http://localhost:3001](http://localhost:3001) to view it in the browser.

### `bun run build`

Builds the app for production to the `dist` folder.<br>
It correctly bundles Solid in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.<br>
Your app is ready to be deployed!

## Features

- JWT login/signup flow against `tyange-cms-api`
- Budget dashboard and active-period spend record views
- Total-budget setup and rebalance actions for an active date range
- Per-user API key management page at `/api-keys` for issuing and revoking keys used with `X-API-Key`

## Deployment

This project deploys to AWS (Lightsail/EC2) as static files served by Nginx.

### GitHub Actions workflow

- Workflow: `.github/workflows/deploy.yml`
- Trigger: `push` on `main` or manual `workflow_dispatch`
- Flow:
1. checkout
2. bun install
3. build (`dist`)
4. upload `dist` by SCP
5. switch `current` symlink to new release
6. `nginx -t` and `systemctl reload nginx`

### Required GitHub Secrets

- `HOST`
- `USER_NAME`
- `PRIVATE_SSH_KEY`

### Required GitHub Variables

- `DEPLOY_PATH` (example: `/var/www/tyange-dashboard`)
- `VITE_CMS_API_BASE_URL` (example: `https://tyange.com/api/cms`)

If `VITE_CMS_API_BASE_URL` is not set in CI, build is configured to fail fast.

### Server setup (one-time)

1. Install and enable Nginx
2. Create deploy path (`/var/www/tyange-dashboard`)
3. Configure Nginx root to `/var/www/tyange-dashboard/current`
4. Add SPA fallback: `try_files $uri $uri/ /index.html;`
5. Run `sudo nginx -t && sudo systemctl reload nginx`

### Rollback

Rollback is symlink-based. To rollback:

1. Point `current` to previous release directory under `releases/`
2. Run `sudo nginx -t && sudo systemctl reload nginx`
