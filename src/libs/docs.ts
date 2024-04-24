import { Command, Help } from "commander";

const sectionPrefix = "### ";
const subsectionPrefix = "####";

type MarkdownOpts = {
  showGlobalOptions?: boolean;
  skipHelp?: boolean;
  anchor?: string;
};

export const generateDocs = (program: Command) => {
  const docs: Record<string, string> = {};

  const traverse = (cmd: Command, parent?: string[]) => {
    const isRoot = parent === undefined;
    parent = isRoot ? [cmd.name()] : parent;
    const cmdName = [...parent].join("--");

    const help = formatHelpAsMarkdown(cmd, cmd.createHelp(), {
      anchor: isRoot ? undefined : cmdName,
    });

    cmd.commands.forEach((c) => {
      traverse(c, [...parent, c.name()]);
    });

    docs[cmdName] = help;
  };

  traverse(program);

  const keys = Object.keys(docs).sort();

  const tocTree: Record<string, any> = {};
  keys.forEach((key) => {
    const baseCommand = key.replace(program.name(), "");
    if (!baseCommand.length) {
      tocTree[""] = {
        group: `- <a href="#${key}">SERMAS CLI overview</a>\n`,
      };
      return;
    }

    const parts = baseCommand.split("--").slice(1);
    const current = parts.shift();
    const isGroup = parts.length === 0;

    const title = docs[key].split("\n")[1];
    const matches = title.split("</a>");

    const label = matches.length == 2 ? matches.pop() : key.replace("--", " ");

    const markdown = `- <a href="#${key}">${label}</a>\n`;

    tocTree[current] = tocTree[current] || {
      group: "",
      commands: [],
    };
    if (isGroup) {
      tocTree[current].group = markdown;
    } else {
      tocTree[current].commands = tocTree[current].commands || [];
      tocTree[current].commands.push(`  ${markdown}`);
    }
  });

  let output = "";

  const toc = Object.keys(tocTree)
    .map((groupKey) => {
      return [
        tocTree[groupKey].group,
        (tocTree[groupKey].commands || []).join("\n"),
      ].join("\n");
    })
    .join("");

  output += toc;

  keys.map((key) => {
    output += docs[key];
  });

  return output;
};

export const formatHelpAsMarkdown = (
  cmd: Command,
  helper: Help,
  opts?: MarkdownOpts,
) => {
  opts = {
    ...{
      showGlobalOptions: false,
      skipHelp: true,
      anchor: undefined,
    },
    ...(opts || {}),
  };

  const helpWidth = helper.helpWidth || 80;

  function formatItem(term, description) {
    if (description) {
      const fullText = `\`${term}\` ${description}`;
      return fullText;
    }
    return term;
  }
  function formatList(textArray) {
    return textArray.map((t) => "- " + t).join("\n");
  }

  let output: string[] = [];

  // Description
  const commandDescription = helper.commandDescription(cmd);
  let description = "";
  if (commandDescription.length > 0) {
    description = helper.wrap(commandDescription, helpWidth, 0);
  }

  // Usage
  const usage = helper.commandUsage(cmd);

  const anchor = opts.anchor ? `<a name="${opts.anchor}"></a>` : "";

  let intro: string = "";
  if (description) {
    intro = [
      "\n",
      sectionPrefix,
      anchor,
      sanitizeHtml(
        description.substring(0, 1).toUpperCase() + description.substring(1),
      ),
      `\n\`${usage}\``,
    ].join("");
  } else {
    intro = ["\n", sectionPrefix, anchor, sanitizeHtml(usage)].join("");
  }

  output.push(intro);

  // Arguments
  const argumentList = helper.visibleArguments(cmd).map((argument) => {
    return formatItem(
      helper.argumentTerm(argument),
      sanitizeHtml(helper.argumentDescription(argument)),
    );
  });
  if (argumentList.length > 0) {
    output = output.concat([
      `\n${subsectionPrefix} Arguments:`,
      formatList(argumentList),
      "",
    ]);
  }

  // Options
  const optionList = helper
    .visibleOptions(cmd)
    .filter((option) => {
      if (opts.skipHelp !== true) return true;
      return option.name() !== "help";
    })
    .map((option) => {
      return formatItem(
        helper.optionTerm(option),
        sanitizeHtml(helper.optionDescription(option)),
      );
    });
  if (optionList.length > 0) {
    output = output.concat([
      `\n${subsectionPrefix} Options:`,
      formatList(optionList),
      "",
    ]);
  }

  if (opts.showGlobalOptions) {
    const globalOptionList = helper.visibleGlobalOptions(cmd).map((option) => {
      return formatItem(
        helper.optionTerm(option),
        sanitizeHtml(helper.optionDescription(option)),
      );
    });
    if (globalOptionList.length > 0) {
      output = output.concat([
        "Global Options:",
        formatList(globalOptionList),
        "",
      ]);
    }
  }

  // Commands
  const commandList = helper
    .visibleCommands(cmd)
    .filter((cmd) => cmd.name() !== "help")
    .map((cmd) => {
      return formatItem(
        helper.subcommandTerm(cmd),
        sanitizeHtml(helper.subcommandDescription(cmd)),
      );
    });
  if (commandList.length > 0) {
    output = output.concat([
      `\n${subsectionPrefix} Commands:`,
      formatList(commandList),
      "",
    ]);
  }

  return output.join("\n");
};

const sanitizeHtml = (t: string) =>
  (t || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
