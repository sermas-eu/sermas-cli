import { sleep } from "@sermas/api-client";
import { WebDriver, Builder, By, WebElement } from "selenium-webdriver";
import chrome from "selenium-webdriver/chrome";

export type Selector = {
  text?: string;
  contains?: string;
  id?: string;
  xpath?: string;
};

export class Browser {
  private webdriver: WebDriver;
  private baseUrl: string;
  private pace: number;
  private defaultMaxWait: number;
  selectedElement: WebElement | null = null;

  /**
   * Automated Browser
   *
   * Expose a simple interface to interact with the browser.
   *
   * @param baseUrl - base URL of the web application to be tested
   * @param pace - sleep after each browser action, in ms. This helps for visual debugging
   * @param maxWait - max time in seconds to wait for a selected element to appear on page
   *                  before throwing and exception
   */
  constructor(baseUrl: string, pace: number = 0, maxWait: number = 10.0) {
    const options = new chrome.Options();
    const prefs = {
      "profile.default_content_setting_values.media_stream_mic": 2, // disable mic
      "profile.default_content_setting_values.media_stream_camera": 2, // disable camera
    };
    options.setUserPreferences(prefs);

    this.webdriver = new Builder()
      .forBrowser("chrome")
      .setChromeOptions(options)
      .build();

    this.baseUrl = baseUrl;
    this.pace = pace;
    this.defaultMaxWait = maxWait * 1000; // Convert to milliseconds
    this.webdriver.manage().setTimeouts({ implicit: this.defaultMaxWait });
    this.webdriver.manage().window().maximize();
    this.webdriver.get(this.baseUrl);
    sleep(this.pace);
  }

  get found(): boolean {
    return Boolean(this.selectedElement);
  }

  /**
   * Get the specified attribute of the selected element
   * @param name - attribute name
   */
  async getAttribute(name: string): Promise<string | null> {
    if (!this.selectedElement) {
      return null;
    }
    return await this.selectedElement.getAttribute(name);
  }

  /**
   * Select an HTML element
   *
   * It accepts only one selector. If multiple elements are matched, only the first one is selected.
   *
   * @param params - Object containing one of: text, contains, id, or xpath
   */
  async select(
    { text, contains, id, xpath }: Selector,
    customWait: number | null = null,
  ): Promise<void> {
    this.selectedElement = null;

    const selectorCount = [text, contains, id, xpath].filter(Boolean).length;
    if (selectorCount !== 1) {
      throw new Error("Specify one selector: text, contains, id or xpath");
    }

    if (customWait)
      this.webdriver.manage().setTimeouts({ implicit: customWait });

    let element: WebElement;

    try {
      if (text) {
        element = await this.webdriver.findElement(
          By.xpath(`//*[text()='${text}']`),
        );
      } else if (contains) {
        element = await this.webdriver.findElement(
          By.xpath(`//*[contains(., '${contains}')]`),
        );
      } else if (id) {
        element = await this.webdriver.findElement(By.id(id));
      } else if (xpath) {
        element = await this.webdriver.findElement(By.xpath(xpath));
      } else {
        throw new Error("No valid selector provided");
      }

      if (!element) {
        throw new Error(
          `Element not found: ${text || contains || id || xpath}`,
        );
      }
    } finally {
      this.webdriver.manage().setTimeouts({ implicit: this.defaultMaxWait });
    }

    this.selectedElement = element;
  }

  /**
   * Click on HTML element
   *
   * It accepts at most one selector. If multiple elements are matched, only the first one is selected.
   * If no selector is passed, clicks on the last selected element.
   *
   * @param params - Object containing one of: text, contains, id, or xpath
   */
  async click(selector: Selector | null = null): Promise<void> {
    if (selector) await this.select(selector);
    if (!this.selectedElement) {
      throw new Error("No element selected");
    }
    await this.selectedElement.click();
    await sleep(this.pace);
  }

