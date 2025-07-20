import { Hono } from 'hono'
import { handle } from 'hono/vercel'
import maimaiRoute from './maimai'
import bangdreamRoute from './bangdream'
import baseRoute from './base'

export const runtime = 'edge'

const app = new Hono().basePath('/api/edge')

app.route('/maimai', maimaiRoute)
app.route('/bangdream', bangdreamRoute)

app.route('/', baseRoute)

// 全局错误处理
app.onError((err, context) => {
	context.status(500)
	console.error(err)

	return context.json({
		code: 500,
		data: null,
		message: err.message,
	})
})

export const GET = handle(app)
export const POST = handle(app)
