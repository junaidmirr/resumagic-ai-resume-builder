export interface GenerateDocParams {
  doc_type: string;
  job_title: string;
  company: string;
  user_experience?: string;
  additional_notes?: string;
  uid?: string;
  idToken?: string;
}

export interface GenerateDocResult {
  success: boolean;
  doc_type: string;
  title: string;
  content: string;
  error?: string;
}

const docBlueprints: Record<string, { name: string; instructions: string }> = {
  cover_letter: {
    name: "Job Cover Letter",
    instructions: `Structure into an executive 4-paragraph layout:
1. Paragraph 1: Powerful opening hook expressing strong interest in the role at target company.
2. Paragraph 2: Core experience highlights with quantified achievements.
3. Paragraph 3: Alignment with company culture, product mission, and engineering standards.
4. Paragraph 4: Professional call to action requesting an interview.`
  },
  sop: {
    name: "Statement of Purpose (SOP)",
    instructions: `Structure into a formal academic SOP:
1. Academic passion and core motivation.
2. Academic background & project achievements.
3. Why this specific university & program.
4. Future career goals & research vision.`
  },
  lor: {
    name: "Recommendation Letter (LOR)",
    instructions: `Structure into a formal reference letter:
1. Supervisory relationship & duration.
2. Technical strengths, leadership, and problem-solving abilities.
3. Specific exemplary project milestone achieved.
4. Highest unreserved endorsement.`
  },
  resignation: {
    name: "Resignation Letter",
    instructions: `Structure into a professional 2-week notice:
1. Clear statement of resignation & effective last working day.
2. Gratitude for professional growth and team support.
3. Commitment to smooth knowledge transfer and transition.`
  },
  cold_email: {
    name: "Recruiter Cold Outreach Email",
    instructions: `Provide 2 variations (Punchy Short & Value-Add):
- Catchy subject lines.
- Opening hook featuring candidate's top achievement.
- Clear value proposition for target company.
- Low-friction Call to Action.`
  },
  thank_you: {
    name: "Post-Interview Thank You Email",
    instructions: `Structure into a warm, professional post-interview note:
1. Expression of appreciation for the interview discussion.
2. Mention of a specific topic or problem discussed during the interview.
3. Re-affirmation of strong interest and readiness for next steps.`
  },
  salary_negotiation: {
    name: "Salary Negotiation Script",
    instructions: `Structure into a persuasive counter-offer letter:
1. Appreciation for the initial offer.
2. Market research data anchoring the candidate's target compensation.
3. Polite request for counter-offer range (base, sign-on, equity).
4. Commitment to delivering top-tier impact.`
  },
  linkedin_bio: {
    name: "LinkedIn Bio & Headline Suite",
    instructions: `Provide:
1. 3 High-Impact Headlines (Max 120 chars each).
2. 'About' Summary (Engaging 1st person storytelling with key achievements).
3. 5 Strategic Skills Tags.`
  },
  interview_answers: {
    name: "Behavioral STAR Answers",
    instructions: `Provide STAR (Situation, Task, Action, Result) answers for 3 top behavioral questions for this role.`
  }
};

