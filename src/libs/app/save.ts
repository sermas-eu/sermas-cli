import { CliApi } from "../../libs/api/api.cli";
import { KeycloakJwtTokenDto } from "../../libs/dto/keycloak.dto";
import { PlatformAppDto, RepositoryAssetTypes } from "@sermas/api-client";
import { lookup } from "mime-types";
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
    res = app.appId ? await api.updateApp(app) : await api.createApp(app);
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
        await api.saveAsset(
          {
            appId,
            filename: asset.path,
            metadata: {},
            type: type as RepositoryAssetTypes,
            ts: new Date().toString(),
          },
          new Blob([await readFile(filename)], {
            type: lookup(filename),
          }),
        );
      }
    }
  }

  return res;
};
