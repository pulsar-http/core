/**
 * HTTP methods supported by the server.
 */
export type HTTPMethod =
  | "GET"
  | "POST"
  | "PUT"
  | "DELETE"
  | "PATCH"
  | "OPTIONS"
  | "HEAD"
  | "CONNECT"
  | "TRACE"
  | "ALL";

/**
 * Handler function for a route, which processes the request and returns a response.
 * @typeParam PathParams - An optional type for path parameters, defaults to a string key-value object.
 * @param request - The HTTP request object.
 * @param pathParams - An object representing the path parameters.
 * @returns A promise resolving to an HTTP response.
 */
export type RouterHandler<PathParams = { [key: string]: string }> = (
  request: Request,
  pathParams: PathParams,
) => Promise<Response>;

/**
 * Defines a route for handling specific HTTP requests.
 *
 * @typeParam PathParams - An optional type for path parameters, defaults to a string key-value object.
 */
export type Route<PathParams = { [key: string]: string }> = {
  /**
   * The HTTP method for the route (e.g., GET, POST).
   */
  method: HTTPMethod;

  /**
   * The path for the route, e.g., "/api/users".
   */
  path: string;

  /**
   * The handler function that processes the request and generates a response.
   */
  handler: RouterHandler<PathParams>;

  /**
   * Optional priority for route matching, with higher numbers indicating higher priority.
   */
  priority?: number;
};

/**
 * A namespace for grouping multiple routes under a common path.
 */
export type RouteNamespace = {
  /**
   * The base path for the namespace, which prefixes all contained routes.
   */
  path: string;

  /**
   * An array of routes that fall under this namespace.
   */
  routes: Route[];
};

/**
 * Type of middleware function that processes the request before or after the main route handler.
 * @param req - The HTTP request object.
 * @param next - A function to call the next middleware or route handler.
 * @returns A promise resolving to an HTTP response.
 *
 * Example of a middleware function:
 * ```typescript
 * import { start, router, text, type Middleware } from "@pulsar-http/core";
 *
 * const logMiddleware: Middleware = async (req, next) => {
 *     const response = await next();
 *     console.log(`Request ${req.method} ${req.url} - Response ${response.status}`);
 *     return response;
 * };
 *
 * const routes = [
 *     router.get("/", async () => text("Hello, World!")),
 * ];
 *
 * start({ routes, middlewares: [logMiddleware] });
 * ```
 *
 * In this example, the `logMiddleware` will wait for the next middleware or route handler to finish processing the request, log the request and response information, and then return the response.
 */
export type Middleware = (
  req: Request,
  next: () => Promise<Response>,
) => Promise<Response>;

/**
 * Options for configuring the server.
 */
export type ServerOptions = {
  /**
   * The port number on which the server should listen.
   * @default 3000
   */
  port?: number;

  /**
   * An array of middlewares to be applied to the server.
   * Middlewares are executed in the order they are provided.
   */
  middlewares?: Middleware[];

  /**
   * An array of routes or route namespaces.
   * Routes define the HTTP endpoints served by the server.
   */
  routes: (Route | RouteNamespace)[];
};

/**
 * Function to create a new route.
 * @typeParam PathParams - An optional type for path parameters, defaults to a string key-value object.
 * @param path - The path for the route.
 * @param handler - The handler function for the route.
 * @returns A new route object.
 */
export type RouteBuilder<PathParams = { [key: string]: string }> = (
  path: string,
  handler: RouterHandler<PathParams>,
) => Route<PathParams>;