export async function generateCareerDocumentClient(params: GenerateDocParams): Promise<GenerateDocResult> {
  const { doc_type, job_title, company, user_experience = "", additional_notes = "", uid, idToken } = params;
  const spec = docBlueprints[doc_type] || { name: "Career Document", instructions: "Format into clean, executive Markdown." };

  // 1. Try Backend API (/api/documents/generate) with a 4-second timeout
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (uid) headers["X-User-ID"] = uid;
    if (idToken) headers["Authorization"] = `Bearer ${idToken}`;

    const res = await fetch("/api/documents/generate", {
      method: "POST",
      headers,
      body: JSON.stringify({ doc_type, job_title, company, user_experience, additional_notes }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data && data.success && data.content) {
        return data;
      }
    }
  } catch (backendErr) {
    console.warn("[CareerDocGen] Backend API unavailable or timed out, trying Direct Gemini API...", backendErr);
  }

  // 2. Try Direct Gemini REST API from Client Side if VITE_GEMINI_API_KEY is present
  const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY || (typeof window !== "undefined" && (window as any).__GEMINI_KEY__);
  if (geminiApiKey) {
    const prompt = `You are a World-Class Executive Career Coach & Professional Writer.
TASK: Write a highly persuasive, flawless, professional ${spec.name}.

TARGET ROLE / PROGRAM: ${job_title}
TARGET COMPANY / INSTITUTION: ${company}
CANDIDATE BACKGROUND & EXPERIENCE:
${user_experience ? user_experience : 'Experienced professional with technical and leadership capabilities.'}

ADDITIONAL DIRECTIVES:
${additional_notes ? additional_notes : 'Executive tone, persuasive positioning, and clear impact.'}

SPECIFIC STRUCTURAL REQUIREMENTS:
${spec.instructions}

FORMATTING:
- Return clean, beautifully formatted Markdown with headers.
- 100% finished and ready to copy/send directly.`;

    const modelsToTry = ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-pro"];
    for (const modelName of modelsToTry) {
      try {
        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${geminiApiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
            }),
          }
        );

        if (geminiRes.ok) {
          const geminiData = await geminiRes.json();
          const candidateText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (candidateText && candidateText.trim().length > 0) {
            return {
              success: true,
              doc_type,
              title: `${spec.name} - ${company}`,
              content: candidateText.trim(),
            };
          }
        }
      } catch (geminiErr) {
        console.warn(`[CareerDocGen] Direct Gemini REST model ${modelName} failed, trying next...`, geminiErr);
      }
    }
  }

  // 3. Guaranteed High-Quality Client-Side Structured Template Fallback
  const today = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  const expSummary = user_experience.trim() ? user_experience.trim() : "software engineering, system design, and technical execution";

  let structuredText = "";

  if (doc_type === "cover_letter") {
    structuredText = `# Job Cover Letter for ${job_title}

**Target Organization:** ${company}  
**Date:** ${today}  

Dear Hiring Team at ${company},

I am writing to express my strong interest in the **${job_title}** position at **${company}**. With my dedicated background in ${expSummary}, I am confident in my ability to make an immediate, positive impact on your team's technical roadmap.

Throughout my career, I have consistently focused on building scalable, reliable solutions, optimizing core workflows, and collaborating effectively across teams. My technical skills paired with a results-oriented mindset align directly with the requirements for the ${job_title} role.

What excites me most about **${company}** is your commitment to technical excellence and product innovation. I am eager to bring my problem-solving skills, adaptability, and drive for engineering quality to your engineering initiatives.

I would welcome the opportunity to discuss how my background and skills align with your current goals for the ${job_title} position. Thank you for your time and consideration.

Sincerely,  
**[Your Name]**  
*Email:* candidate@resumagic.worklabs.studio  
*Phone:* +1 (555) 019-2834  
`;
  } else if (doc_type === "sop") {
    structuredText = `# Statement of Purpose (SOP)

**Applicant:** [Your Name]  
**Target Program:** ${job_title}  
**Target Institution:** ${company}  

### 1. Introduction & Academic Passion
My aspiration to pursue advanced studies in **${job_title}** at **${company}** is rooted in a passion for solving complex theoretical and technical challenges through research and analytical rigor.

### 2. Technical Background & Achievements
My academic and professional experience in ${expSummary} has provided me with a strong foundation in core engineering principles, system analysis, and project execution.

### 3. Why ${company}?
${company}'s distinguished faculty, research infrastructure, and commitment to innovation provide the ideal environment for my graduate work. I am eager to collaborate with leading researchers in this field.

### 4. Long-Term Career Vision
Upon completing my degree at ${company}, I intend to lead transformative technical projects and contribute meaningfully to industry advancement.

Sincerely,  
**[Your Name]**
`;
  } else if (doc_type === "cold_email") {
    structuredText = `# Recruiter Cold Email Suite for ${company}

### Option 1: Direct & High-Converting
**Subject:** Quick Question regarding ${job_title} role at ${company}

Hi [Hiring Manager Name],

I hope this note finds you well. I've been following ${company}'s technical growth and product achievements.

I'm a ${job_title} with experience in ${expSummary}. I recently led a project that improved core performance and scaled user capacity.

Are you open to a brief 5-minute chat next Tuesday to see if my background aligns with your team's current hiring goals at ${company}?

Best regards,  
**[Your Name]**

---

### Option 2: Value-Add Outreach
**Subject:** Candidate fit for ${job_title} at ${company}

Hi [Recruiter Name],

I noticed the ${job_title} opening at ${company} and wanted to reach out directly. Given my experience in technical execution, I believe I could bring immediate value to your team.

I would love to connect for a quick 10-minute call this week.

Best,  
**[Your Name]**
`;
  } else {
    structuredText = `# ${spec.name} for ${company}

**Target Role:** ${job_title}  
**Target Organization:** ${company}  
**Date:** ${today}  

Dear Hiring Team,

This document is prepared specifically for the **${job_title}** position at **${company}**.

### Professional Overview
${expSummary}

### Strategic Alignment
My problem-solving mindset, technical skills, and commitment to quality make me an ideal fit for ${company}'s goals.

Sincerely,  
**[Your Name]**
`;
  }

  return {
    success: true,
    doc_type,
    title: `${spec.name} - ${company}`,
    content: structuredText,
  };
}