  /**
   * Enter text in the selected element
   */
  async write(text: string): Promise<void> {
    if (!this.selectedElement) {
      throw new Error("No element selected");
    }
    await this.selectedElement.sendKeys(text);
    await sleep(this.pace);
  }

  /**
   * Read text content of the selected element
   */
  async read(): Promise<string> {
    if (!this.selectedElement) {
      throw new Error("No element selected");
    }
    return await this.selectedElement.getText();
  }

  /**
   * Get inner HTML content of the selected element
   */
  async getInnerHTML(): Promise<string> {
    if (!this.selectedElement) {
      throw new Error("No element selected");
    }
    return await this.getAttribute("innerHTML");
  }

  /**
   * Quit
   */
  async quit(): Promise<void> {
    return await this.webdriver.quit();
  }

  /**
   * Accept agreement, disable mic and audio
   */
  async initSession(loginToAsa: boolean = false): Promise<void> {
    await this.acceptInitialAgreements();
    if (loginToAsa) {
      await this.loginToAsa();
    }
    await this.disableMic();
    await this.disableSound();
  }

  /**
   * Login to ASA app
   */
  async loginToAsa(): Promise<void> {
    await this.select({
      xpath: '//input[@name="username"]',
    });
    await this.click();
    await this.write("admin");
    await this.select({
      xpath: '//input[@name="password"]',
    });
    await this.click();
    await this.write("admin");
    await this.select({ text: "Login" });
    await this.click();
  }

  /**
   * Accept initial agreement on Kiosk
   */
  async acceptInitialAgreements(): Promise<void> {
    await this.select({
      xpath: "/html/body/div/div[1]/div/div/div[1]/label[1]",
    });
    await this.click();
    await this.select({
      xpath: "/html/body/div/div[1]/div/div/div[2]/label[1]",
    });
    await this.click();
    await this.select({ xpath: "//button[1]" });
    await this.click();
  }

  /**
   * Disable microphone
   */
  async disableMic(): Promise<void> {
    await this.select({
      xpath: "//*[@title='Toggle microphone']",
    });
    if ((await this.getAttribute("class")).includes("is-active"))
      await this.click();
  }

  /**
   * Disable sound
   */
  async disableSound(): Promise<void> {
    await this.select({
      xpath: "//*[@title='Toggle audio']",
    });
    if ((await this.getAttribute("class")).includes("is-active"))
      await this.click();
  }

  /**
   * Get last avatar message
   */
  async getLastMessage(): Promise<string> {
    try {
      await this.select(
        {
          xpath:
            "//span[@id='ui-content-agent']//div[contains(@class, 'agent-wrap')]",
        },
        5000,
      );
    } catch {
      // TODO: Log
    }
    if (!this.found || !(await this.read())) {
      try {
        await this.select(
          {
            xpath: "//div[contains(@class, 'chat-history')]/div[last()]",
          },
          5000,
        );
      } catch {
        // TODO: Log
      }
    }
    return await this.read();
  }

  /**
   * Talk to avatar and get reply
   */
  async talkToAvatar(
    sentence: string,
    extraWait: number = 0.0,
  ): Promise<string> {
    const lastMessage: string = await this.getLastMessage();
    await this.select({ xpath: "//*[@placeholder='Type something to ask']" });
    await this.click();
    await this.write(sentence);
    await this.select({ text: "Send" });
    await this.click();
    let newMessage: string;
    for (let i = 0; i < 30; i++) {
      // wait for reply
      await sleep(250);
      newMessage = await this.getLastMessage();
      if (
        newMessage &&
        newMessage !== lastMessage &&
        !newMessage.includes(sentence)
      ) {
        break;
      }
    }
    if (extraWait > 0) {
      // If the message is partially streamed
      await sleep(extraWait);
      newMessage = await this.getLastMessage();
    }
    if (
      newMessage &&
      newMessage !== lastMessage &&
      !newMessage.includes(sentence)
    ) {
      return newMessage;
    }
    return "";
  }
}
