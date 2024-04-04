import { fileExists, loadFile } from "@libs/util";

export const loadDataFile = async <T = any>(basepath: string) => {
  const exts = ["yml", "yaml", "json"];
  for (const ext of exts) {
    const fullpath = `${basepath}.${ext}`;
    if (await fileExists(fullpath)) {
      return await loadFile<T>(fullpath);
    }
  }
  return null;
};
