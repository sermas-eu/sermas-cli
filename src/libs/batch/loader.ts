import { PlatformAppDto } from "@sermas/api-client";
import { glob } from "glob";
import logger from "../logger";
import { fileExists, loadYAML } from "../util";
import { ChatBatch } from "./loader.dto";

const getAppYaml = async (dir: string) => {
  const appYaml = `${dir}/app.yaml`;
  const app = await loadYAML<PlatformAppDto>(appYaml);
  return app || undefined;
};

const getParentDir = (dir: string) => {
  return dir.split("/").slice(0, -1).join("/");
};

export const loadChatBatch = async (dir: string, skipRepository = false) => {
  // load repository

  if (!skipRepository) {
    const repositoryAppPaths = await glob(`${dir}/**/tests/`);
    if (repositoryAppPaths.length) {
      const definitions: ChatBatch[] = [];
      for (const repositoryAppPath of repositoryAppPaths) {
        const tests = await loadChatBatch(
          getParentDir(repositoryAppPath),
          true,
        );
        definitions.push(...(tests || []));
      }
      return definitions;
    }
  }

  let testsDir = dir;
  let appId: string;
  let app: PlatformAppDto | undefined;

  // load single app or tests
  const hasTestsDir = await fileExists(`${dir}/tests`);
  if (hasTestsDir) {
    const parts = dir.split("/");
    parts.pop();
    appId = parts.pop();

    app = await getAppYaml(dir);
    testsDir = `${dir}/tests`;
  } else {
    // try load app.yaml from parent
    app = await getAppYaml(getParentDir(dir));
  }

  appId = app?.appId || appId;
  const settings = app?.settings;

  logger.verbose(`Loading batch from ${testsDir}`);
  const list = await glob(`${testsDir}/*.yaml`);
  const definitions: ChatBatch[] = [];
  for (const item of list) {
    const yaml = await loadYAML<ChatBatch>(item);
    if (!yaml) {
      logger.warn(`Failed to load ${item}`);
      continue;
    }

    if (!yaml.appId) {
      yaml.appId = appId;
    }

    if (!yaml.appId) {
      logger.warn(`appId is missing in file ${item}, skipping.`);
      continue;
    }

    if (!yaml.chat || !yaml.chat.length) {
      logger.warn(`missing chat elements in file ${item}, skipping.`);
      continue;
    }

    yaml.filePath = item;
    yaml.name = item.split("/").pop().split(".").slice(0, -1).join(".");
    yaml.settings = {
      ...(settings || {}),
      ...(yaml.settings || {}),
    };

    definitions.push(yaml);
  }
  logger.verbose(`Found ${definitions.length} files`);
  return definitions.sort((a, b) => (a.name > b.name ? 1 : -1));
};
