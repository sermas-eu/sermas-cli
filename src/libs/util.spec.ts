import { fail, quit, toData } from "./util.js";

describe("quit and fail", () => {
  const exit = vi
    .spyOn(process, "exit")
    .mockImplementation((() => undefined) as never);
  afterEach(() => exit.mockClear());

  it("quit ends normally unless given a code", () => {
    quit("nothing to do");
    expect(exit).toHaveBeenCalledWith(0);
  });

  it("fail exits with 1", () => {
    fail("broken");
    expect(exit).toHaveBeenCalledWith(1);
  });
});

describe("toData", () => {
  it("renders JSON and YAML", () => {
    expect(toData("json", { a: 1 })).toBe('{\n  "a": 1\n}');
    expect(toData("yaml", { a: 1 })).toBe("a: 1\n");
  });
});
