# Private Crypto Arbitrage Research & Paper-Trading Laboratory

A private, browser-based cryptocurrency trading research laboratory focused initially on **single-exchange triangular arbitrage**, using **Binance public market data only**.

> [!IMPORTANT]
> **SAFETY & ISOLATION BOUNDARY**
> - **This application does not execute real trades.**
> - It does NOT require or accept Binance API keys or private credentials.
> - It consumes Binance PUBLIC MARKET DATA only via official public WebSocket and REST endpoints.
> - Prominent UI badges (`RESEARCH MODE`, `NO REAL TRADES`, `SIMULATED CAPITAL ONLY`) are displayed throughout.

---

## 1. System Architecture

```
BINANCE PUBLIC MARKET WEBSOCKET (wss://stream.binance.com:9443)
       │
       ▼
BINANCE WEBSOCKET CLIENT (Auto-reconnect, Stale Data Detection, Heartbeat)
       │
       ▼
MARKET GRAPH NORMALIZER (ExchangeInfo Dynamic Graph, 3-Pair Cycle Discovery)
       │
       ▼
ORDER BOOK & TICK CACHE (In-Memory Microsecond State)
       │
       ▼
TRIANGULAR ARBITRAGE ENGINE (Bid/Ask Direction, VWAP Slippage, Fees, Latency)
       │
       ▼
PAPER TRADING ENGINE (Virtual $10,000 USDT Account, Trade Execution Rules)
       │
       ▼
PRISMA DATABASE (SQLite default / PostgreSQL compatible)
       │
       ▼
NEXT.JS DASHBOARD & WEBSOCKET SERVER (Real-time Broadcast to Browser UI)
```

---

## 2. Core Concepts & Mathematical Models

### Single-Exchange Triangular Arbitrage (Binance)
Calculates whether starting with a virtual amount of USDT results in more USDT after completing a 3-leg cycle:
Example: `USDT -> BTC -> ETH -> USDT`
- **Leg 1**: Buy BTC with USDT using **ASK** price on `BTCUSDT`
- **Leg 2**: Buy ETH with BTC using **ASK** price on `ETHBTC`
- **Leg 3**: Sell ETH for USDT using **BID** price on `ETHUSDT`

### Transparent Accounting Model
1. **Gross Theoretical Profit**: Theoretical final USD at top-of-book prices with zero fees.
2. **Trading Fees**: Configurable maker/taker spot fee deducted per leg ($0.10\% default).
3. **VWAP Order Book Depth Slippage**: Consumes order book depth levels to compute volume-weighted average price.
4. **Liquidity Check**: Marks `INSUFFICIENT_LIQUIDITY` if order book depth is insufficient for virtual trade size.
5. **Latency Simulation**: Configurable total latency delay (Market data + Decision + Execution = Total e.g. 75ms).

---

## 3. Technology Stack

- **Frontend**: Next.js 14 App Router, React, TypeScript, Tailwind CSS, Lucide Icons, Recharts.
- **Backend & Engine**: Node.js, TypeScript, custom WebSocket server (`ws`), Binance Public WebSocket Client.
- **Database**: Prisma ORM with SQLite default (`file:./dev.db`) and PostgreSQL support.

---

## 4. Local Development & Installation

### Prerequisites
- Node.js v18+ and npm installed.

### Setup Instructions

1. **Install Dependencies**:
```bash
cmd /c npm install
```

2. **Initialize Database Schema**:
```bash
cmd /c npm run db:push
```

3. **Run Automated Unit Tests**:
```bash
cmd /c npm test
```

4. **Launch Application & Real-time Server**:
```bash
cmd /c npm run dev
```

5. **Access Dashboard**:
Open your browser at `http://localhost:3000`.

---

## 5. Environment Variables (`.env`)

```env
DATABASE_URL="file:./dev.db"
PORT=3000
WS_PORT=3001
NODE_ENV=development
```

---

## 6. Dashboard Views & Laboratory Navigation

1. **Dashboard**: High-level KPI cards, live opportunities feed, live market overview, P&L chart.
2. **Live Market**: All streaming Binance pairs with Bid, Ask, Spread, Spread %, search, and sorting.
3. **Arbitrage Scanner**: Real-time scanner for all discovered 3-pair paths with filter toggles.
4. **Paper Trading**: Virtual account state ($10,000 USDT default), live execution feed.
5. **Trade History**: Persistent ledger of paper trades with detailed 3-leg breakdown modal and CSV export.
6. **Order Books**: Interactive dual-sided order book depth visualizer for any pair.
7. **Triangular Path**: Step-by-step visual diagram of leg conversions showing rates, fees, and slippage.
8. **Analytics**: Recharts P&L charts, win/loss pie charts, and per-path empirical performance metrics.
9. **Theoretical vs Realistic**: Side-by-side comparative analysis of gross theoretical profit vs realistic profit.
10. **Capital-Size Scaling**: Multi-tier simulation ($100 to $50,000) displaying liquidity drop-off.
11. **Research Logs**: Real-time searchable event terminal.
12. **Settings**: Strategy controls, fee percentage parameters, latency ms, Demo Mode toggle, Reset Paper Account, and Reset Research Data.
13. **System Status**: Real-time health metrics for WebSocket connection, data age, database, and engine uptime.

---

## 7. Safety Declaration

**"This application does not execute real trades."**
It is built strictly as a research and paper-trading laboratory for quantitative evaluation.
