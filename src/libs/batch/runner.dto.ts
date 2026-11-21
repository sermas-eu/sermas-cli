import { ChatMessage } from "../chat/chat-handler.js";

export type ChatBatchRunnerResult = {
  name: string;
  success: boolean;
  reason?: string;
  messages: ChatMessage[];
};
