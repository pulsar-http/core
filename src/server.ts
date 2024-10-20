import Bun from "bun";
import { log } from "./logger";
import { error } from "./response";
import { handleRoutes } from "./router";
import type { Middleware, Route, RouteNamespace, ServerOptions } from "./types";

/**
 * Composes middlewares and the final route handler into a single function.
 * @param middlewares - An array of middlewares to be applied.
 * @param routeHandler - The final handler for the route.
 * @returns A composed function that applies the middlewares and then the route handler.
 */
const composeMiddleware = (
  middlewares: Middleware[],
  routeHandler: (req: Request) => Promise<Response>,
) => {
  return async (req: Request): Promise<Response> => {
    let i = 0;

    const next = async (): Promise<Response> => {
      if (i < middlewares.length) {
        const response = await middlewares[i++](req, next);
        if (response) {
          return response;
        }
      }

      return routeHandler(req);
    };

    return next();
  };
};

/**
 * Extracts all routes from an array of elements that can be either routes or route namespaces.
 * @param routes - An array of routes or route namespaces.
 * @returns An array of flattened routes.
 */
const getRoutes = (routes: (Route | RouteNamespace)[]): Route[] => {
  const allRoutes: Route[] = [];

  for (const route of routes) {
    if ("routes" in route) {
      const childRoutes = getRoutes(route.routes).map((childRoute) => ({
        ...childRoute,
        path: `${route.path}${childRoute.path}`,
      }));

      allRoutes.push(...childRoutes);
    } else {
      allRoutes.push(route);
    }
  }

  return allRoutes;
};

/**
 * Starts the server with the provided options.
 * @param options - Configuration options for the server.
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
 * In this example, the server will listen on port 3000 and respond to requests to "/api/users" with a plain text response of "User List".
 *
 * It will also apply rate limiting to restrict clients to 10 requests per minute.
 */
export const start = ({
  port,
  middlewares = [],
  routes = [],
}: ServerOptions) => {
  const allRoutes = getRoutes(routes);

  Bun.serve({
    port,
    fetch: async (req, server) => {
      try {
        const clientIp = server.requestIP(req);

        if (clientIp?.address) {
          req.headers.set("x-real-ip", clientIp.address);
        }

        const routeHandler = await handleRoutes(allRoutes);
        const composedHandlers = composeMiddleware(middlewares, routeHandler);

        let response = await composedHandlers(req);

        if (!response) {
          response = error(404);
        }

        return response;
      } catch (e) {
        return error(500);
      }
    },
  });

  log(`Server started on http://localhost:${port ?? 3000}`);
};
