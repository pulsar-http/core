import { ZodSchema, type infer as zInfer } from "zod";
import { OpenAPIV3 } from "openapi-types";
import { type WebSocketHandler } from "bun";

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
 * @param body - The request body, validated against a Zod schema.
 * @returns A promise resolving to an HTTP response.
 */
export type RouterHandler<Body = any> = (args: {
  request: Request;
  pathParams: Record<string, string>;
  body: Body;
}) => Promise<Response>;

/** Defines the base properties for a route. */
export type BaseRoute = {
  /** The HTTP method for the route (e.g., GET, POST). */
  method: HTTPMethod;

  /** The path for the route, e.g., "/api/users". */
  path: string;

  /** The handler function that processes the request and generates a response. */
  handler: RouterHandler;
};

/** Defines the different options that can be set for a route. */
export type RouteOptions<
  BodySchema extends ZodSchema<any> = ZodSchema<any>,
  ResponseSchema extends ZodSchema<any> = ZodSchema<any>,
> = {
  openApi?: OpenAPIV3.OperationObject;
  bodySchema?: BodySchema;
  responseSchema?: ResponseSchema;
};

/** Defines a route for handling specific HTTP requests. */
export type Route<
  BodySchema extends ZodSchema<any> = ZodSchema<any>,
  ResponseSchema extends ZodSchema<any> = ZodSchema<any>,
> = BaseRoute & {
  options?: RouteOptions<BodySchema, ResponseSchema>;
};

/**
 * A namespace for grouping multiple routes under a common path.
 */
export type RouteNamespace = {
  /** The base path for the namespace, which prefixes all contained routes. */
  path: string;

  /** An array of routes that fall under this namespace. */
  routes: (BaseRoute | RouteNamespace)[];
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
export type ServerOptions<WebsocketDataType> = {
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

  /**
   * Websocket default Bun options with additional upgrade options allowing to pass headers and data.
   * When upgrade is provided, the websocket handler will be called with the provided headers and data.
   */
  websocket?: WebSocketHandler<WebsocketDataType> & {
    options?: {
      /** Function that returns whether the request can be upgraded to a websocket connection. (i.e.: must be logged in) */
      canUpgrade?: (req: Request) => Promise<boolean>;

      /** Function that returns the headers and data to be used in the websocket connection. */
      upgrade?: (req: Request) => Promise<{
        headers?: HeadersInit;
        data?: WebsocketDataType;
      }>;
    };
  };
};

/**
 * Function to create a new route.
 * @typeParam PathParams - An optional type for path parameters, defaults to a string key-value object.
 * @param path - The path for the route.
 * @param handler - The handler function for the route.
 * @returns A new route object.
 */
export type RouteBuilder = <
  BodySchema extends ZodSchema<any> = ZodSchema<any>,
  ResponseSchema extends ZodSchema<any> = ZodSchema<any>,
>(
  path: string,
  handler: RouterHandler<zInfer<BodySchema>>,
  options?: RouteOptions<BodySchema, ResponseSchema>,
) => Route<BodySchema, ResponseSchema>;
