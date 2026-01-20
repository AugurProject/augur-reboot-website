import * as fs from "node:fs";

interface PatternRule {
  id: string;
  category: string;
  deprecated: string;
  canonical: string | null;
  explanation: string;
  examples: Array<{ old: string; new: string }>;
  priority: number;
  isRegex?: boolean;
  transform?: string;
}

interface ValidationResult {
  file: string;
  violations: Array<{
    line: number;
    original: string;
    suggested: string;
    rule: PatternRule;
  }>;
}

export function loadPatterns(): PatternRule[] {
  try {
    const patternsPath = `${__dirname}/patterns.json`;
    if (!fs.existsSync(patternsPath)) {
      throw new Error(`Patterns file not found: ${patternsPath}`);
    }
    const content = fs.readFileSync(patternsPath, "utf-8");
    const data = JSON.parse(content);
    if (!Array.isArray(data.patterns)) {
      throw new Error("patterns.json must contain a 'patterns' array");
    }
    return data.patterns.sort((a: PatternRule, b: PatternRule) => a.priority - b.priority);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to load Tailwind validator patterns: ${message}`);
  }
}

export function validateClassString(classString: string, patterns: PatternRule[]): ValidationResult["violations"] {
  const violations: ValidationResult["violations"] = [];

  const lines = classString.split("\n");
  patterns.forEach((rule) => {
    lines.forEach((line, index) => {
      if (!line.includes("className") && !line.includes("class=")) {
        return;
      }

      if (rule.isRegex) {
        const regex = new RegExp(rule.deprecated, "g");
        let match: RegExpExecArray | null = regex.exec(line);
        while (match !== null) {
          violations.push({
            line: index + 1,
            original: match[0],
            suggested: handleSpecialTransforms(match[0], rule),
            rule,
          });
          match = regex.exec(line);
        }
      } else {
        if (line.includes(rule.deprecated)) {
          violations.push({
            line: index + 1,
            original: rule.deprecated,
            suggested: rule.canonical || rule.deprecated,
            rule,
          });
        }
      }
    });
  });

  return violations;
}

function handleSpecialTransforms(original: string, rule: PatternRule): string {
  if (rule.transform === "custom") {
    // Handle opacity modifier transformation
    if (rule.id === "opacity-modifier") {
      // Match: bg-opacity-50 bg-red-500 -> bg-red-500/50
      const opacityMatch = original.match(/(bg|text|border|divide|ring|placeholder)-opacity-(\d+)\s+(bg|text|border|divide|ring|placeholder)-/);
      if (opacityMatch) {
        const [, _prefix, _opacity, colorPrefix] = opacityMatch;
        return `${colorPrefix}-`;
      }
    }
    // Handle important flag position
    if (rule.id === "important-position") {
      return original.replace(/^!/, "").replace(/(\S+)$/, "$1!");
    }
    // Handle outline prefix
    if (rule.id === "outline-prefix") {
      return original.replace(/^outline\s+/, "");
    }
  }

  return rule.canonical || original;
}

export function fixViolations(content: string, violations: ValidationResult["violations"]): string {
  if (violations.length === 0) {
    return content;
  }

  // Group violations by line to apply all replacements at once
  const violationsByLine = new Map<number, Array<{ original: string; suggested: string }>>();

  violations.forEach((violation) => {
    if (!violationsByLine.has(violation.line)) {
      violationsByLine.set(violation.line, []);
    }
    const lineViolations = violationsByLine.get(violation.line);
    if (lineViolations) {
      lineViolations.push({
        original: violation.original,
        suggested: violation.suggested,
      });
    }
  });

  const lines = content.split("\n");

  // Apply all violations to their respective lines in a single pass
  violationsByLine.forEach((replacements, lineNumber) => {
    const lineIndex = lineNumber - 1;
    if (lineIndex >= 0 && lineIndex < lines.length) {
      let line = lines[lineIndex];
      // Apply replacements from this line
      replacements.forEach(({ original, suggested }) => {
        line = line.replace(original, suggested);
      });
      lines[lineIndex] = line;
    }
  });

  return lines.join("\n");
}
