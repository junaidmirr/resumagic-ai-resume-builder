import type { EditorElement } from "../types/editor";
import { parseResumeTextToWizardData, parseResumeTextToCandidateData } from "./pdfParser";
import { generateWizardElements } from "./wizardGenerator";
import { fetchWithCaptcha } from "./apiWithCaptcha";
import {
  generateGeometricResume,
  wizardDataToCandidateData,
  type ParsedCandidateData,
} from "./geometricResumeBuilder";
import { RESUME_TEMPLATES as TEMPLATES } from "../utils/templates";

export interface DesignPlan {
  title: string;
  layout_type: string;
  theme_summary: string;
  color_palette: {
    bg: string;
    primary: string;
    secondary: string;
    text: string;
    accent: string;
  };
  sections: {
    id: string;
    title: string;
    component_type: string;
    description: string;
  }[];
  special_elements?: string[];
  fallback_triggered?: boolean;
  fallback_message?: string;
  raw_plan?: any;
}

function cleanJSONResponse(raw: string): any {
  let text = raw.trim();
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    text = fenceMatch[1].trim();
  }

  const startIdx = text.search(/[{[]/);
  if (startIdx !== -1) {
    const endChar = text[startIdx] === "{" ? "}" : "]";
    const lastIdx = text.lastIndexOf(endChar);
    if (lastIdx !== -1) {
      text = text.substring(startIdx, lastIdx + 1);
    }
  }

  return JSON.parse(text);
}

/**
 * High-Precision Geometric Normalizer & De-collision Engine.
 * 1. Sanitizes all element types and attributes (id, element_type, coordinates, fonts, z-indices).
 * 2. Recognizes background shapes (sidebar rectangles, top banners) and locks them at z_index: 0.
 * 3. Preserves horizontal composite pairs (e.g. Job Title on left + Date on right at the same Y).
 * 4. Preserves dual-layer skill progress loaders (background gray bar + foreground filled bar at the exact same Y).
 * 5. Automatically detects top-down coordinate hallucination from LLMs and normalizes to bottom-up (Y=0 at bottom, Y=792 at top).
 * 6. De-collides overlapping vertical text blocks while preserving relative layout structure.
 */
export function normalizeEditorElements(
  rawList: any[],
  targetPageId: string = "page-1",
): EditorElement[] {
  if (!Array.isArray(rawList) || rawList.length === 0) return [];

  // Step 1: Normalize element structure & calculate exact text heights
  const normalized: EditorElement[] = rawList.map((item, idx) => {
    const id =
      item.id && String(item.id).trim().length > 0
        ? String(item.id)
        : `el_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`;

    let elementType: "text" | "shape" | "image" = "text";
    const rawType = String(
      item.element_type || item.type || item.kind || "",
    ).toLowerCase();
    if (rawType.includes("shape") || item.shape_type || item.shape) {
      elementType = "shape";
    } else if (
      rawType.includes("image") ||
      rawType.includes("icon") ||
      item.image_path ||
      item.icon_name
    ) {
      elementType = "image";
    } else {
      elementType = "text";
    }

    const page_id = item.page_id || targetPageId;
    const x = typeof item.x === "number" && !isNaN(item.x) ? item.x : 40;
    const rawY = typeof item.y === "number" && !isNaN(item.y) ? item.y : 700 - idx * 24;

    const font_size = Number(
      item.font_size || item.fontSize || item.size || 10,
    );
    const font_name = String(
      item.font_name || item.fontFamily || item.font || "Helvetica",
    );
    const text_color = String(
      item.text_color || item.textColor || item.color || "#1E293B",
    );

    let text = "";
    if (elementType === "text") {
      let rawText =
        item.text ??
        item.content ??
        item.value ??
        item.label ??
        item.heading ??
        item.title ??
        item.description ??
        "";
      if (typeof rawText === "object") {
        try {
          rawText = JSON.stringify(rawText);
        } catch (e) {
          rawText = "Text Block";
        }
      }
      text = String(rawText).trim() || "Text Block";
    }

    const width = Number(
      item.width ||
        (elementType === "text"
          ? Math.max(120, Math.min(532, text.length * font_size * 0.55))
          : 100),
    );

    // Dynamic line wrapping height calculation
    let calculatedHeight = Number(item.height || 18);
    if (elementType === "text") {
      const approxCharsPerLine = Math.max(
        12,
        Math.floor(width / (font_size * 0.52)),
      );
      const manualLines = text.split("\n");
      let totalLines = 0;
      for (const line of manualLines) {
        totalLines += Math.max(1, Math.ceil(line.length / approxCharsPerLine));
      }
      calculatedHeight = Math.max(14, Math.ceil(totalLines * font_size * (item.line_height || 1.35)));
    }

    const z_index =
      typeof item.z_index === "number"
        ? item.z_index
        : elementType === "shape"
          ? 1
          : 2 + idx;

    if (elementType === "text") {
      return {
        id,
        element_type: "text",
        page_id,
        text,
        x,
        y: rawY,
        width,
        height: calculatedHeight,
        font_size,
        font_name,
        text_color,
        bold: Boolean(item.bold || item.isBold),
        italic: Boolean(item.italic || item.isItalic),
        underline: Boolean(item.underline || item.isUnderline),
        align: item.align || "left",
        z_index,
      } as any;
    } else if (elementType === "shape") {
      const shape_type =
        item.shape_type ||
        item.shape ||
        (item.x2 !== undefined ? "line" : "rectangle");
      return {
        id,
        element_type: "shape",
        page_id,
        shape_type,
        x,
        y: rawY,
        width: Number(
          item.width ||
            (shape_type === "line" ? Math.abs((item.x2 || x) - x) : 532),
        ),
        height: Number(item.height || (shape_type === "line" ? 2 : 20)),
        fill_color: String(
          item.fill_color ||
            item.fillColor ||
            item.fill ||
            item.color ||
            "#475569",
        ),
        border_color: item.border_color || item.borderColor || item.stroke,
        border_width: Number(item.border_width || item.strokeWidth || 0),
        border_radius: Number(item.border_radius || item.borderRadius || 0),
        x2: item.x2,
        y2: item.y2,
        z_index,
      } as any;
    } else {
      return {
        id,
        element_type: "image",
        page_id,
        x,
        y: rawY,
        width: Number(item.width || 24),
        height: Number(item.height || 24),
        image_path: String(item.image_path || item.src || ""),
        is_icon: Boolean(item.is_icon || item.isIcon),
        icon_name: String(
          item.icon_name || item.iconName || item.icon || "Star",
        ),
        z_index,
      } as any;
    }
  });

  // Step 2: Detect if elements were generated in Top-Down coordinate space (y=0 at top)
  const nonBgTexts = normalized.filter(
    (e) => e.element_type === "text" && e.y !== undefined,
  );
  if (nonBgTexts.length >= 3) {
    const avgY =
      nonBgTexts.slice(0, 5).reduce((acc, e) => acc + e.y, 0) /
      Math.min(5, nonBgTexts.length);
    // In bottom-up space, top elements should have y > 600. If avgY < 350, LLM used top-down!
    if (avgY < 350) {
      normalized.forEach((el) => {
        const h = el.height || 20;
        // Convert top-down y to bottom-up y: canvasY = 792 - y - height
        el.y = Math.max(15, Math.min(775, 792 - el.y - h));
      });
    }
  }

  // Step 3: Normalize Background Shapes and Z-Indices
  normalized.forEach((el) => {
    const isFullSidebar =
      el.element_type === "shape" &&
      el.width &&
      el.width < 250 &&
      el.height &&
      el.height > 600;
    const isTopBanner =
      el.element_type === "shape" &&
      el.width &&
      el.width > 400 &&
      el.height &&
      el.height > 60 &&
      el.y > 600;

    if (isFullSidebar) {
      el.x = 0;
      el.y = 0;
      el.height = 792;
      el.z_index = 0;
    } else if (isTopBanner) {
      el.z_index = 1;
    }
  });

  // Step 4: Clamping bounds
  normalized.forEach((el) => {
    el.x = Math.max(0, Math.min(612 - (el.width || 10), el.x));
    // Full-height sidebar background stays locked at y=0
    if (el.height && el.height >= 790) {
      el.y = 0;
    } else {
      el.y = Math.max(0, Math.min(792 - (el.height || 10), el.y));
    }
  });

  return normalized;
}

export async function generateArchitectPlanDirect(
  userPrompt: string,
  refinement: string = "",
  previousPlan?: DesignPlan,
  forceDefault: boolean = false,
): Promise<DesignPlan> {
  // 1. Primary: Query Backend Proxy Route (Uses Swirls AI as primary engine with Gemini fallback)
  try {
    const res = await fetchWithCaptcha("/api/ai-architect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "plan",
        prompt: `${userPrompt}. Refinement: ${refinement}`,
        force_default: forceDefault,
      }),
    });
    if (res.status === 400) {
      const data = await res.json().catch(() => ({}));
      if (data.status === "rejected") {
        throw new Error(
          data.error ||
            data.reason ||
            "Request violates career and resume safety policy.",
        );
      }
    }
    if (res.ok) {
      const data = await res.json();
      if (data.status === "fallback" || data.fallback_triggered) {
        const plan = data.plan?.plan || data.plan || createFallbackPlan(userPrompt, refinement);
        plan.fallback_triggered = true;
        plan.fallback_message = data.message || "AI failed to generate a custom plan. Would you like to use the default template or retry again?";
        return plan;
      }
      const plan = data.plan?.plan || data.plan;
      if (plan && plan.title) {
        console.log(
          `[AI-Architect] ✅ Plan received from Primary AI engine: ${plan.title}`,
        );
        plan.fallback_triggered = false;
        return plan;
      }
    }
  } catch (e: any) {
    if (
      e?.message?.includes("safety policy") ||
      e?.message?.includes("violates") ||
      e?.message?.includes("Security verification") ||
      e?.message?.includes("cancelled")
    ) {
      throw e;
    }
    console.warn(
      "[AI-Architect] Backend plan call issue, flagging fallback...",
      e,
    );
  }

  // 2. Client-Side Deterministic Design Engine Fallback with fallback_triggered flag
  const fallback = createFallbackPlan(userPrompt, refinement);
  fallback.fallback_triggered = true;
  fallback.fallback_message = "AI service was unreachable. Would you like to use the default template or retry again?";
  return fallback;
}

