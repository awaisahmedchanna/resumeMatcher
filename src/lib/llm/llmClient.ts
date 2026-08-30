import OpenAI from "openai";
import { LLMResponseSchema } from "@/lib/resume/schemas";

interface LlmResponse {
  content: string;
  provider: string;
  modelUsed: string;
}

const DEFAULT_ORDER = ["openrouter", "groq", "gemini"];

const GEMINI_GENERATE_URL =
  "https://generativelanguage.googleapis.com/v1beta/models";

function getEnvVar(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing environment variable: ${key}`);
  return val;
}

function getProviderOrder(): string[] {
  const raw = process.env.AI_PROVIDER_ORDER || DEFAULT_ORDER.join(",");
  const providers = raw
    .split(",")
    .map((p) => p.trim().toLowerCase())
    .filter(Boolean);
  if (providers.length === 0) return DEFAULT_ORDER;
  return providers;
}

function getMaxOutputTokens(provider: string): number {
  const providerSpecific = process.env[`LLM_MAX_OUTPUT_TOKENS_${provider.toUpperCase()}`];
  if (providerSpecific) {
    const n = parseInt(providerSpecific, 10);
    if (!Number.isNaN(n) && n > 0) return n;
  }
  const global = parseInt(process.env.LLM_MAX_OUTPUT_TOKENS || "", 10);
  if (!Number.isNaN(global) && global > 0) return global;

  // The resume JSON + LaTeX easily exceeds 8k tokens (the old default), which used
  // to produce truncated "invalid JSON" responses.
  switch (provider) {
    case "groq":
      // Groq's free tier counts input+output against one 8000-TPM budget per minute.
      // Input (truncated resume+JD) is ~4k tokens, so output must stay ~3k or the
      // request is rejected outright (413). Oversized outputs may still truncate and
      // fall through to the next provider in the chain.
      return 3000;
    case "gemini":
      return 32768;
    default:
      return 16384;
  }
}

function schemaValidJSON(content: string): string | null {
  if (isValidLLMJSON(content)) return content;
  const maybeJSON = extractJSONFromText(content);
  if (maybeJSON && isValidLLMJSON(maybeJSON)) return maybeJSON;
  return null;
}

function isValidLLMJSON(text: string): boolean {
  try {
    LLMResponseSchema.parse(JSON.parse(text));
    return true;
  } catch {
    return false;
  }
}

function extractJSONFromText(text: string): string | null {
  const jsonRegex = /```(?:json)?\s*([\s\S]*?)```/;
  const match = text.match(jsonRegex);
  if (match) return match[1].trim();

  const braceMatch = text.match(/\{[\s\S]*\}/);
  if (braceMatch) return braceMatch[0];

  return null;
}

async function callOpenAiCompatible(
  provider: string,
  apiKey: string,
  baseURL: string,
  model: string,
  systemPrompt: string,
  userPrompt: string,
  timeoutMs: number
): Promise<LlmResponse> {
  const openai = new OpenAI({ apiKey, baseURL, maxRetries: 0 });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await openai.chat.completions.create(
      {
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: getMaxOutputTokens(provider),
        response_format: { type: "json_object" },
      },
      { signal: controller.signal }
    );

    const choice = response.choices?.[0];
    const content = choice?.message?.content?.trim() || "";

    if (!content) {
      throw new Error(`Model ${model} returned empty content`);
    }
    return { content, provider, modelUsed: model };
  } finally {
    clearTimeout(timeoutId);
  }
}

async function callGemini(
  apiKey: string,
  model: string,
  systemPrompt: string,
  userPrompt: string,
  timeoutMs: number
): Promise<LlmResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const url = `${GEMINI_GENERATE_URL}/${model}:generateContent?key=${encodeURIComponent(
      apiKey
    )}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: `${systemPrompt}\n\n---\n\n${userPrompt}` }],
          },
        ],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: getMaxOutputTokens("gemini"),
          responseMimeType: "application/json",
        },
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Gemini API error (HTTP ${response.status})`);
    }

    const data = (await response.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };

    const text =
      data.candidates?.[0]?.content?.parts
        ?.map((part) => part.text || "")
        .join("")
        .trim() || "";

    if (!text) {
      throw new Error(`Model ${model} returned empty content`);
    }
    return { content: text, provider: "gemini", modelUsed: model };
  } finally {
    clearTimeout(timeoutId);
  }
}

async function callProvider(
  provider: string,
  systemPrompt: string,
  userPrompt: string,
  timeoutMs: number
): Promise<LlmResponse> {
  switch (provider) {
    case "openrouter": {
      const model = getEnvVar("OPENROUTER_MODEL");
      console.log(`[LLM] Trying provider "openrouter" with model ${model}`);
      return callOpenAiCompatible(
        "openrouter",
        getEnvVar("OPENROUTER_API_KEY"),
        "https://openrouter.ai/api/v1",
        model,
        systemPrompt,
        userPrompt,
        timeoutMs
      );
    }
    case "groq": {
      const model = getEnvVar("GROQ_MODEL");
      console.log(`[LLM] Trying provider "groq" with model ${model}`);
      return callOpenAiCompatible(
        "groq",
        getEnvVar("GROQ_API_KEY"),
        "https://api.groq.com/openai/v1",
        model,
        systemPrompt,
        userPrompt,
        timeoutMs
      );
    }
    case "gemini": {
      const model = getEnvVar("GEMINI_MODEL");
      console.log(`[LLM] Trying provider "gemini" with model ${model}`);
      return callGemini(
        getEnvVar("GEMINI_API_KEY"),
        model,
        systemPrompt,
        userPrompt,
        timeoutMs
      );
    }
    default:
      throw new Error(`Unknown AI provider: ${provider}`);
  }
}

export async function callLlmWithFallback(
  systemPrompt: string,
  userPrompt: string
): Promise<LlmResponse> {
  const order = getProviderOrder();
  const timeoutMs = parseInt(process.env.LLM_TIMEOUT_MS || "120000", 10);

  let lastError = "";

  console.log(`[LLM] Trying providers in order: ${order.join(", ")} (timeout ${timeoutMs}ms)`);

  // Small models (e.g. llama-3.1-8b) sometimes return schema-incomplete JSON. Give
  // each provider one repair retry before falling through to the next provider.
  const repairSuffix = `
