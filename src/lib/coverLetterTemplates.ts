export interface CoverLetterTemplate {
  id: string;
  name: string;
  category: "modern" | "executive" | "minimal" | "creative" | "academic";
  description: string;
  bg_color: string;
  header_bg: string;
  accent_color: string;
  text_color: string;
  font_family: string;
  layout: "top_banner" | "left_sidebar" | "minimal_header" | "centered_classic" | "dual_tone" | "brutalist";
  badge: string;
  isPremium: boolean;
}

export const COVER_LETTER_TEMPLATES: CoverLetterTemplate[] = [
  {
    id: "modern_executive",
    name: "Modern Executive",
    category: "executive",
    description: "Dark navy header banner with sleek indigo accent line. Executive & corporate look.",
    bg_color: "#ffffff",
    header_bg: "#0f172a",
    accent_color: "#6366f1",
    text_color: "#334155",
    font_family: "Inter",
    layout: "top_banner",
    badge: "PRO",
    isPremium: true
  },
  {
    id: "slate_minimalist",
    name: "Slate Minimalist",
    category: "minimal",
    description: "Clean slate header bar with subtle borders and balanced typography.",
    bg_color: "#ffffff",
    header_bg: "#334155",
    accent_color: "#0284c7",
    text_color: "#475569",
    font_family: "Open Sans",
    layout: "minimal_header",
    badge: "FREE",
    isPremium: false
  },
  {
    id: "emerald_pro",
    name: "Emerald Professional",
    category: "executive",
    description: "Rich emerald header with mint green accent line. High authority & prestige.",
    bg_color: "#ffffff",
    header_bg: "#065f46",
    accent_color: "#10b981",
    text_color: "#1f2937",
    font_family: "Roboto",
    layout: "top_banner",
    badge: "PRO",
    isPremium: true
  },
  {
    id: "crimson_leadership",
    name: "Crimson Leadership",
    category: "executive",
    description: "Deep burgundy crimson header with rose accent line. Powerful & bold.",
    bg_color: "#ffffff",
    header_bg: "#881337",
    accent_color: "#f43f5e",
    text_color: "#334155",
    font_family: "Montserrat",
    layout: "top_banner",
    badge: "PRO",
    isPremium: true
  },
  {
    id: "corporate_hierarchy",
    name: "Corporate Hierarchy",
    category: "executive",
    description: "Classic blue double header with traditional serif headers and formal layout.",
    bg_color: "#ffffff",
    header_bg: "#1e3a8a",
    accent_color: "#3b82f6",
    text_color: "#1e293b",
    font_family: "Times New Roman",
    layout: "centered_classic",
    badge: "FREE",
    isPremium: false
  },
  {
    id: "tech_neon_coder",
    name: "Tech Neon Coder",
    category: "creative",
    description: "Dark obsidian theme with vibrant cyan accents and monospace typography.",
    bg_color: "#090d16",
    header_bg: "#06b6d4",
    accent_color: "#22d3ee",
    text_color: "#e2e8f0",
    font_family: "Roboto Mono",
    layout: "dual_tone",
    badge: "PRO",
    isPremium: true
  },
  {
    id: "elegant_scholar",
    name: "Elegant Scholar",
    category: "academic",
    description: "Classic ivory paper tone with Playfair Display serif headers and gold accent.",
    bg_color: "#fdfbf7",
    header_bg: "#451a03",
    accent_color: "#b45309",
    text_color: "#292524",
    font_family: "Playfair Display",
    layout: "centered_classic",
    badge: "PRO",
    isPremium: true
  },
  {
    id: "geometric_tech",
    name: "Geometric Tech",
    category: "modern",
    description: "Angular header geometric block with crisp indigo text and modern layout.",
    bg_color: "#ffffff",
    header_bg: "#4f46e5",
    accent_color: "#818cf8",
    text_color: "#334155",
    font_family: "Inter",
    layout: "top_banner",
    badge: "PRO",
    isPremium: true
  },
  {
    id: "midnight_obsidian",
    name: "Midnight Obsidian",
    category: "creative",
    description: "Sleek dark mode cover letter with teal highlights and crisp white body text.",
    bg_color: "#0f172a",
    header_bg: "#1e293b",
    accent_color: "#14b8a6",
    text_color: "#f8fafc",
    font_family: "Inter",
    layout: "top_banner",
    badge: "PRO",
    isPremium: true
  },
  {
    id: "rose_gold",
    name: "Rose Gold Deluxe",
    category: "creative",
    description: "Warm rose gold banner with elegant typography and subtle pink dividers.",
    bg_color: "#ffffff",
    header_bg: "#9f1239",
    accent_color: "#f43f5e",
    text_color: "#475569",
    font_family: "Montserrat",
    layout: "top_banner",
    badge: "PRO",
    isPremium: true
  },
  {
    id: "vibrant_dual_tone",
    name: "Vibrant Dual Tone",
    category: "modern",
    description: "Dual-tone royal blue split header with high-visibility title badges.",
    bg_color: "#ffffff",
    header_bg: "#2563eb",
    accent_color: "#60a5fa",
    text_color: "#1e293b",
    font_family: "Inter",
    layout: "dual_tone",
    badge: "PRO",
    isPremium: true
  },
  {
    id: "nordic_clean",
    name: "Nordic Clean",
    category: "minimal",
    description: "Scandinavian minimalist layout with generous spacing and thin rules.",
    bg_color: "#f8fafc",
    header_bg: "#0f172a",
    accent_color: "#64748b",
    text_color: "#334155",
    font_family: "Lato",
    layout: "minimal_header",
    badge: "FREE",
    isPremium: false
  },
  {
    id: "solar_flare",
    name: "Solar Flare",
    category: "creative",
    description: "Warm amber & orange header banner with high energy typography.",
    bg_color: "#ffffff",
    header_bg: "#b45309",
    accent_color: "#f97316",
    text_color: "#1c1917",
    font_family: "Open Sans",
    layout: "top_banner",
    badge: "PRO",
    isPremium: true
  },
  {
    id: "indigo_horizon",
    name: "Indigo Horizon",
    category: "modern",
    description: "Deep indigo top band with violet accent line and clean body text.",
    bg_color: "#ffffff",
    header_bg: "#3730a3",
    accent_color: "#8b5cf6",
    text_color: "#334155",
    font_family: "Inter",
    layout: "top_banner",
    badge: "PRO",
    isPremium: true
  },
  {
    id: "stark_brutalist",
    name: "Stark Brutalist",
    category: "minimal",
    description: "High contrast thick borders, bold typography, and sharp structural layout.",
    bg_color: "#ffffff",
    header_bg: "#000000",
    accent_color: "#000000",
    text_color: "#000000",
    font_family: "Oswald",
    layout: "brutalist",
    badge: "PRO",
    isPremium: true
  }
];