export async function buildArchitectResumeDirect(
  plan: DesignPlan,
  userPrompt: string = "",
): Promise<EditorElement[]> {
  console.log(
    `[AI-Architect] 🚀 Generating graphics elements for plan: '${plan.title}'...`,
  );

  // 1. Primary: Query Backend Proxy Route (Uses Swirls AI as primary engine with Gemini fallback)
  try {
    const res = await fetchWithCaptcha("/api/ai-architect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "build",
        prompt: `Create resume for ${userPrompt}. Plan: ${plan.title}`,
        plan,
      }),
    });
    if (res.status === 400) {
      const data = await res.json().catch(() => ({}));
      if (data.status === "rejected") {
        throw new Error(
          data.error ||
            data.reason ||
            "Request violates career and resume safety policy.",
        );
      }
    }
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.elements) && data.elements.length > 0) {
        console.log(
          `[AI-Architect] ✅ Successfully built ${data.elements.length} elements via Primary AI Engine!`,
        );
        return normalizeEditorElements(data.elements);
      }
    }
  } catch (e: any) {
    if (
      e?.message?.includes("safety policy") ||
      e?.message?.includes("violates") ||
      e?.message?.includes("Security verification") ||
      e?.message?.includes("cancelled")
    ) {
      throw e;
    }
    console.warn(
      "[AI-Architect] Backend build call error, attempting client fallback...",
      e,
    );
  }

  // 2. Client-Side High-Precision Element Engine Fallback
  return generateFallbackElements(plan, userPrompt);
}

