import * as path from "node:path";
import { loadAppStructure, structureToApp } from "./structure.js";

const template = path.resolve(import.meta.dirname, "../../tpl/app");

describe("app structure", () => {
  it("loads the bundled template", async () => {
    const structure = await loadAppStructure(template);
    expect(structure.app?.name).toBe("Hello World");
    expect(structure.modules?.map((m) => m.moduleId)).toContain("avatar");
    // platform defaults: no avatar of its own, no pinned LLM models
    expect(structure.repository?.avatars ?? []).toHaveLength(0);
    expect(structure.settings?.llm).toBeUndefined();
    expect(structure.repository?.documents?.length).toBeGreaterThan(0);
  });

  it("turns a structure into an app", async () => {
    const structure = await loadAppStructure(template);
    const app = structureToApp({ ...structure, appId: "my-app" });
    expect(app.appId).toBe("my-app");
    expect(app.name).toBe("Hello World");
    expect(app.modules?.length).toBeGreaterThan(0);
    // the website crawler is gone from the API (no `rag`)
    expect(app).not.toHaveProperty("rag");
  });
});
