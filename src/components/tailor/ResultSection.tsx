"use client";

import { motion } from "framer-motion";
import { Download, FileCode, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ScoreCircle from "./ScoreCircle";

interface AnalysisResult {
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
}

interface ResumeResult {
  latex: string;
  pdfBase64: string;
  fileName: string;
}

interface ResultSectionProps {
  analysis: AnalysisResult;
  resume: ResumeResult;
}

export default function ResultSection({
  analysis,
  resume,
}: ResultSectionProps) {
  const improvement = analysis.newScore - analysis.previousScore;

  const handleDownloadPDF = () => {
    const byteCharacters = atob(resume.pdfBase64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${resume.fileName}_tailored.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadLatex = () => {
    const blob = new Blob([resume.latex], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${resume.fileName}_tailored.tex`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadJSON = () => {
    const report = { analysis };
    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${resume.fileName}_analysis.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyLatex = () => {
    navigator.clipboard.writeText(resume.latex);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      <div className="text-center">
        <h2 className="text-2xl font-bold tracking-tight">
          AI Analysis Completed
        </h2>
        <p className="mt-2 text-muted-foreground">{analysis.summary}</p>
      </div>

      <div className="flex items-center justify-center gap-8 sm:gap-16">
        <ScoreCircle
          score={analysis.previousScore}
          label="Previous Match"
        />
        <div className="flex flex-col items-center">
          <span className="text-3xl font-bold gradient-text">
            {improvement > 0 ? `+${improvement}%` : `${improvement}%`}
          </span>
          <span className="text-xs text-muted-foreground">Improvement</span>
        </div>
        <ScoreCircle
          score={analysis.newScore}
          label="New Match"
        />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {analysis.missingKeywords.length > 0 && (
          <div className="rounded-2xl border p-4">
            <h3 className="mb-3 font-semibold text-sm text-destructive">
              Missing Keywords
            </h3>
            <div className="flex flex-wrap gap-2">
              {analysis.missingKeywords.map((kw, i) => (
                <Badge key={i} variant="destructive" className="text-xs">
                  {kw}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {analysis.addedKeywords.length > 0 && (
          <div className="rounded-2xl border p-4">
            <h3 className="mb-3 font-semibold text-sm text-green-600 dark:text-green-400">
              Keywords Added
            </h3>
            <div className="flex flex-wrap gap-2">
              {analysis.addedKeywords.map((kw, i) => (
                <Badge
                  key={i}
                  variant="secondary"
                  className="bg-green-500/10 text-green-600 dark:text-green-400 text-xs"
                >
                  {kw}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>

      {analysis.weakAreas.length > 0 && (
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
          <h3 className="mb-2 font-semibold text-sm text-amber-600 dark:text-amber-400">
            Warnings — Weak Areas
          </h3>
          <ul className="space-y-1">
            {analysis.weakAreas.map((area, i) => (
              <li key={i} className="text-sm text-muted-foreground">
                • {area}
              </li>
            ))}
          </ul>
        </div>
      )}

      {analysis.changes.length > 0 && (
        <div>
          <h3 className="mb-4 font-semibold">What Changed and Why</h3>
          <div className="space-y-4">
            {analysis.changes.map((change, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="rounded-2xl border p-4"
              >
                <span className="mb-2 inline-block rounded-full bg-primary/10 px-3 py-0.5 text-xs font-medium text-primary">
                  {change.section}
                </span>
                <div className="mt-2 grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="mb-1 text-xs text-muted-foreground">Before</p>
                    <p className="text-sm text-muted-foreground line-through">
                      {change.before}
                    </p>
                  </div>
                  <div>
                    <p className="mb-1 text-xs text-muted-foreground">After</p>
                    <p className="text-sm font-medium text-green-600 dark:text-green-400">
                      {change.after}
                    </p>
                  </div>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Why: {change.why}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {analysis.beforeAfterBullets.length > 0 && (
        <div>
          <h3 className="mb-4 font-semibold">Before vs After Bullet Points</h3>
          <div className="space-y-4">
            {analysis.beforeAfterBullets.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="rounded-2xl border p-4"
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="mb-1 text-xs text-muted-foreground">Before</p>
                    <p className="text-sm text-muted-foreground line-through">
                      {item.before}
                    </p>
                  </div>
                  <div>
                    <p className="mb-1 text-xs text-muted-foreground">After</p>
                    <p className="text-sm font-medium text-green-600 dark:text-green-400">
                      {item.after}
                    </p>
                  </div>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Reason: {item.reason}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
        <Button onClick={handleDownloadPDF} className="gap-2">
          <Download className="h-4 w-4" />
          Download PDF
        </Button>
        <Button onClick={handleDownloadLatex} variant="outline" className="gap-2">
          <FileCode className="h-4 w-4" />
          Download LaTeX
        </Button>
        <Button onClick={handleCopyLatex} variant="outline" className="gap-2">
          <FileText className="h-4 w-4" />
          Copy LaTeX
        </Button>
        <Button
          onClick={handleDownloadJSON}
          variant="ghost"
          size="sm"
          className="gap-2"
        >
          <FileCode className="h-4 w-4" />
          Download Report (JSON)
        </Button>
      </div>
    </motion.div>
  );
}
