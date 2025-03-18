#!./node_modules/.bin/tsx --inspect=0.0.0.0:9233
import { CliProgram } from "./cli";
import logger from "./libs/logger";

new CliProgram().init().catch((e) => logger.error(e.stack));
