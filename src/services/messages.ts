import fs from "fs";
import path from "path";

interface MessagesConfig {
  [key: string]: string;
}

const messagesPath = path.resolve(__dirname, "../../config/messages.json");
const messages: MessagesConfig = JSON.parse(
  fs.readFileSync(messagesPath, "utf-8")
);

export function getMessage(
  key: string,
  vars: Record<string, string | number> = {}
): string {
  let text = messages[key] ?? `[Missing message: ${key}]`;

  for (const [k, v] of Object.entries(vars)) {
    text = text.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
  }

  return text;
}
