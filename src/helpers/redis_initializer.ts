import { redis_url } from './constants';
import { createClient } from 'redis';

if (!redis_url) {
    console.log('REDIS URL not found');
}

const client = createClient({
    url: String(redis_url),
    pingInterval: 3000
    })
    .on('error', err => console.log('Redis Client Error', err))
    .connect();


export async function addToRedis (key: string, value: any, expire: number) {
    
    await (await client).set(key, value, {
        EX: expire
    });
    
}

export async function getFromRedis (key: string) {
    
    const data = await (await client).get(key);
    
    return data;

}

export async function delFromRedis (key: string) {
    
    const data = await (await client).del(key)

    return data
}