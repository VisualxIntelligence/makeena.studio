import { describe, expect, it } from "vitest";
import { baseClass, checkClass, classTokens } from "../../scripts/lint/class-rules.mjs";

describe("checkClass", () => {
  it.each([
    "ml-4",
    "pr-2",
    "md:hover:-mr-1",
    "left-0",
    "right-[3px]",
    "text-left",
    "float-right",
    "rounded-l-sm",
    "border-r",
    "shadow",
    "shadow-md",
    "drop-shadow-lg",
    "bg-linear-to-r",
    "bg-radial",
    "from-ivory",
    "backdrop-blur-sm",
    "rounded-full",
    "rounded-[6px]",
    "ml-4!",
  ])("rejects %s", (c) => expect(checkClass(c)).not.toBeNull());

  it.each([
    "ms-4",
    "pe-2",
    "start-0",
    "end-[3px]",
    "text-start",
    "float-end",
    "rounded-sm",
    "rounded-s-xs",
    "border-e",
    "border-ink",
    "bg-ivory",
    "text-copper-deep",
    "font-display",
    "text-label",
    "max-w-content",
    "lg:[&>li]:ms-2",
    "translate-x-1",
    "top-0",
  ])("allows %s", (c) => expect(checkClass(c)).toBeNull());
});

describe("baseClass", () => {
  it("strips variants, important and negative", () => {
    expect(baseClass("md:hover:-ml-4!")).toBe("ml-4");
    expect(baseClass("[&:hover]:ms-2")).toBe("ms-2");
  });
});

describe("classTokens", () => {
  it("reads class, class:list and expression attributes with line numbers", () => {
    const src = `<p class="a b">\n<i class={\`c \${x}\`} />\n<b class:list={["d", { e: on }]} />`;
    expect(classTokens(src).map((t) => t.token)).toEqual(
      expect.arrayContaining(["a", "b", "c", "d"]),
    );
    expect(classTokens(src).find((t) => t.token === "d")?.line).toBe(3);
  });
});
