import "@testing-library/jest-dom";
import { vi } from "vitest";

// Set global mock environment variables for tests
process.env.TELEGRAM_BOT_TOKEN = "mock_bot_token";
process.env.TELEGRAM_CHAT_ID = "mock_chat_id";
process.env.UPSTASH_REDIS_REST_URL = "https://mock-redis.upstash.io";
process.env.UPSTASH_REDIS_REST_TOKEN = "mock_redis_token";

// Mock matchMedia for components that use it (e.g., Framer Motion)
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // Deprecated
    removeListener: vi.fn(), // Deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
