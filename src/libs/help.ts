import { Command, Help } from "commander";

const sectionPrefix = "### ";
const subsectionPrefix = "####";

type MarkdownOpts = {
  showGlobalOptions?: boolean;
  skipHelp?: boolean;
  anchor?: string;
};

const sanitizeHtml = (t: string) =>
  (t || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

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
    return sanitizeHtml(term);
  }
  function formatList(textArray) {
    return textArray.map((t) => sanitizeHtml("- " + t)).join("\n");
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
      helper.argumentDescription(argument),
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
        helper.optionDescription(option),
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
        helper.optionDescription(option),
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
  const commandList = helper.visibleCommands(cmd).map((cmd) => {
    return formatItem(
      helper.subcommandTerm(cmd),
      helper.subcommandDescription(cmd),
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
