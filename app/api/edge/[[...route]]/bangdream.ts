/**
 * 数据来源 https://bestdori.com/api/player/cn/1007734059?mode=2
 */

import { Hono } from 'hono'
import { getRedisCache, setRedisCache } from '@/lib/redis'

// ========================================

const bangdream = new Hono()
const dataKey = 'bangdream:data'
const expireTime = 60

const userId_env = process.env.BANGDREAM_USERID as string | undefined

// ========================================

bangdream.get('/data', async (context) => {
	const userId = context.req.param('userId') || userId_env

	if (!userId) {
		context.status(500)
		return context.json({
			code: 500,
			data: null,
			message: 'userId id required',
		})
	}

	// 尝试从缓存获取数据
	const cacheData = await getRedisCache(dataKey, expireTime)
	if (cacheData) {
		return context.json(cacheData)
	}

	const response = await fetch(
		`https://bestdori.com/api/player/cn/${userId}?mode=2`,
	)
	const apiData = await response.json()

	const bandRankList = Object.entries(
		apiData.data.profile.bandRankMap.entries,
	).map(([id, rank]) => ({
		img: `https://bestdori.com/assets/jp/band/logo/${id.padStart(3, '0')}_rip/logoL.png`,
		rank,
	}))

	// ========

	const userMusicClearInfoEntries = Object.entries(
		apiData.data.profile.userMusicClearInfoMap.entries,
	)

	const userMusicClearInfo = Object.fromEntries(
		['clearedMusicCount', 'fullComboMusicCount', 'allPerfectMusicCount'].map(
			(key) => [
				key,
				Object.fromEntries(
					userMusicClearInfoEntries.map((item) => [
						item[0],
						(item[1] as any)[key],
					]),
				),
			],
		),
	)

	// ========

	const userCharacterRank = Object.entries(
		apiData.data.profile.userCharacterRankMap.entries,
	).map(([id, info]) => ({
		img: `https://bestdori.com/res/icon/chara_icon_${id}.png`,
		rank: (info as any).rank,
	}))

	const resContent = {
		code: 200,
		message: 'success',
		data: {
			profile: {
				userId: apiData.data.profile.userId,
				userName: apiData.data.profile.userName,
				rank: apiData.data.profile.rank,
				introduction: apiData.data.profile.introduction,
			},
			bandRankList,
			userMusicClearInfo,
			userCharacterRank,
		},
	}

	// 存入Redis缓存
	await setRedisCache(dataKey, resContent)

	return context.json(resContent)
})

export default bangdream
