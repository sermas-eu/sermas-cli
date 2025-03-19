import {
  ButtonDto,
  DialogueMessageDto,
  QuizContentDto,
  SermasApiClient,
  SessionChangedDto,
  sleep,
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

export type ChatHandlerArgs = {
  api: CliApi;
  appId: string;
  sessionId?: string;
  language?: string;
  onMessage: (messages: ChatMessage[]) => Promise<void> | void;
};
export class ChatHandler {
  private readonly api: CliApi;
  private readonly appId: string;
  private readonly language?: string;
  private sessionId?: string;
  private readonly onMessage: (messages: ChatMessage[]) => Promise<void> | void;

  private queue: ChatMessage[] = [];
  private messages: Record<string, ChatMessage[]> = {};

  private appApi: AppApi;
  private appApiClient: SermasApiClient;

  private end = false;

  private isWaiting = false;
  private lastMessageReceived?: Date = undefined;

  constructor(args: ChatHandlerArgs) {
    this.api = args.api;
    this.appId = args.appId;
    this.sessionId = args.sessionId;
    this.language = args.language;
    this.onMessage = args.onMessage;
  }

  quit() {
    this.end = true;
  }

  async init() {
    this.appApi = await this.api.getAppClient(this.appId);
    this.appApiClient = this.appApi.getClient();

    this.sessionId = await this.ensureSession(this.sessionId, this.language);
    if (!this.sessionId) {
      throw new Error("Missing sessionId");
    }

    await this.appApiClient.events.session.onSessionChanged(
      (ev: SessionChangedDto) => {
        if (ev.sessionId !== this.sessionId) return;

        if (ev.record.closedAt) {
          logger.info(`Session closed, exiting chat`);
          this.quit();
        }
      },
    );

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

    if (!session) {
      logger.error(`Failed to create session`);
      return null;
    }

    logger.info(`Created sessionId=${session.sessionId}`);
    return session.sessionId;
  }

  async loop(handleMessage: () => Promise<void>) {
    if (!this.appApi) {
      await this.init();
    }
    const intv = setInterval(() => this.process(), 500);
    while (!this.end) {
      try {
        await handleMessage();
      } catch (e) {
        logger.error(`Error sending message: ${e.stack}`);
        break;
      }
    }
    clearInterval(intv);
  }

  async waitResponse() {
    this.isWaiting = true;

    const waitFor = 1000;
    const sameMessageMax = 5;

    const waitTimesMax = 10;

    return new Promise<void>(async (resolve) => {
      let sameMessage = 0;
      let waitTimes = 0;
      while (this.isWaiting) {
        await sleep(waitFor);

        const queue = this.queue.sort((a, b) =>
          new Date(a.ts) > new Date(b.ts) ? 1 : -1,
        );

        const breakWaitTimes = () => {
          waitTimes++;
          if (waitTimes >= waitTimesMax) {
            return true;
          }
          return false;
        };

        if (!queue.length) {
          if (breakWaitTimes()) {
            break;
          }
          continue;
        }

        // console.log("queue", queue);
        const lastMessages = queue.slice(-1);
        const lastMessage = lastMessages[0];
        if (!lastMessage) {
          if (breakWaitTimes()) {
            break;
          }
          continue;
        }
        const ts = new Date(lastMessage.ts);

        if (
          this.lastMessageReceived &&
          this.lastMessageReceived.getTime() === ts.getTime()
        ) {
          sameMessage++;
          if (sameMessage >= sameMessageMax) {
            break;
          }
        } else {
          this.lastMessageReceived = ts;
        }

        logger.info(
          `Waiting for response (${sameMessage} / ${sameMessageMax}) ..`,
        );
      }

      logger.info(`Response received`);
      this.isWaiting = false;

      this.process();

      resolve();
    });
  }

  async sendChat(text: string, language?: string) {
    if (!this.appApi) {
      await this.init();
    }

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

    // skip, we are waiting for messages to arrive
    if (this.isWaiting) return;

    this.queue.forEach((message, i) => {
      if (Date.now() - new Date(message.ts).getTime() < 800) return;
      this.messages[message.messageId] = this.messages[message.messageId] || [];
      this.messages[message.messageId].push(message);
      delete this.queue[i];
      hasNewMessages = true;
    });

    for (const key in this.messages) {
      this.messages[key] = this.messages[key]
        .filter((m) => m.sessionId === this.sessionId)
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
