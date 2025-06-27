import { Hono } from 'hono'
import OpenGraphScraper from 'open-graph-scraper'

const og = new Hono()

og.post('/', async (context) => {
	const { url } = await context.req.json()

	const res = await OpenGraphScraper({
		url,
	})

	if (res.error) {
		return context.json({
			code: 500,
			message: 'parse error',
			data: null,
		})
	}

	return context.json({
		code: 200,
		message: 'success',
		data: res.result,
	})
})

export default og
