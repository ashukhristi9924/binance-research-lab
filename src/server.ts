import { createServer } from 'http';
import next from 'next';
import { WebSocketServer } from 'ws';
import { engineManager } from './engine/manager';

const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0';
const port = Number(process.env.PORT) || 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

async function main() {
  await app.prepare();

  // Create Next.js HTTP server
  const server = createServer(async (req, res) => {
    try {
      await handle(req, res);
    } catch (err) {
      console.error('Error handling request:', err);
      res.statusCode = 500;
      res.end('Internal Server Error');
    }
  });

  // Attach WebSocket Server directly to HTTP server instance (shares process.env.PORT for Railway)
  const wss = new WebSocketServer({ server });

  wss.on('connection', (ws) => {
    engineManager.registerWsClient(ws);
  });

  // Keep-alive heartbeat to prevent reverse proxies (Railway edge routers) from dropping idle sockets
  setInterval(() => {
    wss.clients.forEach((client) => {
      if (client.readyState === 1) {
        client.ping();
      }
    });
  }, 20000);

  server.listen(port, hostname, async () => {
    console.log(`> Binance Research Laboratory running on http://${hostname}:${port}`);
    console.log(`> Server listening on host 0.0.0.0 port ${port} (process.env.PORT: ${process.env.PORT || '3000'})`);
    console.log(`> WebSocket Broadcaster attached on port ${port}`);

    // Initialize market graph, Binance WS connection, and strategy engines
    await engineManager.initialize();
  });
}

main().catch((err) => {
  console.error('Fatal error starting server:', err);
  process.exit(1);
});
