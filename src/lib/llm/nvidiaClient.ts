import OpenAI from "openai";

interface NvidiaResponse {
  content: string;
  modelUsed: string;
}

function getEnvVar(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing environment variable: ${key}`);
  return val;
}

function getModelList(): string[] {
  const models: string[] = [];
  for (let i = 1; i <= 5; i++) {
    const m = process.env[`NVIDIA_MODEL_${i}`];
    if (m) models.push(m);
  }
  if (models.length === 0) throw new Error("No NVIDIA_MODEL_X env vars set");
  return models;
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

export async function callNvidiaWithFallback(
  systemPrompt: string,
  userPrompt: string
): Promise<NvidiaResponse> {
  const baseURL = process.env.NVIDIA_BASE_URL || "https://integrate.api.nvidia.com/v1";
  const apiKey = getEnvVar("NVIDIA_API_KEY");
  const models = getModelList();
  const timeoutMs = parseInt(process.env.LLM_TIMEOUT_MS || "120000", 10);

  let lastError: string = "";

  console.log(`[NVIDIA] Attempting ${models.length} models, timeout ${timeoutMs}ms`);

  for (let i = 0; i < models.length; i++) {
    const model = models[i];
    try {
      const openai = new OpenAI({
        apiKey,
        baseURL,
        maxRetries: 0,
      });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

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

      clearTimeout(timeoutId);

      const choice = response.choices?.[0];
      const content = choice?.message?.content?.trim() || "";

      if (!content) {
        console.log(`[NVIDIA Fallback] Model ${model} returned empty content`);
        lastError = `Model ${model} returned empty content`;
        continue;
      }

      if (!isValidJSON(content)) {
        const maybeJSON = extractJSONFromText(content);
        if (maybeJSON && isValidJSON(maybeJSON)) {
          console.log(`[NVIDIA] Model ${model} returned JSON embedded in text, extracted successfully`);
          return { content: maybeJSON, modelUsed: model };
        }
        console.log(`[NVIDIA Fallback] Model ${model} returned invalid JSON`);
        lastError = `Model ${model} returned invalid JSON`;
        continue;
      }

      console.log(`[NVIDIA] Model ${model} succeeded`);
      return { content, modelUsed: model };
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") {
        lastError = `Model ${model} timed out after ${timeoutMs}ms`;
        console.log(`[NVIDIA Fallback] ${lastError}`);
        continue;
      }

      if (err instanceof OpenAI.APIError) {
        const status = err.status;
        const body = err.message;
        lastError = `Model ${model} failed with status ${status}: ${body}`;
        console.log(`[NVIDIA Fallback] ${lastError}`);

        if (status === undefined || isRetryableError(status) || status === 404) {
          continue;
        }

        throw new Error(`Model ${model} unavailable (HTTP ${status}). Try a different model ID.`);
      }

      if (err instanceof Error) {
        lastError = `Model ${model} error: ${err.message}`;
        console.log(`[NVIDIA Fallback] ${lastError}`);
        continue;
      }

      lastError = `Model ${model} unknown error: ${String(err)}`;
      console.log(`[NVIDIA Fallback] ${lastError}`);
    }
  }

  throw new Error(`All NVIDIA models exhausted. Last error: ${lastError}. Check your API key, model IDs, and internet connection.`);
}

function extractJSONFromText(text: string): string | null {
  const jsonRegex = /```(?:json)?\s*([\s\S]*?)```/;
  const match = text.match(jsonRegex);
  if (match) return match[1].trim();

  const braceMatch = text.match(/\{[\s\S]*\}/);
  if (braceMatch) return braceMatch[0];

  return null;
}
