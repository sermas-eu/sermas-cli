import axios, { AxiosResponse } from "axios";
import { Command } from "commander";
import { CommandParams } from "../../../libs/dto/cli.dto";
import logger from "../../../libs/logger";
import { PlatformModuleConfigDto } from "@sermas/api-client";
import { fail, toJSON } from "../../../libs/util";

export default {
  setup: async (command: Command) => {
    command
      .description("Add or update a platform module")
      .argument("[openapiSpec]", "Module Open API specification URL");
  },

  run: async ({ api, feature, args }: CommandParams) => {
    const [moduleUrl] = args;

    const mod: PlatformModuleConfigDto = {
      moduleId: "",
      supports: [],
      config: {
        url: moduleUrl,
        asyncapiSpec: null,
        openapiSpec: null,
        resources: [],
      },
    };

    if (!mod.config.url) {
      const answers = await feature.prompt([
        {
          name: "moduleUrl",
          message: "Module URL",
          type: "input",
        },
      ]);
      mod.config.url = answers.moduleUrl;
    }

    if (!mod.config.url) return fail(`Module URL is required`);

    const wellKnownUrl = `${mod.config.url}/.well-known/sermas.json`;
    try {
      logger.info(`Loading well-known from ${wellKnownUrl}`);
      const res = await axios.get<
        undefined,
        AxiosResponse<{ openapiSpec?: string; asyncapiSpec?: string }>
      >(wellKnownUrl);

      const wellKnowDto = res.data;

      mod.config.openapiSpec =
        mod.config.openapiSpec || wellKnowDto.openapiSpec;
      mod.config.asyncapiSpec =
        mod.config.asyncapiSpec || wellKnowDto.asyncapiSpec;
    } catch (e: any) {
      return fail(`Failed to load well-known ${wellKnownUrl}: ${e.message}`);
    }

    let spec: any;
    try {
      const res = await axios.get(mod.config.openapiSpec, {
        baseURL: mod.config.url,
      });
      spec = res.data;
    } catch (e: any) {
      return fail(`Failed to load ${mod.config.url}: ${e.message}`);
    }

    mod.name = spec.info?.title || "";
    mod.description = spec.info?.description || "";

    mod.moduleId = (spec.info?.title || "module")
      .replace(/ /gi, "-")
      .replace(/[^a-z0-9_-]/gi, "")
      .toLowerCase();
    mod.config.resources = mod.config.resources || [];

    for (const path in spec.paths) {
      for (const method in spec.paths[path]) {
        const operation = spec.paths[path][method];
        if (!operation.operationId) continue;
        let resource = mod.moduleId;
        if (operation.tags && operation.tags.length) {
          resource = operation.tags[0];
        }
        logger.info(
          `Found ${resource}.${
            operation.operationId
          } [${method.toUpperCase()} ${path}]`,
        );

        mod.config.resources.push({
          moduleId: mod.moduleId,
          operationId: operation.operationId,
          resource: resource,
          scope: operation.operationId,
          description: operation.title || operation.summary || "",
        });
      }
    }

    const res = await api.savePlatformModule(mod);
    if (res === null) return;

    logger.info(`Module saved ${mod.moduleId}`);
    logger.debug(`${toJSON(mod)}`);

    return mod;
  },
};
