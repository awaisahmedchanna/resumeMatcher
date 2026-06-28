import type { OptimizedResume } from "@/types/resume";
import { escapeLatex } from "./escapeLatex";

export function generateLatexFromJSON(resume: OptimizedResume): string {
  const name = escapeLatex(resume.name || "Your Name");
  const title = escapeLatex(resume.title || "");
  const email = escapeLatex(resume.email || "");
  const phone = escapeLatex(resume.phone || "");
  const location = escapeLatex(resume.location || "");
  const summary = escapeLatex(resume.summary || "");
  const links = resume.links
    .map((l) => escapeLatex(l))
    .join(" \\quad ");
  const skills = resume.skills.map((s) => escapeLatex(s)).join(", ");
  const certs = resume.certifications.map((c) => `\\item ${escapeLatex(c)}`).join("\n");

  const experienceLatex = resume.experience
    .map(
      (exp) => `
\\begin{tabularx}{\\textwidth}{lX}
  \\textbf{${escapeLatex(exp.role)}} & ${escapeLatex(exp.company)} \\hfill ${escapeLatex(exp.dates)} \\\\
  \\multicolumn{2}{l}{${escapeLatex(exp.location)}} \\\\
\\end{tabularx}
\\vspace{-0.2cm}
\\begin{itemize}[leftmargin=*,nosep]
${exp.bullets.map((b) => `  \\item ${escapeLatex(b)}`).join("\n")}
\\end{itemize}
`
    )
    .join("\n");

  const projectsLatex = resume.projects
    .map(
      (proj) => `
\\textbf{${escapeLatex(proj.name)}} \\hfill ${escapeLatex(proj.tech)} \\
\\begin{itemize}[leftmargin=*,nosep]
${proj.bullets.map((b) => `  \\item ${escapeLatex(b)}`).join("\n")}
\\end{itemize}
`
    )
    .join("\n");

  const educationLatex = resume.education
    .map(
      (edu) => `
\\textbf{${escapeLatex(edu.degree)}} \\hfill ${escapeLatex(edu.institution)} \\hfill ${escapeLatex(edu.dates)} \\
\\multicolumn{2}{l}{${escapeLatex(edu.location)}} \\\\
`
    )
    .join("\n");

  const latex = `\\documentclass[letterpaper,11pt]{article}

\\usepackage{latexsym}
\\usepackage{amsmath}
\\usepackage{amssymb}
\\usepackage[empty]{fullpage}
\\usepackage{titlesec}
\\usepackage{marvosym}
\\usepackage[usenames,dvipsnames]{color}
\\usepackage{verbatim}
\\usepackage{enumitem}
\\usepackage[hidelinks]{hyperref}
\\usepackage{fancyhdr}
\\usepackage[english]{babel}
\\usepackage{tabularx}
\\input{glyphtounicode}

\\pagestyle{fancy}
\\fancyhf{}
\\fancyfoot{}
\\renewcommand{\\headrulewidth}{0pt}
\\renewcommand{\\footrulewidth}{0pt}

\\addtolength{\\oddsidemargin}{-0.5in}
\\addtolength{\\evensidemargin}{-0.5in}
\\addtolength{\\textwidth}{1in}
\\addtolength{\\topmargin}{-0.5in}
\\addtolength{\\textheight}{1.0in}

\\urlstyle{same}

\\raggedbottom
\\raggedright
\\setlength{\\tabcolsep}{0in}

\\titleformat{\\section}{
  \\vspace{-4pt}\\scshape\\raggedright\\large
}{}{0em}{}[\\color{black}\\titlerule \\vspace{-5pt}]

\\newcommand{\\resumeItem}[1]{
  \\item\\small{#1 \\vspace{-2pt}}
}

\\newcommand{\\resumeSubheading}[4]{
  \\vspace{-2pt}\\item
    \\begin{tabular*}{0.97\\textwidth}[t]{l@{\\extracolsep{\\fill}}r}
      \\textbf{#1} & #2 \\\\
      \\textit{\\small#3} & \\textit{\\small #4} \\\\
    \\end{tabular*}\\vspace{-7pt}
}

\\pdfgentounicode=1

\\begin{document}

\\begin{center}
  \\textbf{\\Huge ${name}} \\\\[0.3cm]
  \\small ${email} \\quad ${phone} \\quad ${location} \\\\
  ${links}
\\end{center}

\\section{Professional Summary}
${summary}

\\section{Skills}
${skills}

\\section{Experience}
\\begin{itemize}[leftmargin=*,nosep]
${experienceLatex}
\\end{itemize}

\\section{Projects}
\\begin{itemize}[leftmargin=*,nosep]
${projectsLatex}
\\end{itemize}

\\section{Education}
\\begin{itemize}[leftmargin=*,nosep]
${educationLatex}
\\end{itemize}

${certs ? `\\section{Certifications}\n\\begin{itemize}[leftmargin=*,nosep]\n${certs}\n\\end{itemize}` : ""}

\\end{document}
`;

  return latex;
}

export function isValidLatex(latex: string): boolean {
  return latex.includes("\\documentclass") && latex.includes("\\begin{document}") && latex.includes("\\end{document}");
}
