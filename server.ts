import express from "express";
import { createServer as createViteServer } from "vite";
import webpush from 'web-push';
import bodyParser from 'body-parser';

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

  app.use(bodyParser.json());

  // VAPID keys generation (for demonstration, store securely in production)
  const vapidKeys = webpush.generateVAPIDKeys();
  console.log('VAPID Public Key:', vapidKeys.publicKey);
  console.log('VAPID Private Key:', vapidKeys.privateKey);

  webpush.setVapidDetails(
    'mailto:example@example.com',
    vapidKeys.publicKey,
    vapidKeys.privateKey
  );

  const subscriptions: webpush.PushSubscription[] = [];

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.get('/api/push/vapid-key', (req, res) => {
    res.json({ publicKey: vapidKeys.publicKey });
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
    app.use(express.static('dist'));
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

// Only start the server if not imported as a module (e.g., by Vercel)
if (process.env.NODE_ENV !== "production" || process.env.VERCEL_ENV === "development") {
  startServer();
} else {
  module.exports = startServer();
}
