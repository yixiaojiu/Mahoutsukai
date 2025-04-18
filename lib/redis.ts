import { Redis } from '@upstash/redis';

export const redis = Redis.fromEnv();

/**
 * 向 Redis 中设置数据，并记录当前时间戳
 * @param {string} redisKey Redis 的存储键名
 * @param {any} data 要插入的数据
 */
export async function setRedisCache(redisKey: string, data: any) {
	const timestamp = Date.now();
	const jsonData = JSON.stringify({ ...data, timestamp });

	await redis.set(redisKey, jsonData);
}

/**
 * 从 Redis 中获取数据，并检查数据是否过期
 * @param {string} redisKey Redis 的存储键名
 * @param {number} expire 数据过期时间（秒数）
 */
export async function getRedisCache(redisKey: string, expire: number) {
	const data = await redis.get<any>(redisKey);

	if (!data) return null; // 如果数据不存在，返回 null

	const timestamp = data.timestamp as number; // 获取数据的时间戳
	const now = Date.now(); // 获取当前时间戳

	if (now - timestamp > expire * 1000) return null; // 如果数据过期，返回 null

	return data; // 返回数据
}
