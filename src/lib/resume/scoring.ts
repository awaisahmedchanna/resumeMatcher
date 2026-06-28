import type { OptimizedResume } from "@/types/resume";

export function calculateScore(resume: OptimizedResume, keywords: string[]): number {
  const allText = [
    resume.summary,
    ...resume.skills,
    ...resume.experience.flatMap((e) => [e.role, e.company, ...e.bullets]),
    ...resume.projects.flatMap((p) => [p.name, p.tech, ...p.bullets]),
    ...resume.education.flatMap((e) => [e.degree, e.institution]),
    ...resume.certifications,
  ]
    .join(" ")
    .toLowerCase();

  if (keywords.length === 0) return 50;

  const matched = keywords.filter((kw) => allText.includes(kw.toLowerCase()));
  return Math.round((matched.length / keywords.length) * 100);
}
