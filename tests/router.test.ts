import { expect, describe, it } from "bun:test";
import { z } from "zod";

import {
  text,
  router,
  matchRoute,
  processRoute,
  getRawParams,
  getParams,
  getBody,
} from "../src";

describe("router", () => {
  it("should match a basic route", async () => {
    const routes = [router.get("/", async () => text("Hello, World!"))];

    const request = new Request("http://localhost:3000/");
    const route = matchRoute(routes, request);

    expect(route).toEqual({
      method: "GET",
      path: "/",
      handler: expect.any(Function),
    });

    const response = await processRoute(route, request);
    const responseAsText = await response.text();

    expect(responseAsText).toEqual("Hello, World!");
  });

  it("should match a route with path parameters", async () => {
    const routes = [router.get("/:id", async (_, params) => text(params.id))];

    const request = new Request("http://localhost:3000/123");
    const route = matchRoute(routes, request);

    expect(route).toEqual({
      method: "GET",
      path: "/:id",
      handler: expect.any(Function),
    });

    const response = await processRoute(route, request);
    const responseAsText = await response.text();

    expect(responseAsText).toEqual("123");
  });

  it("should match a route with nested path parameters", async () => {
    const routes = [
      router.get("/:id/:name", async (_, params) =>
        text(params.id + params.name),
      ),
    ];

    const request = new Request("http://localhost:3000/123/john");
    const route = matchRoute(routes, request);

    expect(route).toEqual({
      method: "GET",
      path: "/:id/:name",
      handler: expect.any(Function),
    });

    const response = await processRoute(route, request);
    const responseAsText = await response.text();

    expect(responseAsText).toEqual("123john");
  });

  it("should correctly retrieve raw path parameters", async () => {
    const rawParams = getRawParams("/:id/:name/:age");
    expect(rawParams).toEqual(["id", "name", "age"]);
  });

  it("should correctly retrieve path parameters", async () => {
    const routes = [
      router.get("/:id/:name/:age", async (_, params) =>
        text(params.id + params.name + params.age),
      ),
    ];

    const request = new Request("http://localhost:3000/123/john/30");
    const route = matchRoute(routes, request);

    const params = getParams(request, route.path);

    expect(params).toEqual({
      id: "123",
      name: "john",
      age: "30",
    });
  });

  it("should correctly retrieve the request body", async () => {
    const userSchema = z.object({
      name: z.string(),
      email: z.string().email(),
    });

    const myRoute = router.post(
      "/api/users",
      async () => text("User Created"),
      userSchema,
    );

    const request = new Request("http://localhost:3000/api/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ name: "John Doe", email: "john@example.com" }),
    });

    const body = await getBody(request, myRoute);

    expect(body).toEqual({ name: "John Doe", email: "john@example.com" });
  });
});
