/**
 * 数据来源 https://maimai.lxns.net/docs/api/maimai
 */

import { Hono } from 'hono'
import { getRedisCache, setRedisCache, redis } from '@/lib/redis'

// ========================================

const maimai = new Hono()
const bestKey = 'maimai:best'
const playerKey = 'maimai:player'
const songKey = 'maimai:song'
const songHashKey = 'maimai:songHash'
// TODO 增加刷新参数时，可延长缓存时间
const expireTime = 60
const maimaiToken = process.env.MAIMAI as string

// ========================================

async function updateSongs() {
	const resSongList = await (
		await fetch('https://maimai.lxns.net/api/v0/maimai/song/list')
	).json()

	const songs = resSongList.songs as any[]

	await redis.set(songKey, songs)
}

function handleScore(scoreList: any[], songList: any[]) {
	return scoreList.map((score: any) => {
		const song = songList.find((item) => item.id === score.id)
		const levelValue =
			song?.difficulties?.[score.type]?.[score.level_index]?.level_value

		return {
			...score,
			level_value: levelValue ? levelValue.toFixed(1) : score.level,
		}
	})
}

// ========================================

// b50
maimai.get('/best', async (context) => {
	const cacheData = await getRedisCache(bestKey, expireTime)

	if (cacheData) {
		return context.json(cacheData)
	}

	const res = await fetch(
		'https://maimai.lxns.net/api/v0/user/maimai/player/bests',
		{
			headers: {
				'X-User-Token': maimaiToken,
			},
		},
	)

	const bestsRes = await res.json()

	const songList = (await redis.get<any[]>(songKey)) || []

	// 更新曲库
	if (songList.length === 0) {
		await updateSongs()
	}

	const resContent = {
		code: 200,
		message: 'success',
		data: {
			standard: handleScore(bestsRes.data.standard, songList),
			dx: handleScore(bestsRes.data.dx, songList),
		},
	}

	await setRedisCache(bestKey, resContent)

	return context.json(resContent)
})

// 玩家数据
maimai.get('/player', async (context) => {
	const cacheData = await getRedisCache(playerKey, expireTime)

	if (cacheData) {
		return context.json(cacheData)
	}

	const res = await fetch('https://maimai.lxns.net/api/v0/user/maimai/player', {
		headers: {
			'X-User-Token': maimaiToken,
		},
	})

	const data = await res.json()

	await setRedisCache(playerKey, data)

	return context.json(data)
})

// 更新曲库
maimai.post('/song/update', async (context) => {
	const cacheHash = await redis.get<string>(songHashKey)
	const resConfig = await (
		await fetch('https://maimai.lxns.net/api/v0/site/config')
	).json()
	const resSongHash = resConfig.data.resource_hashes.maimai.songs

	if (cacheHash === resSongHash) {
		return context.json({
			code: 200,
			data: null,
			message: 'There is no update yet.',
		})
	}

	await redis.set(songHashKey, resSongHash)

	await updateSongs()

	return context.json({
		code: 200,
		data: null,
		message: 'The song library has been updated.',
	})
})

export default maimai
