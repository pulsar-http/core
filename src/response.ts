/**
 * Creates a custom response with the specified body, content type, and options.
 * @param body - The response body, which can be of type BodyInit or null.
 * @param contentType - The Content-Type header for the response. Defaults to an empty string.
 * @param options - Optional response initialization options.
 * @returns A Response object with the specified body, headers, and options.
 *
 * Example usage:
 * ```typescript
 * import { start, router, customResponse } from "@pulsar-http/core";
 *
 * const routes = [
 *     router.get("/api/users", async () => customResponse(JSON.stringify({ users: [] }), "application/json", { headers: { "X-Test": "123" } })),
 * ];
 *
 * start({ routes });
 * ```
 *
 * In this example, the response will have a JSON body, a Content-Type header of "application/json" and a custom "X-Test" header.
 */
export const customResponse = (
  body: BodyInit | null,
  contentType: string = "",
  options: ResponseInit = {},
) => {
  return new Response(body, {
    ...options,
    headers: {
      ...(contentType ? { "Content-Type": contentType } : {}),
      ...(options.headers || {}),
    },
  });
};

/**
 * Creates a plain text response.
 * @param text - The response body as a plain text string.
 * @param options - Optional response initialization options.
 * @returns A Response object with the specified plain text content.
 *
 * Example usage:
 * ```typescript
 * import { start, router, text } from "@pulsar-http/core";
 *
 * const routes = [
 *    router.get("/", async () => text("Hello, World!")),
 * ];
 *
 * start({ routes });
 * ```
 *
 * In this example, the response will have a plain text body with the content "Hello, World!".
 */
export const text = (text: string, options: ResponseInit = {}) => {
  return customResponse(text, "text/plain", options);
};

/**
 * Creates a response for serving a file.
 * @param pathToFile - The path to the file to be served.
 * @param options - Optional response initialization options.
 * @returns A Response object containing the file data.
 *
 * Example usage:
 * ```typescript
 * import { start, router, file } from "@pulsar-http/core";
 *
 * const routes = [
 *   router.get("/", async () => file("public/index.html")),
 * ];
 *
 * start({ routes });
 * ```
 *
 * In this example, the response will serve the file located at "public/index.html".
 */
export const file = async (pathToFile: string, options: ResponseInit = {}) => {
  const path = pathToFile.startsWith("/") ? pathToFile.slice(1) : pathToFile;
  const file = Bun.file(path);
  return customResponse(await file.arrayBuffer(), file.type, options);
};

/**
 * Creates a JSON response.
 * @param data - The data to be serialized as JSON.
 * @param options - Optional response initialization options.
 * @returns A Response object with the specified JSON content.
 *
 * Example usage:
 * ```typescript
 * import { start, router, json } from "@pulsar-http/core";
 *
 * const routes = [
 *    router.get("/api/users", async () => json({ users: [] })),
 * ];
 *
 * start({ routes });
 * ```
 *
 * In this example, the response will have a JSON body with the content `{ "users": [] }`.
 */
export const json = (data: unknown, options: ResponseInit = {}) => {
  return customResponse(JSON.stringify(data), "application/json", options);
};

/**
 * Creates an HTML response.
 * @param html - The response body as an HTML string.
 * @param options - Optional response initialization options.
 * @returns A Response object with the specified HTML content.
 *
 * Example usage:
 * ```typescript
 * import { start, router, html } from "@pulsar-http/core";
 *
 * const routes = [
 *   router.get("/", async () => html("<h1>Hello, World!</h1>")),
 * ];
 *
 * start({ routes });
 * ```
 *
 * In this example, the response will have an HTML body with the content `<h1>Hello, World!</h1>`.
 */
export const html = (html: string, options: ResponseInit = {}) => {
  return customResponse(html, "text/html", options);
};

