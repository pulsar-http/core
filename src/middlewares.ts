import { error } from "./response";
import type { Middleware } from "./types";

/**
 * A map to track the rate limit information for each client IP.
 */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

/**
 * Configuration options for rate limiting.
 */
export type RateLimitConfig = {
  /**
   * The time window in milliseconds for which the rate limit applies.
   */
  windowMs: number;

  /**
   * The maximum number of requests allowed within the time window.
   */
  maxRequests: number;
};

/**
 * Middleware to enforce rate limiting based on client IP.
 * @param rateLimitConfig - The configuration options for rate limiting.
 * @returns A middleware function that limits the number of requests from a client IP.
 *
 * Example usage:
 * ```typescript
 * import { start, router, text, rateLimitMiddleware } from "@pulsar-http/core";
 *
 * const routes = [
 *     router.get("/api/users", async () => text("User List")),
 * ];
 *
 * const middlewares = [
 *     rateLimitMiddleware({
 *         windowMs: 60000, // 1 minute
 *         maxRequests: 10,
 *     }),
 * ]
 *
 * start({ routes, middlewares });
 * ```
 *
 * In this example, if a client IP makes more than 10 requests within a 1-minute window, subsequent requests will receive a 429 response until the window resets.
 */
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
