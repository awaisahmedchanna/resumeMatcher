import { NextRequest, NextResponse } from "next/server";
import { extractResumeText } from "@/lib/resume/extractText";
import { buildSystemPrompt, buildUserPrompt } from "@/lib/llm/prompts";
import { callNvidiaWithFallback } from "@/lib/llm/nvidiaClient";
import { parseAndValidateLLMResponse } from "@/lib/llm/parseJson";
import { generateLatexFromJSON, isValidLatex } from "@/lib/latex/generateLatex";
import { renderResumePDFBase64 } from "@/lib/pdf/renderResumePdf";
import type { OptimizedResume } from "@/types/resume";

const MAX_UPLOAD_MB = parseInt(process.env.MAX_UPLOAD_MB || "5", 10);
const MAX_BYTES = MAX_UPLOAD_MB * 1024 * 1024;

const ALLOWED_MIME_TYPES = [
  "text/plain",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const file = formData.get("resume") as File | null;
    const jobDescription = formData.get("jobDescription") as string | null;
    const targetRole = formData.get("targetRole") as string | null;
    const applicantName = formData.get("applicantName") as string | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "Resume file is required." },
        { status: 400 }
      );
    }

    if (!jobDescription || jobDescription.trim().length < 100) {
      return NextResponse.json(
        {
          success: false,
          error: "Job description must be at least 100 characters.",
        },
        { status: 400 }
      );
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type) && !file.name.match(/\.(pdf|docx|txt)$/i)) {
      return NextResponse.json(
        { success: false, error: "Unsupported file type. Please upload PDF, DOCX, or TXT." },
        { status: 400 }
      );
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        {
          success: false,
          error: `File too large. Maximum size is ${MAX_UPLOAD_MB} MB.`,
        },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const resumeText = await extractResumeText(buffer, file.type, file.name);

    if (!resumeText || resumeText.trim().length < 10) {
      return NextResponse.json(
        { success: false, error: "Could not extract enough text from the resume file." },
        { status: 400 }
      );
    }

    const systemPrompt = buildSystemPrompt();
    const userPrompt = buildUserPrompt(
      resumeText,
      jobDescription,
      targetRole || undefined,
      applicantName || undefined
    );

    const { content } = await callNvidiaWithFallback(systemPrompt, userPrompt);

    const parsed = parseAndValidateLLMResponse(content);

    let latex = parsed.latex;

    if (!isValidLatex(latex)) {
      latex = generateLatexFromJSON(parsed.optimizedResume);
    }

    if (!isValidLatex(latex)) {
      latex = generateLatexFromJSON(parsed.optimizedResume);
    }

    const pdfBase64 = await renderResumePDFBase64(
      parsed.optimizedResume as OptimizedResume
    );

    const safeFileName = (applicantName || parsed.optimizedResume.name || "resume")
      .replace(/\s+/g, "_")
      .replace(/[^a-zA-Z0-9_-]/g, "");

    return NextResponse.json({
      success: true,
      analysis: {
        previousScore: parsed.previousScore,
        newScore: parsed.newScore,
        summary: parsed.summary,
        missingKeywords: parsed.missingKeywords,
        addedKeywords: parsed.addedKeywords,
        weakAreas: parsed.weakAreas,
        changes: parsed.changes,
        beforeAfterBullets: parsed.beforeAfterBullets,
      },
      resume: {
        latex,
        pdfBase64,
        fileName: safeFileName,
      },
    });
  } catch (error) {
    console.error("[Tailor Resume API]", error);

    let message = "An unexpected error occurred. Please try again later.";
    if (error instanceof Error) {
      if (error.message.includes("NVIDIA") || error.message.includes("API key")) {
        message = "AI providers are temporarily busy. Please try again later.";
      } else if (
        error.message.includes("PDF") ||
        error.message.includes("DOCX") ||
        error.message.includes("extract")
      ) {
        message = error.message;
      }
    }

    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
