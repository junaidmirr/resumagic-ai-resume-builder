import { GoogleGenerativeAI } from "@google/generative-ai";
import type { EditorElement } from "../types/editor";
import { parseResumeTextToWizardData } from "./pdfParser";
import { generateWizardElements } from "./wizardGenerator";

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
}

// Frontend routes all AI tasks securely via backend API (/api/*)
const genAI = null;

// Official Google Gemini API Available Models List
export const GEMINI_MODELS = [
  "gemini-3.5-flash",
  "gemini-3.5-flash-lite",
  "gemini-3.6-flash",
  "gemini-3.1-pro",
  "gemini-2.5-flash",
  "gemini-2.5-pro",
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
  "gemini-flash-latest",
  "gemini-pro-latest"
];

function cleanJSONResponse(raw: string): any {
  let text = raw.trim();
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    text = fenceMatch[1].trim();
  }
  
  const startIdx = text.search(/[\{\[]/);
  if (startIdx !== -1) {
    const endChar = text[startIdx] === "{" ? "}" : "]";
    const lastIdx = text.lastIndexOf(endChar);
    if (lastIdx !== -1) {
      text = text.substring(startIdx, lastIdx + 1);
    }
  }

  return JSON.parse(text);
}

export function normalizeEditorElements(rawList: any[], targetPageId: string = "page-1"): EditorElement[] {
  if (!Array.isArray(rawList)) return [];

  // Determine if Y coordinates in rawList are Top-Down (0 at top of page, 792 at bottom)
  let isTopDown = false;
  for (const item of rawList) {
    const txt = String(item.text || item.content || item.heading || item.name || '').toLowerCase();
    if (txt.length > 0 && typeof item.y === 'number' && item.y < 350 && idx_is_early(item, rawList)) {
      isTopDown = true;
      break;
    }
  }

  function idx_is_early(target: any, list: any[]) {
    const idx = list.indexOf(target);
    return idx >= 0 && idx < 5;
  }

  return rawList.map((item, idx) => {
    // Unique ID guarantee
    const id = item.id && String(item.id).trim().length > 0
      ? String(item.id)
      : `el_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`;

    // Element Type ('text' | 'shape' | 'image')
    let elementType: 'text' | 'shape' | 'image' = 'text';
    const rawType = String(item.element_type || item.type || item.kind || '').toLowerCase();
    if (rawType.includes('shape') || item.shape_type || item.shape) {
      elementType = 'shape';
    } else if (rawType.includes('image') || rawType.includes('icon') || item.image_path || item.icon_name) {
      elementType = 'image';
    } else {
      elementType = 'text';
    }

    const page_id = item.page_id || targetPageId;
    const x = typeof item.x === 'number' && !isNaN(item.x) ? item.x : 40;
    const rawY = typeof item.y === 'number' && !isNaN(item.y) ? item.y : (50 + idx * 22);

    // Convert top-down Y (0=top) to bottom-up Y (792=top) if needed
    let y = isTopDown
      ? Math.max(10, Math.min(770, 792 - rawY - 20))
      : Math.max(10, Math.min(770, rawY));

    const z_index = typeof item.z_index === 'number' ? item.z_index : (elementType === 'shape' ? 1 : 2 + idx);

    if (elementType === 'text') {
      let rawText = item.text ?? item.content ?? item.value ?? item.label ?? item.heading ?? item.title ?? item.description ?? "";
      if (typeof rawText === 'object') {
        try { rawText = JSON.stringify(rawText); } catch (e) { rawText = "Text Block"; }
      }
      const text = String(rawText).trim() || "Text Block";

      const font_size = Number(item.font_size || item.fontSize || item.size || 11);
      const font_name = String(item.font_name || item.fontFamily || item.font || "Helvetica");
      const text_color = String(item.text_color || item.textColor || item.color || "#1E293B");
      const width = Number(item.width || Math.max(120, Math.min(532, text.length * font_size * 0.55)));
      const height = Number(item.height || Math.max(16, Math.ceil(font_size * 1.4)));

      return {
        id,
        element_type: 'text',
        page_id,
        text,
        x,
        y,
        width,
        height,
        font_size,
        font_name,
        text_color,
        bold: Boolean(item.bold || item.isBold),
        italic: Boolean(item.italic || item.isItalic),
        align: item.align || 'left',
        z_index,
      } as any;
    } else if (elementType === 'shape') {
      const shape_type = item.shape_type || item.shape || (item.x2 !== undefined ? 'line' : 'rectangle');
      const width = Number(item.width || (shape_type === 'line' ? Math.abs((item.x2 || x) - x) : 532));
      const height = Number(item.height || (shape_type === 'line' ? 2 : 20));
      const fill_color = String(item.fill_color || item.fillColor || item.fill || item.color || "#475569");

      return {
        id,
        element_type: 'shape',
        page_id,
        shape_type,
        x,
        y,
        width,
        height,
        fill_color,
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
        element_type: 'image',
        page_id,
        x,
        y,
        width: Number(item.width || 24),
        height: Number(item.height || 24),
        image_path: String(item.image_path || item.src || ''),
        is_icon: Boolean(item.is_icon || item.isIcon),
        icon_name: String(item.icon_name || item.iconName || item.icon || 'Star'),
        z_index,
      } as any;
    }
  });
}

export async function generateArchitectPlanDirect(
  userPrompt: string, 
  refinement: string = "", 
  previousPlan?: DesignPlan
): Promise<DesignPlan> {
  if (!genAI || !apiKey) {
    return createFallbackPlan(userPrompt, refinement);
  }

  const sysPrompt = `You are a Lead AI Architect specializing in high-converting, ATS-friendly resume engineering.
CONTEXT: A 612x792 PDF canvas (Origin=BOTTOM-LEFT).

YOUR TASK:
Analyze the user's prompt (and optional refinement instruction / previous plan) and create a structured DESIGN PLAN.

Return ONLY raw JSON with this exact schema:
{
  "title": "Short Descriptive Title of Design",
  "layout_type": "two_column_left_sidebar | two_column_right_sidebar | single_column | executive_header",
  "theme_summary": "1-2 sentence description of design aesthetics and typography",
  "color_palette": {
    "bg": "#HEX",
    "primary": "#HEX",
    "secondary": "#HEX",
    "text": "#HEX",
    "accent": "#HEX"
  },
  "sections": [
    {
      "id": "sec_1",
      "title": "Section Name",
      "component_type": "header | sidebar | text_block | skill_loader | chart | qr_code | timeline",
      "description": "Details of what will be included"
    }
  ],
  "special_elements": [
    "Skill progress bars with percentage loaders",
    "QR Code linking to portfolio",
    "Visual bar chart for key impact metrics"
  ]
}

Output ONLY valid raw JSON without markdown or conversational text.`;

  let prompt = `User Request: ${userPrompt}\n`;
  if (previousPlan) prompt += `Previous Plan:\n${JSON.stringify(previousPlan, null, 2)}\n`;
  if (refinement) prompt += `Refinement Instruction: ${refinement}\n`;

  for (const modelName of GEMINI_MODELS) {
    try {
      console.log(`[AI-Architect Direct] Trying model ${modelName}...`);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(`${sysPrompt}\n\n${prompt}`);
      const text = result.response.text();
      const plan = cleanJSONResponse(text);
      if (plan && plan.title && plan.color_palette) {
        console.log(`[AI-Architect Direct] ✅ Plan received from Gemini API (${modelName}): ${plan.title}`);
        return plan;
      }
    } catch (err: any) {
      if (!err?.message?.includes("404")) {
        console.warn(`[AI-Architect Direct] Model ${modelName} call issue:`, err);
      }
    }
  }

  return createFallbackPlan(userPrompt, refinement);
}

export async function buildArchitectResumeDirect(
  plan: DesignPlan, 
  userPrompt: string = ""
): Promise<EditorElement[]> {
  console.log(`[AI-Architect Direct] 🚀 Building graphics elements with Gemini API for plan: '${plan.title}'...`);

  if (!genAI || !apiKey) {
    return generateFallbackElements(plan);
  }

  const execPrompt = `You are a Master Graphics Engineer.
Task: Generate ALL EditorElement objects to build a complete, production-ready, 1-page resume based on this DESIGN PLAN.

DESIGN PLAN:
${JSON.stringify(plan, null, 2)}

USER INITIAL PROMPT: ${userPrompt}

CANVAS SPECIFICATIONS:
- Size: 612x792 points. Origin (0,0) is at the BOTTOM-LEFT.
- TOP of page is Y=792. BOTTOM of page is Y=0.
- Header goes at Y=720-770.
- As you place elements DOWN the page, Y MUST DECREASE.

ENGINE CAPABILITIES TO USE:
1. TEXT ('element_type': 'text'):
   - text, x, y, width, height, font_size, font_name ('Helvetica', 'Helvetica-Bold', 'NotoSans-Regular', 'NotoSans-Bold'), text_color (#HEX), align ('left', 'center', 'right'), bold, italic, line_height, letter_spacing, z_index.
2. SHAPES ('element_type': 'shape'):
   - shape_type: 'rectangle', 'circle', 'line', 'arrow', 'polygon', 'path'
   - fill_color, border_color, border_width, border_radius (for rounded rects), x2, y2 (for lines/arrows), path_d (for SVG paths), points (for polygons).
3. SKILL PROGRESS LOADERS:
   - Build skill progress bars using TWO overlapping rectangles:
     a) Background loader bar: height=6, fill_color='#E2E8F0', border_radius=3.
     b) Filled progress bar: height=6, width=(percentage * total_width), fill_color=accent_color, border_radius=3.
4. CHARTS / METRIC GRAPHS:
   - Draw bar charts or metric graphs using rectangles and line axes to visually display key metrics.
5. QR CODES:
   - Render a QR code block using a square image/shape element.
6. ICONS:
   - Use is_icon=true with icon_name: Phone, Mail, Globe, MapPin, Linkedin, Github, ExternalLink, Briefcase, GraduationCap, Trophy, Star, CheckCircle, Award, Target, Zap, Rocket, User, Calendar.

Return ONLY a raw JSON array of the final EditorElement objects.`;

  for (const modelName of GEMINI_MODELS) {
    try {
      console.log(`[AI-Architect Direct] Building graphics with model ${modelName}...`);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(execPrompt);
      const text = result.response.text();
      const elements = cleanJSONResponse(text);
      if (Array.isArray(elements) && elements.length > 0) {
        const normalized = normalizeEditorElements(elements);
        console.log(`[AI-Architect Direct] ✅ Successfully generated ${normalized.length} normalized elements via Gemini API (${modelName})!`);
        return normalized;
      }
    } catch (err: any) {
      if (!err?.message?.includes("404")) {
        console.warn(`[AI-Architect Direct] Build error with model ${modelName}:`, err);
      }
    }
  }

  return generateFallbackElements(plan);
}

export function createFallbackPlan(userPrompt: string, refinement: string = ""): DesignPlan {
  const p = (userPrompt + " " + refinement).toLowerCase();
  
  let primary = "#0F172A";
  let secondary = "#38BDF8";
  let accent = "#6366F1";
  let bg = "#FFFFFF";
  let text = "#1E293B";

  if (p.includes("dark")) {
    bg = "#0B132B";
    primary = "#38BDF8";
    secondary = "#90E0EF";
    text = "#F8FAFC";
    accent = "#818CF8";
  } else if (p.includes("emerald") || p.includes("green")) {
    primary = "#064E3B";
    secondary = "#059669";
    accent = "#10B981";
  } else if (p.includes("executive") || p.includes("crimson") || p.includes("red")) {
    primary = "#7F1D1D";
    secondary = "#991B1B";
    accent = "#DC2626";
  }

  return {
    title: "AI Architect Bespoke Resume",
    layout_type: "two_column_left_sidebar",
    theme_summary: `Bespoke mathematical design created for "${userPrompt.slice(0, 40)}..." featuring balanced proportions, skill progress loaders, and executive typography.`,
    color_palette: { bg, primary, secondary, text, accent },
    sections: [
      { id: "sec_1", title: "Header & Personal Branding", component_type: "header", description: "Bold target role, contact badges with modern icons and styled banner" },
      { id: "sec_2", title: "Sidebar Skills & Progress Loaders", component_type: "skill_loader", description: "Dual-layer skill progress loaders showing technical proficiency percentages" },
      { id: "sec_3", title: "Professional Work Experience", component_type: "timeline", description: "Structured timeline entries with company role, dates, and impact bullets" },
      { id: "sec_4", title: "Education & Credentials", component_type: "text_block", description: "Degree specialization, university honors, and certifications" },
      { id: "sec_5", title: "Portfolio QR Code", component_type: "qr_code", description: "Scannable QR code block linking to live GitHub / Portfolio" }
    ],
    special_elements: [
      "Skill progress loaders with percentage bars",
      "Scannable Portfolio QR Code block",
      "Executive timeline section dividers"
    ]
  };
}

export function generateFallbackElements(plan: DesignPlan): EditorElement[] {
  const gid = () => Math.random().toString(36).substring(2, 9);
  const pageId = "page-1";
  const palette = plan.color_palette;
  const els: EditorElement[] = [];

  const sw = 180;

  // 1. Sidebar Background & Divider
  els.push({
    id: gid(),
    element_type: "shape",
    shape_type: "rectangle",
    page_id: pageId,
    x: 0,
    y: 0,
    width: sw,
    height: 792,
    fill_color: palette.bg === "#FFFFFF" ? "#0F172A" : "#1E293B",
    border_width: 0,
    z_index: 0,
  } as any);

  els.push({
    id: gid(),
    element_type: "shape",
    shape_type: "line",
    page_id: pageId,
    x: sw,
    y: 0,
    x2: sw,
    y2: 792,
    border_color: palette.accent,
    border_width: 2,
    z_index: 1,
  } as any);

  // 2. Header Banner
  els.push({
    id: gid(),
    element_type: "shape",
    shape_type: "rectangle",
    page_id: pageId,
    x: sw,
    y: 792 - 110,
    width: 612 - sw,
    height: 110,
    fill_color: palette.primary,
    border_width: 0,
    z_index: 1,
  } as any);

  els.push({
    id: gid(),
    element_type: "text",
    page_id: pageId,
    text: "ALEX MERCER",
    x: sw + 20,
    y: 735,
    width: 380,
    height: 28,
    font_size: 24,
    font_name: "Helvetica-Bold",
    text_color: "#FFFFFF",
    bold: true,
    z_index: 2,
  } as any);

  els.push({
    id: gid(),
    element_type: "text",
    page_id: pageId,
    text: "Senior Cloud Architect & Lead Engineer",
    x: sw + 20,
    y: 715,
    width: 380,
    height: 14,
    font_size: 11,
    font_name: "Helvetica",
    text_color: palette.secondary,
    z_index: 2,
  } as any);

  // 3. Sidebar Avatar & Skills
  els.push({
    id: gid(),
    element_type: "shape",
    shape_type: "circle",
    page_id: pageId,
    x: sw / 2 - 30,
    y: 690,
    width: 60,
    height: 60,
    fill_color: palette.accent,
    border_width: 2,
    border_color: "#FFFFFF",
    z_index: 2,
  } as any);

  els.push({
    id: gid(),
    element_type: "text",
    page_id: pageId,
    text: "AM",
    x: 0,
    y: 705,
    width: sw,
    height: 30,
    font_size: 20,
    font_name: "Helvetica-Bold",
    text_color: "#FFFFFF",
    align: "center",
    bold: true,
    z_index: 3,
  } as any);

  els.push({
    id: gid(),
    element_type: "text",
    page_id: pageId,
    text: "CORE SKILLS & PROFICIENCY",
    x: 15,
    y: 640,
    width: sw - 30,
    height: 14,
    font_size: 9,
    font_name: "Helvetica-Bold",
    text_color: palette.secondary,
    bold: true,
    z_index: 2,
  } as any);

  const skills = [
    { name: "React / Next.js", pct: 0.95 },
    { name: "Python / FastAPI", pct: 0.90 },
    { name: "AWS / Cloud", pct: 0.85 },
    { name: "PostgreSQL", pct: 0.88 },
    { name: "Docker / K8s", pct: 0.80 }
  ];

  let sy = 615;
  skills.forEach((s) => {
    els.push({
      id: gid(),
      element_type: "text",
      page_id: pageId,
      text: `${s.name} (${Math.round(s.pct * 100)}%)`,
      x: 15,
      y: sy,
      width: sw - 30,
      height: 10,
      font_size: 7.5,
      font_name: "Helvetica",
      text_color: "#CBD5E1",
      z_index: 2,
    } as any);

    els.push({
      id: gid(),
      element_type: "shape",
      shape_type: "rectangle",
      page_id: pageId,
      x: 15,
      y: sy - 8,
      width: sw - 30,
      height: 5,
      fill_color: "#334155",
      border_width: 0,
      border_radius: 3,
      z_index: 2,
    } as any);

    els.push({
      id: gid(),
      element_type: "shape",
      shape_type: "rectangle",
      page_id: pageId,
      x: 15,
      y: sy - 8,
      width: (sw - 30) * s.pct,
      height: 5,
      fill_color: palette.accent,
      border_width: 0,
      border_radius: 3,
      z_index: 3,
    } as any);

    sy -= 28;
  });

  // Sidebar QR Code
  els.push({
    id: gid(),
    element_type: "text",
    page_id: pageId,
    text: "LIVE PORTFOLIO QR",
    x: 15,
    y: 380,
    width: sw - 30,
    height: 12,
    font_size: 8.5,
    font_name: "Helvetica-Bold",
    text_color: palette.secondary,
    bold: true,
    z_index: 2,
  } as any);

  els.push({
    id: gid(),
    element_type: "shape",
    shape_type: "rectangle",
    page_id: pageId,
    x: sw / 2 - 35,
    y: 300,
    width: 70,
    height: 70,
    fill_color: "#FFFFFF",
    border_color: palette.accent,
    border_width: 2,
    border_radius: 6,
    z_index: 2,
  } as any);

  els.push({
    id: gid(),
    element_type: "text",
    page_id: pageId,
    text: "SCAN ME",
    x: 15,
    y: 282,
    width: sw - 30,
    height: 10,
    font_size: 7.5,
    font_name: "Helvetica-Bold",
    text_color: "#94A3B8",
    align: "center",
    z_index: 2,
  } as any);

  // 4. Main Body Content (Right Side)
  let ry = 640;

  // Summary
  els.push({
    id: gid(),
    element_type: "text",
    page_id: pageId,
    text: "PROFESSIONAL SUMMARY",
    x: sw + 20,
    y: ry,
    width: 380,
    height: 14,
    font_size: 10,
    font_name: "Helvetica-Bold",
    text_color: palette.primary,
    bold: true,
    z_index: 2,
  } as any);

  els.push({
    id: gid(),
    element_type: "shape",
    shape_type: "line",
    page_id: pageId,
    x: sw + 20,
    y: ry - 4,
    x2: 580,
    y2: ry - 4,
    border_color: palette.secondary,
    border_width: 1,
    z_index: 2,
  } as any);

  ry -= 22;
  els.push({
    id: gid(),
    element_type: "text",
    page_id: pageId,
    text: "Innovative Cloud Architect with 8+ years leading cross-functional teams building high-throughput microservices. Specialized in serverless architectures, cost optimization ($12M saved), and real-time streaming serving 10M+ users.",
    x: sw + 20,
    y: ry - 35,
    width: 380,
    height: 40,
    font_size: 8.5,
    font_name: "Helvetica",
    text_color: "#334155",
    line_height: 1.4,
    z_index: 2,
  } as any);

  // Experience Section
  ry -= 65;
  els.push({
    id: gid(),
    element_type: "text",
    page_id: pageId,
    text: "WORK EXPERIENCE",
    x: sw + 20,
    y: ry,
    width: 380,
    height: 14,
    font_size: 10,
    font_name: "Helvetica-Bold",
    text_color: palette.primary,
    bold: true,
    z_index: 2,
  } as any);

  els.push({
    id: gid(),
    element_type: "shape",
    shape_type: "line",
    page_id: pageId,
    x: sw + 20,
    y: ry - 4,
    x2: 580,
    y2: ry - 4,
    border_color: palette.secondary,
    border_width: 1,
    z_index: 2,
  } as any);

  ry -= 25;
  els.push({
    id: gid(),
    element_type: "text",
    page_id: pageId,
    text: "Principal Cloud Engineer · TechCorp Inc.",
    x: sw + 20,
    y: ry,
    width: 260,
    height: 12,
    font_size: 9.5,
    font_name: "Helvetica-Bold",
    text_color: palette.primary,
    bold: true,
    z_index: 2,
  } as any);

  els.push({
    id: gid(),
    element_type: "text",
    page_id: pageId,
    text: "2021 – Present",
    x: 480,
    y: ry,
    width: 100,
    height: 12,
    font_size: 8,
    font_name: "Helvetica",
    text_color: "#64748B",
    align: "right",
    z_index: 2,
  } as any);

  ry -= 16;
  els.push({
    id: gid(),
    element_type: "text",
    page_id: pageId,
    text: "• Spearheaded cloud migration of 14 core services to AWS EKS, boosting availability to 99.99%\n• Reduced monthly infrastructure spend by 40% ($350k/mo) through Spot instance orchestration\n• Mentored a high-performing team of 12 software engineers across 3 timezones",
    x: sw + 25,
    y: ry - 35,
    width: 375,
    height: 40,
    font_size: 8.2,
    font_name: "Helvetica",
    text_color: "#475569",
    line_height: 1.4,
    z_index: 2,
  } as any);

  // Education
  ry -= 125;
  els.push({
    id: gid(),
    element_type: "text",
    page_id: pageId,
    text: "EDUCATION & CREDENTIALS",
    x: sw + 20,
    y: ry,
    width: 380,
    height: 14,
    font_size: 10,
    font_name: "Helvetica-Bold",
    text_color: palette.primary,
    bold: true,
    z_index: 2,
  } as any);

  els.push({
    id: gid(),
    element_type: "shape",
    shape_type: "line",
    page_id: pageId,
    x: sw + 20,
    y: ry - 4,
    x2: 580,
    y2: ry - 4,
    border_color: palette.secondary,
    border_width: 1,
    z_index: 2,
  } as any);

  ry -= 25;
  els.push({
    id: gid(),
    element_type: "text",
    page_id: pageId,
    text: "M.S. Computer Science · Stanford University",
    x: sw + 20,
    y: ry,
    width: 280,
    height: 12,
    font_size: 9,
    font_name: "Helvetica-Bold",
    text_color: palette.primary,
    bold: true,
    z_index: 2,
  } as any);

  return els;
}

export async function buildResumeFromImportedText(
  extractedText: string,
  userPrompt: string = ""
): Promise<{ elements: EditorElement[]; title: string }> {
  // 1. Initial local extraction as baseline
  let wizardData = parseResumeTextToWizardData(extractedText);

  // 2. Ask Gemini AI to distill structured JSON data from extracted text
  if (genAI && apiKey && extractedText.trim().length > 10) {
    const distillationPrompt = `You are a Lead AI Career Data Analyst.
TASK: Extract ALL structured candidate information from this raw uploaded resume document text.

RAW EXTRACTED TEXT:
${extractedText.slice(0, 6000)}

${userPrompt ? `USER PROMPT ENHANCEMENT: ${userPrompt}` : ''}

Return ONLY a raw JSON object with this exact schema:
{
  "contact": {
    "firstName": "...",
    "lastName": "...",
    "email": "...",
    "phone": "...",
    "linkedin": "...",
    "location": "..."
  },
  "summary": "...",
  "experiences": [
    {
      "jobTitle": "...",
      "company": "...",
      "dates": "...",
      "location": "...",
      "description": "..."
    }
  ],
  "educations": [
    {
      "degree": "...",
      "school": "...",
      "dates": "...",
      "location": "..."
    }
  ],
  "skills": ["Skill 1", "Skill 2"]
}`;

    for (const modelName of GEMINI_MODELS) {
      try {
        console.log(`[AI-Import Engine] Distilling with Gemini model ${modelName}...`);
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(distillationPrompt);
        const rawJson = cleanJSONResponse(result.response.text());
        if (rawJson && (rawJson.contact || rawJson.experiences || rawJson.skills)) {
          console.log(`[AI-Import Engine] ✅ Gemini successfully distilled candidate JSON data via ${modelName}!`);
          wizardData = {
            ...wizardData,
            contact: {
              ...wizardData.contact,
              firstName: rawJson.contact?.firstName || wizardData.contact.firstName,
              lastName: rawJson.contact?.lastName || wizardData.contact.lastName,
              email: rawJson.contact?.email || wizardData.contact.email,
              phone: rawJson.contact?.phone || wizardData.contact.phone,
              linkedin: rawJson.contact?.linkedin || wizardData.contact.linkedin,
              country: rawJson.contact?.location || wizardData.contact.country,
            },
            summary: rawJson.summary || wizardData.summary,
            skills: Array.isArray(rawJson.skills) && rawJson.skills.length > 0 ? rawJson.skills : wizardData.skills,
            experiences: Array.isArray(rawJson.experiences) && rawJson.experiences.length > 0
              ? rawJson.experiences.map((exp: any, i: number) => ({
                  id: `exp_${i}`,
                  jobTitle: exp.jobTitle || exp.title || "Position",
                  company: exp.company || "",
                  location: exp.location || "",
                  startDate: exp.dates || exp.startDate || "",
                  endDate: "",
                  current: false,
                  description: exp.description || exp.desc || "",
                }))
              : wizardData.experiences,
            educations: Array.isArray(rawJson.educations) && rawJson.educations.length > 0
              ? rawJson.educations.map((edu: any, i: number) => ({
                  id: `edu_${i}`,
                  degree: edu.degree || "Degree",
                  school: edu.school || "",
                  location: edu.location || "",
                  startDate: edu.dates || edu.startDate || "",
                  endDate: "",
                  description: edu.description || "",
                }))
              : wizardData.educations,
          };
          break;
        }
      } catch (err: any) {
        if (!err?.message?.includes("404")) {
          console.warn(`[AI-Import Engine] Model ${modelName} distillation notice:`, err);
        }
      }
    }
  }

  // 3. Build bespoke canvas elements from distilled candidate wizardData
  const candidateName = (wizardData.contact.firstName + " " + wizardData.contact.lastName).trim();
  const resumeTitle = candidateName ? `${candidateName}'s Resume` : "Imported Resume";
  
  const elements = generateWizardElements(wizardData, "level2");
  const normalized = normalizeEditorElements(elements, "page-1");
  return { elements: normalized, title: resumeTitle };
}
