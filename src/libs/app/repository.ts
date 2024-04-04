import logger from "@libs/logger";
import { fileExists } from "../util";

import { RepositoryAssetTypes, RepositoryConfigDto } from "@sermas/api-client";
import { glob } from "glob";
import * as path from "path";
import { loadDataFile } from "./util";

export type RepositoryFiles = Record<
  RepositoryAssetTypes,
  Record<string, string>
>;

type AssetDto = {
  [key: string]: any;
  path: string;
  name?: string;
  id: string;
  metadata: Record<string, any>;
  type: RepositoryAssetTypes;
};

type RepositoryHandlerParam = AssetDto;
type RepositoryHandler = {
  extensions: string[] | null;
  handler: (param: RepositoryHandlerParam) => Promise<AssetDto | void>;
  skipMetadata?: boolean;
};

const handlers: Record<RepositoryAssetTypes, RepositoryHandler> = {
  animations: {
    extensions: ["glb"],
    handler: async (param: RepositoryHandlerParam) => {
      return { ...param };
    },
  },
  avatars: {
    extensions: ["glb", "gltf", "fbx"],
    handler: async (param: RepositoryHandlerParam) => {
      const metadata: any = param.metadata?.metadata || {};
      return { ...param, ...(param.metadata || {}), metadata };
    },
  },
  backgrounds: {
    extensions: ["jpg", "jpeg", "png"],
    handler: async (param: RepositoryHandlerParam) => {
      return { ...param };
    },
  },
  documents: {
    extensions: ["txt"],
    handler: async (param: RepositoryHandlerParam) => {
      return { ...param };
    },
  },
  robots: {
    extensions: ["yaml", "json"],
    handler: async (param: RepositoryHandlerParam) => {
      return { ...param };
    },
  },
};

export const scanRepository = async (basepath: string) => {
  let repositoryPath = `${basepath}/repository`;
  if (!(await fileExists(repositoryPath))) {
    repositoryPath = basepath;
  }

  const repository: RepositoryConfigDto = {
    avatars: [],
    backgrounds: [],
    animations: [],
    documents: [],
    robots: [],
  };

  const files: RepositoryFiles = {
    avatars: {},
    backgrounds: {},
    animations: {},
    documents: {},
    robots: {},
  };

  for (const type in handlers) {
    const handlerType = type as RepositoryAssetTypes;
    const handler = handlers[handlerType];

    if (!handler) {
      logger.warn(`handler for type ${type} not found`);
      continue;
    }

    const globBasePath = `${repositoryPath}/${handlerType}`;
    const globExt =
      handler.extensions.length > 1
        ? `.{${handler.extensions.join(",")}}`
        : `.${handler.extensions.at(0)}`;
    const assets = await glob(
      [`${globBasePath}/*${globExt}`, `${globBasePath}/**/*${globExt}`],
      {
        nodir: true,
      },
    );

    // console.warn(handlerType, assets);

    for (const assetPath of assets) {
      const metadata =
        handler.skipMetadata !== false ? await loadMetadata(assetPath) : {};

      const assetRelativePath = assetPath.replace(
        `${repositoryPath}/${handlerType}/`,
        "",
      );

      // use dirnmae as id
      const assetRelativePathParts = assetRelativePath.split("/");

      const baseName =
        assetRelativePathParts.length === 2
          ? assetRelativePathParts[0]
          : path.basename(assetPath);

      const name = baseName.replace(
        new RegExp(`[.]${handler.extensions.join("|")}$`),
        "",
      );
      const id = name.toLowerCase().replace(/[^a-z0-9_-]/g, "-");

      const asset = await handler.handler({
        path: assetRelativePath,
        name,
        id,
        metadata,
        type: handlerType,
      });

      if (asset) {
        repository[handlerType].push(asset as any);
        files[handlerType][id] = assetPath;
      }
    }
  }

  return { repository, files };
};

const loadMetadata = async (filepath: string) => {
  return await loadDataFile(filepath);
};
