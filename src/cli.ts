import { Command, Option } from "commander";
import * as fs from "fs/promises";
import { glob } from "glob";
import inquirer, { Answers } from "inquirer";
import * as path from "path";
import { CliApi } from "./libs/api/api.cli";
import { CliConfigHandler } from "./libs/api/config";
import { CliCredentialsHandler } from "./libs/api/credentials";
import {
  CliCommand,
  CliCommandLeaf,
  CliCommandTree,
  CommandParams,
  PromptQuestion,
} from "./libs/dto/cli.dto";
import logger from "./libs/logger";
import { FileFormatType, toData, toJSON } from "./libs/util";

const configDir = process.env.CONFIG_DIR || path.resolve(__dirname, "../");

const credentialsFile = path.resolve(configDir, `credentials.json`);
const cliConfigFile = path.resolve(configDir, `cli.json`);
const packageJson = path.resolve(__dirname, "../package.json");

export class CliProgram {
  private readonly fileExt = path.extname(__filename);

  private readonly config = new CliConfigHandler(cliConfigFile);
  private readonly credentials = new CliCredentialsHandler(
    this.config,
    credentialsFile,
  );

  private readonly cliApi = new CliApi(this.config, this.credentials);

  constructor() {}

  async init() {
    const pkg: { name: string; version: string } = JSON.parse(
      (await fs.readFile(packageJson)).toString(),
    );

    const CLI_NAME = "sermas-cli";
    const CLI_VERSION = pkg.version;

    const program = new Command();
    program

      .name(CLI_NAME)
      .version(CLI_VERSION)

      // https://github.com/tj/commander.js?tab=readme-ov-file#parsing-configuration
      // each option is parsed and available by the relative command
      .enablePositionalOptions()

      .addOption(
        new Option("-l, --log-level <level>", "Set log level")
          .default("info")
          .env("LOG_LEVEL")
          .choices(Object.keys(logger.levels)),
      )
      .on("option:log-level", (level: string) => {
        logger.level = level;
      })

      .addOption(
        new Option(
          "-j, --json",
          "Return as JSON output. This option will disable interactive prompts.",
        )
          .env("OUTPUT_JSON")
          .conflicts(["yaml"])
          .implies({ output: "json" }),
      )
      .addOption(
        new Option(
          "-y, --yaml",
          "Return as YAML output. This option will disable interactive prompts.",
        )
          .env("OUTPUT_YAML")
          .conflicts(["json"])
          .implies({ output: "yaml" }),
      )
      .addOption(
        new Option(
          "-o, --output [format]",
          "Return as parsable output. This option will disable interactive prompts.",
        )
          .env("OUTPUT")
          .preset("json")
          .choices(["json", "yaml"]),
      )
      .on("option:output", () => this.silenceLogger())
      .on("option:yaml", () => this.silenceLogger())
      .on("option:json", () => this.silenceLogger());

    const commandsBasePath = path.resolve(__dirname, "./commands/");
    const commandsPathsList = await glob(
      commandsBasePath + "/**/*" + this.fileExt,
    );
    const commandsList = commandsPathsList
      .map((p) => p.replace(commandsBasePath + "/", ""))
      .map((p) => p.split("/"));

    const tree: CliCommandLeaf = {};
    for (const cmds of commandsList) {
      let leaf = tree;
      for (const cmd of cmds) {
        const isCmd = cmd.indexOf(this.fileExt) > -1;
        if (isCmd) {
          leaf.commands = leaf.commands || [];
          leaf.commands.push(cmd);
        } else {
          leaf[cmd] = leaf[cmd] || {};
          leaf = leaf[cmd];
        }
      }
    }

    const commands = await this.buildProgram({
      program,
      command: program,
      dirpath: path.resolve(commandsBasePath),
      leaf: tree,
    });

    program.command("completion").action(async () => {
      const completions = process.argv.slice(
        process.argv.indexOf("completion") + 1,
      );

      const depth = +completions.shift() - 1;
      const words = completions
        .slice(1)
        .reverse()
        .filter((w) => w !== CLI_NAME);

      const printOptions = (options: string[], match?: string) => {
        console.log(
          options.filter((c) => !match || c.startsWith(match)).join("\n"),
        );
      };

      // console.error(words);

      // const log = async (data) =>
      //   await fs.appendFile(
      //     './log.txt',
      //     (typeof data === 'string' ? data : JSON.stringify(data)) + '\n',
      //   );

      // log('');
      // log(`position ${depth}`);
      // log(words);

      let subcommand = commands;
      if (words.length > 0) {
        let i = 0;
        while (i < depth) {
          subcommand = commands[words[i]];
          i++;
        }
      }

      const options = subcommand ? Object.keys(subcommand) : [];

      // log('options');
      // log(options);

      printOptions(options);
    });

    program.parse();
  }

