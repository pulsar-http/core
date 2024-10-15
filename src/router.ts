import { file } from "./response";
import type { HTTPMethod, Route, RouteBuilder, RouterHandler } from "./types";

export const matchRoute = (routes: Route[], request: Request) => {
  const url = new URL(request.url);

  return routes.find((route) => {
    const routePath = route.path.split("/").filter((part) => part !== "");
    const requestPath = url.pathname.split("/").filter((part) => part !== "");

    if (route.method !== request.method) {
      return false;
    }

    if (routePath.length !== requestPath.length) {
      return false;
    }

    for (let i = 0; i < routePath.length; i++) {
      if (routePath[i].startsWith(":")) {
        continue;
      }

      if (routePath[i] !== requestPath[i]) {
        return false;
      }
    }

    return true;
  });
};

export const processRoute = async (
  matchedRoute: Route | undefined,
  request: Request,
) => {
  const url = new URL(request.url);

  if (matchedRoute?.handler) {
    const params = getParams(request, matchedRoute.path);
    return matchedRoute.handler(request, params);
  }

  if (url.pathname.startsWith("/public")) {
    return file(url.pathname);
  }

  return new Response("Not Found", { status: 404 });
};

export const getParams = <T = { [key: string]: string }>(
  request: Request,
  routePath: string,
): T => {
  const url = new URL(request.url);
  const routePathParts = routePath.split("/").filter((part) => part !== "");
  const requestPathParts = url.pathname
    .split("/")
    .filter((part) => part !== "");

  return routePathParts.reduce((acc, part, index) => {
    if (part.startsWith(":")) {
      const key = part.slice(1);
      const value = requestPathParts[index];
      return { ...acc, [key]: value };
    }

    return acc;
  }, {} as T);
};

export const route = <QueryParams = { [key: string]: string }>(
  method: HTTPMethod,
  path: string,
  handler: RouterHandler<QueryParams>,
): Route<QueryParams> => {
  return {
    method,
    path,
    handler,
  };
};

const methods: HTTPMethod[] = [
  "GET",
  "POST",
  "PUT",
  "DELETE",
  "PATCH",
  "OPTIONS",
  "HEAD",
  "CONNECT",
  "TRACE",
  "ALL",
];

export const router = methods.reduce(
  (acc, method) => {
    acc[method.toLowerCase()] = (path: string, handler: RouterHandler) =>
      route(method, path, handler);
    return acc;
  },
  {} as Record<string, RouteBuilder>,
);

export const handleRoutes = async (routes: Route[]) => {
  return async (request: Request) => {
    const route = matchRoute(routes, request);
    return processRoute(route, request);
  };
};
