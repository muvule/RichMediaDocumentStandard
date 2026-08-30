# Deploying the RMD Web Playground & Landing Page

The RMD Interactive Playground & Landing Page is a fast, standalone single-page application built with Vite, React, and Tailwind CSS. It requires zero backend servers and can be hosted for **100% free** on Render, Vercel, Cloudflare Pages, or GitHub Pages.

---

## Option 1: Deploy on Render (Recommended)

Render provides free static site hosting directly connected to your GitHub repository:

1. Push this repository to your GitHub account (e.g. `https://github.com/your-username/rmd-standard`).
2. Go to [dashboard.render.com](https://dashboard.render.com/) and click **New + ➔ Static Site**.
3. Select your GitHub repository.
4. Set the following build settings:
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `packages/playground/dist`
5. Click **Create Static Site**.
6. Render will automatically build and deploy your site to a free `https://rmd-playground.onrender.com` URL with automatic SSL and continuous deployment on every Git push!

*(Alternatively, use the included `render.yaml` Blueprint by clicking "New + ➔ Blueprint" in Render).*

---

## Option 2: Deploy on Vercel (Instant CDN)

1. Go to [vercel.com](https://vercel.com/) and click **Add New ➔ Project**.
2. Import your GitHub repository.
3. Vercel will automatically read `vercel.json`:
   - **Build Command:** `npm run build`
   - **Output Directory:** `packages/playground/dist`
4. Click **Deploy**. Your site will be live on a high-speed global edge network.

---

## Option 3: Deploy on Cloudflare Pages (Free Forever, Zero Limits)

1. Log in to the [Cloudflare Dashboard](https://dash.cloudflare.com/) and go to **Workers & Pages ➔ Create application ➔ Pages ➔ Connect to Git**.
2. Select your repository.
3. Build configuration:
   - **Framework preset:** `Vite`
   - **Build command:** `npm run build`
   - **Build output directory:** `packages/playground/dist`
4. Click **Save and Deploy**. Cloudflare Pages will serve the static site globally with unmetered bandwidth.

---

## Local Development & Testing

To test the landing page and studio locally before deploying:

```bash
# Install dependencies
npm install

# Build all workspaces
npm run build

# Start local dev server (default http://localhost:5173 or 5174)
npm run playground
```
