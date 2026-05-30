import { describe, it, expect } from "vitest";
import { DISHES, dishLabel } from "@/lib/dishes";

describe("dishes", () => {
  it("has 7 dishes with unique ids", () => {
    const ids = DISHES.map((dish) => dish.id);
    expect(ids).toHaveLength(7);
    expect(new Set(ids).size).toBe(7);
  });

  it("resolves a label by id", () => {
    expect(dishLabel("sushi")).toBe("суши");
  });

  it("returns the id itself for unknown dish", () => {
    expect(dishLabel("mystery")).toBe("mystery");
  });
});
