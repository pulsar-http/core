import { expect, describe, it } from "bun:test";

import {
  router,
  handleRoutes,
  text,
  json,
  html,
  file,
  redirect,
  stream,
  error,
} from "../src";

describe("response", () => {
  it("should return a text response", async () => {
    const routes = [router.get("/", async () => text("Hello, World!"))];

    const request = new Request("http://localhost:3000/");
    const routeHandler = await handleRoutes(routes);
    const response = await routeHandler(request);
    const responseAsText = await response.text();

    expect(responseAsText).toEqual("Hello, World!");
    expect(response.headers.get("content-type")).toEqual("text/plain");
  });

  it("should return a file response", async () => {
    const routes = [
      router.get("/", async () => file("tests/assets/index.html")),
    ];

    const request = new Request("http://localhost:3000/");
    const routeHandler = await handleRoutes(routes);
    const response = await routeHandler(request);
    const responseAsText = await response.text();

    const localFile = Bun.file("tests/assets/index.html");

    expect(responseAsText).toEqual(await localFile.text());
    expect(response.headers.get("content-type")).toEqual(
      "text/html;charset=utf-8",
    );
  });

  it("should return a JSON response", async () => {
    const routes = [
      router.get("/", async () => json({ message: "Hello, World!" })),
    ];

    const request = new Request("http://localhost:3000/");
    const routeHandler = await handleRoutes(routes);
    const response = await routeHandler(request);
    const responseAsJson = await response.json();

    expect(responseAsJson).toEqual({ message: "Hello, World!" });
    expect(response.headers.get("content-type")).toEqual("application/json");
  });

  it("should return an HTML response", async () => {
    const routes = [
      router.get("/", async () => html("<h1>Hello, World!</h1>")),
    ];

    const request = new Request("http://localhost:3000/");
    const routeHandler = await handleRoutes(routes);
    const response = await routeHandler(request);
    const responseAsText = await response.text();

    expect(responseAsText).toEqual("<h1>Hello, World!</h1>");
    expect(response.headers.get("content-type")).toEqual("text/html");
  });

  it("should return a redirect response", async () => {
    const routes = [router.get("/", async () => redirect("/redirected"))];

    const request = new Request("http://localhost:3000/");
    const routeHandler = await handleRoutes(routes);
    const response = await routeHandler(request);

    expect(response.status).toEqual(302);
    expect(response.headers.get("location")).toEqual("/redirected");
  });

  it("should return a stream response", async () => {
    const routes = [
      router.get("/", async () => {
        async function* dataGenerator() {
          yield "Hello, ";
          yield "World!";
        }

        return stream(dataGenerator());
      }),
    ];

    const request = new Request("http://localhost:3000/");
    const routeHandler = await handleRoutes(routes);
    const response = await routeHandler(request);
    const responseAsText = await response.text();

    expect(responseAsText).toEqual("Hello, World!");
  });

  it("should return a 400 error response", async () => {
    const routes = [router.get("/", async () => error(400))];

    const request = new Request("http://localhost:3000/");
    const routeHandler = await handleRoutes(routes);
    const response = await routeHandler(request);
    const responseAsText = await response.text();

    expect(response.status).toEqual(400);
    expect(responseAsText).toEqual("Bad Request");
  });
});
