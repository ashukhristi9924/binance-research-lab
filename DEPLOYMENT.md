# Railway Deployment & Local Setup Manual

This document provides instructions for running locally and deploying the **Binance Cryptocurrency Research Laboratory** to **Railway** (or any Node.js cloud platform).

---

## 1. Safety & Architecture Overview

- **100% Research & Paper Trading Only**: The system contains **NO real trading capabilities**, **NO private Binance API keys**, **NO withdrawal or execution permissions**.
- **Binance Public Market Data**: Connects exclusively to Binance's public WebSocket stream (`wss://stream.binance.com:9443`) for real-time market data across 50+ USDT spot pairs.
- **Single-Port Architecture**: The custom Next.js server (`src/server.ts`) handles Next.js frontend page rendering, backend REST API routes, WebSocket client broadcasting, and background strategy processing under a single unified HTTP port (`process.env.PORT`).

---

## 2. Prerequisites

- **Node.js**: v18.x or v20.x
- **Package Manager**: `npm` (v9+)
- **Git**: Installed locally

---

## 3. How to Install Dependencies

Clone the repository and install all required dependencies:

```bash
npm install
```

---

## 4. How to Run Locally

1. Create a local `.env` file (copied from `.env.example`):
   ```bash
   cp .env.example .env
   ```

2. Initialize the local SQLite database schema:
   ```bash
   npm run db:push
   npm run db:generate
   ```

3. Start the local development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to:
   `http://localhost:3000`

---

## 5. How to Build for Production

To compile the TypeScript code, generate the Prisma ORM client, push the database schema, and build the Next.js production bundle:

```bash
npm run build
```

---

## 6. How to Start the Production Server

To start the compiled Next.js custom production server on `process.env.PORT`:

```bash
npm run start
```

---

## 7. Required Environment Variables

| Variable Name | Required | Default Value | Description |
| :--- | :--- | :--- | :--- |
| `DATABASE_URL` | Yes | `file:./dev.db` | Path to SQLite database file |
| `PORT` | Yes (Auto by Railway) | `3000` | Port for HTTP & WebSocket server |
| `NODE_ENV` | Yes | `production` | Environment mode (`production` / `development`) |

> **Note**: **NO Binance API keys or private credentials are required or supported.**

---

## 8. Railway Deployment Requirements

Deploying to Railway requires only **ONE single web service**.

### Step-by-Step Railway Deployment

1. **Push Repository to GitHub**:
   Ensure your code is pushed to a private or public GitHub repository.

2. **Create New Project on Railway**:
   - Log in to [Railway.app](https://railway.app/).
   - Click **New Project** → Select **Deploy from GitHub repo**.
   - Choose your repository (`binance-triangular-arbitrage`).

3. **Configure Environment Variables**:
   In your Railway service settings under **Variables**, add:
   - `DATABASE_URL` = `file:./dev.db`
   - `NODE_ENV` = `production`

4. **Verify Deployment Settings**:
   Railway will automatically detect `package.json` and use:
   - **Build Command**: `npm run build` (`prisma generate && prisma db push && next build`)
   - **Start Command**: `npm run start` (`NODE_ENV=production tsx src/server.ts`)

5. **Generate Public Domain**:
   - In Railway, navigate to **Settings** → **Networking** → Click **Generate Domain**.
   - Your research application will be live at `https://<your-project>.up.railway.app`.

---

## 9. Automated Testing Verification

Before deploying, run the full automated unit test suite:

```bash
npm test
```

Expected result: 31 / 31 test suites passed 100%.
