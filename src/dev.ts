#!./node_modules/.bin/tsx --inspect=0.0.0.0:9233
import { CliProgram } from "./cli";
import logger from "./libs/logger";

const cliProgram = new CliProgram();
const logStack = (e) => logger.error(e.stack);
cliProgram.init().catch(logStack);
cliProgram.parse().catch(logStack);
