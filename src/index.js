import { createApp } from './app.js';

async function startServer() {
  const app = await createApp();
  app.listen(5000, () => {
    console.log('server running on http://localhost:5000/graphql');
  });
}

startServer().catch(console.error);
