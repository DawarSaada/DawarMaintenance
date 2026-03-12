import express from "express";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
import { createServer as createViteServer } from "vite";
import webpush from 'web-push';
import bodyParser from 'body-parser';

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

  app.use(bodyParser.json());

  // VAPID keys
  const publicVapidKey = process.env.VAPID_PUBLIC_KEY || 'BBQlCknLDMoHmHNNvJkuICi8FMxVUTE4ibFwd0PlRPU2JIWxdrHCzXblNBxOTVuItwfmQn9H9j2KI6tslkdLNc0';
  const privateVapidKey = process.env.VAPID_PRIVATE_KEY || 'KRwpt6dW9vOFtE3IuviB3DGoGxKiWOKrCzn8eydaSg4';
  const vapidEmail = process.env.VAPID_EMAIL || 'mailto:admin@dawarsaada.com';

  webpush.setVapidDetails(
    vapidEmail,
    publicVapidKey,
    privateVapidKey
  );

  const subscriptions: webpush.PushSubscription[] = [];

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.get('/api/push/vapid-key', (req, res) => {
    res.json({ publicKey: publicVapidKey });
  });

  app.post('/api/push/subscribe', (req, res) => {
    const subscription = req.body;
    subscriptions.push(subscription);
    console.log('Push Subscription received:', subscription);
    res.status(201).json({ message: 'Subscription received.' });
  });

  app.post('/api/push/send', (req, res) => {
    const { title, body, url } = req.body;
    const payload = JSON.stringify({ title, body, url });

    Promise.all(subscriptions.map(sub => webpush.sendNotification(sub, payload)))
      .then(() => res.status(200).json({ message: 'Notifications sent successfully.' }))
      .catch(error => {
        console.error('Error sending notifications:', error);
        res.status(500).json({ error: 'Failed to send notifications.' });
      });
  });

  // Serve static files in production
  if (process.env.NODE_ENV === "production") {
    app.use(express.static(join(__dirname, '../dist')));
    // For any other route, serve the index.html (SPA fallback)
    app.get('*', (req, res) => {
      res.sendFile(join(__dirname, '../dist', 'index.html'));
    });
  }

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }

  if (process.env.NODE_ENV !== "production" || process.env.VERCEL_ENV === "development") {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }

  return app;
}

// Start the server and export for Vercel
const app = await startServer();
export default app;