export interface ArchitectStreamEvent {
  type: "status" | "agent_start" | "agent_step" | "thought" | "complete" | "error" | "fallback_prompt";
  stage?: string;
  agent?: string;
  step_index?: number;
  total_steps?: number;
  message?: string;
  plan?: any;
  elements?: EditorElement[];
  quality_metrics?: any;
  quality_score?: number;
  symmetry_score?: number;
  action?: string;
  fallback_triggered?: boolean;
}

export async function buildArchitectResumeWithStream(
  plan: DesignPlan,
  userPrompt: string = "",
  onEvent?: (event: ArchitectStreamEvent) => void,
): Promise<EditorElement[]> {
  console.log(`[AI-Architect] 🚀 Streaming build for: '${plan.title}'...`);

  onEvent?.({
    type: "status",
    stage: "connecting",
    message: "Connecting to Multi-Agent AI stream pipeline...",
    step_index: 1,
    total_steps: 5,
  });

  try {
    const res = await fetchWithCaptcha("/api/ai-architect/stream", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "build",
        prompt: userPrompt || plan.title,
        plan,
      }),
    });

    if (res.ok && res.body) {
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let finalElements: EditorElement[] | null = null;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith("data:")) {
            try {
              const data: ArchitectStreamEvent = JSON.parse(trimmed.slice(5).trim());
              onEvent?.(data);

              if (data.type === "complete" && Array.isArray(data.elements) && data.elements.length > 0) {
                finalElements = normalizeEditorElements(data.elements);
              }
            } catch (jsonErr) {
              console.warn("[AI-Architect] SSE JSON parse warning:", jsonErr);
            }
          }
        }
      }

      if (finalElements && finalElements.length > 0) {
        return finalElements;
      }
    }
  } catch (err: any) {
    console.warn("[AI-Architect] Stream error, falling back to direct build:", err);
  }

  // Fallback to direct build or client layout engine
  onEvent?.({
    type: "status",
    stage: "synthesizing",
    message: "Synthesizing calibrated layout elements...",
    step_index: 5,
    total_steps: 5,
  });

  return buildArchitectResumeDirect(plan, userPrompt);
}

