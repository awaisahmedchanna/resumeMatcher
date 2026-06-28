# ResumeTailor AI

Tailor your resume to any job description in minutes. Upload your resume, paste a job description, and get a polished PDF resume with AI-powered matching insights.

## Features

- **AI Resume Matching** — Get a precise match score between your resume and any job description
- **Job Keyword Extraction** — Automatically identify missing keywords from the job posting
- **Bullet Point Optimization** — Rewrite experience bullet points to be ATS-friendly with action verbs
- **LaTeX-Quality Formatting** — Generate professionally formatted resumes with clean LaTeX source
- **PDF Download** — Download a polished PDF that renders beautifully
- **Change Report** — See exactly what changed and why, with before/after comparisons
- **Private by Design** — No data storage, no accounts, no tracking

## Tech Stack

- Next.js (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui
- Framer Motion
- Zod validation
- NVIDIA NIM / Build API (OpenAI-compatible)
- @react-pdf/renderer for PDF generation
- mammoth for DOCX extraction
- pdf-parse for PDF extraction

## Getting Started

### Prerequisites

- Node.js 18+
- An NVIDIA API key from [build.nvidia.com](https://build.nvidia.com)

### Setup

1. Clone the repository:
   ```bash
   git clone <your-repo-url>
   cd resume-tailor-ai
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create your environment file:
   ```bash
   cp .env.example .env.local
   ```

4. Edit `.env.local` and add your NVIDIA API key:
   ```
   NVIDIA_API_KEY=nvapi-your-actual-key-here
   ```

5. Run the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NVIDIA_API_KEY` | Your NVIDIA NIM API key | Required |
| `NVIDIA_BASE_URL` | NVIDIA API base URL | `https://integrate.api.nvidia.com/v1` |
| `NVIDIA_MODEL_1` | Primary LLM model | `meta/llama-3.3-70b-instruct` |
| `NVIDIA_MODEL_2` | Fallback model 2 | `nvidia/llama-3.1-nemotron-ultra-253b-v1` |
| `NVIDIA_MODEL_3` | Fallback model 3 | `mistralai/mixtral-8x22b-instruct-v0.1` |
| `NVIDIA_MODEL_4` | Fallback model 4 | `deepseek-ai/deepseek-r1` |
| `NVIDIA_MODEL_5` | Fallback model 5 | `qwen/qwen2.5-72b-instruct` |
| `LLM_TIMEOUT_MS` | Timeout per model call | `45000` |
| `MAX_UPLOAD_MB` | Max upload file size | `5` |

### Getting an NVIDIA API Key

1. Go to [build.nvidia.com](https://build.nvidia.com)
2. Sign up or log in
3. Navigate to the API section
4. Create an API key (starts with `nvapi-`)
5. Copy the key into your `.env.local` file

### Model Fallback Order

The app tries models in order (1 → 5). If a model returns an error (429 rate limit, 5xx server error, timeout, empty response, or invalid JSON), it automatically falls back to the next model. You can customize the models and their order by editing the `NVIDIA_MODEL_X` variables.

## Deployment on Vercel

1. Push your code to a Git repository
2. Import the project in Vercel
3. Add all environment variables from `.env.example` in the Vercel dashboard
4. Deploy

The app is designed to work on Vercel serverless functions. Key considerations:

- Uses Node.js runtime (not Edge)
- No filesystem writes
- PDF is rendered using @react-pdf/renderer (no `pdflatex` required)
- LaTeX source is generated as a string for download

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── health/route.ts        # Health check endpoint
│   │   └── tailor-resume/route.ts # Main processing endpoint
│   ├── tailor/page.tsx            # Resume tailoring page
│   ├── page.tsx                   # Landing page
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── landing/                   # Landing page components
│   └── tailor/                    # Tailor page components
├── lib/
│   ├── llm/                       # NVIDIA client, prompts, JSON parsing
│   ├── resume/                    # Text extraction, schemas, scoring
│   ├── latex/                     # LaTeX generation and escaping
│   └── pdf/                       # PDF rendering
└── types/                         # TypeScript type definitions
```

## API Routes

### POST `/api/tailor-resume`

Accepts `multipart/form-data` with:
- `resume` (file) — PDF, DOCX, or TXT
- `jobDescription` (string) — min 100 characters
- `targetRole` (string, optional)
- `applicantName` (string, optional)

Returns JSON with analysis data, LaTeX source, and base64 PDF.

### GET `/api/health`

Returns app status and configured model count.

## Limitations

- PDF text extraction may not work well with scanned documents or image-based PDFs
- Very large resumes or job descriptions may hit token limits
- The quality of optimization depends on the underlying LLM models
- LaTeX requires a LaTeX compiler to render locally (the app generates the source for download, but renders PDF via @react-pdf/renderer for immediate download)

## Troubleshooting

**Q: The AI returns an error**
A: Check your NVIDIA API key and that you have credits/quota available. The app automatically falls back through multiple models.

**Q: PDF text extraction fails**
A: The resume may be a scanned image. Try uploading a DOCX or TXT version.

**Q: Build fails on Vercel**
A: Ensure all environment variables are set in the Vercel dashboard. Check that `next.config.ts` includes `serverExternalPackages: ["pdf-parse", "mammoth"]`.

## License

MIT
