import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";
import {
  uploadToTelegram,
  deleteFromTelegram,
  getTelegramFileUrl,
} from "../telegram";

const handlers = [
  // Mock uploadToTelegram
  http.post("https://api.telegram.org/bot*/sendDocument", () => {
    return HttpResponse.json({
      ok: true,
      result: {
        document: { file_id: "test_file_id_123" },
        message_id: 456,
      },
    });
  }),

  // Mock deleteFromTelegram
  http.post("https://api.telegram.org/bot*/deleteMessage", () => {
    return HttpResponse.json({ ok: true });
  }),

  // Mock getFile for URL retrieval
  http.get("https://api.telegram.org/bot*/getFile", ({ request }) => {
    const url = new URL(request.url);
    const fileId = url.searchParams.get("file_id");

    if (fileId === "error_id") {
      return HttpResponse.json(
        { ok: false, description: "File not found" },
        { status: 404 },
      );
    }

    return HttpResponse.json({
      ok: true,
      result: { file_path: "documents/test_file.pdf" },
    });
  }),
];

const server = setupServer(...handlers);

describe("Telegram Proxy Service", () => {
  beforeAll(() => {
    server.listen();
  });

  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it("uploads a file correctly and returns IDs", async () => {
    const mockFile = new Blob(["test content"], { type: "text/plain" });
    const result = await uploadToTelegram(mockFile as any, "test.txt");

    expect(result.fileId).toBe("test_file_id_123");
    expect(result.messageId).toBe(456);
  });

  it("deletes a message correctly", async () => {
    const result = await deleteFromTelegram(456);
    expect(result).toBe(true);
  });

  it("generates a fresh download URL", async () => {
    const url = await getTelegramFileUrl("test_file_id_123");
    expect(url).toContain(
      "https://api.telegram.org/file/botmock_bot_token/documents/test_file.pdf",
    );
  });

  it("handles Telegram errors gracefully", async () => {
    await expect(getTelegramFileUrl("error_id")).rejects.toThrow(
      "Failed to get file path: File not found",
    );
  });
});
