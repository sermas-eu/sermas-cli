#!./node_modules/.bin/ts-node
import { CliProgram } from "./cli";
import logger from "./libs/logger";

export const main = async () => {
  const cli = new CliProgram();
  await cli.init();
};

main().catch((e) => logger.error(e.stack));
