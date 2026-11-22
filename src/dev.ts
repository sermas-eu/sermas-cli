#!./node_modules/.bin/tsx --inspect=0.0.0.0:9233
import { CliProgram } from "./cli.js";
import logger from "./libs/logger.js";

const cliProgram = new CliProgram();
const logStack = (e) => logger.error(e.stack);
cliProgram
  .init()
  .catch(logStack)
  .then(() => cliProgram.parse())
  .catch(logStack);
