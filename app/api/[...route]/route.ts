import { Hono } from 'hono';
import { handle } from 'hono/vercel';
import { swaggerUI } from '@hono/swagger-ui';

export const runtime = 'edge';

const app = new Hono().basePath('/api');

app.get('/ui', swaggerUI({ url: '/openapi.yaml' }));

app.get('/hello', c => {
  return c.json({
    message: 'Hello from Hono!',
  });
});

app.get('/maimai/best', async context => {
  const MAIMAI = process.env.MAIMAI as string;

  const res = await fetch('https://maimai.lxns.net/api/v0/user/maimai/player/bests', {
    headers: {
      'X-User-Token': MAIMAI,
    },
  });

  const data = await res.json();

  return context.json(data);
});

app.get('/maimai/player', async context => {
  const MAIMAI = process.env.MAIMAI as string;

  const res = await fetch('https://maimai.lxns.net/api/v0/user/maimai/player', {
    headers: {
      'X-User-Token': MAIMAI,
    },
  });

  const data = await res.json();

  return context.json(data);
});

export const GET = handle(app);
export const POST = handle(app);
