/**
 * Adamas University: Do-Fetch Telegram Proxy Service
 * Infinite Free Storage for Academic Artifacts
 */

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID; // Your private channel/chat ID for storage

export async function uploadToTelegram(file: File | Blob, fileName: string): Promise<{ fileId: string; messageId: number }> {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    throw new Error("Telegram credentials not configured");
  }

  const formData = new FormData();
  formData.append("chat_id", TELEGRAM_CHAT_ID);
  formData.append("document", file, fileName);

  const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendDocument`, {
    method: "POST",
    body: formData,
  });

  const result = await response.json();

  if (!result.ok) {
    throw new Error(`Telegram Upload Failed: ${result.description}`);
  }

  // file_id is for downloading, message_id is for deleting
  return {
    fileId: result.result.document.file_id,
    messageId: result.result.message_id
  };
}

export async function deleteFromTelegram(messageId: number): Promise<boolean> {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    throw new Error("Telegram credentials not configured");
  }

  const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/deleteMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: TELEGRAM_CHAT_ID,
      message_id: messageId
    }),
  });

  const result = await response.json();
  return result.ok;
}

export async function getTelegramFileUrl(fileId: string): Promise<string> {
  if (!TELEGRAM_BOT_TOKEN) {
    throw new Error("Telegram token not configured");
  }

  // 1. Get file path from Telegram
  const pathResponse = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getFile?file_id=${fileId}`);
  const pathResult = await pathResponse.json();

  if (!pathResult.ok) {
    throw new Error(`Failed to get file path: ${pathResult.description}`);
  }

  const filePath = pathResult.result.file_path;

  // 2. Return the temporary download URL
  // Note: These URLs expire after ~1 hour, so we fetch them fresh for each view
  return `https://api.telegram.org/file/bot${TELEGRAM_BOT_TOKEN}/${filePath}`;
}
