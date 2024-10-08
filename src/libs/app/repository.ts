import logger from "../../libs/logger";
import { fileExists, loadFile } from "../util";

import { RepositoryAssetTypes, RepositoryConfigDto } from "@sermas/api-client";
import { glob } from "glob";
import * as path from "path";
import { DataFileExtensions, loadDataFile } from "./util";

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
    extensions: undefined,
    handler: async (param: RepositoryHandlerParam) => {
      return { ...param };
    },
  },
};

const getNameFromFile = (assetPath: string, extensions?: string[]) => {
  let name = path.basename(assetPath);
  const ext = path.extname(name);
  extensions = extensions ? [...extensions.map((e) => `.${e}`), ext] : [ext];
  name = name.replace(new RegExp(`${extensions.join("|")}$`), "");
  return name;
};

const getIdFromName = (name: string) => {
  const id = name.toLowerCase().replace(/[^a-z0-9_-]/g, "-");
  return id;
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

    const assets: string[] = [];

    const globBasePath = `${repositoryPath}/${handlerType}`;

    // find assets by extension eg *.glb
    if (handler.extensions) {
      const globExt =
        handler.extensions && handler.extensions.length > 1
          ? `.{${handler.extensions.join(",")}}`
          : `.${handler.extensions.at(0)}`;

      const fileAssets = await glob(
        [`${globBasePath}/*${globExt}`, `${globBasePath}/**/*${globExt}`],
        {
          nodir: true,
        },
      );

      assets.push(...fileAssets);
    }

    // find assets definiton eg *.json|yaml|yml...
    const yamlExts = `.{${DataFileExtensions.join(",")}}`;
    let assetsYaml = await glob(
      [`${globBasePath}/*${yamlExts}`, `${globBasePath}/**/*${yamlExts}`],
      {
        nodir: true,
      },
    );

    // skip metadata files
    assetsYaml = assetsYaml.filter((yamlPath) => {
      let partialPath = yamlPath;
      DataFileExtensions.forEach((ext) => {
        partialPath = partialPath.replace(new RegExp(`.${ext}$`, "i"), "");
      });
      // skip format like `file.glb.yaml` or `file.yaml`  which contains metadata
      return (
        !assets.includes(partialPath) &&
        !assets
          .map((a) => a.replace(new RegExp(`${path.extname(a)}$`), ""))
          .includes(partialPath)
      );
    });

    // add plain definition files, that may not have a file to upload
    for (const assetPath of assetsYaml) {
      const asset = await loadFile(assetPath);
      if (asset) {
        const name = getNameFromFile(assetPath, handler.extensions);
        const id = getIdFromName(name);

        if (!asset.id) asset.id = id;
        if (!asset.name) asset.name = name;

        logger.debug(`Added asset config ${handlerType} ${assetPath}`);
        repository[handlerType].push(asset as any);
      }
    }

    for (const assetPath of assets) {
      let metadata =
        handler.skipMetadata !== false ? await loadMetadata(assetPath) : {};
      metadata = metadata || {};

      const assetRelativePath = assetPath.replace(
        `${repositoryPath}/${handlerType}/`,
        "",
      );

      // use dirname as id
      const assetRelativePathParts = assetRelativePath.split("/");

      const baseName =
        assetRelativePathParts.length === 2
          ? assetRelativePathParts[0]
          : path.basename(assetPath);

      const name = getNameFromFile(baseName, handler.extensions);
      const id = getIdFromName(name);

      const asset = await handler.handler({
        path: assetRelativePath,
        name,
        id,
        metadata,
        type: handlerType,
      });

      if (asset) {
        logger.debug(`Added asset file ${handlerType} ${assetPath}`);
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