export function createFallbackPlan(
  userPrompt: string,
  refinement: string = "",
): DesignPlan {
  const p = (userPrompt + " " + refinement).toLowerCase();

  let primary = "#0F172A";
  let secondary = "#38BDF8";
  let accent = "#6366F1";
  let bg = "#FFFFFF";
  let text = "#1E293B";
  let layout_type = "two_column_left_sidebar";

  const wantsQr =
    p.includes("qr") ||
    p.includes("barcode") ||
    p.includes("quick response") ||
    p.includes("scan");

  if (
    p.includes("cyberpunk") ||
    p.includes("neon") ||
    p.includes("synthwave") ||
    p.includes("matrix")
  ) {
    layout_type = "cyberpunk_edge";
    bg = "#0A0A0F";
    primary = "#FF003C";
    secondary = "#00F0FF";
    accent = "#FFE600";
    text = "#FFFFFF";
  } else if (
    p.includes("terminal") ||
    p.includes("retro") ||
    p.includes("hacker") ||
    p.includes("cli") ||
    p.includes("console") ||
    p.includes("bash") ||
    p.includes("linux")
  ) {
    layout_type = "retro_terminal";
    bg = "#0C0C0C";
    primary = "#00FF66";
    secondary = "#1F2430";
    accent = "#FFE600";
    text = "#00FF66";
  } else if (
    p.includes("classic") ||
    p.includes("harvard") ||
    p.includes("monarch") ||
    p.includes("single") ||
    p.includes("executive")
  ) {
    layout_type = "monarch_classic";
    bg = "#FFFFFF";
    primary = "#0F172A";
    secondary = "#B45309";
    accent = "#2563EB";
    text = "#1E293B";
  } else if (p.includes("minimal") || p.includes("grid")) {
    layout_type = "minimalist_grid";
    bg = "#FFFFFF";
    primary = "#18181B";
    secondary = "#71717A";
    accent = "#09090B";
    text = "#27272A";
  } else if (p.includes("red") && p.includes("blue")) {
    primary = "#1E3A8A"; // Deep Navy Blue
    secondary = "#DC2626"; // Crimson Red
    accent = "#2563EB";
  } else if (p.includes("dark")) {
    bg = "#0B132B";
    primary = "#38BDF8";
    secondary = "#90E0EF";
    text = "#F8FAFC";
    accent = "#818CF8";
  } else if (p.includes("emerald") || p.includes("green")) {
    primary = "#064E3B";
    secondary = "#059669";
    accent = "#10B981";
  } else if (
    p.includes("crimson") ||
    p.includes("red")
  ) {
    primary = "#7F1D1D";
    secondary = "#991B1B";
    accent = "#DC2626";
  }

  const sections = [
    {
      id: "sec_1",
      title: "Header & Personal Branding",
      component_type: "header",
      description:
        "Bold target role, contact badges with modern icons and styled banner",
    },
    {
      id: "sec_2",
      title: "Professional Summary",
      component_type: "summary",
      description:
        "Executive career highlights and technical accomplishments",
    },
    {
      id: "sec_3",
      title: "Professional Work Experience",
      component_type: "timeline",
      description:
        "Structured timeline entries with company role, dates, and impact bullets",
    },
    {
      id: "sec_4",
      title: "Skills & Technical Competencies",
      component_type: "skill_loader",
      description:
        "Core skills, tools, and technical proficiency metrics",
    },
    {
      id: "sec_5",
      title: "Education & Credentials",
      component_type: "text_block",
      description:
        "Degree specialization, university honors, and certifications",
    },
  ];

  if (wantsQr) {
    sections.push({
      id: "sec_6",
      title: "Portfolio QR Code",
      component_type: "qr_code",
      description:
        "Scannable QR code block linking to live GitHub / Portfolio",
    });
  }

  const special_elements = [
    "Mathematical layout alignment",
    "Archetype-tailored typography and palette",
  ];
  if (wantsQr) {
    special_elements.push("Scannable Portfolio QR Code block");
  }

  return {
    title: `AI Architect ${layout_type.replace(/_/g, " ").replace(/\\b\\w/g, (c) => c.toUpperCase())} Resume`,
    layout_type,
    theme_summary: `Bespoke mathematical design created for "${userPrompt.slice(0, 40)}..." featuring balanced proportions, archetype styling, and executive typography.`,
    color_palette: { bg, primary, secondary, text, accent },
    sections,
    special_elements,
  };
}

