import * as path from "path";
import { fileExists, loadFile } from "../../libs/util";

export const DataFileExtensions = ["yml", "yaml", "json"];

// loads file.ext.[json|yaml] or file.[json|yaml]
export const loadDataFile = async <T = any>(basepath: string) => {
  const exts = DataFileExtensions;
  const files = [basepath, basepath.replace(path.extname(basepath), "")];
  for (const file of files) {
    for (const ext of exts) {
      const fullpath = `${file}.${ext}`;
      if (await fileExists(fullpath)) {
        return await loadFile<T>(fullpath);
      }
    }
  }
  return null;
};
