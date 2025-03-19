import { AppSettingsDto } from "@sermas/api-client";

export type ChatBatchMessage = {
  message: string;
  evaluation?: string;
};

export type ChatBatch = {
  filePath: string;
  name: string;
  appId?: string;
  settings?: Partial<AppSettingsDto>;
  chat: ChatBatchMessage[];
};
