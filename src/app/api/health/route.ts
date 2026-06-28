import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    modelsConfigured: countConfiguredModels(),
  });
}

function countConfiguredModels(): number {
  let count = 0;
  for (let i = 1; i <= 5; i++) {
    if (process.env[`NVIDIA_MODEL_${i}`]) count++;
  }
  return count;
}
