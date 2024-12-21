import {
  PlatformAppDto,
  RepositoryAssetTypes,
  UIAssetDto,
} from "@sermas/api-client";
import * as fs from "fs/promises";
import { lookup } from "mime-types";
import * as path from "path";
import { CliApi } from "../../libs/api/api.cli";
import { KeycloakJwtTokenDto } from "../../libs/dto/keycloak.dto";
import logger from "../../libs/logger";
import { readFile } from "../../libs/util";
import { loadAppStructure, saveAppId, structureToApp } from "./structure";

export const saveAppFromDirectory = async (data: {
  filepath: string;
  jwt: KeycloakJwtTokenDto;
  api: CliApi;
  saveApp?: (app: PlatformAppDto) => Promise<any>;
  skipUpload?: boolean;
  importWebsites?: boolean;
}) => {
  const { filepath, jwt, api, skipUpload, importWebsites } = data;

  const appStructure = await loadAppStructure(filepath);
  const app = structureToApp(appStructure, importWebsites);

  app.ownerId = app.ownerId || jwt.sub;

  logger.info(`${app.appId ? "Updating" : "Creating"} app '${app.name}'`);
  logger.debug(JSON.stringify(app, null, 2));

  let res: PlatformAppDto;

  if (data.saveApp) {
    res = await data.saveApp(app);
  } else {
    if (app.appId) {
      const savedApp = await api.loadApp(app.appId);
      if (savedApp === null) {
        logger.info(`app id=${app.appId} not found, recreating`);
        const appLockFile = path.resolve(filepath, "appId");
        try {
          await fs.unlink(appLockFile);
          app.appId = undefined;
        } catch (e) {
          logger.warn(`Cannot remove app lock at ${appLockFile}: ${e.message}`);
        }
      }
    }

    if (app.appId) {
      res = await api.updateApp(app);
      if (!res) {
        logger.info(
          `If the app does not exists or has been removed, try removing the file .appId and try again`,
        );
      }
    } else {
      res = await api.createApp(app);
    }
  }

  if (!res) return;

  const appId = res.appId;
  logger.debug(`Save appId=${appId}`);
  try {
    await saveAppId(filepath, appId);
  } catch (e) {
    throw new Error(`Failed to save appId: ${e.message}`);
  }

  logger.info(`Application ${app.name} saved with id=${appId}`);

  // upload assets
  if (appStructure.repository && skipUpload !== true) {
    logger.debug(`Uploading repository resources`);
    for (const type in appStructure.repository) {
      if (!appStructure.repository[type]) continue;
      for (const asset of appStructure.repository[type]) {
        const assetId = asset.id;
        if (!appStructure.files[type][assetId]) continue;

        const filename = appStructure.files[type][assetId];
        logger.info(`Uploading ${type} ${assetId} (${filename})`);

        const payload: Partial<UIAssetDto> & { appId: string } = {
          appId: appId,
          filename: asset.path,
          metadata: asset.metadata || {},
          type: type as RepositoryAssetTypes,
          ts: new Date().toString(),
        };

        await api.saveAsset(
          payload,
          new Blob([await readFile(filename)], {
            type: lookup(filename),
          }),
        );
      }
    }
  }

  return res;
};
