import {
  ButtonDto,
  DialogueMessageDto,
  QuizContentDto,
  SermasApiClient,
  UIContentDto,
} from "@sermas/api-client";
import { ulid } from "ulid";

type ChatMessage = DialogueMessageDto & { shown: boolean };

export class ChatHandler {
  private messages: ChatMessage[] = [];

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

  private process(markShown?: boolean) {
    this.messages = this.messages
      .map((m) => ({
        ...m,
        shown: markShown === undefined ? m.shown : markShown,
      }))
      .filter((m) => m.actor === "agent")
      .filter((m) => m.text.trim().length > 0)
      .filter((m) => !m.shown)
      .sort((a, b) => (a.messageId <= b.messageId ? 1 : -1));
  }

  addMessage(message: DialogueMessageDto) {
    this.messages.push({
      ...message,
      shown: false,
    });
    this.process();
  }

  getMessages() {
    if (!this.messages.length) return null;

    const fullMessage = this.messages.reduce(
      (text, message) => `${text}\n${message.text}`,
      "",
    );

    this.process(true);
    return `[agent] \n${fullMessage}\n`;
  }
}