  async importModule(modulePath: string, failSilently = false) {
    try {
      return (await import(modulePath)).default as CliCommand;
    } catch (e) {
      if (!failSilently)
        logger.error(`Failed to import ${modulePath}: ${e.stack}`);
      return null;
    }
  }

  addSubCommand(parent: Command, name?: string) {
    const cmd = new Command(name);
    // parse each option per command
    // .enablePositionalOptions()
    // pass options as part of the commnad
    // .passThroughOptions();
    parent.addCommand(cmd);
    return cmd;
  }

  async buildProgram(param: CliCommandTree, tree: Record<string, any> = {}) {
    for (const key in param.leaf) {
      if (key === "commands" && param.leaf.commands.length) {
        await Promise.all(
          param.leaf.commands.map(async (cmd) => {
            const cmdName = cmd.replace(this.fileExt, "");

            if (cmdName === "default") {
              return;
            }

            const cliCommand = await this.importModule(
              path.resolve(param.dirpath, cmd),
            );
            // skip command if not found
            if (cliCommand === null) return;

            tree[cmdName] = [];
            const command = this.addSubCommand(param.command, cmdName);
            await cliCommand.setup(command);

            const getParams = async (): Promise<CommandParams> => ({
              program: param.program,
              command,
              config: await this.config.loadConfig(),
              args: command.args || [],
              flags: command.opts() || {},
              api: this.cliApi,
              feature: {
                prompt: async (
                  questions: PromptQuestion[],
                ): Promise<Answers> => {
                  // disable prompt in json mode
                  if (param.program.opts().output) {
                    return {};
                  }
                  return await inquirer.prompt(questions);
                },
              },
            });

            if (!cliCommand.run) return;

            command.action(async () => {
              const formatOutput: FileFormatType = param.program.opts().output;
              try {
                await this.cliApi.loadToken();
                const params = await getParams();
                const output = await cliCommand.run(params);
                if (output && formatOutput) {
                  console.log(
                    typeof output === "string"
                      ? output
                      : toData(formatOutput, output),
                  );
                }
              } catch (e) {
                if (formatOutput) {
                  console.error(toJSON(e));
                  return;
                }
                logger.error(e.stack);
              } finally {
                logger.debug(`Closing API connection`);
                await this.cliApi.close();
                process.exit(0);
              }
            });
          }),
        );
        continue;
      }

      const leaf = param.leaf[key];
      const dirpath = path.resolve(param.dirpath, key);

      const defaultModule = await this.importModule(
        path.resolve(dirpath, `default${this.fileExt}`),
        true,
      );

      const command = this.addSubCommand(param.command, key);
      if (defaultModule) {
        await defaultModule.setup(command);
      }

      tree[key] = await this.buildProgram({
        program: param.program,
        dirpath,
        command,
        leaf,
      });
    }

    return tree;
  }

  silenceLogger() {
    // this seems not to be working, need to be passed as ENV
    process.env.NODE_NO_WARNINGS = "1";
    logger.transports.forEach((t) => {
      t.silent = true;
    });
  }
}
