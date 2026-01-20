import * as fs from "node:fs";
import * as path from "node:path";

interface EditToolUse {
  tool: "Edit";
  input: {
    file_path: string;
    new_string: string;
  };
}

export async function validateAndFixTailwindClasses(toolUse: EditToolUse): Promise<void> {
  if (toolUse.tool !== "Edit") {
    return;
  }

  const filePath = toolUse.input.file_path;
  const extensions = [".tsx", ".jsx", ".astro", ".css"];
  const shouldValidate = extensions.some((ext) => filePath.endsWith(ext));

  if (!shouldValidate) {
    return;
  }

  try {
    // Load validation module
    type LoadPatterns = () => unknown[];
    type ValidateClassString = (content: string, patterns: unknown[]) => unknown[];
    type FixViolations = (content: string, violations: unknown[]) => string;

    let loadPatterns: LoadPatterns | undefined;
    let validateClassString: ValidateClassString | undefined;
    let fixViolations: FixViolations | undefined;

    try {
      const module = await import("../skills/tailwind-v4-validator/validate.ts");
      loadPatterns = module.loadPatterns;
      validateClassString = module.validateClassString;
      fixViolations = module.fixViolations;
    } catch (_importError) {
      console.error("Tailwind v4 Validator: Failed to load validation module. Ensure skill is installed at .claude/skills/tailwind-v4-validator/");
      return;
    }

    if (!loadPatterns || !validateClassString || !fixViolations) {
      console.error("Tailwind v4 Validator: Validation functions not found in module");
      return;
    }

    // Read file
    let content: string;
    try {
      if (!fs.existsSync(filePath)) {
        console.error(`Tailwind v4 Validator: File not found: ${filePath}`);
        return;
      }
      content = fs.readFileSync(filePath, "utf-8");
    } catch (readError) {
      console.error(`Tailwind v4 Validator: Failed to read file ${path.basename(filePath)}: ${readError instanceof Error ? readError.message : String(readError)}`);
      return;
    }

    // Validate and get violations
    let patterns: unknown[];
    let violations: unknown[];
    try {
      patterns = loadPatterns();
      violations = validateClassString(content, patterns);
    } catch (validationError) {
      console.error(`Tailwind v4 Validator: Validation error: ${validationError instanceof Error ? validationError.message : String(validationError)}`);
      return;
    }

    // Apply fixes and write back
    if (Array.isArray(violations) && violations.length > 0) {
      try {
        const fixed = fixViolations(content, violations);
        fs.writeFileSync(filePath, fixed, "utf-8");

        console.log(`\n✅ Tailwind v4 Validator: Fixed ${violations.length} deprecated patterns in ${path.basename(filePath)}`);
        violations.forEach((v: unknown) => {
          if (typeof v === 'object' && v !== null && 'rule' in v && 'original' in v && 'suggested' in v) {
            const violation = v as { rule?: { category?: string }; original?: string; suggested?: string };
            if (violation.rule?.category && violation.original && violation.suggested) {
              console.log(`  ${violation.rule.category}: "${violation.original}" → "${violation.suggested}"`);
            }
          }
        });
      } catch (writeError) {
        console.error(`Tailwind v4 Validator: Failed to write fixes to ${path.basename(filePath)}: ${writeError instanceof Error ? writeError.message : String(writeError)}`);
      }
    }
  } catch (unexpectedError) {
    console.error(`Tailwind v4 Validator: Unexpected error: ${unexpectedError instanceof Error ? unexpectedError.message : String(unexpectedError)}`);
  }
}
