import { Hono } from 'hono';
import { getRedisCache, setRedisCache } from '@/lib/redis';

const maimai = new Hono();
const bestKey = 'maimai:best';
const playerKey = 'maimai:player';
const expireTime = 30;

const maimaiToken = process.env.MAIMAI as string;

// b50
maimai.get('/best', async (context) => {
	const cacheData = await getRedisCache(bestKey, expireTime);

	if (cacheData) {
		return context.json(cacheData);
	}

	const res = await fetch(
		'https://maimai.lxns.net/api/v0/user/maimai/player/bests',
		{
			headers: {
				'X-User-Token': maimaiToken,
			},
		},
	);

	const data = await res.json();

	await setRedisCache(bestKey, data);

	return context.json(data);
});

// 玩家数据
maimai.get('/player', async (context) => {
	const cacheData = await getRedisCache(playerKey, expireTime);

	if (cacheData) {
		return context.json(cacheData);
	}

	const res = await fetch('https://maimai.lxns.net/api/v0/user/maimai/player', {
		headers: {
			'X-User-Token': maimaiToken,
		},
	});

	const data = await res.json();

	await setRedisCache(playerKey, data);

	return context.json(data);
});

export default maimai;
