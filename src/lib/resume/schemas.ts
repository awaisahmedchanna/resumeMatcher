import { z } from "zod/v4";

const ChangeSchema = z.object({
  section: z.string(),
  before: z.string(),
  after: z.string(),
  why: z.string(),
});

const BeforeAfterBulletSchema = z.object({
  before: z.string(),
  after: z.string(),
  reason: z.string(),
});

const ExperienceSchema = z.object({
  company: z.string(),
  role: z.string(),
  location: z.string(),
  dates: z.string(),
  bullets: z.array(z.string()),
});

const ProjectSchema = z.object({
  name: z.string(),
  tech: z.string(),
  bullets: z.array(z.string()),
});

const EducationSchema = z.object({
  institution: z.string(),
  degree: z.string(),
  location: z.string(),
  dates: z.string(),
});

const OptimizedResumeSchema = z.object({
  name: z.string(),
  title: z.string(),
  email: z.string(),
  phone: z.string(),
  location: z.string(),
  links: z.array(z.string()),
  summary: z.string(),
  skills: z.array(z.string()),
  experience: z.array(ExperienceSchema),
  projects: z.array(ProjectSchema),
  education: z.array(EducationSchema),
  certifications: z.array(z.string()),
});

export const LLMResponseSchema = z.object({
  previousScore: z.number().min(0).max(100),
  newScore: z.number().min(0).max(100),
  summary: z.string(),
  missingKeywords: z.array(z.string()),
  addedKeywords: z.array(z.string()),
  weakAreas: z.array(z.string()),
  changes: z.array(ChangeSchema),
  beforeAfterBullets: z.array(BeforeAfterBulletSchema),
  optimizedResume: OptimizedResumeSchema,
  latex: z.string(),
});

export type LLMResponseType = z.infer<typeof LLMResponseSchema>;
