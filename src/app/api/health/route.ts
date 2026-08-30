import { NextResponse } from "next/server";

const PROVIDERS: Array<{ id: string; key: string; model: string; baseUrl?: string }> = [
  { id: "openrouter", key: "OPENROUTER_API_KEY", model: "OPENROUTER_MODEL" },
  { id: "groq", key: "GROQ_API_KEY", model: "GROQ_MODEL" },
  { id: "gemini", key: "GEMINI_API_KEY", model: "GEMINI_MODEL" },
];

export async function GET() {
  const configured = getConfiguredProviders();
  const order = getProviderOrder();

  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    providerOrder: order,
    modelsConfigured: configured.length,
    configuredProviders: configured,
  });
}

function getConfiguredProviders(): string[] {
  return PROVIDERS.filter(
    (p) => process.env[p.key] && process.env[p.model]
  ).map((p) => p.id);
}

function getProviderOrder(): string[] {
  const raw = process.env.AI_PROVIDER_ORDER || "openrouter,groq,gemini";
  return raw
    .split(",")
    .map((p) => p.trim().toLowerCase())
    .filter(Boolean);
}
