import { Command } from "commander";
import { Browser } from "../../../libs/testing/browser";
import { fail } from "../../../libs/util";
import { CommandParams } from "../../../libs/dto/cli.dto";

export default {
  setup: async (command: Command) => {
    command.description("Say hello to Emma");
  },

  run: async ({ flags }: CommandParams) => {
    const baseUrl = flags.baseurl || "http://localhost:8080";
    const pace = parseInt(flags.pace) || 0;
    const browser: Browser = new Browser(`${baseUrl}/poa`, pace);
    let reply: string;
    try {
      await browser.initSession();
      reply = await browser.talkToAvatar(
        "Buongiorno, Emma! Devo spedire un pacco",
        3000,
      );
    } finally {
      await browser.quit();
    }
    if (!reply) fail("No reply from avatar");
    if (
      !reply.includes(
        "Benvenuto nella procedura guidata per la spedizione di un pacco",
      )
    )
      fail(
        `Avatar did not explain how to ship a parcel. Last reply: "${reply}"`,
      );
    return [];
  },
};
