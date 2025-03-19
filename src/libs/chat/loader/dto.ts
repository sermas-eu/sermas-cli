import { AppSettingsDto } from "@sermas/api-client";

export type ChatTestMessage = {
  message: string;
  evaluation?: string;
};

export type ChatTests = {
  appId?: string;
  settings?: Partial<AppSettingsDto>;
  chat: ChatTestMessage[];
};
