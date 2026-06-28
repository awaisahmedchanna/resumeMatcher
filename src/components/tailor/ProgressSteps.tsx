"use client";

import { motion } from "framer-motion";
import {
  FileText,
  Search,
  BarChart,
  Edit3,
  FileCode,
  Image,
  CheckCircle2,
} from "lucide-react";

const steps = [
  { key: "reading", label: "Reading resume", icon: FileText },
  { key: "understanding", label: "Understanding job description", icon: Search },
  { key: "comparing", label: "Comparing match", icon: BarChart },
  { key: "rewriting", label: "Rewriting bullet points", icon: Edit3 },
  { key: "generating", label: "Generating LaTeX", icon: FileCode },
  { key: "rendering", label: "Rendering PDF", icon: Image },
  { key: "finalizing", label: "Finalizing report", icon: CheckCircle2 },
];

interface ProgressStepsProps {
  currentStep: number;
}

export default function ProgressSteps({ currentStep }: ProgressStepsProps) {
  return (
    <div className="space-y-3">
      {steps.map((step, index) => (
        <motion.div
          key={step.key}
          initial={{ opacity: 0, x: -10 }}
          animate={{
            opacity: currentStep >= index ? 1 : 0.3,
            x: 0,
          }}
          transition={{ duration: 0.3, delay: index * 0.05 }}
          className="flex items-center gap-3"
        >
          <div
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-medium ${
              currentStep > index
                ? "bg-primary text-primary-foreground"
                : currentStep === index
                ? "bg-primary/20 text-primary ring-2 ring-primary/30"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {currentStep > index ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <step.icon className="h-4 w-4" />
            )}
          </div>
          <span
            className={`text-sm ${
              currentStep >= index
                ? "text-foreground font-medium"
                : "text-muted-foreground"
            }`}
          >
            {step.label}
          </span>
          {currentStep === index && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-1"
            >
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary [animation-delay:0.1s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary [animation-delay:0.2s]" />
            </motion.span>
          )}
        </motion.div>
      ))}
    </div>
  );
}
