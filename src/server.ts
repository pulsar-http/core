import Bun from "bun";
import { log } from "./logger";
import { error } from "./response";
import { handleRoutes } from "./router";
import type { Middleware, Route, RouteNamespace, ServerOptions } from "./types";

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

const getRoutes = (elements: (Route | RouteNamespace)[]): Route[] => {
  return elements.flatMap((element) => {
    if ("routes" in element) {
      return element.routes.map((route) => ({
        ...route,
        path: `${element.path}${route.path}`,
      }));
    }

    return element;
  });
};

export const start = ({
  port,
  middlewares = [],
  routes = [],
}: ServerOptions) => {
  const allRoutes = getRoutes(routes);

  Bun.serve({
    port,
    fetch: async (req: Request) => {
      try {
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
