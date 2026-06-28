import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  pdf,
} from "@react-pdf/renderer";

const accentColor = "#2563eb";

Font.register({
  family: "Helvetica",
  fonts: [
    { src: "https://fonts.cdnfonts.com/s/29128/Helvetica.woff", fontWeight: 400 },
    { src: "https://fonts.cdnfonts.com/s/29128/Helvetica-Bold.woff", fontWeight: 700 },
  ],
});

const styles = StyleSheet.create({
  page: {
    padding: "0.75in 0.7in",
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#1a1a1a",
    lineHeight: 1.4,
  },
  header: {
    textAlign: "center",
    marginBottom: 12,
  },
  name: {
    fontSize: 22,
    fontWeight: 700,
    color: "#111",
    marginBottom: 2,
  },
  title: {
    fontSize: 12,
    color: "#555",
    marginBottom: 6,
  },
  contactRow: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: 4,
    fontSize: 9,
    color: "#444",
  },
  section: {
    marginTop: 10,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 700,
    color: accentColor,
    textTransform: "uppercase",
    letterSpacing: 1,
    borderBottomWidth: 1,
    borderBottomColor: accentColor,
    paddingBottom: 2,
    marginBottom: 6,
  },
  summaryText: {
    fontSize: 9.5,
    color: "#333",
    lineHeight: 1.5,
  },
  skillsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
  skillBadge: {
    fontSize: 8.5,
    color: "#333",
    backgroundColor: "#f0f4ff",
    padding: "3 6",
    borderRadius: 3,
  },
  experienceBlock: {
    marginBottom: 6,
  },
  expHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
  },
  expRole: {
    fontSize: 10,
    fontWeight: 700,
    color: "#111",
  },
  expCompany: {
    fontSize: 9.5,
    color: "#444",
  },
  expDates: {
    fontSize: 8.5,
    color: "#777",
  },
  bulletPoint: {
    fontSize: 9,
    color: "#333",
    marginLeft: 12,
    marginBottom: 1,
    lineHeight: 1.4,
  },
  projectBlock: {
    marginBottom: 5,
  },
  projName: {
    fontSize: 10,
    fontWeight: 700,
    color: "#111",
  },
  projTech: {
    fontSize: 8.5,
    color: "#666",
  },
  eduBlock: {
    marginBottom: 3,
  },
  eduLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 9.5,
  },
  eduDegree: {
    fontWeight: 700,
    color: "#111",
  },
  eduSchool: {
    color: "#444",
  },
  eduDates: {
    color: "#777",
    fontSize: 8.5,
  },
  certText: {
    fontSize: 9,
    color: "#333",
    marginBottom: 1,
  },
});

interface ResumeData {
  name: string;
  title: string;
  email: string;
  phone: string;
  location: string;
  links: string[];
  summary: string;
  skills: string[];
  experience: Array<{
    company: string;
    role: string;
    location: string;
    dates: string;
    bullets: string[];
  }>;
  projects: Array<{
    name: string;
    tech: string;
    bullets: string[];
  }>;
  education: Array<{
    institution: string;
    degree: string;
    location: string;
    dates: string;
  }>;
  certifications: string[];
}

function ResumeDocument({ data }: { data: ResumeData }) {
  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.name}>{data.name || "Your Name"}</Text>
          {data.title ? <Text style={styles.title}>{data.title}</Text> : null}
          <View style={styles.contactRow}>
            {data.email ? <Text>{data.email}</Text> : null}
            {data.phone ? <Text>{data.phone}</Text> : null}
            {data.location ? <Text>{data.location}</Text> : null}
            {data.links.map((link, i) => (
              <Text key={i}>{link}</Text>
            ))}
          </View>
        </View>

        {data.summary ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Professional Summary</Text>
            <Text style={styles.summaryText}>{data.summary}</Text>
          </View>
        ) : null}

        {data.skills.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Skills</Text>
            <View style={styles.skillsRow}>
              {data.skills.map((skill, i) => (
                <Text key={i} style={styles.skillBadge}>
                  {skill}
                </Text>
              ))}
            </View>
          </View>
        ) : null}

        {data.experience.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Experience</Text>
            {data.experience.map((exp, i) => (
              <View key={i} style={styles.experienceBlock}>
                <View style={styles.expHeader}>
                  <Text style={styles.expRole}>
                    {exp.role}
                  </Text>
                  <Text style={styles.expDates}>{exp.dates}</Text>
                </View>
                <Text style={styles.expCompany}>
                  {exp.company}{exp.location ? ` — ${exp.location}` : ""}
                </Text>
                {(exp.bullets || []).map((bullet, j) => (
                  <Text key={j} style={styles.bulletPoint}>
                    • {bullet}
                  </Text>
                ))}
              </View>
            ))}
          </View>
        ) : null}

        {data.projects.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Projects</Text>
            {data.projects.map((proj, i) => (
              <View key={i} style={styles.projectBlock}>
                <View style={styles.expHeader}>
                  <Text style={styles.projName}>{proj.name}</Text>
                  {proj.tech ? <Text style={styles.projTech}>{proj.tech}</Text> : null}
                </View>
                {(proj.bullets || []).map((bullet, j) => (
                  <Text key={j} style={styles.bulletPoint}>
                    • {bullet}
                  </Text>
                ))}
              </View>
            ))}
          </View>
        ) : null}

        {data.education.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Education</Text>
            {data.education.map((edu, i) => (
              <View key={i} style={styles.eduBlock}>
                <View style={styles.expHeader}>
                  <Text style={styles.eduDegree}>{edu.degree}</Text>
                  <Text style={styles.eduDates}>{edu.dates}</Text>
                </View>
                <Text style={styles.eduSchool}>
                  {edu.institution}{edu.location ? ` — ${edu.location}` : ""}
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        {data.certifications.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Certifications</Text>
            {data.certifications.map((cert, i) => (
              <Text key={i} style={styles.certText}>
                • {cert}
              </Text>
            ))}
          </View>
        ) : null}
      </Page>
    </Document>
  );
}

export async function renderResumePDFBase64(
  data: ResumeData
): Promise<string> {
  const doc = <ResumeDocument data={data} />;
  const instance = pdf(doc);
  const blob = await instance.toBlob();
  const buffer = await blob.arrayBuffer();
  const base64 = Buffer.from(buffer).toString("base64");
  return base64;
}
