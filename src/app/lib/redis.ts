import { createClient } from "redis";
import config from "../config";

export const redisClient = createClient({
  username: config.redis_user,
  password: config.redis_password,

  socket: {
    host: config.redis_host,
    port: Number(config.redis_port),

    reconnectStrategy(retries) {
      const delay = Math.min(retries * 500, 5000);

      console.log(
        `Redis reconnecting... attempt ${retries}, retrying in ${delay}ms`,
      );

      return delay;
    },
  },
});

// Very important:
// Prevent Redis errors from becoming an unhandled Node.js error.
redisClient.on("error", (error) => {
  console.error("Redis Client Error:", error);
});

redisClient.on("connect", () => {
  console.log("Redis socket connected.");
});

redisClient.on("ready", () => {
  console.log("Redis client ready.");
});

redisClient.on("reconnecting", () => {
  console.log("Redis reconnecting...");
});

redisClient.on("end", () => {
  console.log("Redis connection closed.");
});