export function generateFallbackElements(
  plan: DesignPlan,
  userPrompt: string = "",
): EditorElement[] {
  const p = (userPrompt + " " + (plan.title || "")).toLowerCase();
  const palette = plan.color_palette;

  // Determine domain/role from user prompt
  let role = "Senior Software Engineer & Full-Stack Architect";
  let skills = [
    { name: "TypeScript / React", level: 0.95 },
    { name: "Python / FastAPI", level: 0.92 },
    { name: "AWS Cloud / K8s", level: 0.88 },
    { name: "PostgreSQL & Redis", level: 0.86 },
    { name: "GraphQL & REST APIs", level: 0.9 },
    { name: "Docker / CI/CD", level: 0.85 },
  ];
  let summary =
    "Results-driven Senior Engineer with 6+ years designing scalable microservices, high-throughput cloud architectures, and responsive web applications. Proven track record of boosting system reliability to 99.99% and mentoring engineering teams.";

  const experiences = [
    {
      role: "Lead Full-Stack Architect",
      company: "TechScale Systems",
      duration: "2021 – Present",
      location: "San Francisco, CA",
      bullets: [
        "Architected distributed event-driven microservices processing 15M+ daily requests on AWS EKS.",
        "Reduced cloud infrastructure costs by 35% ($420k/yr) through Spot instance optimization.",
        "Mentored a team of 10 software engineers, establishing automated CI/CD and 95%+ test coverage.",
      ],
    },
    {
      role: "Senior Software Engineer",
      company: "CloudCore Inc.",
      duration: "2018 – 2021",
      location: "Austin, TX",
      bullets: [
        "Built responsive real-time analytics dashboards using React, TypeScript, and WebSockets.",
        "Implemented OAuth2 token rotation and end-to-end encryption complying with SOC2 standards.",
      ],
    },
  ];

  if (p.includes("analyst") || (p.includes("data") && !p.includes("ml") && !p.includes("machine"))) {
    role = "Senior Data Analyst";
    skills = [
      { name: "SQL & PostgreSQL", level: 0.96 },
      { name: "Python (Pandas, NumPy)", level: 0.92 },
      { name: "Tableau & PowerBI", level: 0.90 },
      { name: "ETL & Data Warehousing", level: 0.88 },
      { name: "Statistical A/B Testing", level: 0.85 },
      { name: "Predictive Analytics", level: 0.82 },
    ];
    summary =
      "Analytical Senior Data Analyst with 5+ years of experience transforming complex multi-source telemetry data into actionable executive insights. Expert in SQL, Python, Tableau, and automated ETL pipelines. Proven track record of improving reporting efficiency by 35% and identifying $1.2M in annual cost optimizations.";
    experiences[0].role = "Senior Data Analyst";
    experiences[0].company = "Cognitive Insights Tech";
    experiences[0].bullets = [
      "Architected automated SQL and Python ETL pipelines ingesting 25M+ daily user interactions, cutting data latency by 45%.",
      "Designed 14 C-suite executive dashboards in Tableau and PowerBI, tracking $40M+ in annual recurring revenue (ARR).",
      "Spearheaded predictive customer churn model in Python (Scikit-Learn), directly reducing customer attrition by 18%.",
    ];
    experiences[1].role = "Data & BI Analyst";
    experiences[1].company = "Apex Global Analytics";
    experiences[1].bullets = [
      "Conducted rigorous A/B multivariate testing across 1.5M monthly web visitors, boosting checkout funnel conversions by 22%.",
      "Automated weekly stakeholder reporting via Python scripts, saving 16 engineering hours per sprint.",
    ];
  } else if (p.includes("data") || p.includes("ai") || p.includes("ml") || p.includes("machine learning")) {
    role = "Senior Data Scientist & AI/ML Engineer";
    skills = [
      { name: "Python / PyTorch", level: 0.96 },
      { name: "LLMs / LangChain", level: 0.92 },
      { name: "SQL & Apache Spark", level: 0.88 },
      { name: "MLOps & Docker", level: 0.85 },
      { name: "AWS SageMaker", level: 0.86 },
      { name: "Data Viz & Tableau", level: 0.9 },
    ];
    summary =
      "Innovative AI/ML Engineer with 6+ years architecting production machine learning models, retrieval-augmented generation (RAG) pipelines, and predictive telemetry platforms.";
    experiences[0].role = "Lead AI/ML Engineer";
    experiences[0].company = "DataMind Intelligence";
    experiences[1].role = "Senior Data Scientist";
    experiences[1].company = "InsightWorks AI";
  } else if (p.includes("product") || p.includes("pm") || p.includes("manager")) {
    role = "Senior Product Manager & Strategy Lead";
    skills = [
      { name: "Product Roadmapping", level: 0.95 },
      { name: "User Research & A/B Testing", level: 0.92 },
      { name: "Agile & Scrum (CSPO)", level: 0.94 },
      { name: "Mixpanel & SQL Telemetry", level: 0.88 },
      { name: "Wireframing (Figma)", level: 0.86 },
      { name: "GTM Growth Execution", level: 0.9 },
    ];
    summary =
      "Customer-obsessed Product Leader with 6+ years driving enterprise SaaS products from discovery to scale, generating $4.5M+ ARR and reducing user churn by 28%.";
    experiences[0].role = "Senior Product Manager";
    experiences[0].company = "ScaleSaaS Technologies";
    experiences[1].role = "Product Manager";
    experiences[1].company = "Venture Growth Lab";
  } else if (p.includes("executive") || p.includes("director") || p.includes("vp")) {
    role = "VP of Engineering & Technology Strategy";
    skills = [
      { name: "Cross-Functional Leadership", level: 0.96 },
      { name: "Architecture & Scale", level: 0.94 },
      { name: "Budgeting ($12M ARR)", level: 0.9 },
      { name: "Talent Acquisition & OKRs", level: 0.92 },
      { name: "Cloud & Cybersecurity", level: 0.88 },
      { name: "Board & C-Suite Advisory", level: 0.9 },
    ];
  }

  const candidateData: ParsedCandidateData = {
    name: "ALEXANDER MORGAN",
    headline: role,
    email: "alex.morgan@resumagic.ai",
    phone: "+1 (555) 019-2834",
    location: "New York, NY",
    linkedin: "linkedin.com/in/alexmorgan-lead",
    website: "alexmorgan.dev",
    summary,
    experiences,
    educations: [
      {
        degree: "M.S. in Computer Science",
        school: "Stanford University",
        year: "2018",
        gpa: "3.9 GPA",
      },
      {
        degree: "B.S. in Software Engineering",
        school: "University of Washington",
        year: "2016",
      },
    ],
    skills,
    certifications: [
      "AWS Certified Solutions Architect (Professional)",
      "Certified Scrum Master (CSM)",
    ],
  };

  // Check if any bespoke archetype template matches
  let matchedTemplate = TEMPLATES.find((t) => t.id === plan.layout_type);
  if (!matchedTemplate) {
    if (
      p.includes("cyberpunk") ||
      p.includes("neon") ||
      p.includes("synthwave") ||
      p.includes("matrix")
    ) {
      matchedTemplate = TEMPLATES.find((t) => t.id === "cyberpunk_edge");
    } else if (
      p.includes("terminal") ||
      p.includes("retro") ||
      p.includes("hacker") ||
      p.includes("cli") ||
      p.includes("console") ||
      p.includes("bash") ||
      p.includes("linux")
    ) {
      matchedTemplate = TEMPLATES.find((t) => t.id === "retro_terminal");
    } else if (
      p.includes("classic") ||
      p.includes("harvard") ||
      p.includes("monarch")
    ) {
      matchedTemplate = TEMPLATES.find((t) => t.id === "monarch_classic");
    } else if (p.includes("minimal") || p.includes("grid")) {
      matchedTemplate = TEMPLATES.find((t) => t.id === "minimalist_grid");
    }
  }

  if (matchedTemplate) {
    const firstName = candidateData.name.split(" ")[0] || "ALEX";
    const lastName = candidateData.name.split(" ").slice(1).join(" ") || "MORGAN";
    const wizardData = {
      contact: {
        firstName,
        lastName,
        email: candidateData.email,
        phone: candidateData.phone,
        city: candidateData.location,
        linkedin: candidateData.linkedin,
      },
      targetRole: candidateData.headline,
      summary: candidateData.summary,
      experiences: candidateData.experiences.map((exp) => ({
        role: exp.role,
        company: exp.company,
        duration: exp.duration,
        description: exp.bullets.map((b) => `• ${b}`).join("\n"),
      })),
      educations: candidateData.educations.map((edu) => ({
        degree: edu.degree,
        school: edu.school,
        startDate: edu.year ? edu.year.split("–")[0]?.trim() || "2018" : "2018",
        endDate: edu.year ? edu.year.split("–")[1]?.trim() || "2022" : "2022",
      })),
      skills: candidateData.skills.map((s) => s.name),
    };

    const rawTemplateElements = matchedTemplate.elements("page-1", wizardData);
    return normalizeEditorElements(rawTemplateElements as any[], "page-1");
  }

  const isExecutiveTheme =
    plan.layout_type?.includes("single") ||
    plan.layout_type?.includes("executive") ||
    p.includes("executive") ||
    p.includes("ats");

  if (isExecutiveTheme) {
    return generateGeometricResume(candidateData, "executive", {
      primary: palette.primary || "#0F172A",
      secondary: palette.secondary || "#2563EB",
      accent: palette.accent || "#CBD5E1",
      text: palette.text || "#334155",
      muted: "#64748B",
    });
  }

  return generateGeometricResume(candidateData, "sidebar", {
    sidebarBg: palette.bg === "#FFFFFF" ? "#0F172A" : palette.bg || "#0F172A",
    sidebarText: "#F8FAFC",
    sidebarMuted: "#94A3B8",
    primary: palette.primary || "#1E293B",
    secondary: palette.secondary || "#2563EB",
    accent: palette.accent || "#38BDF8",
    text: palette.text || "#334155",
    muted: "#64748B",
    barBg: "#334155",
  });
}

