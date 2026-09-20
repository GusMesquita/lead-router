import { describe, expect, it } from "vitest";
import { tierFor } from "./scoreTier";

describe("tierFor", () => {
  it("classifies boundary scores correctly", () => {
    expect(tierFor(70).label).toBe("quente");
    expect(tierFor(69).label).toBe("morno");
    expect(tierFor(40).label).toBe("morno");
    expect(tierFor(39).label).toBe("frio");
  });
});
