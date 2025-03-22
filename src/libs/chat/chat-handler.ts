import {
  ButtonDto,
  DialogueMessageDto,
  DialogueSessionRequestDto,
  DialogueSessionRequestStatus,
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

type MessageSource = {
  completed?: boolean;
};

export type MessageSourceUIContent = MessageSource & {
  type: "ui";
  ui: UIContentDto;
};

export type MessageSourceDialogueMessage = MessageSource & {
  type: "message";
  message: DialogueMessageDto;
};

export type ChatMessage = DialogueMessageDto & {
  shown: boolean;
  source: MessageSourceDialogueMessage | MessageSourceUIContent;
};

export type ChatHandlerArgs = {
  api: CliApi;
  appId: string;
  sessionId?: string;
  language?: string;
  onMessage?: (messages: ChatMessage[]) => Promise<void> | void;
};

type QueueItem = {
  requestId: string;
  status?: DialogueSessionRequestStatus;
  completed: boolean;
  messages: ChatMessage[];
};

export class ChatHandler {
  private readonly api: CliApi;
  private readonly appId: string;
  private readonly language?: string;
  private sessionId?: string;
  private readonly onMessage: (messages: ChatMessage[]) => Promise<void> | void;

  private queue: Record<string, QueueItem> = {};
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

  getSessionId() {
    return this.sessionId;
  }

  quit() {
    this.end = true;
  }

  async init() {
    this.appApi = await this.api.getAppClient(this.appId);
    this.appApiClient = this.appApi.getClient();

    this.sessionId = this.sessionId || uuid();

    this.appApiClient.events.dialogue.onRequest(
      (ev: DialogueSessionRequestDto) => {
        // logger.info(`Request UPDATE ----- `);
        // console.info(ev.requestId, ev.status);

        if (ev.sessionId !== this.sessionId) return;

        if (!ev.requestId || !this.queue[ev.requestId]) return;

        this.queue[ev.requestId].status = ev.status;
        this.queue[ev.requestId].completed =
          ev.status === "ended" || ev.status === "cancelled";
        logger.debug(`Status changed ${ev.status} requestId=${ev.requestId}`);
      },
    );

    this.appApiClient.events.session.onSessionChanged(
      (ev: SessionChangedDto) => {
        if (ev.sessionId !== this.sessionId) return;

        if (ev.record.closedAt) {
          logger.info(`Session closed, exiting chat`);
          this.quit();
        }
      },
    );

    this.appApiClient.events.dialogue.onDialogueMessages(
      (ev: DialogueMessageDto) => {
        const message: ChatMessage = {
          ...ev,
          shown: false,
          source: {
            type: "message",
            message: ev,
          },
        };

        if (message.actor !== "agent") return;

        logger.debug(`Got dialogue message [${message.text}]`);
        this.addMessage(message);
      },
    );

    this.appApiClient.events.ui.onContent((ev: UIContentDto) => {
      const message: ChatMessage = {
        appId: this.appId,
        sessionId: this.sessionId,
        actor: "agent",
        requestId: ev.requestId || ulid(),
        messageId: ev.messageId || ulid(),
        chunkId: ev.chunkId || ulid(),
        ts: ev.ts || new Date().toString(),
        text: "",

        shown: false,
        source: {
          type: "ui",
          ui: ev,
          completed: true,
        },
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
          message.text =
            "\n" +
            (ev.content.list as ButtonDto[])
              .map((b: ButtonDto) => `- ${b.label}`)
              .join("\n");
          break;
        case "quiz":
          const quiz = ev.content as QuizContentDto;
          message.text = `${quiz.question}\n${quiz.answers
            .map((a) => `- ${a.answer}`)
            .join("\n")}`;
          break;
        // case "clear-screen":
        //   return;
        default:
          return;
      }

      logger.debug(`Got UI content type=${ev.contentType}`);
      this.addMessage(message);
    });

    this.sessionId = await this.ensureSession(this.sessionId, this.language);
    if (!this.sessionId) {
      throw new Error("Missing sessionId");
    }
  }

  async ensureSession(sessionId?: string, language?: string) {
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

    logger.info(`Using sessionId=${session.sessionId}`);
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

    return new Promise<ChatMessage[]>(async (resolve) => {
      let sameMessage = 0;
      let waitTimes = 0;
      while (this.isWaiting) {
        await sleep(waitFor);

        const queue = Object.values(this.queue)
          .filter((q) => q.completed)
          .reduce((list, q) => [...list, ...q.messages], [])
          .flat()
          .filter((m) => m !== undefined)
          .filter((m) => m.actor === "agent")
          .sort((a, b) => (new Date(a.ts) > new Date(b.ts) ? 1 : -1));

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
          (this.lastMessageReceived &&
            this.lastMessageReceived.getTime() === ts.getTime()) ||
          lastMessage.completed
        ) {
          sameMessage++;
          if (sameMessage >= sameMessageMax) {
            break;
          }
        } else {
          this.lastMessageReceived = ts;
        }

        logger.debug(
          `Waiting for response (${sameMessage + 1} / ${sameMessageMax}) ..`,
        );
      }

      logger.debug(`Response received`);
      this.isWaiting = false;

      const messages = this.process();
      resolve(messages);
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
      language: language || this.language || defaultLanguage,
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

    for (const key in this.queue) {
      if (!this.queue[key].completed) continue;
      this.queue[key].messages.forEach((message, i) => {
        // if (Date.now() - new Date(message.ts).getTime() < 800) return;
        this.messages[message.messageId] =
          this.messages[message.messageId] || [];
        this.messages[message.messageId].push(message);
        delete this.queue[key].messages[i];
        hasNewMessages = true;
      });
    }

    for (const key in this.messages) {
      this.messages[key] = this.messages[key]
        .filter((m) => m.sessionId === this.sessionId)
        .filter((m) => m.actor === "agent")
        .filter((m) => m.text.trim().length > 0)
        .sort((a, b) => (a.chunkId > b.chunkId ? 1 : -1));
    }

    let messages: ChatMessage[] = [];

    if (hasNewMessages) {
      messages = this.getMessages();
      this.onMessage && this.onMessage(messages);
      return messages;
    }

    return messages;
  }

  addMessage(message: ChatMessage) {
    const requestId = message.requestId;

    if (!this.queue[requestId]) {
      logger.debug(`Tracking requestId=${requestId}`);
      this.queue[requestId] = {
        requestId,
        completed: message.source.completed === true,
        messages: [],
      };
    }

    this.queue[requestId].messages.push({
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
