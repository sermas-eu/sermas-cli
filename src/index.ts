#!/usr/bin/env node
import { CliProgram } from "./cli.js";
import logger from "./libs/logger.js";

const cliProgram = new CliProgram();
const logStack = (e) => logger.error(e.stack);
cliProgram
  .init()
  .catch(logStack)
  .then(() => cliProgram.parse())
  .catch(logStack);
