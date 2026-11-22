import remove from "./remove.js";
import adminRemove from "./admin/remove.js";
import type { CommandParams } from "../../libs/dto/cli.dto.js";

const exit = vi
  .spyOn(process, "exit")
  .mockImplementation((() => undefined) as never);

const params = (
  args: string[],
  flags: Record<string, unknown>,
  answer?: boolean,
) => {
  const prompt = vi.fn(async () =>
    answer === undefined ? {} : { confirm: answer },
  );
  const api = {
    listUserApps: vi.fn(async () => [{ appId: "a1", name: "demo" }]),
    removeApp: vi.fn(async () => undefined),
    removeApps: vi.fn(async () => undefined),
  };
  return {
    params: {
      args,
      flags,
      feature: { prompt },
      api,
    } as unknown as CommandParams,
    prompt,
    api,
  };
};

afterEach(() => exit.mockClear());

describe("app remove", () => {
  it("removes without asking with --yes", async () => {
    const { params: p, prompt, api } = params(["a1"], { yes: true });
    await remove.run(p);
    expect(prompt).not.toHaveBeenCalled();
    expect(api.removeApp).toHaveBeenCalledWith("a1");
  });

  it("asks first without --yes, and keeps the app on no", async () => {
    const { params: p, prompt, api } = params(["a1"], {}, false);
    await remove.run(p);
    expect(prompt).toHaveBeenCalledOnce();
    expect(api.removeApp).not.toHaveBeenCalled();
    expect(exit).toHaveBeenCalledWith(1);
  });

  it("keeps the app when prompts are disabled (JSON output) and --yes is missing", async () => {
    const { params: p, api } = params(["a1"], { output: "json" });
    await remove.run(p);
    expect(api.removeApp).not.toHaveBeenCalled();
    expect(exit).toHaveBeenCalledWith(1);
  });

  it("fails when the API call fails", async () => {
    const { params: p, api } = params(["a1"], { yes: true });
    api.removeApp.mockResolvedValueOnce(null as never);
    await remove.run(p);
    expect(exit).toHaveBeenCalledWith(1);
  });
});

describe("app admin remove", () => {
  it("removes every given app with --yes", async () => {
    const { params: p, prompt, api } = params(["a1", "a2"], { yes: true });
    await adminRemove.run(p);
    expect(prompt).not.toHaveBeenCalled();
    expect(api.removeApps).toHaveBeenCalledWith(["a1", "a2"]);
  });

  it("removes after a yes", async () => {
    const { params: p, api } = params(["a1"], {}, true);
    await adminRemove.run(p);
    expect(api.removeApps).toHaveBeenCalledWith(["a1"]);
  });

  it("keeps the apps on no", async () => {
    const { params: p, api } = params(["a1"], {}, false);
    await adminRemove.run(p);
    expect(api.removeApps).not.toHaveBeenCalled();
  });

  it("fails when the API call fails", async () => {
    const { params: p, api } = params(["a1"], { yes: true });
    api.removeApps.mockResolvedValueOnce(null as never);
    await adminRemove.run(p);
    expect(exit).toHaveBeenCalledWith(1);
  });
});
