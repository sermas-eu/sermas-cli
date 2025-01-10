import { Command } from "commander";
import { fail, quit } from "../../libs/util";
import { CommandParams } from "../../libs/dto/cli.dto";
import { Builder, Browser, By, Key, until } from "selenium-webdriver";
import { sleep } from "@sermas/api-client";

export default {
  setup: async (command: Command) => {
    command.description("List user applications");
  },

  run: async () => {
    const driver = await new Builder().forBrowser(Browser.CHROME).build();
    try {
      await driver.get("https://www.google.com/ncr");
      await sleep(1000);
      await driver.findElement(By.xpath("//*[text()='Reject all']")).click();
      await sleep(1000);
      await driver.wait(until.titleIs("webdriver - Google Search"), 1000);
    } finally {
      await driver.quit();
    }
    return [];
  },
};
