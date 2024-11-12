import {
  Auth,
  type AuthConfig,
  setEnvDefaults,
  createActionURL,
  customFetch,
} from "@auth/core";
import type { Session } from "@auth/core/types";
export { customFetch };
export { AuthError, CredentialsSignin } from "@auth/core/errors";
export type {
  Account,
  DefaultSession,
  Profile,
  Session,
  User,
} from "@auth/core/types";

import { error } from "../../response";
import { type Middleware } from "../../types";

let globalConfig: AuthConfig;

/**
 * Middleware to authenticate users with Auth.js
 * @param config - The Auth.js configuration
 * @returns A middleware function that handles authentication by intercepting requests to the Auth.js callbacks
 *
 * - Install the `@auth/core` package to use this middleware. It contains the providers.
 * - Be sure to set `AUTH_SECRET` in your environment variables.
 * - The `AUTH_BASE_PATH` environment variable can be used to set the base path for the Auth.js routes. The default is `/api/auth`.
 *
 * Example usage:
 * ```typescript
 * import { start, router, authMiddleware, text } from "@pulsar-http/core";
 * import githubAuthProvider from '@auth/core/providers/github';
 *
 * const routes = [
 *     router.get("/", async () => text("Hello world")),
 * ];
 *
 * const auth = authMiddleware({
 *     providers: [
 *         githubAuthProvider({
 *             clientId: "YOUR_CLIENT_ID",
 *             clientSecret: "YOUR_CLIENT_SECRET"
 *         }),
 *     ]
 * });
 *
 * start({
 *     routes,
 *     middlewares: [auth],
 * });
 * ```
 *
 * In this example, the `auth` middleware is added to the server, which will handle authentication for the GitHub provider.
 *
 * If you access the /api/auth/signin route, the user will be redirected to a page containing a link to sign in with GitHub.
 */
export const authMiddleware = (config: AuthConfig): Middleware => {
  return async (req, next) => {
    try {
      setEnvDefaults(process.env, config);
      config.basePath = process.env.AUTH_BASE_PATH ?? "/api/auth";

      globalConfig = config;

      const pathname = new URL(req.url).pathname;

      if (pathname.startsWith(config.basePath)) {
        return Auth(req, config);
      }

      return next();
    } catch (e) {
      if (e instanceof Error) {
        return error(500, e.message);
      }

      throw e;
    }
  };
};

/**
 * Function to get the session data for the current request
 * @param req - The incoming request
 * @returns The session data for the current request
 *
 * This function needs to be used in conjunction with the `authMiddleware` middleware.
 *
 * Example usage:
 * ```typescript
 * import {start, router, authMiddleware, text, getSession} from "@pulsar-http/core";
 * import githubAuthProvider from '@auth/core/providers/github';
 *
 * const routes = [
 *     router.get("/", async ({ request }) => {
 *         const session = await getSession(request);
 *         return text(`Hello, ${session?.user?.name ?? 'guest'}!`);
 *     }),
 * ];
 *
 * const auth = authMiddleware({
 *     providers: [
 *         githubAuthProvider({
 *             clientId: "YOUR_CLIENT_ID",
 *             clientSecret: "YOUR_CLIENT_SECRET"
 *         }),
 *     ]
 * });
 *
 * start({
 *     routes,
 *     middlewares: [auth],
 * });
 * ```
 *
 * In this example, the `getSession` function is used to get the session data for the current request.
 *
 * If you access the /api/auth/signin route and sign in with GitHub, the user's name will be displayed on the page.
 */
export const getSession = async (req: Request): Promise<Session | null> => {
  if (!globalConfig) {
    throw new Error("Auth middleware not initialized");
  }

  const requestUrl = new URL(req.url);
  setEnvDefaults(process.env, globalConfig);
  const url = createActionURL(
    "session",
    requestUrl.protocol,
    new Headers(req.headers),
    process.env,
    globalConfig,
  );

  const response = await Auth(
    new Request(url, { headers: { cookie: req.headers.get("cookie") ?? "" } }),
    globalConfig,
  );

  const { status = 200 } = response;

  const data = await response.json();

  if (!data || !Object.keys(data).length) return null;
  if (status === 200) return data;
  throw new Error(data.message);
};
