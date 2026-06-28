export interface Change {
  section: string;
  before: string;
  after: string;
  why: string;
}

export interface BeforeAfterBullet {
  before: string;
  after: string;
  reason: string;
}

export interface Experience {
  company: string;
  role: string;
  location: string;
  dates: string;
  bullets: string[];
}

export interface Project {
  name: string;
  tech: string;
  bullets: string[];
}

export interface Education {
  institution: string;
  degree: string;
  location: string;
  dates: string;
}

export interface OptimizedResume {
  name: string;
  title: string;
  email: string;
  phone: string;
  location: string;
  links: string[];
  summary: string;
  skills: string[];
  experience: Experience[];
  projects: Project[];
  education: Education[];
  certifications: string[];
}

export interface LLMResponse {
  previousScore: number;
  newScore: number;
  summary: string;
  missingKeywords: string[];
  addedKeywords: string[];
  weakAreas: string[];
  changes: Change[];
  beforeAfterBullets: BeforeAfterBullet[];
  optimizedResume: OptimizedResume;
  latex: string;
}

export interface AnalysisResult {
  previousScore: number;
  newScore: number;
  summary: string;
  missingKeywords: string[];
  addedKeywords: string[];
  weakAreas: string[];
  changes: Change[];
  beforeAfterBullets: BeforeAfterBullet[];
}

export interface ResumeResult {
  latex: string;
  pdfBase64: string;
  fileName: string;
}

export interface TailorResponse {
  success: boolean;
  analysis: AnalysisResult;
  resume: ResumeResult;
}
