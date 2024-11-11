import { OpenAPIV3 } from "openapi-types";
import {
  ZodFirstPartyTypeKind,
  type ZodRawShape,
  type ZodTypeDef,
  type ZodTypeAny,
} from "zod";

import { html, json } from "../../response";
import { getRawParams } from "../../router";
import type { Middleware, Route } from "../../types";

const defaultResponse = {
  200: {
    description: "Successful response",
  },
  400: {
    description: "Bad request",
  },
  401: {
    description: "Unauthorized",
  },
  403: {
    description: "Forbidden",
  },
};

const findTagFromPath = (route: Route) => {
  const tag = route.path.split("/")[1];
  return tag !== "" ? tag : "index";
};

type GenericZodDef = ZodTypeDef & {
  type?: ZodTypeAny;
  typeName?: ZodFirstPartyTypeKind;
  shape?: () => ZodRawShape;
};

const getBasicType = (def: GenericZodDef): OpenAPIV3.SchemaObject => {
  switch (def.typeName) {
    case "ZodNumber":
      return {
        type: "number",
      };
    case "ZodString":
      return {
        type: "string",
      };
    case "ZodBoolean":
      return {
        type: "boolean",
      };
    case "ZodArray":
      return {
        type: "array",
        items: getBasicType(def?.type?._def),
      };
    case "ZodObject":
      return convertZodSchemaToOpenAPI(def);
    default:
      return {};
  }
};

const convertZodSchemaToOpenAPI = (
  def: GenericZodDef,
): OpenAPIV3.SchemaObject => {
  const shape = def.shape?.();

  if (!shape) {
    return {};
  }

  return Object.entries(shape).reduce<OpenAPIV3.SchemaObject>(
    (acc, [key, value]) => {
      const propertyDef = value._def;
      const type = getBasicType(propertyDef);

      if (!acc.properties) {
        return acc;
      }

      acc.properties[key] = type;

      return acc;
    },
    {
      type: "object",
      properties: {},
    },
  );
};

const generatePaths = (routes: Route[]) => {
  return routes.reduce((acc: OpenAPIV3.PathsObject, route) => {
    const tag = findTagFromPath(route);
    const path = route.path.replace(/:(\w+)/g, "{$1}");
    const method = route.method.toLowerCase();
    const routeParameters = getRawParams(route.path);

    return {
      ...acc,
      [path]: {
        ...(acc[path] || {}),
        [method]: {
          summary: route.openapi?.summary ?? undefined,
          description: route.openapi?.description ?? undefined,
          responses: route.openapi?.responses ?? defaultResponse,
          tags: route.openapi?.tags ?? [tag],
          parameters: routeParameters.map((param) => ({
            name: param,
            in: "path",
            required: true,
            schema: {
              type: "string",
            },
          })),
          requestBody: route.bodyValidator?._def
            ? {
                content: {
                  "application/json": {
                    schema: convertZodSchemaToOpenAPI(
                      route.bodyValidator?._def,
                    ),
                  },
                  "multipart/form-data": {
                    schema: convertZodSchemaToOpenAPI(
                      route.bodyValidator?._def,
                    ),
                  },
                  "text/plain": {
                    schema: convertZodSchemaToOpenAPI(
                      route.bodyValidator?._def,
                    ),
                  },
                },
              }
            : undefined,
        },
      },
    };
  }, {});
};

const generateTags = (routes: Route[]) => {
  const tags = new Set(routes.map(findTagFromPath));
  return Array.from(tags).map((tag) => ({ name: tag }));
};

/**
 * Middleware to generate and serve Swagger UI documentation.
 * @param routes - The routes to generate documentation for.
 * @param document - The OpenAPI document to extend/override the generated documentation.
 * @returns A middleware function that serves the Swagger UI documentation.
 *
 * Example usage:
 * ```typescript
 * import { start, router, json, swaggerMiddleware } from "@pulsar-http/core";
 * import { z } from "zod";
 *
 * const userSchema = z.object({
 *     name: z.string(),
 *     age: z.number(),
 * });
 *
 * const routes = [
 *     router.get("/", async (req) => json({ message: "Hello, world!" })),
 *     router.post('/users', async (req, _, body) => json({
 *         message: "User created",
 *         user: body,
 *     }), userSchema),
 * ];
 *
 * start({
 *     routes,
 *     middlewares: [swaggerMiddleware(routes)],
 * });
 * ```
 *
 * In this example, the `/swagger` route will serve the Swagger UI documentation for the provided routes.
 */
export const swaggerMiddleware =
  (routes: Route[], document?: OpenAPIV3.Document): Middleware =>
  async (request, next) => {
    const pathname = new URL(request.url).pathname;
    const info = {
      title: document?.info?.title || "API Documentation",
      version: document?.info?.version || "3.0.0",
      description: document?.info?.description,
    };

    const spec: OpenAPIV3.Document = {
      openapi: document?.openapi || "3.0.0",
      info: {
        title: info.title,
        version: info.version,
        description: info.description,
      },
      paths: { ...(document?.paths ?? {}), ...generatePaths(routes) },
      tags: [...(document?.tags ?? []), ...generateTags(routes)],
      components: {
        schemas: {},
      },
    };

    if (pathname === "/openapi.json") {
      return json(spec);
    }

    if (pathname === "/swagger") {
      return html(`
        <!DOCTYPE html>
        <html>
            <head>
                <link type="text/css" rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@4/swagger-ui.css">
                <link rel="shortcut icon" href="https://www.svgrepo.com/show/374111/swagger.svg">
                <title>${info.title}I</title>
            </head>
            <body>
                <div id="swagger-ui">
                </div>
                <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@4/swagger-ui-bundle.js"></script>
                <script>
                    const ui = SwaggerUIBundle({
                    "url": "/openapi.json",
                    "dom_id": "#swagger-ui",
                    "layout": "BaseLayout",
                    "deepLinking": true,
                    "showExtensions": true,
                    "showCommonExtensions": true
                    });
                </script>
            </body>
        </html>
      `);
    }

    return next();
  };