export function buildCoverLetterCanvasElements(
  docTitle: string,
  rawText: string,
  templateId: string = "slate_minimalist"
): any[] {
  const tmpl = COVER_LETTER_TEMPLATES.find((t) => t.id === templateId) || COVER_LETTER_TEMPLATES[0];
  const elements: any[] = [];

  // Canvas Dimensions: 612 x 792 pts. y=792 is TOP, y=0 is BOTTOM.

  // 1. Page Background Shape (for dark mode or custom background)
  if (tmpl.bg_color !== "#ffffff") {
    elements.push({
      id: `bg_shape_${Date.now()}`,
      element_type: "shape",
      shape_type: "rectangle",
      x: 0,
      y: 0,
      width: 612,
      height: 792,
      fill_color: tmpl.bg_color,
      border_color: tmpl.bg_color,
      border_width: 0,
      border_radius: 0,
      z_index: 0,
      page_id: "page-1",
    });
  }

  // 2. Header Layout Elements based on Template Style
  if (tmpl.layout === "top_banner" || tmpl.layout === "dual_tone") {
    // Header Banner
    elements.push({
      id: `shape_banner_${Date.now()}`,
      element_type: "shape",
      shape_type: "rectangle",
      x: 0,
      y: 708,
      width: 612,
      height: 84,
      fill_color: tmpl.header_bg,
      border_color: tmpl.header_bg,
      border_width: 0,
      border_radius: 0,
      z_index: 1,
      page_id: "page-1",
    });

    // Accent Stripe
    elements.push({
      id: `shape_stripe_${Date.now()}`,
      element_type: "shape",
      shape_type: "rectangle",
      x: 0,
      y: 704,
      width: 612,
      height: 4,
      fill_color: tmpl.accent_color,
      border_color: tmpl.accent_color,
      border_width: 0,
      border_radius: 0,
      z_index: 2,
      page_id: "page-1",
    });

    // Document Title
    const cleanTitle = docTitle.replace(/#|\*/g, "").trim().toUpperCase();
    elements.push({
      id: `txt_title_${Date.now()}`,
      element_type: "text",
      text: cleanTitle || "CAREER COVER LETTER",
      x: 40,
      y: 745,
      width: 532,
      height: 28,
      font_size: 18,
      font_name: tmpl.font_family,
      text_color: "#ffffff",
      bold: true,
      italic: false,
      underline: false,
      align: "left",
      z_index: 3,
      page_id: "page-1",
    });

    // Subtitle / Date Pill
    const dateStr = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
    elements.push({
      id: `txt_date_${Date.now()}`,
      element_type: "text",
      text: `ResuMagic Career Suite • ${dateStr}`,
      x: 40,
      y: 722,
      width: 532,
      height: 16,
      font_size: 10,
      font_name: tmpl.font_family,
      text_color: tmpl.accent_color,
      bold: false,
      italic: false,
      underline: false,
      align: "left",
      z_index: 4,
      page_id: "page-1",
    });
  } else if (tmpl.layout === "brutalist") {
    // Brutalist Outer Border
    elements.push({
      id: `shape_border_${Date.now()}`,
      element_type: "shape",
      shape_type: "rectangle",
      x: 20,
      y: 20,
      width: 572,
      height: 752,
      fill_color: "transparent",
      border_color: "#000000",
      border_width: 3,
      border_radius: 0,
      z_index: 1,
      page_id: "page-1",
    });

    // Brutalist Top Title Box
    elements.push({
      id: `shape_banner_${Date.now()}`,
      element_type: "shape",
      shape_type: "rectangle",
      x: 20,
      y: 722,
      width: 572,
      height: 50,
      fill_color: "#000000",
      border_color: "#000000",
      border_width: 0,
      border_radius: 0,
      z_index: 2,
      page_id: "page-1",
    });

    elements.push({
      id: `txt_title_${Date.now()}`,
      element_type: "text",
      text: docTitle.replace(/#|\*/g, "").trim().toUpperCase(),
      x: 40,
      y: 735,
      width: 532,
      height: 24,
      font_size: 16,
      font_name: tmpl.font_family,
      text_color: "#ffffff",
      bold: true,
      italic: false,
      underline: false,
      align: "left",
      z_index: 3,
      page_id: "page-1",
    });
  } else {
    // Minimal Header / Centered Classic
    const cleanTitle = docTitle.replace(/#|\*/g, "").trim().toUpperCase();
    elements.push({
      id: `txt_title_${Date.now()}`,
      element_type: "text",
      text: cleanTitle || "CAREER COVER LETTER",
      x: 40,
      y: 735,
      width: 532,
      height: 28,
      font_size: 20,
      font_name: tmpl.font_family,
      text_color: tmpl.header_bg,
      bold: true,
      italic: false,
      underline: false,
      align: tmpl.layout === "centered_classic" ? "center" : "left",
      z_index: 3,
      page_id: "page-1",
    });

    // Divider Line
    elements.push({
      id: `shape_stripe_${Date.now()}`,
      element_type: "shape",
      shape_type: "rectangle",
      x: 40,
      y: 720,
      width: 532,
      height: 2,
      fill_color: tmpl.accent_color,
      border_color: tmpl.accent_color,
      border_width: 0,
      border_radius: 0,
      z_index: 2,
      page_id: "page-1",
    });
  }

  // 3. Process Body Text Paragraphs
  const rawParagraphs = rawText
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  let currentY = 665; // Start below header banner (704 - 39 = 665)

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
      font_name: tmpl.font_family,
      text_color: isHeading ? tmpl.header_bg : tmpl.text_color,
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
