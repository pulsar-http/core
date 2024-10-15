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

export type RouterHandler<QueryParams = { [key: string]: string }> = (
  request: Request,
  queryParams: QueryParams,
) => Promise<Response>;

export type Route<QueryParams = { [key: string]: string }> = {
  method: HTTPMethod;
  path: string;
  handler: RouterHandler<QueryParams>;
  priority?: number;
};

export type RouteNamespace = {
  path: string;
  routes: Route[];
};

export type Middleware = (
  req: Request,
  next: () => Promise<Response>,
) => Promise<Response>;

export type ServerOptions = {
  port?: number;
  middlewares?: Middleware[];
  routes: (Route | RouteNamespace)[];
};

export type RouteBuilder<QueryParams = { [key: string]: string }> = (
  path: string,
  handler: RouterHandler<QueryParams>,
) => Route<QueryParams>;
