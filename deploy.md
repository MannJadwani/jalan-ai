# Jalan AI Deployment

This app is deployed on a Hostinger VPS.

## Production Server

- SSH user: `root`
- Host: `157.173.220.87`
- App directory: `/var/www/jalan-ai`
- Process manager: `pm2`
- PM2 app name: `jalan-ai`
- Production branch: `main`

The n8n webhook server used by the app is separate:

- n8n URL: `http://117.250.36.98:5678`

Do not commit server passwords, SSH keys, or deployment tokens to this repo.

## Local Pre-Deploy Checks

Run these from the repo root:

```bash
npm test
npm run build
git status --short --branch
```

Only deploy after tests and the production build pass.

## Push Code

Commit and push the intended changes to `main`:

```bash
git add .
git commit -m "your commit message"
git push origin main
```

The VPS deploy pulls from GitHub, so unpushed local changes will not reach production.

## Deploy To Production

SSH into the VPS:

```bash
ssh root@157.173.220.87
```

Then run:

```bash
cd /var/www/jalan-ai
git pull origin main
npm install
npm run build
pm2 restart jalan-ai
pm2 status jalan-ai
```

If dependencies did not change, `npm install` can be skipped. When in doubt, run it.

## One-Line Deploy

From a local terminal:

```bash
ssh root@157.173.220.87 "cd /var/www/jalan-ai && git pull origin main && npm install && npm run build && pm2 restart jalan-ai && pm2 status jalan-ai"
```

## If SSH Host Key Changed

If SSH reports that the host key changed and you have confirmed the VPS was rebuilt or reinstalled, remove the old known-hosts entry:

```bash
ssh-keygen -R 157.173.220.87
ssh -o StrictHostKeyChecking=accept-new root@157.173.220.87
```

## If Password Login Fails

Use the Hostinger VPS browser console and run:

```bash
cd /var/www/jalan-ai
git pull origin main
npm install
npm run build
pm2 restart jalan-ai
pm2 status jalan-ai
```

If the password has changed or password authentication is disabled, reset the root password or add an SSH key from the Hostinger VPS dashboard.

## Post-Deploy Checks

On the VPS:

```bash
pm2 logs jalan-ai --lines 80
pm2 status jalan-ai
```

From your browser, verify the production site loads and the chat/dashboard API routes can reach the n8n webhooks.
