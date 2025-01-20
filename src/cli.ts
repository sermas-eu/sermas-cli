import { Command, Option } from "commander";
import * as fs from "fs/promises";
import { glob } from "glob";
import inquirer, { Answers } from "inquirer";
import { homedir } from "os";
import * as path from "path";
import { CliApi } from "./libs/api/api.cli";
import { CliConfigHandler } from "./libs/api/config";
import { CliCredentialsHandler } from "./libs/api/credentials";
import { generateDocs } from "./libs/docs";
import {
  CliCommand,
  CliCommandLeaf,
  CliCommandTree,
  CommandParams,
  PromptQuestion,
} from "./libs/dto/cli.dto";
import logger from "./libs/logger";
import { FileFormatType, toData, toJSON } from "./libs/util";

import LoginCmd from "./commands/auth/login";

const baseUrl = process.env.BASE_URL || "http://localhost:8080";
const configDir = process.env.CONFIG_DIR || path.resolve(homedir(), ".sermas");

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

  private readonly cliApi = new CliApi(this.config, this.credentials, baseUrl);

  constructor() {}

  async init(extraCommandFolders: string[] = []) {
    const pkg: { name: string; version: string } = JSON.parse(
      (await fs.readFile(packageJson)).toString(),
    );

    const CLI_NAME = "sermas-cli";
    const CLI_VERSION = pkg.version;

    logger.debug(`Ensuring config path exists at ${configDir}`);
    await fs.mkdir(configDir, { recursive: true });

    const program = new Command();
    program

      .name(CLI_NAME)
      .version(CLI_VERSION)
      .description("Manage and interact with the SERMAS Toolkit API")

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

    const commandsPaths = [
      path.resolve(__dirname, "./commands/"),
      ...extraCommandFolders,
    ];

    const tree: CliCommandLeaf = {};

    for (const commandsBasePath of commandsPaths) {
      const commandsPathsList = await glob(
        commandsBasePath + "/**/*" + this.fileExt,
      );
      const commandsList = commandsPathsList
        .map((p) => p.replace(commandsBasePath + "/", ""))
        .map((p) => p.split("/"));

      // Populate tree with current folder structure
      for (const cmds of commandsList) {
        let leaf = tree;
        let dirpath = path.resolve(commandsBasePath);
        for (const cmd of cmds) {
          dirpath = path.resolve(dirpath, cmd);
          const isCmd = cmd.indexOf(this.fileExt) > -1;
          if (isCmd) {
            leaf.commands = leaf.commands || [];
            leaf.commands.push(cmd);
          } else {
            leaf[cmd] = leaf[cmd] || {
              dirpath: dirpath,
            };
            leaf = leaf[cmd];
          }
        }
      }

      // Load commands
      await this.buildProgram({
        program,
        command: program,
        leaf: tree,
      });
    }

    program
      .command("docs-gen")
      .description("generate markdown documentation")
      .action(async () => {
        await fs.mkdir("./docs", { recursive: true });
        const filename = `./docs/${program.name()}.md`;
        const output = generateDocs(program);
        await fs.writeFile(filename, output);
      });

    program
      .command("completion")
      .description("generate bash completion")
      .action(async () => {
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

        let subcommand = tree;
        if (words.length > 0) {
          let i = 0;
          while (i < depth) {
            subcommand = tree[words[i]];
            i++;
          }
        }

        const options = subcommand ? Object.keys(subcommand) : [];
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
      if (key === "dirpath") continue;
      if (key === "commands" && param.leaf.commands.length) {
        await Promise.all(
          param.leaf.commands.map(async (cmd) => {
            const cmdName = cmd.replace(this.fileExt, "");
            if (cmdName === "default") {
              return;
            }

            const cliCommand = await this.importModule(
              path.resolve(param.leaf.dirpath, cmd),
            );
            // skip command if not found
            if (cliCommand === null) return;

            tree[cmdName] = [];
            const command = this.addSubCommand(param.command, cmdName);
            await cliCommand.setup(command);

            const getParams = async (): Promise<CommandParams> => ({
              program: param.program,
              command,
              config: await this.config.loadConfig(baseUrl),
              args: command.args || [],
              flags: command.optsWithGlobals() || {},
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
                let params = await getParams();

                if (
                  params.command.name() !== "login" &&
                  !params.config?.auth?.username
                ) {
                  logger.info(`Login is missing`);
                  await LoginCmd.run({
                    args: [],
                    config: {},
                    flags: {},
                    feature: params.feature,
                    api: params.api,
                    command: params.command,
                    program: params.program,
                  });

                  // reload
                  await this.cliApi.loadToken();
                  params = await getParams();
                }

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

      const defaultModule = await this.importModule(
        path.resolve(leaf.dirpath, `default${this.fileExt}`),
        true,
      );

      const command = this.addSubCommand(param.command, key);
      if (defaultModule) {
        await defaultModule.setup(command);
      }

      tree[key] = await this.buildProgram({
        program: param.program,
        command,
        leaf,
      });
    }
  }

  silenceLogger() {
    // this seems not to be working, need to be passed as ENV
    process.env.NODE_NO_WARNINGS = "1";
    logger.transports.forEach((t) => {
      t.silent = true;
    });
  }
}
