import { ChatMessage } from "../chat/chat-handler";

export type ChatBatchRunnerResult = {
  name: string;
  success: boolean;
  reason?: string;
  messages: ChatMessage[];
};
