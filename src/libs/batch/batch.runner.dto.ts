import { ChatBatchOptions } from "./chat.runner.dto.js";

export type BatchRunnerOptions = ChatBatchOptions & {
  outputPath?: string;
  onlyFailed?: boolean;
};
