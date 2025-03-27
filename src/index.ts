#!/usr/bin/env node
import { CliProgram } from "./cli";
import logger from "./libs/logger";

const cliProgram = new CliProgram();
const logStack = (e) => logger.error(e.stack);
cliProgram.init().catch(logStack);
cliProgram.parse().catch(logStack);
