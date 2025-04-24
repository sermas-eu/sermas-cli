import { DialogueMemoryMessageDto } from "@sermas/api-client";
import colors from "cli-color";

export const formatHistory = (
  history: DialogueMemoryMessageDto[],
  print = false,
): string[] => {
  const messages: string[] = [];
  for (const message of history) {
    const color =
      (message.role as any) === "user" ? colors.white.bold : colors.cyan.bold;

    // console.warn(message);

    if (message.type !== undefined && message.type !== "message") {
      const line1 = `[${message.type}] ${message.content}`;
      messages.push(line1);
      if (print) console.log(colors.magenta.italic(line1));
      continue;
    }

    messages.push(`${message.role}: ${message.content}`);
    if (print) console.log(`${color(message.role)}: ${message.content}`);
  }
  return messages;
};
