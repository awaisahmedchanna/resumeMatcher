import { LLMResponseSchema } from "@/lib/resume/schemas";
import type { LLMResponse } from "@/types/resume";

function repairJSON(text: string): string {
  let cleaned = text.trim();

  if (cleaned.startsWith("```")) {
    const extracted = extractJSONFromText(cleaned);
    if (extracted) cleaned = extracted;
  }

  cleaned = cleaned.replace(/,\s*([}\]])/g, "$1");

  return cleaned;
}

function extractJSONFromText(text: string): string | null {
  const jsonRegex = /```(?:json)?\s*([\s\S]*?)```/;
  const match = text.match(jsonRegex);
  if (match) return match[1].trim();

  let depth = 0;
  let start = -1;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === "{") {
      if (depth === 0) start = i;
      depth++;
    } else if (ch === "}") {
      depth--;
      if (depth === 0 && start !== -1) {
        return text.slice(start, i + 1);
      }
    }
  }

  return null;
}

export function parseAndValidateLLMResponse(raw: string): LLMResponse {
  let repaired = repairJSON(raw);

  let parsed: unknown;
  try {
    parsed = JSON.parse(repaired);
  } catch {
    const extracted = extractJSONFromText(raw);
    if (extracted) {
      repaired = repairJSON(extracted);
      parsed = JSON.parse(repaired);
    } else {
      throw new Error("Could not extract valid JSON from LLM response");
    }
  }

  const result = LLMResponseSchema.parse(parsed);

  return {
    previousScore: result.previousScore,
    newScore: result.newScore,
    summary: result.summary,
    missingKeywords: result.missingKeywords,
    addedKeywords: result.addedKeywords,
    weakAreas: result.weakAreas,
    changes: result.changes,
    beforeAfterBullets: result.beforeAfterBullets,
    optimizedResume: {
      name: result.optimizedResume.name,
      title: result.optimizedResume.title,
      email: result.optimizedResume.email,
      phone: result.optimizedResume.phone,
      location: result.optimizedResume.location,
      links: result.optimizedResume.links,
      summary: result.optimizedResume.summary,
      skills: result.optimizedResume.skills,
      experience: result.optimizedResume.experience,
      projects: result.optimizedResume.projects,
      education: result.optimizedResume.education,
      certifications: result.optimizedResume.certifications,
    },
    latex: result.latex,
  };
}
