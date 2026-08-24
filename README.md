# Joineazy - Full-Stack Student & Coursework Platform

A modern, full-stack educational portal supporting Student Study Groups, Coursework Management, Question Paper PDF uploads, and Faculty Analytics.

## 🚀 Hosting on Vercel (Step-by-Step Guide)

### 1. Import Repository on Vercel
1. Go to [Vercel Dashboard](https://vercel.com/new).
2. Connect your GitHub account and import `https://github.com/jojo-manuel/jojo-manuel-p-task1.git`.

### 2. Configure Framework & Build Settings
- **Framework Preset**: `Vite` *(Vercel auto-detects this)*
- **Root Directory**: `./`
- **Build Command**: `npm run build` *(Auto-configured in `vercel.json`)*
- **Output Directory**: `frontend/dist` *(Auto-configured in `vercel.json`)*

### 3. Add Environment Variables on Vercel
Before clicking **Deploy**, add these **Environment Variables** under Project Settings:

| Environment Variable | Value |
| :--- | :--- |
| `DATABASE_URL` | `postgresql://neondb_owner:npg_FMWP78gfCaXb@ep-flat-violet-azifb1kv-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=verify-full` |
| `JWT_SECRET` | `joineazy_super_secret_jwt_key_2026` |
| `NODE_ENV` | `production` |

---

## 🛠️ Local Development

```bash
# Install dependencies
npm install

# Start local server
npm start
```
