import { ChatBatchOptions } from "./chat.runner.dto";

export type BatchRunnerOptions = ChatBatchOptions & {
  outputPath?: string;
};