/**
 * Creates a redirect response.
 * @param location - The URL to which the client should be redirected.
 * @param status - The HTTP status code for the redirect, defaults to 302.
 * @param options - Optional response initialization options.
 * @returns A Response object with the redirect information.
 *
 * Example usage:
 * ```typescript
 * import { start, router, redirect, text } from "@pulsar-http/core";
 *
 * const routes = [
 *   router.get("/old", async () => redirect("/new")),
 *   router.get("/new", async () => text("New Page")),
 * ];
 *
 * start({ routes });
 * ```
 */
export const redirect = (
  location: string,
  status: number = 302,
  options: ResponseInit = {},
) => {
  return customResponse(null, "", {
    ...options,
    status,
    headers: { Location: location, ...(options.headers || {}) },
  });
};

/**
 * Creates a response that streams data from an asynchronous generator.
 * @param generator - An asynchronous generator that yields chunks of data.
 * @param options - Optional response initialization options.
 * @returns A Response object that streams the data.
 *
 * Example usage:
 * ```typescript
 * import { start, router, stream } from "@pulsar-http/core";
 *
 * const routes = [
 *    router.get("/stream", async () => {
 *      async function* dataGenerator() {
 *        yield "Hello, ";
 *        yield "World!";
 *       }
 *
 *      return stream(dataGenerator());
 *    }),
 * ];
 *
 * start({ routes });
 * ```
 *
 * In this example, the response will stream the data "Hello, World!".
 */
export const stream = (
  generator: AsyncGenerator<string | Uint8Array | ArrayBuffer>,
  options: ResponseInit = {},
) => {
  const readableStream = new ReadableStream({
    async pull(controller) {
      for await (const chunk of generator) {
        controller.enqueue(chunk);
      }
      controller.close();
    },
  });

  return customResponse(readableStream, "", options);
};

/**
 * A record of HTTP status codes and their corresponding messages.
 */
const statusMessages: Record<number, string> = {
  400: "Bad Request",
  401: "Unauthorized",
  402: "Payment Required",
  403: "Forbidden",
  404: "Not Found",
  405: "Method Not Allowed",
  406: "Not Acceptable",
  407: "Proxy Authentication Required",
  408: "Request Timeout",
  409: "Conflict",
  410: "Gone",
  411: "Length Required",
  412: "Precondition Failed",
  413: "Payload Too Large",
  414: "URI Too Long",
  415: "Unsupported Media Type",
  416: "Range Not Satisfiable",
  417: "Expectation Failed",
  418: "I'm a teapot",
  421: "Misdirected Request",
  422: "Unprocessable Entity",
  423: "Locked",
  424: "Failed Dependency",
  425: "Too Early",
  426: "Upgrade Required",
  428: "Precondition Required",
  429: "Too Many Requests",
  431: "Request Header Fields Too Large",
  451: "Unavailable For Legal Reasons",
  500: "Internal Server Error",
  501: "Not Implemented",
  502: "Bad Gateway",
  503: "Service Unavailable",
  504: "Gateway Timeout",
  505: "HTTP Version Not Supported",
  506: "Variant Also Negotiates",
  507: "Insufficient Storage",
  508: "Loop Detected",
  510: "Not Extended",
  511: "Network Authentication Required",
};

/**
 * Creates an error response with the specified status code and optional message.
 * @param status - The HTTP status code for the error.
 * @param message - An optional custom message for the error.
 * @param options - Optional response initialization options.
 * @returns A Response object representing the error.
 *
 * Example usage:
 * ```typescript
 * import { start, router, error } from "@pulsar-http/core";
 *
 * const routes = [
 *   router.get("/not-found", async () => error(404, "The page you requested was not found.")),
 * ];
 *
 * start({ routes });
 * ```
 *
 * In this example, the response will have a 404 status code and the message "The page you requested was not found.".
 */
export const error = (
  status: number,
  message?: string,
  options: ResponseInit = {},
) => {
  return customResponse(
    message || statusMessages[status] || "Unknown Error",
    "",
    { ...options, status },
  );
};
