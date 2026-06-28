"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import UploadZone from "@/components/tailor/UploadZone";
import ProgressSteps from "@/components/tailor/ProgressSteps";
import ResultSection from "@/components/tailor/ResultSection";

const PROGRESS_INTERVAL = 500;

export default function TailorPage() {
  const [file, setFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [applicantName, setApplicantName] = useState("");
  const [loading, setLoading] = useState(false);
  const [progressStep, setProgressStep] = useState(-1);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{
    analysis: {
      previousScore: number;
      newScore: number;
      summary: string;
      missingKeywords: string[];
      addedKeywords: string[];
      weakAreas: string[];
      changes: {
        section: string;
        before: string;
        after: string;
        why: string;
      }[];
      beforeAfterBullets: {
        before: string;
        after: string;
        reason: string;
      }[];
    };
    resume: {
      latex: string;
      pdfBase64: string;
      fileName: string;
    };
  } | null>(null);

  const handleFileSelect = useCallback((f: File | null) => {
    setFile(f);
    setError("");
  }, []);

  const simulateProgress = () => {
    setProgressStep(0);
    let step = 0;
    const interval = setInterval(() => {
      step++;
      if (step < 7) {
        setProgressStep(step);
      } else {
        clearInterval(interval);
      }
    }, PROGRESS_INTERVAL);
    return interval;
  };

  const handleSubmit = async () => {
    setError("");
    setResult(null);

    if (!file) {
      setError("Please upload a resume file.");
      return;
    }

    if (jobDescription.trim().length < 100) {
      setError("Job description must be at least 100 characters.");
      return;
    }

    setLoading(true);
    const progressInterval = simulateProgress();

    try {
      const formData = new FormData();
      formData.append("resume", file);
      formData.append("jobDescription", jobDescription);
      if (targetRole) formData.append("targetRole", targetRole);
      if (applicantName) formData.append("applicantName", applicantName);

      const response = await fetch("/api/tailor-resume", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Something went wrong.");
      }

      setResult({
        analysis: data.analysis,
        resume: data.resume,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred."
      );
    } finally {
      clearInterval(progressInterval);
      setProgressStep(7);
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col flex-1">
      <header className="border-b border-border/50 px-4 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
          <span className="text-xl font-bold tracking-tight gradient-text">
            ResumeTailor AI
          </span>
          <div className="w-16" />
        </div>
      </header>

      <main className="flex-1 px-4 py-8">
        <div className="mx-auto max-w-6xl">
          {result ? (
            <ResultSection
              analysis={result.analysis}
              resume={result.resume}
            />
          ) : (
            <div className="grid gap-8 lg:grid-cols-2">
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                    Tailor Your Resume
                  </h1>
                  <p className="mt-2 text-muted-foreground">
                    Upload your resume and paste the job description to get
                    AI-powered optimization.
                  </p>
                </div>

                <UploadZone
                  onFileSelect={handleFileSelect}
                  file={file}
                  disabled={loading}
                />

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Job Description
                    <span className="text-muted-foreground font-normal">
                      {" "}
                      (min 100 characters)
                    </span>
                  </label>
                  <Textarea
                    placeholder="Paste the full job description here..."
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    rows={8}
                    disabled={loading}
                    className="resize-none"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>
                      {jobDescription.length < 100
                        ? `${jobDescription.length}/100`
                        : `${jobDescription.length} characters`}
                    </span>
                    {jobDescription.length >= 100 && (
                      <span className="text-green-600 dark:text-green-400">
                        Minimum met
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Target Role{" "}
                      <span className="text-muted-foreground font-normal">
                        (optional)
                      </span>
                    </label>
                    <Input
                      placeholder="e.g. Senior Frontend Engineer"
                      value={targetRole}
                      onChange={(e) => setTargetRole(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Your Name{" "}
                      <span className="text-muted-foreground font-normal">
                        (optional)
                      </span>
                    </label>
                    <Input
                      placeholder="e.g. John Doe"
                      value={applicantName}
                      onChange={(e) => setApplicantName(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                </div>

                {error && (
                  <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                    {error}
                  </div>
                )}

                <Button
                  onClick={handleSubmit}
                  disabled={loading || !file || jobDescription.length < 100}
                  className="w-full h-12 gap-2 text-base"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-5 w-5" />
                      Analyze & Generate Resume
                    </>
                  )}
                </Button>
              </div>

              <div className="lg:pl-8 lg:border-l lg:border-border/50">
                {loading ? (
                  <div className="space-y-6">
                    <h3 className="font-semibold">Processing</h3>
                    <ProgressSteps currentStep={progressStep} />
                  </div>
                ) : (
                  <div className="flex h-full min-h-[300px] items-center justify-center rounded-2xl border border-dashed p-8">
                    <div className="text-center">
                      <Sparkles className="mx-auto h-10 w-10 text-muted-foreground/50" />
                      <p className="mt-4 text-sm text-muted-foreground">
                        Your results will appear here after processing.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
