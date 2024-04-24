import { Command, Help } from "commander";

const sectionPrefix = "\n###";
const subsectionPrefix = "\n####";

type MarkdownOpts = {
  showGlobalOptions?: boolean;
  skipHelp?: boolean;
  anchor?: string;
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
    //   .replace(/^/gm, " ".repeat(itemIndentWidth));
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

  const anchorStart = opts.anchor ? `<a name="${opts.anchor}">` : "";
  const anchorEnd = opts.anchor ? `</a>` : "";

  if (description) {
    output.push(
      anchorStart,
      `${sectionPrefix} ${description}`,
      anchorEnd,
      `\n\`${usage}\``,
    );
  } else {
    output.push(anchorStart, `${sectionPrefix} ${usage}`, anchorEnd);
  }

  // Arguments
  const argumentList = helper.visibleArguments(cmd).map((argument) => {
    return formatItem(
      helper.argumentTerm(argument),
      helper.argumentDescription(argument),
    );
  });
  if (argumentList.length > 0) {
    output = output.concat([
      `${subsectionPrefix} Arguments:`,
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
      `${subsectionPrefix} Options:`,
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
      `${subsectionPrefix} Commands:`,
      formatList(commandList),
      "",
    ]);
  }

  return output.join("\n");
};
