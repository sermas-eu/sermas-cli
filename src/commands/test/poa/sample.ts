import { Command } from "commander";
import { Browser } from "../../../libs/testing/browser";
import { fail, quit } from "../../../libs/util";
import { CommandParams } from "../../../libs/dto/cli.dto";
import { sleep } from "@sermas/api-client";

export default {
  setup: async (command: Command) => {
    command.description("List user applications");
  },

  run: async () => {
    const browser: Browser = new Browser("https://www.google.com/ncr");
    try {
      await sleep(2000);
      await browser.select({ xpath: "//*[text()='Reject all']" });
      await browser.click();
      await sleep(2000);
    } finally {
      await browser.quit();
    }
    return [];
  },
};
