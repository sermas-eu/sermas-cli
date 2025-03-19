import {
  ButtonDto,
  DialogueMessageDto,
  QuizContentDto,
  SermasApiClient,
  UIContentDto,
} from "@sermas/api-client";
import { ulid } from "ulid";
import { AppApi } from "../api/api.app";
import { CliApi } from "../api/api.cli";
import logger from "../logger";
import { fail, uuid } from "../util";

export const languages = ["es-ES", "pt-PT", "it-IT", "de-DE", "en-GB", "fr-FR"];
export const defaultLanguage = "en-GB";

export type ChatMessage = DialogueMessageDto & { shown: boolean };

export class ChatHandler {
  private readonly sessionId: string;

  private queue: ChatMessage[] = [];
  private messages: Record<string, ChatMessage[]> = {};

  private appApi: AppApi;
  private appApiClient: SermasApiClient;

  private end = false;

  constructor(
    private readonly api: CliApi,
    private readonly appId: string,
    private readonly onMessage: (
      messages: ChatMessage[],
    ) => Promise<void> | void,
  ) {}

  quit() {
    this.end = true;
  }

  async init(sessionId?: string, language?: string) {
    this.appApi = await this.api.getAppClient(this.appId);
    this.appApiClient = this.appApi.getClient();

    sessionId = await this.ensureSession(sessionId, language);

    await this.appApiClient.events.dialogue.onDialogueMessages(
      (ev: DialogueMessageDto) => {
        this.addMessage(ev);
      },
    );

    await this.appApiClient.events.ui.onContent((ev: UIContentDto) => {
      const message: DialogueMessageDto = {
        appId: this.appId,
        sessionId: this.sessionId,
        actor: "agent",
        messageId: ev.messageId || ulid(),
        chunkId: ev.chunkId || ulid(),
        ts: ev.ts || new Date().toString(),
        text: "",
      };

      switch (ev.contentType) {
        case "object":
        case "video":
        case "image":
        case "pdf":
        case "webpage":
        case "dialogue-message":
        case "navigation":
        case "qrcode-scanner":
        case "background-audio":
          message.text = `[content:${ev.contentType}]`;
          break;
        case "text":
          message.text = ev.content.text.toString();
          break;
        case "email":
          message.text = ev.content.email.toString();
          break;
        case "html":
          message.text = ev.content.html.toString();
          break;
        case "link":
          message.text = ev.content.url.toString();
          break;
        case "buttons":
          message.text = (ev.content.list as ButtonDto[])
            .map((b: ButtonDto) => `- ${b.label}`)
            .join("\n");
          break;
        case "quiz":
          const quiz = ev.content as QuizContentDto;
          message.text = `${quiz.question}\n${quiz.answers.map(
            (a) => `- ${a.answer}`,
          )}`;
          break;
        // case "clear-screen":
        //   return;
        default:
          return;
      }

      this.addMessage(message);
    });
  }

  async ensureSession(sessionId?: string, language?: string) {
    if (sessionId) {
      logger.info(`Reusing session sessionId=${sessionId}`);
      return sessionId;
    }

    const session = await this.appApi.startSession({
      appId: this.appId,
      agentId: uuid(),
      settings: {
        ttsEnabled: false,
        language,
      } as any,
    });

    logger.info(`Created sessionId=${session.sessionId}`);
    return session.sessionId;
  }

  async loop(handleMessage: () => Promise<void>) {
    if (!this.appApi) throw new Error("Call init() first");
    const intv = setInterval(() => this.process(), 500);
    while (!this.end) {
      await handleMessage();
    }
    clearInterval(intv);
  }

  async sendChat(text: string, language?: string) {
    const res = await this.appApi.sendChatMessage({
      text,
      appId: this.appId,
      sessionId: this.sessionId,
      language: language || defaultLanguage,
    });
    if (res === null) return fail();
    return res;
  }

  private markAsRead(shown?: boolean) {
    for (const key in this.messages) {
      this.messages[key] = this.messages[key].map((m) => ({
        ...m,
        shown: shown === undefined ? m.shown : shown,
      }));
    }
  }

  // dequeue messages after a threshold time
  private process() {
    let hasNewMessages = false;
    this.queue.forEach((message, i) => {
      if (Date.now() - new Date(message.ts).getTime() < 500) return;
      this.messages[message.messageId] = this.messages[message.messageId] || [];
      this.messages[message.messageId].push(message);
      delete this.queue[i];
      hasNewMessages = true;
    });

    for (const key in this.messages) {
      this.messages[key] = this.messages[key]
        .filter((m) => m.actor === "agent")
        .filter((m) => m.text.trim().length > 0)
        .sort((a, b) => (a.chunkId > b.chunkId ? 1 : -1));
    }

    if (hasNewMessages) {
      this.onMessage(this.getMessages());
    }
  }

  addMessage(message: DialogueMessageDto) {
    this.queue.push({
      ...message,
      shown: false,
    });
    this.process();
  }

  getMessages() {
    const messages = Object.values(this.messages)
      .flat()
      .filter((m) => !m.shown);
    this.markAsRead(true);
    return messages;
  }
}
