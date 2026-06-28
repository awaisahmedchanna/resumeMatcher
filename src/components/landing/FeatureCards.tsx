"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Target,
  Search,
  Sparkles,
  FileText,
  Download,
  Shield,
} from "lucide-react";

const features = [
  {
    icon: Target,
    title: "AI Resume Matching",
    description:
      "Our AI analyzes your resume against any job description and provides a precise match score.",
  },
  {
    icon: Search,
    title: "Job Keyword Extraction",
    description:
      "Automatically identifies missing keywords and skills from the job posting.",
  },
  {
    icon: Sparkles,
    title: "Bullet Point Optimization",
    description:
      "Rewrites experience bullet points to be ATS-friendly with action verbs and impact.",
  },
  {
    icon: FileText,
    title: "LaTeX-Quality Formatting",
    description:
      "Generates professionally formatted resumes with clean LaTeX source code.",
  },
  {
    icon: Download,
    title: "PDF Download",
    description:
      "Download a polished PDF that renders beautifully and passes ATS parsers.",
  },
  {
    icon: Shield,
    title: "Private by Design",
    description:
      "No data storage, no accounts, no tracking. Your data stays yours.",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function FeatureCards() {
  return (
    <section className="px-4 py-20">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12 text-center"
        >
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Everything You Need to Land the Job
          </h2>
          <p className="mt-4 text-muted-foreground">
            Intelligent tools to optimize your resume for every application.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {features.map((feature) => (
            <motion.div key={feature.title} variants={itemVariants}>
              <Card className="card-hover h-full border-border/50 bg-background/50 backdrop-blur">
                <CardHeader>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                </CardHeader>
                <CardContent>
                  <h3 className="mb-2 font-semibold">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
