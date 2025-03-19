import { AppSettingsDto, PlatformAppDto } from "@sermas/api-client";
import { glob } from "glob";
import logger from "../../logger";
import { fileExists, loadYAML } from "../../util";
import { ChatBatch } from "./dto";

export class ChatBatchLoader {
  async load(dir: string) {
    let testsDir = dir;
    let appId: string;
    let settings: Partial<AppSettingsDto>;

    const hasTestsDir = await fileExists(`${dir}/tests`);
    if (hasTestsDir) {
      const parts = dir.split("/");
      parts.pop();
      appId = parts.pop();

      const appYaml = `${dir}/app.yaml`;
      const app = await loadYAML<PlatformAppDto>(appYaml);

      //   if (!app) {
      //     appYaml = `${dir}/app.yml`;
      //     app = await loadYAML<PlatformAppDto>(appYaml);
      //   }

      appId = app?.appId;
      settings = app?.settings;
      testsDir = `${dir}/tests`;
    }

    const list = await glob(`${testsDir}/**/*.yaml`);
    const definitions: ChatBatch[] = [];
    for (const item of list) {
      const yaml = await loadYAML<ChatBatch>(item);
      if (!yaml) {
        logger.warn(`Failed to load ${item}`);
        continue;
      }

      yaml.filePath = item;
      yaml.name = item.split("/").pop().split(".").slice(0, -1).join(".");

      if (!yaml.appId) {
        yaml.appId = appId;
      }

      yaml.settings = {
        ...(settings || {}),
        ...(yaml.settings || {}),
      };

      if (!yaml.appId) {
        logger.warn(`appId is missing in file ${item}, skipping.`);
        continue;
      }

      if (!yaml.chat || !yaml.chat.length) {
        logger.warn(`missing chat elements in file ${item}, skipping.`);
        continue;
      }

      definitions.push(yaml);
    }
    return definitions;
  }
}
