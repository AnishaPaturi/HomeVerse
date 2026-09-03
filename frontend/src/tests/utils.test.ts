/**
 * Frontend sample unit test
 */
import { formatCurrency, cn } from "@/lib/utils";

describe("Utility Functions", () => {
  test("formatCurrency formats correctly", () => {
    const formatted = formatCurrency(50000, "INR");
    expect(formatted).toContain("50,000");
  });

  test("cn joins class names cleanly", () => {
    expect(cn("px-4", false && "hidden", "py-2")).toBe("px-4 py-2");
  });
});
