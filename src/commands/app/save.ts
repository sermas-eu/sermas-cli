import { loadAppStructure, saveAppId, structureToApp } from "@libs/app";
import {
  RepositoryAvatarDto,
  RepositoryBackgroundDto,
} from "@sermas/api-client";
import { Command } from "commander";
import { lookup } from "mime-types";
import * as path from "path";
import { CommandParams } from "../../libs/dto/cli.dto";
import logger from "../../libs/logger";
import { fail, readFile } from "../../libs/util";

export default {
  setup: async (command: Command) => {
    command
      .description("Create a new application")
      .option("--public", "Expose as a public application")
      .argument("[name]", "Application name");
  },

  run: async ({ args, flags, feature, api }: CommandParams) => {
    const filepath = args[0];
    if (!filepath)
      return fail(
        "Please provide the application definition path. Create one with `sermas-cli app init ./myapp`",
      );

    const appStructure = await loadAppStructure(filepath);
    const app = structureToApp(appStructure);

    // console.warn("------ appStructure");
    // console.warn(appStructure);
    // console.warn("------ app");

    const jwt = await api.getTokenInfo();
    if (!jwt) return fail(`Token is not available. Try to login first.`);

    app.ownerId = jwt.sub;

    logger.info(`${app.appId ? "Updating" : "Creating"} app '${app.name}'`);
    logger.debug(JSON.stringify(app, null, 2));

    const res = app.appId ? await api.updateApp(app) : await api.createApp(app);
    if (!res) return;

    const appId = res.appId;
    logger.debug(`Save appId=${appId}`);
    try {
      await saveAppId(filepath, appId);
    } catch (e) {
      return fail(`Failed to save appId: ${e.message}`);
    }

    logger.info(`Application ${app.name} saved with id=${appId}`);

    // upload assets
    if (appStructure.repository) {
      logger.debug(`Uploading repository resources`);

      const avatars: RepositoryAvatarDto[] =
        appStructure.repository.avatars || [];

      for (const avatar of avatars) {
        const name = avatar.name;
        if (!appStructure.files.avatars[name]) continue;

        const filename = appStructure.files.avatars[name];
        logger.info(`Uploading model ${name} (${filename})`);
        await api.saveAsset(
          {
            appId,
            filename: path.basename(appStructure.files.avatars[name]),
            metadata: {},
            type: "avatars",
            ts: new Date().toString(),
          },
          new Blob([await readFile(filename)], {
            type: lookup(filename),
          }),
        );
      }

      const backgrounds: RepositoryBackgroundDto[] =
        appStructure.repository.backgrounds || [];
      for (const background of backgrounds) {
        const name = background.name;
        if (!appStructure.files.backgrounds[name]) continue;

        const filename = appStructure.files.backgrounds[name];
        logger.info(`Uploading background ${name} (${filename})`);
        await api.saveAsset(
          {
            appId,
            filename: path.basename(appStructure.files.backgrounds[name]),
            metadata: {},
            type: "backgrounds",
            ts: new Date().toString(),
          },
          new Blob([await readFile(filename)], {
            type: lookup(filename),
          }),
        );
      }
    }

    return res;
  },
};
