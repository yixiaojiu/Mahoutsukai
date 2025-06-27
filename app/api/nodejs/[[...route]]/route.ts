import { Hono } from 'hono'
import { handle } from 'hono/vercel'
import ogRoute from './og'

export const runtime = 'nodejs'

const app = new Hono().basePath('/api/nodejs')

app.route('/og', ogRoute)

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
