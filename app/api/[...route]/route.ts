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

app.post('/maimai', context => {
  return context.json({
    message: 'Hello Maimai',
  });
});

export const GET = handle(app);
export const POST = handle(app);
