import fs from "fs/promises";
import { glob } from "glob";

export class ChatLoader {
  async loadDirectory(dir: string) {
    const list = await glob(`${dir}/**/*.yaml`);
  }
}
