import OpenAI from "openai";

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

function isRetryableError(status?: number): boolean {
  if (status && [429, 500, 502, 503, 504].includes(status)) return true;
  return false;
}

function isValidJSON(text: string): boolean {
  try {
    JSON.parse(text);
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
        max_tokens: 8192,
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
          maxOutputTokens: 8192,
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

  for (const provider of order) {
    try {
      const result = await callProvider(provider, systemPrompt, userPrompt, timeoutMs);
      const content = result.content;

      if (!isValidJSON(content)) {
        const maybeJSON = extractJSONFromText(content);
        if (maybeJSON && isValidJSON(maybeJSON)) {
          console.log(
            `[LLM] Provider ${provider} (${result.modelUsed}) returned JSON embedded in text, extracted successfully`
          );
          return { content: maybeJSON, provider, modelUsed: result.modelUsed };
        }
        lastError = `Provider ${provider} returned invalid JSON`;
        console.log(`[LLM Fallback] ${lastError}`);
        continue;
      }

      console.log(`[LLM] Provider ${provider} (${result.modelUsed}) succeeded`);
      return result;
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") {
        lastError = `Provider ${provider} timed out after ${timeoutMs}ms`;
        console.log(`[LLM Fallback] ${lastError}`);
        continue;
      }

      if (err instanceof OpenAI.APIError) {
        lastError = `Provider ${provider} failed: ${err.message}`;
        console.log(`[LLM Fallback] ${lastError}`);
        if (err.status === undefined || isRetryableError(err.status) || err.status === 404) {
          continue;
        }
        continue;
      }

      lastError = err instanceof Error ? err.message : String(err);
      console.log(`[LLM Fallback] Provider ${provider} error: ${lastError}`);
    }
  }

  throw new Error(
    `All AI providers exhausted. Last error: ${lastError}. Check your API keys, model IDs, and internet connection.`
  );
}
