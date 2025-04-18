import { Hono } from 'hono';
import { handle } from 'hono/vercel';
import maimaiRoute from './maimai';
import baseRoute from './base';

export const runtime = 'edge';

const app = new Hono().basePath('/api');

app.route('/maimai', maimaiRoute);

app.route('/', baseRoute);

// 全局错误处理
app.onError((err, context) => {
	context.status(500);
	// console.error()

	return context.json({
		code: 500,
		data: null,
		message: err.message,
	});
});

export const GET = handle(app);
export const POST = handle(app);
