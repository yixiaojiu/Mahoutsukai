import { Hono } from 'hono'
import { redis } from '@/lib/redis'
import { swaggerUI } from '@hono/swagger-ui'

const base = new Hono()

base.get('/ui', swaggerUI({ url: '/openapi.yaml' }))

base.get('/error', (context) => {
	throw new Error('encounter some error')
})

base.get('/hello', (context) => {
	return context.json({
		message: 'Hello from Hono!',
	})
})

base.get('/hello/redis', async (context) => {
	const result = await redis.get('test')

	return context.json({ data: result })
})

export default base
