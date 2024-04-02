import logger from "@libs/logger";
import { fileExists, loadYAML, saveFile } from "../util";

import {
  AppModuleConfigDto,
  AppSettingsDto,
  AppToolsDTO,
  AppUserDto,
  PlatformAppDto,
  RepositoryAvatarModelDto,
  RepositoryBackgroundModelDto,
  RepositoryConfigDto,
} from "@sermas/api-client";
import * as fs from "fs/promises";
import { glob } from "glob";
import * as path from "path";

export type RepositoryFiles = {
  backgrounds: { [key: string]: string };
  avatars: { [key: string]: string };
  documents: { [key: string]: string };
};

export type AppStructure = {
  appId?: string;
  app?: Partial<PlatformAppDto>;
  modules?: AppModuleConfigDto[];
  settings?: AppSettingsDto;
  tools?: AppToolsDTO[];
  users?: AppUserDto[];
  repository?: RepositoryConfigDto;
  files?: RepositoryFiles;
};

export const structureToApp = (appStructure: AppStructure): PlatformAppDto => {
  const app: PlatformAppDto = ({ ...appStructure.app } || {}) as PlatformAppDto;

  app.appId = appStructure.appId || undefined;
  app.modules = appStructure.modules || [];
  app.settings = appStructure.settings || undefined;
  app.tools = appStructure.tools || [];
  app.repository = appStructure.repository || undefined;

  return app;
};

export const loadAppStructure = async (basepath: string) => {
  const appStructure: AppStructure = {};

  const appIdPath = `${basepath}/appId`;
  if (await fileExists(appIdPath)) {
    appStructure.appId = await loadYAML(appIdPath);
  }

  const appPath = `${basepath}/app.yaml`;
  if (await fileExists(appPath)) {
    appStructure.app = await loadYAML<PlatformAppDto>(appPath);
  }

  const settingsPath = `${basepath}/settings.yaml`;
  if (await fileExists(settingsPath)) {
    appStructure.settings = await loadYAML<AppSettingsDto>(settingsPath);
  }

  const modulesPath = `${basepath}/modules.yaml`;
  if (await fileExists(modulesPath)) {
    appStructure.modules = await loadYAML<AppModuleConfigDto[]>(modulesPath);
  }

  const toolsPath = `${basepath}/tools.yaml`;
  if (await fileExists(toolsPath)) {
    appStructure.tools = await loadYAML<AppToolsDTO[]>(toolsPath);
  }

  const usersPath = `${basepath}/users.yaml`;
  if (await fileExists(usersPath)) {
    appStructure.users = await loadYAML<AppUserDto[]>(usersPath);
  }

  const { repository, files } = await scanRepository(basepath);
  appStructure.repository = repository;
  appStructure.files = files;

  return appStructure;
};

export const scanRepository = async (basepath: string) => {
  const repositoryPath = `${basepath}/repository`;
  if (!(await fileExists(repositoryPath))) {
    return undefined;
  }

  const repository: RepositoryConfigDto = {
    avatars: [],
    backgrounds: [],
  };

  const files: RepositoryFiles = {
    backgrounds: {},
    documents: {},
    avatars: {},
  };

  // map backgrounds
  const backgrounds = await glob(
    `${repositoryPath}/backgrounds/*.{png,jpeg,jpg}`,
    {
      nodir: true,
    },
  );

  for (const img of backgrounds) {
    const ext = path.extname(img);
    const yamlImgFile = img.replace(ext, ".yaml");
    let metadata = {};
    if (await fileExists(yamlImgFile)) {
      metadata = await loadYAML(yamlImgFile);
    }

    let name = path.basename(img).replace(ext, "");
    const id = name.toLowerCase();

    if (metadata && metadata["name"]) {
      name = metadata["name"];
    }

    const background: RepositoryBackgroundModelDto = {
      path: path.basename(img),
      metadata,
      name,
      id,
    };

    logger.debug(`Added background ${img}`);
    files.backgrounds[name] = img;
    repository.backgrounds.push(background);
  }

  // map avatars
  const avatars = await glob(`${repositoryPath}/avatars/*.yaml`, {
    nodir: true,
  });

  for (const avatarYaml of avatars) {
    const avatar = await loadYAML<RepositoryAvatarModelDto>(avatarYaml);
    const ext = path.extname(avatarYaml);

    const id = path.basename(avatarYaml).replace(ext, "").toLowerCase();

    const model: RepositoryAvatarModelDto = {
      ...avatar,
      id,
    };

    if (!avatar.modelPath.startsWith("http")) {
      const modelPath = `${repositoryPath}/avatars/${avatar.modelPath}`;
      const exists = await fileExists(modelPath);
      if (exists) {
        files.avatars[id] = modelPath;
      } else {
        logger.warn(`Avatar model not found at modelPath=${modelPath}`);
        continue;
      }
    }

    logger.debug(`Added avatar ${id}`);
    repository.avatars.push(model);
  }

  // console.warn(repository);

  return { repository, files };
};

export const saveAppId = async (filepath: string, appId: string) => {
  await saveFile(`${filepath}/appId`, appId, "yaml");
};

export const copyTemplate = async (filepath: string, force = false) => {
  const fullpath = path.resolve(process.cwd(), filepath);

  if (await fileExists(fullpath)) {
    if (!force) {
      logger.error(`Path exists ${fullpath}`);
      return null;
    }
  }

  try {
    await fs.cp(path.resolve(__dirname, "../../tpl/app"), fullpath, {
      recursive: true,
    });
  } catch (e: any) {
    logger.error(`Failed to create template ${e.message}`);
    logger.debug(e.stack);
    return null;
  }

  return fullpath;
};
