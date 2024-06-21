import logger from "../../libs/logger";
import { fileExists, loadYAML, saveFile } from "../util";

import {
  AppModuleConfigDto,
  AppSettingsDto,
  AppToolsDTO,
  AppUserDto,
  DialogueTaskDto,
  PlatformAppDto,
  RagDocumentsDto,
  RepositoryConfigDto,
} from "@sermas/api-client";
import * as fs from "fs/promises";
import * as path from "path";
import { RepositoryFiles, scanRepository } from "./repository";
import { loadDataFile } from "./util";

export type AppStructure = {
  appId?: string;
  app?: Partial<PlatformAppDto>;
  modules?: AppModuleConfigDto[];
  settings?: AppSettingsDto;
  tools?: AppToolsDTO[];
  tasks?: DialogueTaskDto[];
  users?: AppUserDto[];
  repository?: RepositoryConfigDto;
  files?: RepositoryFiles;
  rag?: RagDocumentsDto;
};

export const structureToApp = (
  appStructure: AppStructure,
  importWebsites?: boolean,
): PlatformAppDto => {
  const app: PlatformAppDto = ({ ...appStructure.app } || {}) as PlatformAppDto;

  app.appId = appStructure.appId || app.appId || undefined;

  const modules = [
    ...(appStructure.modules?.length ? appStructure.modules : []),
  ];
  if (app.modules?.length) {
    modules.push(
      ...app.modules.filter(
        (m) => modules.filter((m2) => m2.moduleId !== m.moduleId).length === 0,
      ),
    );
  }

  app.modules = modules;
  app.settings = {
    ...(app.settings || {}),
    ...(appStructure.settings || {}),
  } as AppSettingsDto;

  const tools = appStructure.tools ? [...appStructure.tools] : [];
  if (app.tools) {
    app.tools.forEach((tool) => {
      // keep from structure
      if (tools.filter((t) => t.name === tool.name).length) return;
      tools.push(tool);
    });
  }
  app.tools = tools;

  const tasks = appStructure.tasks ? [...appStructure.tasks] : [];
  if (app.tasks) {
    app.tasks.forEach((task) => {
      // keep from structure
      if (tasks.filter((t) => t.name === task.name).length) return;
      tasks.push(task);
    });
  }
  app.tasks = tasks;

  app.repository = appStructure.repository || undefined;

  if (!importWebsites) {
    delete app.rag;
  }

  return app;
};

export const loadAppStructure = async (basepath: string) => {
  const appStructure: AppStructure = {};

  const appIdPath = `${basepath}/appId`;
  if (await fileExists(appIdPath)) {
    appStructure.appId = await loadYAML(appIdPath);
  }

  const app = await loadDataFile<PlatformAppDto>(`${basepath}/app`);
  if (app) {
    appStructure.app = app;
  }

  const settings = await loadDataFile<AppSettingsDto>(`${basepath}/settings`);
  if (settings) {
    appStructure.settings = settings;
  }

  const modules = await loadDataFile<AppModuleConfigDto[]>(
    `${basepath}/modules`,
  );
  if (modules) {
    appStructure.modules = modules;
  }

  const tools = await loadDataFile<AppToolsDTO[]>(`${basepath}/tools`);
  if (tools) {
    appStructure.tools = tools;
  }

  const tasks = await loadDataFile<DialogueTaskDto[]>(`${basepath}/tasks`);
  if (tasks) {
    appStructure.tasks = tasks;
  }

  const users = await loadDataFile<AppUserDto[]>(`${basepath}/users`);
  if (modules) {
    appStructure.users = users;
  }

  const rag = await loadDataFile<RagDocumentsDto>(`${basepath}/rag`);
  if (rag) {
    appStructure.rag = rag;
  }

  const { repository, files } = await scanRepository(basepath);
  appStructure.repository = repository;
  appStructure.files = files;

  return appStructure;
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
