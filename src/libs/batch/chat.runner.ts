import { ButtonsUIContentDto, sleep } from "@sermas/api-client";
import { AppApi } from "../api/api.app";
import { CliApi } from "../api/api.cli";
import {
  ChatHandler,
  ChatMessage,
  MessageSourceUIContent,
} from "../chat/chat-handler";
import { colorize } from "../colors";
import logger from "../logger";
import { ChatBatchOptions } from "./chat.runner.dto";
import { ChatBatch, ChatBatchMessage } from "./loader.dto";
import { ChatBatchRunnerResult } from "./runner.dto";

export class ChatBatchRunner {
  private chatHandler: ChatHandler;
  private appApi: AppApi;

  private messages: ChatMessage[] = [];

  constructor(
    private readonly api: CliApi,
    private readonly chatBatch: ChatBatch,
    private readonly options: ChatBatchOptions = {},
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

    this.appApi = await this.api.getAppClient(this.chatBatch.appId);
  }

  logMessage(role: "user" | "agent", message: string, date?: Date | string) {
    if (this.options.showChatLogs !== true) return;

    date = date ? new Date(date) : new Date();
    const text = `${date.toTimeString().split(" ")[0]} [${role}] ${message}`;

    logger.info(colorize(text, role === "user" ? "FgCyan" : "FgGray"));
  }

  logMessages(messages: ChatMessage[]) {
    messages.forEach((m) => this.logMessage(m.actor, m.text, m.ts));
  }

  async sendChatMessage(message: string) {
    await this.chatHandler.sendChat(message);
    this.logMessage("user", message);

    this.messages.push({
      appId: this.chatBatch.appId,
      sessionId: this.chatHandler.getSessionId(),

      actor: "user",
      text: message,

      shown: true,
      source: {
        type: "message",
        message: undefined,
      },
    });
  }

  async handleSelect(
    messages: ChatMessage[],
    chatMessage: ChatBatchMessage,
  ): Promise<Partial<ChatBatchRunnerResult>> {
    logger.verbose(`Select message from buttons select=${chatMessage.select}`);

    const buttons = messages
      .filter(
        (m) =>
          m.source.type === "ui" &&
          (m.source as MessageSourceUIContent).ui?.contentType === "buttons",
      )
      .map(
        (m) => (m.source as MessageSourceUIContent).ui as ButtonsUIContentDto,
      )
      .flat();
    if (!buttons.length) {
      return this.formatResult({
        success: false,
        reason: `Cannot select, no buttons found`,
      });
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
              undefined,
            ),
      )
      .filter((response) => response !== undefined);

    if (!selections.length) {
      return this.formatResult({
        success: false,
        reason: `Response option not found for select=${chatMessage.select}`,
      });
    }

    await this.sendChatMessage(selections[0]);

    return this.formatResult();
  }

  async handlePrompt(
    chatMessage: ChatBatchMessage,
  ): Promise<ChatBatchRunnerResult & { message: string | undefined }> {
    logger.verbose(`Handle prompt=${chatMessage.prompt}`);

    const res = await this.appApi.sendPrompt({
      appId: this.chatBatch.appId,
      sessionId: this.chatHandler.getSessionId(),
      prompt: `Based on HISTORY impersonate the user and create a request for the assistant following the description. 
## DESCRIPTION
${chatMessage.prompt}`,

      options: {
        app: false,
        history: true,
        json: false,
      },
    });

    const message = res && res.result ? res?.result?.toString() : undefined;

    const result = this.formatResult();

    if (!message) {
      result.success = false;
      result.reason = "Failed to generate prompt";
    }

    return {
      ...result,
      message,
    };
  }

  async evaluateResponse(chatMessage: ChatBatchMessage) {
    if (chatMessage.evaluation === undefined) return this.formatResult();

    logger.verbose(`Evaluate response evaluation=${chatMessage.evaluation}`);

    const res = await this.appApi.sendPrompt({
      appId: this.chatBatch.appId,
      sessionId: this.chatHandler.getSessionId(),
      prompt: `Analyze conversation HISTORY to check if EVALUATION is correctly met. 

## Response format
Answer in parsable JSON. Follow this structure, do not add notes or explanation.
{
  "success": boolean, // EVALUATION result if positive or negative
  "reason": string, // Describe the motivation that made you decide in english
}

## EVALUATION
${chatMessage.evaluation}`,

      options: {
        app: false,
        history: true,
        json: true,
      },
    });

    // console.warn(res.result);
    const result = res?.result as unknown as {
      success: boolean;
      reason: string;
    };

    if (result && result.success === false) {
      return this.formatResult({
        success: result.success,
        reason: result.reason,
      });
    }

    return this.formatResult();
  }

  private formatResult(
    res?: Partial<ChatBatchRunnerResult>,
  ): ChatBatchRunnerResult {
    const result: ChatBatchRunnerResult = {
      name: this.chatBatch.name,
      success: true,
      messages: this.messages,
    };
    res = res || {};
    result.success = res.success === false ? false : true;
    result.reason = res.reason;
    return result;
  }

  async run() {
    logger.verbose(`------------------------------------------`);
    logger.info(`Running batch '${this.chatBatch.name}'`);

    let messages: ChatMessage[] = [];

    const initialWait = this.chatBatch.wait || 4;
    if (initialWait) {
      logger.verbose(`initial wait ${initialWait} seconds`);
      await sleep(initialWait * 1000);
    }

    messages = await this.chatHandler.waitResponse();
    this.logMessages(messages);

    // track messages
    this.messages.push(...messages);

    for (const chatMessage of this.chatBatch.chat) {
      // send plain text chat message
      if (chatMessage.wait !== undefined) {
        logger.verbose(`wait ${chatMessage.wait} seconds`);
        await sleep(chatMessage.wait * 1000);
      }

      if (chatMessage.message !== undefined) {
        await this.sendChatMessage(chatMessage.message);
      } else if (chatMessage.select !== undefined) {
        const res = await this.handleSelect(messages, chatMessage);
        if (res.success === false) {
          return this.formatResult(res);
        }
      } else if (chatMessage.prompt !== undefined) {
        const res = await this.handlePrompt(chatMessage);
        if (res.success === false) {
          return res;
        }
        await this.sendChatMessage(res.message);
      }

      // just in case
      await sleep(1000);

      messages = await this.chatHandler.waitResponse();
      this.logMessages(messages);

      const res = await this.evaluateResponse(chatMessage);
      if (res?.success === false) {
        return this.formatResult(res);
      }

      logger.verbose("---");
    }

    return this.formatResult();
  }
}
