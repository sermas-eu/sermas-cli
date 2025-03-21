import { ButtonsUIContentDto, sleep } from "@sermas/api-client";
import { CliApi } from "../api/api.cli";
import {
  ChatHandler,
  ChatMessage,
  MessageSourceUIContent,
} from "../chat/chat-handler";
import logger from "../logger";
import { ChatBatch, ChatBatchMessage } from "./loader.dto";
import { ChatBatchRunnerResult } from "./runner.dto";

export class ChatBatchRunner {
  private chatHandler: ChatHandler;

  constructor(
    private readonly api: CliApi,
    private readonly chatBatch: ChatBatch
  ) {}

  async init() {
    this.chatHandler = new ChatHandler({
      api: this.api,
      appId: this.chatBatch.appId,
      language: this.chatBatch?.settings?.language,
      // onMessage: (messages: ChatMessage[]) => {
      //   if (!messages.length) return;
      //   messages.forEach((m) =>
      //     this.logMessage("user", message);
      //     logger.info(
      //       `[agent] ${new Date(m.ts).toTimeString().split(" ")[0]} ${m.text}`,
      //     ),
      //   );
      // },
    });

    await this.chatHandler.init();
  }

  logMessage(role: "user" | "agent", message: string, date?: Date | string) {
    date = date ? new Date(date) : new Date();
    logger.info(`[${role}] ${date.toTimeString().split(" ")[0]} ${message}`);
  }

  logMessages(messages: ChatMessage[]) {
    messages.forEach((m) => this.logMessage(m.actor, m.text, m.ts));
  }

  async sendChatMessage(message: string) {
    await this.chatHandler.sendChat(message);
    this.logMessage("user", message);
  }

  async handleSelect(
    messages: ChatMessage[],
    chatMessage: ChatBatchMessage,
  ): Promise<Partial<ChatBatchRunnerResult>> {
    logger.verbose(`Select message from buttons select=${chatMessage.select}`);

    const result: Partial<ChatBatchRunnerResult> = {
      success: true,
    };

    const buttons = messages
      .filter(
        (m) =>
          m.source.type === "ui" &&
          (m.source as MessageSourceUIContent).ui?.contentType === "buttons"
      )
      .map(
        (m) => (m.source as MessageSourceUIContent).ui as ButtonsUIContentDto
      )
      .flat();
    if (!buttons.length) {
      return {
        success: false,
        reason: `Cannot select, no buttons found`,
      };
    }

    const selections = buttons
      .map(
        (b) =>
          b.content?.list
            .map((b, i) => {
              // match button by index, id, label or value
              const matches =
                i === +chatMessage.select ||
                b.id === chatMessage.select ||
                chatMessage.select === b.label ||
                chatMessage.select === b.value;
              return matches ? b.label || b.value : null;
            })
            // return only the label selected or undefined
            .reduce(
              (selection: string | undefined, value) => value || selection,
              undefined
            )
      )
      .filter((response) => response !== undefined);

    if (!selections.length) {
      return {
        success: false,
        reason: `Response option not found for select=${chatMessage.select}`,
      };
    }

    await this.sendChatMessage(selections[0]);

    return {
      success: true,
    };
  }

  async handlePrompt(messages: ChatMessage[], chatMessage: ChatBatchMessage) {
    logger.verbose("TODO HANDLE PROMPT");
  }

  async evaluateResponse(
    messages: ChatMessage[],
    chatMessage: ChatBatchMessage
  ) {
    const result: Partial<ChatBatchRunnerResult> = {
      success: true,
    };

    logger.verbose(`Evaluate response evaluation=${chatMessage.evaluation}`);

    if (!messages || !messages.length) {
      result.success = false;
      result.reason = "Unexpected empty response";
      return result;
    }

    if (chatMessage.evaluation !== undefined) {
      logger.verbose("TODO ADD PROMPT EVAL");
    }

    return result;
  }

  private formatResult(
    res?: Partial<ChatBatchRunnerResult>,
  ): ChatBatchRunnerResult {
    const result: ChatBatchRunnerResult = {
      name: this.chatBatch.name,
      success: true,
    };
    res = res || {};
    result.success = res.success === false ? false : true;
    result.reason = res.reason;
    return result;
  }

  async run() {
    logger.info(`------------------------------------------`);
    logger.info(`Running batch ${this.chatBatch.name}`);

    let messages: ChatMessage[] = [];

    messages = await this.chatHandler.waitResponse();
    this.logMessages(messages);

    for (const chatMessage of this.chatBatch.chat) {
      // send plain text chat message
      if (chatMessage.wait !== undefined) {
        logger.info(`wait ${chatMessage.wait} seconds`);
        await sleep(chatMessage.wait * 1000);
      } else if (chatMessage.message !== undefined) {
        await this.sendChatMessage(chatMessage.message);
      } else if (chatMessage.select !== undefined) {
        const res = await this.handleSelect(messages, chatMessage);
        if (res.success === false) {
          return this.formatResult(res);
        }
      } else if (chatMessage.prompt !== undefined) {
        await this.handlePrompt(messages, chatMessage);
      }

      messages = await this.chatHandler.waitResponse();
      this.logMessages(messages);

      const res = await this.evaluateResponse(messages, chatMessage);
      if (res.success === false) {
        return this.formatResult(res);
      }

      logger.verbose("---");
    }

    return this.formatResult();
  }
}
