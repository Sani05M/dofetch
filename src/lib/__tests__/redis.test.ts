import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";
import { redis } from "../redis";

const handlers = [
  // Mock Upstash Redis REST API
  http.post("https://mock-redis.upstash.io", async ({ request }) => {
    const body = (await request.json()) as any[];
    const command = body[0];

    if (command === "SET") {
      return HttpResponse.json({ result: "OK" });
    }

    if (command === "GET") {
      const key = body[1];
      if (key === "existing_key") {
        return HttpResponse.json({
          result: JSON.stringify({ name: "Adamas Student" }),
        });
      }
      return HttpResponse.json({ result: null });
    }

    if (command === "DEL") {
      return HttpResponse.json({ result: 1 });
    }

    return HttpResponse.json({ error: "Unknown command" }, { status: 400 });
  }),
];

const server = setupServer(...handlers);

describe("Redis Cache Service", () => {
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it("sets a value in the cache", async () => {
    const result = await redis.set("test_key", { foo: "bar" });
    expect(result.result).toBe("OK");
  });

  it("gets a value from the cache (Cache Hit)", async () => {
    const result = await redis.get("existing_key");
    expect(result).toEqual({ name: "Adamas Student" });
  });

  it("returns null for missing keys (Cache Miss)", async () => {
    const result = await redis.get("missing_key");
    expect(result).toBeNull();
  });

  it("deletes a key from the cache", async () => {
    const result = await redis.del("test_key");
    expect(result.result).toBe(1);
  });
});