export async function buildResumeFromImportedText(
  extractedText: string,
  userPrompt: string = "",
): Promise<{ elements: EditorElement[]; title: string }> {
  // 1. Initial high-accuracy semantic text extraction
  const candidateData = parseResumeTextToCandidateData(extractedText);

  // 2. Primary: Distill structured candidate information via Backend Primary AI
  try {
    const res = await fetchWithCaptcha("/api/ai-architect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "distill",
        prompt: extractedText.slice(0, 10000),
      }),
    });
    if (res.ok) {
      const data = await res.json();
      const rawJson = data.data;
      if (
        rawJson &&
        (rawJson.contact || rawJson.experiences || rawJson.skills)
      ) {
        console.log(
          "[AI-Import Engine] ✅ Successfully distilled candidate data via Primary AI Engine!",
        );
        if (rawJson.contact?.firstName) {
          candidateData.name = `${rawJson.contact.firstName} ${rawJson.contact.lastName || ""}`.trim();
        }
        if (rawJson.contact?.email) candidateData.email = rawJson.contact.email;
        if (rawJson.contact?.phone) candidateData.phone = rawJson.contact.phone;
        if (rawJson.contact?.linkedin) candidateData.linkedin = rawJson.contact.linkedin;
        if (rawJson.contact?.location || rawJson.contact?.country) {
          candidateData.location = rawJson.contact.location || rawJson.contact.country;
        }
        if (rawJson.summary) candidateData.summary = rawJson.summary;
        if (Array.isArray(rawJson.skills) && rawJson.skills.length > 0) {
          candidateData.skills = rawJson.skills.map((s: string, idx: number) => ({
            name: s,
            level: Math.min(0.96, Math.max(0.75, 0.95 - (idx % 6) * 0.04)),
          }));
        }
        if (Array.isArray(rawJson.experiences) && rawJson.experiences.length > 0) {
          candidateData.experiences = rawJson.experiences.map((exp: any) => ({
            role: exp.jobTitle || exp.role || exp.title || "Professional",
            company: exp.company || "",
            duration: exp.dates || exp.duration || "",
            location: exp.location || "",
            bullets: (exp.description || "")
              .split(/\n|•/)
              .map((b: string) => b.trim())
              .filter((b: string) => b.length > 4),
          }));
        }
        if (Array.isArray(rawJson.educations) && rawJson.educations.length > 0) {
          candidateData.educations = rawJson.educations.map((edu: any) => ({
            degree: edu.degree || "Degree",
            school: edu.school || "",
            year: edu.dates || edu.year || "",
            gpa: edu.gpa || "",
            details: edu.description || "",
          }));
        }
      }
    }
  } catch (backendErr) {
    console.warn(
      "[AI-Import Engine] Backend distillation notice:",
      backendErr,
    );
  }

  // 3. Build pristine geometric canvas elements
  const candidateName = candidateData.name.trim();
  const resumeTitle = candidateName
    ? `${candidateName}'s Resume`
    : "Imported Resume";

  const elements = generateGeometricResume(candidateData, "sidebar");
  return { elements, title: resumeTitle };
}
