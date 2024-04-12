#!./node_modules/.bin/ts-node
import { CliProgram } from "./cli";
import logger from "./libs/logger";

new CliProgram().init().catch((e) => logger.error(e.stack));
