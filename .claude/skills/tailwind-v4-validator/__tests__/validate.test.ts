import { loadPatterns, validateClassString, fixViolations } from "../validate";

describe("Tailwind v4 Validator", () => {
  describe("loadPatterns", () => {
    test("loads patterns from JSON", () => {
      const patterns = loadPatterns();
      expect(patterns.length).toBeGreaterThanOrEqual(14); // At least the documented patterns
      expect(patterns[0]).toHaveProperty("id");
      expect(patterns[0]).toHaveProperty("deprecated");
      expect(patterns[0]).toHaveProperty("canonical");
      expect(patterns[0]).toHaveProperty("priority");
    });

    test("sorts patterns by priority", () => {
      const patterns = loadPatterns();
      for (let i = 1; i < patterns.length; i++) {
        expect(patterns[i - 1].priority).toBeLessThanOrEqual(patterns[i].priority);
      }
    });
  });

  describe("validateClassString", () => {
    test("detects flex-shrink-0 -> shrink-0", () => {
      const patterns = loadPatterns();
      const code = '<div className="flex-shrink-0">Item</div>';
      const violations = validateClassString(code, patterns);
      expect(violations.length).toBeGreaterThan(0);
      expect(violations[0].original).toContain("flex-shrink");
      expect(violations[0].suggested).toBe("shrink-0");
    });

    test("detects shadow-sm -> shadow-xs", () => {
      const patterns = loadPatterns();
      const code = '<div className="shadow-sm">Item</div>';
      const violations = validateClassString(code, patterns);
      const shadowViolation = violations.find((v) => v.rule.id === "shadow-scale");
      expect(shadowViolation).toBeDefined();
      expect(shadowViolation?.original).toBe("shadow-sm");
      expect(shadowViolation?.suggested).toBe("shadow-xs");
    });

    test("detects outline-none -> outline-hidden", () => {
      const patterns = loadPatterns();
      const code = '<input className="outline-none" />';
      const violations = validateClassString(code, patterns);
      expect(violations.some((v) => v.rule.id === "outline-none")).toBe(true);
    });

    test("returns empty array for canonical classes", () => {
      const patterns = loadPatterns();
      const code = '<div className="flex gap-4 shrink-0">Item</div>';
      const violations = validateClassString(code, patterns);
      // All classes are already canonical, so no violations should be found
      expect(violations.length).toBe(0);
    });

    test("detects multiple violations in one line", () => {
      const patterns = loadPatterns();
      const code = '<div className="flex-shrink-0 shadow-sm rounded-sm">Item</div>';
      const violations = validateClassString(code, patterns);
      expect(violations.length).toBe(3);
      expect(violations.map((v) => v.rule.id)).toEqual(expect.arrayContaining(["flex-shrink", "shadow-scale", "rounded-scale"]));
    });

    test("detects gradient transformation", () => {
      const patterns = loadPatterns();
      const code = '<div className="bg-gradient-to-r from-blue-500 to-purple-500">Item</div>';
      const violations = validateClassString(code, patterns);
      expect(violations.some((v) => v.rule.id === "gradient-linear")).toBe(true);
      expect(violations.some((v) => v.suggested === "bg-linear-to-r")).toBe(true);
    });

    test("ignores non-className lines", () => {
      const patterns = loadPatterns();
      const code = `
        // This comment mentions flex-shrink-0 but shouldn't be validated
        const message = "Use flex-shrink-0 for flex items";
        <div className="flex gap-4">Item</div>
      `;
      const violations = validateClassString(code, patterns);
      // Only the actual className should be checked, not comments or strings
      expect(violations.length).toBe(0);
    });
  });

  describe("fixViolations", () => {
    test("replaces deprecated classes with canonical forms", () => {
      const patterns = loadPatterns();
      const original = '<div className="flex-shrink-0 shadow-sm">Item</div>';
      const violations = validateClassString(original, patterns);
      const fixed = fixViolations(original, violations);
      expect(fixed).toContain("shrink-0");
      expect(fixed).toContain("shadow-xs");
    });

    test("preserves non-matching content", () => {
      const patterns = loadPatterns();
      const original = '<div className="flex gap-4">Item</div>';
      const violations = validateClassString(original, patterns);
      const fixed = fixViolations(original, violations);
      expect(fixed).toContain("flex gap-4");
    });

    test("handles multiple violations on different lines", () => {
      const patterns = loadPatterns();
      const original = `
        <div className="flex-shrink-0">Item 1</div>
        <div className="shadow-sm">Item 2</div>
        <div className="rounded-sm">Item 3</div>
      `;
      const violations = validateClassString(original, patterns);
      const fixed = fixViolations(original, violations);
      expect(fixed).toContain("shrink-0");
      expect(fixed).toContain("shadow-xs");
      expect(fixed).toContain("rounded-xs");
    });

    test("returns original content when no violations", () => {
      const patterns = loadPatterns();
      const original = '<div className="flex gap-4 shrink-0">Item</div>';
      const violations = validateClassString(original, patterns);
      const fixed = fixViolations(original, violations);
      expect(fixed).toBe(original);
    });

    test("handles empty violations array", () => {
      const original = '<div className="flex gap-4">Item</div>';
      const fixed = fixViolations(original, []);
      expect(fixed).toBe(original);
    });
  });
});
