'use-strict'

import redis from "redis";


const redisClient = redis.createClient({
    host: "localhost",
    port: 6379
});

export default redisClient;