import fs from "fs";
import path from "path";

interface SectionRule {
  label: string;
  keywords: string[];
  required: boolean;
}

interface IntroFormat {
  minLength: number;
  requiredSections: SectionRule[];
}

const formatPath = path.resolve(__dirname, "../../config/intro-format.json");
const introFormat: IntroFormat = JSON.parse(
  fs.readFileSync(formatPath, "utf-8")
);

export interface ValidationResult {
  valid: boolean;
  tooShort: boolean;
  missingSections: string[];
}

export function validateIntro(text: string): ValidationResult {
  const lower = text.toLowerCase();

  if (text.length < introFormat.minLength) {
    return { valid: false, tooShort: true, missingSections: [] };
  }

  const missingSections: string[] = [];

  for (const section of introFormat.requiredSections) {
    if (!section.required) continue;

    const hasKeyword = section.keywords.some((kw) => lower.includes(kw));
    if (!hasKeyword) {
      missingSections.push(section.label);
    }
  }

  return {
    valid: missingSections.length === 0,
    tooShort: false,
    missingSections,
  };
}
