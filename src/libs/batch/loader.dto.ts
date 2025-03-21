import { AppSettingsDto } from "@sermas/api-client";

export type ChatBatchMessage = {
  message: string;
  // create a message using LLM
  prompt?: string;
  // evaluate message response with LLM
  evaluation?: string;
  // select an items from an enumerable response (e.g. UI contents like buttons)
  select?: string | number;
  // await for response
  wait?: number;
};

export type ChatBatch = {
  filePath: string;
  name: string;
  appId?: string;
  settings?: Partial<AppSettingsDto>;
  chat: ChatBatchMessage[];
};
