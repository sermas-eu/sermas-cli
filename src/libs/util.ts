import * as fs from "fs/promises";
import YAML from "js-yaml";
import * as path from "path";
import { v4 as uuidv4 } from "uuid";
import logger from "./logger";

export const uuid = () => uuidv4();

export type FileFormatType = "json" | "yaml";

export const sleep = (time: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, time));

export const toJSON = (output: unknown) => JSON.stringify(output, null, 2);
export const toYAML = (output: unknown) => YAML.dump(output);
export const toData = (format: FileFormatType, output: unknown) =>
  format === "yaml" ? toYAML(output) : toJSON(output);

export const quit = (message?: string, code?: number) => {
  code === undefined ? 1 : code;
  const isErr = code !== 0;
  if (message) {
    if (isErr) {
      logger.error(message);
    } else {
      logger.info(message);
    }
  }
  process.exit(code);
};

export const fail = (message?: string) => quit(message, 1);

export const readFile = async (filepath: string) => {
  if (!filepath) return null;
  try {
    // return await fs.readFile(filepath, { encoding: "utf8" });
    return await fs.readFile(filepath);
  } catch (e) {
    logger.verbose(`Failed to read file ${filepath}: ${e.message}`);
    return null;
  }
};

export const writeFile = async (filepath: string, data: any) => {
  if (!filepath) return null;
  try {
    logger.debug(`Writing file ${filepath}`);
    return await fs.writeFile(filepath, data);
  } catch (e) {
    logger.error(`Failed to write file ${filepath}: ${e.message}`);
    return null;
  }
};

const getFileFormatType = (filepath: string): FileFormatType | null => {
  if (!filepath) return null;
  const ext = path.extname(filepath);
  if (ext === ".yaml" || ext === ".yml") return "yaml";
  if (ext === ".json") return "json";
  return null;
};

export const saveFile = async (
  filepath: string,
  data: any,
  format?: "json" | "yaml",
) => {
  format = format || getFileFormatType(filepath);
  let content = "";
  if (format === "yaml") {
    content = toYAML(data);
  } else {
    content = toJSON(data);
  }
  return await writeFile(filepath, content);
};

export const loadFile = <T = any>(filepath: string) => {
  const format = getFileFormatType(filepath);
  if (format === null) {
    logger.error(`Unsupported format ${path.extname(filepath)}`);
    return null;
  }
  if (format === "yaml") return loadYAML<T>(filepath);
  if (format === "json") return loadJSON<T>(filepath);
};

export const loadJSON = async <T = any>(filepath: string) => {
  const raw = await readFile(filepath);
  if (raw === null) return null;
  try {
    return JSON.parse(raw.toString()) as T;
  } catch (e) {
    logger.error(`Failed to parse JSON from ${filepath}: ${e.message}`);
    return null;
  }
};

export const loadYAML = async <T = any>(filepath: string) => {
  const raw = await readFile(filepath);
  if (raw === null) return null;
  try {
    return YAML.load(raw.toString()) as T;
  } catch (e) {
    logger.error(`Failed to parse YAML from ${filepath}: ${e.message}`);
    return null;
  }
};

export const waitInterrupt = async () => {
  logger.info(`Use CTRL+C (SIGINT) to exit`);
  return new Promise<void>(() => {
    process.on("SIGINT", function () {
      logger.info("Caught interrupt signal");
      process.exit(0);
    });
  });
};

export const rmFile = async (file: string) => {
  if (!file) return false;
  try {
    await fs.unlink(file);
    return true;
  } catch {}
  return false;
};

export const fileExists = (file) => {
  return fs
    .access(file, fs.constants.F_OK)
    .then(() => true)
    .catch(() => false);
};
