import { LoginResponseDto } from "@sermas/api-client";
import { Command } from "commander";
import { Answers, Question } from "inquirer";
import { CliApi } from "../api/api.cli";

export type CliInstanceCredentialsCollection = Record<
  string,
  CliCredentialsCollection
>;

export interface CliCredentialsCollection
  extends Record<string, LoginResponseDto> {
  user?: LoginResponseDto;
}

export interface CliCommand {
  setup: (command: Command) => Promise<void>;
  run: (params: CliConfig) => Promise<any>;
}

export interface CommandParams extends Record<string, Record<string, any>> {
  flags: Record<string, any>;
  args: string[];
  feature: CliFeature;
  config?: CliConfig;
  command: Command;
  program: Command;
  api: CliApi;
}

export type CliInstanceConfig = Record<string, CliConfig>;

export interface CliConfig extends Record<string, any> {
  auth?: {
    saveLocally?: boolean;
    username?: string;
    password?: string;
  };
  currentApp?: string;
}

export type PromptQuestionChoice =
  | string[]
  | number[]
  | { name: string; value: any; short?: string }[];
export interface PromptQuestion extends Question {
  name: string;
  message: string;
  type?:
    | "input"
    | "number"
    | "confirm"
    | "list"
    | "rawlist"
    | "expand"
    | "checkbox"
    | "password"
    | "editor";
  choices?: PromptQuestionChoice | (() => PromptQuestionChoice);
  default?: string;
}

export interface CliFeature {
  prompt: (questions: PromptQuestion[]) => Promise<Answers>;
}

export type ProgramTree = Record<string, CliCommandLeaf>;

export interface CliCommandLeaf extends Record<string, any | CliCommandLeaf> {
  commands?: string[];
  dirpath?: string;
}

export interface CliCommandTree {
  program: Command;
  command: Command;
  leaf: CliCommandLeaf;
}