export function convertDocumentTextToCanvasElements(docTitle: string, rawText: string): any[] {
  const elements: any[] = [];

  // Top Header Accent Banner Shape
  elements.push({
    id: `shape_banner_${Date.now()}`,
    element_type: "shape",
    shape_type: "rectangle",
    x: 0,
    y: 712,
    width: 612,
    height: 80,
    fill_color: "#1e1b4b",
    border_color: "#312e81",
    border_width: 0,
    border_radius: 0,
    z_index: 1,
    page_id: "page-1",
  });

  // Top Accent Stripe Line
  elements.push({
    id: `shape_stripe_${Date.now()}`,
    element_type: "shape",
    shape_type: "rectangle",
    x: 0,
    y: 708,
    width: 612,
    height: 4,
    fill_color: "#6366f1",
    border_color: "#6366f1",
    border_width: 0,
    border_radius: 0,
    z_index: 2,
    page_id: "page-1",
  });

  // Document Main Title inside Banner
  const cleanTitle = docTitle.replace(/#|\*/g, "").trim().toUpperCase();
  elements.push({
    id: `txt_title_${Date.now()}`,
    element_type: "text",
    text: cleanTitle || "CAREER DOCUMENT",
    x: 40,
    y: 745,
    width: 532,
    height: 28,
    font_size: 18,
    font_name: "Inter",
    text_color: "#ffffff",
    bold: true,
    italic: false,
    underline: false,
    align: "left",
    z_index: 3,
    page_id: "page-1",
  });

  // Subtitle / Date Pill inside Banner
  const dateStr = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  elements.push({
    id: `txt_date_${Date.now()}`,
    element_type: "text",
    text: `ResuMagic Career Suite • ${dateStr}`,
    x: 40,
    y: 725,
    width: 532,
    height: 16,
    font_size: 10,
    font_name: "Inter",
    text_color: "#a5b4fc",
    bold: false,
    italic: false,
    underline: false,
    align: "left",
    z_index: 4,
    page_id: "page-1",
  });

  // Process Body Text Paragraphs
  const rawParagraphs = rawText
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  let currentY = 670; // Start below header banner (708 - 38 = 670)

  rawParagraphs.forEach((para, idx) => {
    const isHeading = para.startsWith("#") || (para.length < 60 && !para.endsWith("."));
    const cleanPara = para.replace(/#|\*/g, "").trim();

    // Estimate height based on character length (~85 chars per line, 18px per line)
    const lineCount = Math.max(1, Math.ceil(cleanPara.length / 85));
    const paraHeight = Math.max(22, lineCount * 18);

    if (currentY - paraHeight < 40) return; // Stay within printable page margins

    elements.push({
      id: `txt_para_${idx}_${Date.now()}`,
      element_type: "text",
      text: cleanPara,
      x: 40,
      y: currentY - paraHeight,
      width: 532,
      height: paraHeight,
      font_size: isHeading ? 13 : 11,
      font_name: "Inter",
      text_color: isHeading ? "#1e1b4b" : "#334155",
      bold: isHeading,
      italic: false,
      underline: false,
      align: "left",
      z_index: 10 + idx,
      page_id: "page-1",
    });

    currentY -= paraHeight + 14; // 14px gap between paragraphs
  });

  return elements;
}

