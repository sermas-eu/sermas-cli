import { Command } from "commander";
import { Browser } from "../../../libs/testing/browser";
import { fail } from "../../../libs/util";
import { CommandParams } from "../../../libs/dto/cli.dto";

export default {
  setup: async (command: Command) => {
    command.description("Say hello to Emma");
  },

  run: async ({ args, flags, feature, api }: CommandParams) => {
    const baseUrl = flags.baseurl || "http://localhost:8080";
    const pace = parseInt(flags.pace) || 0;
    const browser: Browser = new Browser(`${baseUrl}/poa`, pace);
    let reply: string;
    let qrImageFound: boolean = false;
    try {
      await browser.initSession();
      reply = await browser.talkToAvatar(
        "Ciao, Emma! Ho bisogno di fissare un appuntamento con un consulente finanziario",
      );
      const matcher: RegExp = new RegExp(
        /(?<day>\d{1,2}) (?<month>\w+) (?<year>\d{4}), (?<hour>\d{2}:\d{2})/,
        "mg", // Multiline + Global flags
      );
      let captured = [...reply.matchAll(matcher)];
      if (captured.length === 0) {
        await browser.select({
          xpath:
            "//div[contains(@class, 'ui-content')]/span[contains(@class, 'buttons-widget')]",
        });
        reply = await browser.read();
        captured = [...reply.matchAll(matcher)];
      }
      if (captured.length === 0) fail("No date found");
      const { day, month, year, hour } = captured[0].groups;
      reply = await browser.talkToAvatar(`Il ${day} alle ${hour}`, 3000);
      await browser.select({
        xpath: "(//span[contains(@class, 'image-wrapper')])[last()]",
      });
      qrImageFound = browser.found;
    } finally {
      await browser.quit();
    }
    if (!reply) fail("No reply from avatar");
    if (!reply.includes("Ecco il codice"))
      fail(
        `Avatar did not present the appointment code. Last reply: "${reply}"`,
      );
    if (!qrImageFound) fail("QR image not shown");
    return [];
  },
};
