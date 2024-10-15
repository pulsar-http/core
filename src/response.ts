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

export const text = (text: string, options: ResponseInit = {}) => {
  return customResponse(text, "text/plain", options);
};

export const file = async (pathToFile: string, options: ResponseInit = {}) => {
  const path = pathToFile.startsWith("/") ? pathToFile.slice(1) : pathToFile;
  const file = Bun.file(path);
  return customResponse(await file.arrayBuffer(), file.type, options);
};

export const json = (data: unknown, options: ResponseInit = {}) => {
  return customResponse(JSON.stringify(data), "application/json", options);
};

export const html = (html: string, options: ResponseInit = {}) => {
  return customResponse(html, "text/html", options);
};

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
