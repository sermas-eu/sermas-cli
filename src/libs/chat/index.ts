import {
  ButtonDto,
  DialogueMessageDto,
  QuizContentDto,
  SermasApiClient,
  UIContentDto,
} from "@sermas/api-client";
import { ulid } from "ulid";
import logger from "../logger";

export class ChatHandler {
  private messages: DialogueMessageDto[] = [];
  private lastMessageId: string;

  constructor(
    private readonly appId: string,
    private readonly sessionId: string,
    private readonly appApiClient: SermasApiClient,
  ) {}

  async init() {
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

  private process() {
    this.messages = this.messages
      .filter((m) => m.actor === "agent")
      .filter(
        (m) =>
          this.lastMessageId === undefined || m.messageId > this.lastMessageId,
      )
      .sort((a, b) => (a.messageId > b.messageId ? 1 : -1));

    console.warn(this.lastMessageId, this.messages);
  }

  addMessage(message: DialogueMessageDto) {
    logger.info(`Add message: [${message.actor}] ${message.text}`);
    this.messages.push(message);
    this.process();
  }

  getMessages() {
    if (!this.messages.length) return null;

    const fullMessage = this.messages.reduce(
      (text, message) => `${text}\n${message.text}`,
      "",
    );

    this.lastMessageId = this.messages[this.messages.length - 1].messageId;
    this.process();

    return `[agent] \n${fullMessage}\n`;
  }
}
