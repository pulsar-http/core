import { expect, describe, it } from "bun:test";

import { start, router, text } from "../src";

describe("server", () => {
  it("should start the server and respond to requests", async () => {
    const routes = [router.get("/", async () => text("Hello, World!"))];

    start({ routes });

    const response = await fetch("http://localhost:3000/");
    const responseAsText = await response.text();

    expect(response.status).toEqual(200);
    expect(responseAsText).toEqual("Hello, World!");
  });
});
