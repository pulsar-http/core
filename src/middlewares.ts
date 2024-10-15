import { error } from "./response";
import type { Middleware } from "./types";

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

type RateLimitConfig = {
  windowMs: number;
  maxRequests: number;
};

export const rateLimitMiddleware: (
  rateLimitConfig: RateLimitConfig,
) => Middleware = (rateLimitConfig) => async (req, next) => {
  const clientIp =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-real-ip");

  if (!clientIp) {
    return error(400, "Could not determine client IP");
  }

  const currentTime = Date.now();

  let rateData = rateLimitMap.get(clientIp);

  if (!rateData) {
    rateData = {
      count: 0,
      resetTime: currentTime + rateLimitConfig.windowMs,
    };
    rateLimitMap.set(clientIp, rateData);
  }

  if (currentTime > rateData.resetTime) {
    rateData.count = 0;
    rateData.resetTime = currentTime + rateLimitConfig.windowMs;
  }

  rateData.count++;

  if (rateData.count > rateLimitConfig.maxRequests) {
    return error(429);
  }

  return next();
};