IMPORTANT: The previous response was invalid or incomplete.
Return the COMPLETE JSON object, and only that JSON, with ALL of these keys:
"previousScore", "newScore", "summary", "missingKeywords", "addedKeywords",
"weakAreas", "changes", "beforeAfterBullets", "optimizedResume" (with name, title,
email, phone, location, links, summary, skills, experience, projects, education,
certifications), and "latex".
It must be complete and valid: no truncation, no markdown fences, no extra text.`;

  for (const provider of order) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const effectiveUserPrompt =
          attempt === 0 ? userPrompt : `${userPrompt}\n${repairSuffix}`;
        const result = await callProvider(provider, systemPrompt, effectiveUserPrompt, timeoutMs);

        // Accept JSON only when it parses AND matches the expected resume schema.
        // Free-tier output caps can truncate responses into valid-but-partial JSON,
        // which must exhaust this provider's retries and fall through downstream.
        const content = schemaValidJSON(result.content);

        if (!content) {
          if (attempt === 0) {
            console.log(
              `[LLM] Provider ${provider} (${result.modelUsed}) returned invalid/incomplete JSON - one repair retry`
            );
            continue;
          }
          lastError = `Provider ${provider} returned invalid or schema-incomplete JSON`;
          console.log(`[LLM Fallback] ${lastError}`);
          break;
        }

        console.log(
          `[LLM] Provider ${provider} (${result.modelUsed}) succeeded${attempt === 0 ? "" : " after repair"}`
        );
        return { content, provider, modelUsed: result.modelUsed };
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") {
          lastError = `Provider ${provider} timed out after ${timeoutMs}ms`;
          console.log(`[LLM Fallback] ${lastError}`);
          break;
        }

        if (err instanceof OpenAI.APIError) {
          lastError = `Provider ${provider} failed: ${err.message}`;
          console.log(`[LLM Fallback] ${lastError}`);
          break;
        }

        lastError = err instanceof Error ? err.message : String(err);
        console.log(`[LLM Fallback] Provider ${provider} error: ${lastError}`);
        break;
      }
    }
  }

  throw new Error(
    `All AI providers exhausted. Last error: ${lastError}. Check your API keys, model IDs, and internet connection.`
  );
}
