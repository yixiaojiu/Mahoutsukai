/**
 * 数据来源 https://maimai.lxns.net/docs/api/maimai
 */

import { Hono } from 'hono'
import { getRedisCache, setRedisCache, redis } from '@/lib/redis'

// ========================================

const maimai = new Hono()
const songKey = 'maimai:song'
const songHashKey = 'maimai:songHash'
const dataKey = 'maimai:data'
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

	return songs
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

maimai.get('/data', async (context) => {
	const cacheData = await getRedisCache(dataKey, expireTime)

	if (cacheData) {
		return context.json(cacheData)
	}

	const [playerRes, playerBestRes] = await Promise.all([
		fetch('https://maimai.lxns.net/api/v0/user/maimai/player', {
			headers: {
				'X-User-Token': maimaiToken,
			},
		}),
		fetch('https://maimai.lxns.net/api/v0/user/maimai/player/bests', {
			headers: {
				'X-User-Token': maimaiToken,
			},
		}),
	])

	if (playerRes.status !== 200) {
		return context.json(playerRes)
	}

	if (playerBestRes.status !== 200) {
		return context.json(playerBestRes)
	}

	const playerData = await playerRes.json()

	const playerBestData = await playerBestRes.json()

	let songList = (await redis.get<any[]>(songKey)) || []

	// 更新曲库
	if (songList.length === 0) {
		songList = await updateSongs()
	}

	const resContent = {
		code: 200,
		message: 'success',
		data: {
			score: {
				standard: handleScore(playerBestData.data.standard, songList),
				dx: handleScore(playerBestData.data.dx, songList),
			},
			player: playerData.data,
		},
	}

	await setRedisCache(dataKey, resContent)

	return context.json(resContent)
})

/**
 * 更新曲库
 * 注册了定时任务，每天的13点执行
 * vercel cron 不支持 post 请求
 */
maimai.get('/song/update', async (context) => {
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
