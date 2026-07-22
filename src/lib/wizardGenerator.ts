import type { WizardData } from "../pages/WizardPage";
import type { EditorElement, TextElement, ShapeElement } from "../types/editor";

const generateId = () => Math.random().toString(36).substring(2, 9);

// ─── Canvas Constants ─────────────────────────────────────────────────────────
// The Editor canvas is 612×792 (US Letter at 72 DPI).
//
// CRITICAL: EditorCanvas.tsx positions every element using CSS `bottom`, NOT `top`.
//   → y=0   → bottom of page
//   → y=792 → top of page
//
// So to flow content top-to-bottom, we track `topOffset` (px from the TOP of the page)
// and convert using:
//   canvasY = PAGE_HEIGHT - topOffset - elementHeight
const PAGE_WIDTH  = 612;
const PAGE_HEIGHT = 792;
const MARGIN_X    = 40;   // left & right gutter
const MARGIN_TOP  = 40;   // distance from top to first element
const CONTENT_W   = PAGE_WIDTH - MARGIN_X * 2; // 532 px usable width

// Design tokens
const FONT  = "Inter";
const C_PRIMARY = "#1e293b";  // headings / name
const C_ACCENT  = "#475569";  // company / school
const C_MUTED   = "#64748b";  // dates / secondary
const C_BODY    = "#334155";  // body text / descriptions

// ─── Typography Math ──────────────────────────────────────────────────────────
// Estimates the rendered pixel height of a text block.
// Uses the industry-standard 0.55 avg character-width / fontSize ratio
// for proportional fonts like Inter/Roboto.
function estimateTextHeight(
  text: string,
  fontSize: number,
  availableWidth: number,
  lineHeight = 1.4
): number {
  if (!text || text.trim().length === 0) return Math.ceil(fontSize * lineHeight);
  const avgCharWidth  = fontSize * 0.55;
  const charsPerLine  = Math.max(1, Math.floor(availableWidth / avgCharWidth));
  const numLines      = Math.max(1, Math.ceil(text.length / charsPerLine));
  return Math.ceil(numLines * fontSize * lineHeight);
}

export type TemplateLevel = "level1" | "level2" | "level3" | "level4";

// ─── Generator ───────────────────────────────────────────────────────────────
export function generateWizardElements(data: WizardData, level: TemplateLevel = "level1"): EditorElement[] {
  const els: EditorElement[] = [];
  const fullName = `${data.contact.firstName || ""} ${data.contact.lastName || ""}`.trim() || "Your Name";

  // Cursor: distance in px from the TOP of the page.
  let top = MARGIN_TOP;

  // Convert top-relative cursor → canvas bottom-relative Y for an element
  // of the given pixel height.
  const toY = (elH: number) => PAGE_HEIGHT - top - elH;

  // ── Low-level helpers ──────────────────────────────────────────────────────
  /** Adds a TextElement and advances the cursor by the element's height. */
  const text = (
    content: string,
    fontSize: number,
    opts: {
      x?: number;
      width?: number;
      color?: string;
      bold?: boolean;
      italic?: boolean;
      align?: "left" | "center" | "right";
      lineHeight?: number;
      letterSpacing?: number;
    } = {}
  ) => {
    const w  = opts.width  ?? CONTENT_W;
    const lh = opts.lineHeight ?? 1.4;
    const h  = estimateTextHeight(content, fontSize, w, lh);
    const y  = toY(h);

    els.push({
      id: generateId(),
      element_type: "text",
      page_id: "page-1",
      text: content,
      x: opts.x ?? MARGIN_X,
      y,
      z_index: 1,
      font_size:      fontSize,
      font_name:      FONT,
      text_color:     opts.color         ?? C_BODY,
      bold:           opts.bold          ?? false,
      italic:         opts.italic        ?? false,
      align:          opts.align         ?? "left",
      width:          w,
      height:         h,
      line_height:    lh,
      letter_spacing: opts.letterSpacing ?? 0,
    } as TextElement);

    top += h;
    return h;
  };

  /** Adds a horizontal rule at the current cursor position (no height cost). */
  const hRule = (color = "#cbd5e1", strokeW = 1) => {
    const y = PAGE_HEIGHT - top;
    els.push({
      id: generateId(),
      element_type: "shape",
      shape_type: "line",
      page_id: "page-1",
      x: MARGIN_X, y,
      x2: PAGE_WIDTH - MARGIN_X, y2: y,
      z_index: 1,
      border_color: color,
      border_width: strokeW,
    } as ShapeElement);
  };

  /**
   * Adds a two-column row: primary text on the left, secondary (date) on the right.
   * Both are vertically aligned to the same Y.
   */
  const twoColRow = (
    leftText: string,
    leftFontSize: number,
    leftOpts: { color?: string; bold?: boolean; width?: number } = {},
    rightText?: string,
    rightFontSize = 8.5
  ) => {
    const rightColW = 115; // px reserved for the right date column
    const leftW     = leftOpts.width ?? (CONTENT_W - rightColW - 8);
    const lh        = 1.3;
    const h         = estimateTextHeight(leftText, leftFontSize, leftW, lh);
    const y         = toY(h);

    // Left column
    els.push({
      id: generateId(),
      element_type: "text",
      page_id: "page-1",
      text: leftText,
      x: MARGIN_X, y, z_index: 1,
      font_size:   leftFontSize,
      font_name:   FONT,
      text_color:  leftOpts.color ?? C_PRIMARY,
      bold:        leftOpts.bold  ?? false,
      width:       leftW,
      height:      h,
      line_height: lh,
    } as TextElement);

    // Right column (right-aligned, anchored to right margin)
    if (rightText) {
      const rh = estimateTextHeight(rightText, rightFontSize, rightColW, lh);
      els.push({
        id: generateId(),
        element_type: "text",
        page_id: "page-1",
        text: rightText,
        x: PAGE_WIDTH - MARGIN_X - rightColW,
        y, z_index: 1,
        font_size:  rightFontSize,
        font_name:  FONT,
        text_color: C_MUTED,
        align:      "right",
        width:      rightColW,
        height:     rh,
        line_height: lh,
      } as TextElement);
    }

    top += h;
  };

  /** Adds a section header with decorative rule. */
  const sectionHeader = (title: string, color = C_PRIMARY, align = "left", withRule = true) => {
    top += 8;   // gap above section
    text(title, 9.5, {
      color:         color,
      bold:          true,
      letterSpacing: 1.5,
      align:         align as any
    });
    top += 3;   // gap between text and rule
    if (withRule) {
      hRule("#94a3b8", 1);
      top += 9;   // gap below rule
    } else {
      top += 6;
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // LEVEL ROUTING
  // ═══════════════════════════════════════════════════════════════════════════

  if (level === "level2") {
    // LEVEL 2: MODERN (Sidebar Layout)
    const sidebarW = 195;
    
    // Sidebar background
    els.push({
      id: generateId(), element_type: "shape", shape_type: "rectangle", page_id: "page-1",
      x: 0, y: PAGE_HEIGHT, width: sidebarW, height: PAGE_HEIGHT,
      fill_color: "#F1F5F9", border_width: 0, z_index: 0
    });
    els.push({
      id: generateId(), element_type: "shape", shape_type: "rectangle", page_id: "page-1",
      x: 0, y: PAGE_HEIGHT, width: 8, height: PAGE_HEIGHT,
      fill_color: "#2563EB", border_width: 0, z_index: 0
    });

    // Sidebar Content (Left Column)
    let leftTop = MARGIN_TOP;
    const addLeftSection = (title: string) => {
      els.push({ id: generateId(), element_type: "text", page_id: "page-1", text: title, x: 18, y: PAGE_HEIGHT - leftTop - 12, width: sidebarW - 36, height: 12, font_size: 10, font_name: "Helvetica-Bold", text_color: "#0F172A", z_index: 1 });
      leftTop += 16;
      els.push({ id: generateId(), element_type: "shape", shape_type: "line", page_id: "page-1", x: 18, y: PAGE_HEIGHT - leftTop, x2: sidebarW - 18, y2: PAGE_HEIGHT - leftTop, border_color: "#2563EB", border_width: 1.5, z_index: 1 });
      leftTop += 6;
    };
    const addLeftText = (txt: string, isMuted = false, isBold = false) => {
      const h = estimateTextHeight(txt, 8.5, sidebarW - 36, 1.3);
      els.push({ id: generateId(), element_type: "text", page_id: "page-1", text: txt, x: 18, y: PAGE_HEIGHT - leftTop - h, width: sidebarW - 36, height: h, font_size: isMuted ? 8 : 8.5, font_name: isBold ? "Helvetica-Bold" : FONT, text_color: isMuted ? "#64748B" : "#334155", bold: isBold, z_index: 1 });
      leftTop += h + 2;
    };

    addLeftSection("CONTACT");
    addLeftText(`${data.contact.city || ""} ${data.contact.country || ""}`.trim());
    addLeftText(data.contact.phone);
    addLeftText(data.contact.email);
    addLeftText(data.contact.linkedin);
    leftTop += 10;

    if (data.educations.length > 0) {
      addLeftSection("EDUCATION");
      data.educations.forEach(edu => {
        addLeftText(edu.degree, false, true);
        addLeftText(edu.school);
        addLeftText(`${edu.startDate} - ${edu.endDate}`, true);
        leftTop += 8;
      });
    }

    if (data.skills.length > 0) {
      addLeftSection("SKILLS");
      data.skills.forEach(skill => {
        els.push({ id: generateId(), element_type: "shape", shape_type: "rectangle", page_id: "page-1", x: 18, y: PAGE_HEIGHT - leftTop - 16, width: sidebarW - 36, height: 16, fill_color: "#E2E8F0", border_width: 0, border_radius: 4, z_index: 1 });
        els.push({ id: generateId(), element_type: "text", page_id: "page-1", text: skill, x: 18, y: PAGE_HEIGHT - leftTop - 13, width: sidebarW - 36, height: 10, font_size: 7.5, font_name: "Helvetica-Bold", text_color: "#0F172A", align: "center", z_index: 2 });
        leftTop += 20;
      });
    }

    // Main Content (Right Column)
    top = MARGIN_TOP;
    const mainX = sidebarW + 15;
    const mainW = PAGE_WIDTH - mainX - 15;

    // Name & Title
    els.push({ id: generateId(), element_type: "text", page_id: "page-1", text: fullName, x: mainX, y: toY(24), width: mainW, height: 24, font_size: 22, font_name: "Helvetica-Bold", text_color: "#0F172A", bold: true, z_index: 1 });
    top += 28;
    els.push({ id: generateId(), element_type: "text", page_id: "page-1", text: (data.experiences[0]?.role || "PROFESSIONAL").toUpperCase(), x: mainX, y: toY(14), width: mainW, height: 14, font_size: 11, font_name: "Helvetica-Bold", text_color: "#2563EB", bold: true, z_index: 1 });
    top += 22;

    const addMainSection = (title: string) => {
      els.push({ id: generateId(), element_type: "text", page_id: "page-1", text: title, x: mainX, y: toY(14), width: mainW, height: 14, font_size: 11, font_name: "Helvetica-Bold", text_color: "#0F172A", bold: true, z_index: 1 });
      top += 16;
      els.push({ id: generateId(), element_type: "shape", shape_type: "line", page_id: "page-1", x: mainX, y: toY(0), x2: mainX + mainW, y2: toY(0), border_color: "#0F172A", border_width: 1, z_index: 1 });
      top += 8;
    };

    if (data.summary) {
      addMainSection("PROFILE SUMMARY");
      const h = estimateTextHeight(data.summary, 9, mainW, 1.4);
      els.push({ id: generateId(), element_type: "text", page_id: "page-1", text: data.summary, x: mainX, y: toY(h), width: mainW, height: h, font_size: 9, font_name: FONT, text_color: "#334155", line_height: 1.4, z_index: 1 });
      top += h + 12;
    }

    if (data.experiences.length > 0) {
      addMainSection("WORK EXPERIENCE");
      data.experiences.forEach(exp => {
        const titleH = estimateTextHeight(`${exp.role} | ${exp.company}`, 9, mainW - 120, 1.3);
        els.push({ id: generateId(), element_type: "text", page_id: "page-1", text: `${exp.role} | ${exp.company}`, x: mainX, y: toY(titleH), width: mainW - 120, height: titleH, font_size: 9, font_name: "Helvetica-Bold", text_color: "#334155", bold: true, z_index: 1 });
        els.push({ id: generateId(), element_type: "text", page_id: "page-1", text: `${exp.duration} | ${exp.location}`, x: mainX + mainW - 120, y: toY(titleH), width: 120, height: titleH, font_size: 9, font_name: FONT, text_color: "#64748B", align: "right", z_index: 1 });
        top += titleH + 4;
        
        const descH = estimateTextHeight(exp.description, 8.8, mainW, 1.4);
        els.push({ id: generateId(), element_type: "text", page_id: "page-1", text: exp.description, x: mainX + 8, y: toY(descH), width: mainW - 8, height: descH, font_size: 8.8, font_name: FONT, text_color: "#334155", line_height: 1.4, z_index: 1 });
        top += descH + 8;
      });
    }
    return els;
  }

  if (level === "level3") {
    // LEVEL 3: CREATIVE (Magical Layout)
    const sidebarW = 210;
    
    // Sidebar
    els.push({ id: generateId(), element_type: "shape", shape_type: "rectangle", page_id: "page-1", x: 0, y: PAGE_HEIGHT, width: sidebarW, height: PAGE_HEIGHT, fill_color: "#1E293B", border_width: 0, z_index: 0 });
    // Hero Banner
    els.push({ id: generateId(), element_type: "shape", shape_type: "rectangle", page_id: "page-1", x: sidebarW, y: PAGE_HEIGHT, width: PAGE_WIDTH - sidebarW, height: 110, fill_color: "#1E1B4B", border_width: 0, z_index: 0 });
    // Accents
    els.push({ id: generateId(), element_type: "shape", shape_type: "circle", page_id: "page-1", x: sidebarW, y: PAGE_HEIGHT, width: 36, height: 36, fill_color: "#6366F1", border_width: 0, z_index: 1 });
    els.push({ id: generateId(), element_type: "shape", shape_type: "circle", page_id: "page-1", x: sidebarW - 12, y: PAGE_HEIGHT - 85, width: 12, height: 12, fill_color: "#38BDF8", border_width: 0, z_index: 1 });
    els.push({ id: generateId(), element_type: "shape", shape_type: "rectangle", page_id: "page-1", x: sidebarW - 4, y: PAGE_HEIGHT, width: 4, height: PAGE_HEIGHT, fill_color: "#6366F1", border_width: 0, z_index: 2 });

    let leftTop = MARGIN_TOP;
    const addLeftSection = (title: string) => {
      els.push({ id: generateId(), element_type: "text", page_id: "page-1", text: title, x: 12, y: PAGE_HEIGHT - leftTop - 12, width: sidebarW - 24, height: 12, font_size: 10, font_name: "Helvetica-Bold", text_color: "#38BDF8", z_index: 1 });
      leftTop += 16;
      els.push({ id: generateId(), element_type: "shape", shape_type: "line", page_id: "page-1", x: 12, y: PAGE_HEIGHT - leftTop, x2: sidebarW - 12, y2: PAGE_HEIGHT - leftTop, border_color: "#6366F1", border_width: 1, z_index: 1 });
      leftTop += 8;
    };
    
    addLeftSection("CONTACT & LINKS");
    const contactTexts = [data.contact.phone, data.contact.email, data.contact.linkedin];
    contactTexts.forEach(txt => {
      if (!txt) return;
      els.push({ id: generateId(), element_type: "text", page_id: "page-1", text: txt, x: 12, y: PAGE_HEIGHT - leftTop - 12, width: sidebarW - 24, height: 12, font_size: 8.5, font_name: FONT, text_color: "#F8FAFC", z_index: 1 });
      leftTop += 15;
    });
    leftTop += 14;

    if (data.skills.length > 0) {
      addLeftSection("CORE PROFICIENCIES");
      data.skills.slice(0, 6).forEach((skill, i) => {
        // Skill Progress Bar
        const barW = 170;
        const level = 100 - (i * 5); // Fake proficiency levels
        els.push({ id: generateId(), element_type: "text", page_id: "page-1", text: skill, x: 12, y: PAGE_HEIGHT - leftTop - 10, width: barW, height: 10, font_size: 8.5, font_name: "Helvetica-Bold", text_color: "#F8FAFC", z_index: 1 });
        leftTop += 12;
        els.push({ id: generateId(), element_type: "shape", shape_type: "rectangle", page_id: "page-1", x: 12, y: PAGE_HEIGHT - leftTop - 5, width: barW, height: 5, fill_color: "#334155", border_width: 0, border_radius: 2, z_index: 1 });
        els.push({ id: generateId(), element_type: "shape", shape_type: "rectangle", page_id: "page-1", x: 12, y: PAGE_HEIGHT - leftTop - 5, width: barW * (level/100), height: 5, fill_color: "#38BDF8", border_width: 0, border_radius: 2, z_index: 2 });
        leftTop += 12;
      });
    }

    // Main Content
    const mainX = sidebarW + 20;
    const mainW = PAGE_WIDTH - mainX - 20;
    top = 30; // Within Hero Banner

    els.push({ id: generateId(), element_type: "text", page_id: "page-1", text: fullName, x: mainX, y: toY(24), width: mainW, height: 24, font_size: 22, font_name: "Helvetica-Bold", text_color: "#F8FAFC", bold: true, z_index: 1 });
    top += 28;
    els.push({ id: generateId(), element_type: "text", page_id: "page-1", text: (data.experiences[0]?.role || "PROFESSIONAL").toUpperCase(), x: mainX, y: toY(12), width: mainW, height: 12, font_size: 10, font_name: "Helvetica-Bold", text_color: "#38BDF8", bold: true, z_index: 1 });
    
    top = 130; // Jump below hero banner

    if (data.summary) {
      els.push({ id: generateId(), element_type: "text", page_id: "page-1", text: "EXECUTIVE PROFILE", x: mainX, y: toY(14), width: mainW, height: 14, font_size: 11, font_name: "Helvetica-Bold", text_color: "#6366F1", bold: true, z_index: 1 });
      top += 16;
      els.push({ id: generateId(), element_type: "shape", shape_type: "line", page_id: "page-1", x: mainX, y: toY(0), x2: mainX + mainW, y2: toY(0), border_color: "#6366F1", border_width: 1.5, z_index: 1 });
      top += 8;
      
      const h = estimateTextHeight(data.summary, 8.8, mainW, 1.4);
      els.push({ id: generateId(), element_type: "text", page_id: "page-1", text: data.summary, x: mainX, y: toY(h), width: mainW, height: h, font_size: 8.8, font_name: FONT, text_color: "#334155", line_height: 1.4, z_index: 1 });
      top += h + 12;
    }

    if (data.experiences.length > 0) {
      els.push({ id: generateId(), element_type: "text", page_id: "page-1", text: "ENGINEERING EXPERIENCE", x: mainX, y: toY(14), width: mainW, height: 14, font_size: 11, font_name: "Helvetica-Bold", text_color: "#6366F1", bold: true, z_index: 1 });
      top += 16;
      els.push({ id: generateId(), element_type: "shape", shape_type: "line", page_id: "page-1", x: mainX, y: toY(0), x2: mainX + mainW, y2: toY(0), border_color: "#6366F1", border_width: 1.5, z_index: 1 });
      top += 12;

      data.experiences.forEach(exp => {
        const titleH = estimateTextHeight(`${exp.role} | ${exp.company}`, 9, mainW - 100, 1.3);
        els.push({ id: generateId(), element_type: "text", page_id: "page-1", text: `${exp.role} | ${exp.company}`, x: mainX, y: toY(titleH), width: mainW - 100, height: titleH, font_size: 9, font_name: "Helvetica-Bold", text_color: "#334155", bold: true, z_index: 1 });
        els.push({ id: generateId(), element_type: "text", page_id: "page-1", text: `${exp.duration}`, x: mainX + mainW - 100, y: toY(titleH), width: 100, height: titleH, font_size: 9, font_name: FONT, text_color: "#94A3B8", align: "right", z_index: 1 });
        top += titleH + 4;
        
        const descH = estimateTextHeight(exp.description, 8.5, mainW, 1.4);
        els.push({ id: generateId(), element_type: "text", page_id: "page-1", text: exp.description, x: mainX + 8, y: toY(descH), width: mainW - 8, height: descH, font_size: 8.5, font_name: FONT, text_color: "#334155", line_height: 1.4, z_index: 1 });
        top += descH + 12;
      });
    }
    return els;
  }

  if (level === "level4") {
    // LEVEL 4: ULTIMATE (Bezier Wave + Radar Chart)
    const sidebarW = 205;
    
    // Backgrounds
    els.push({ id: generateId(), element_type: "shape", shape_type: "rectangle", page_id: "page-1", x: 0, y: PAGE_HEIGHT, width: sidebarW, height: PAGE_HEIGHT, fill_color: "#1E293B", border_width: 0, z_index: 0 });
    els.push({ id: generateId(), element_type: "shape", shape_type: "rectangle", page_id: "page-1", x: sidebarW, y: PAGE_HEIGHT, width: PAGE_WIDTH - sidebarW, height: 105, fill_color: "#0F172A", border_width: 0, z_index: 0 });
    
    // Bezier Wave
    els.push({ id: generateId(), element_type: "shape", shape_type: "path", page_id: "page-1", path_d: `M ${sidebarW} ${PAGE_HEIGHT - 105} C ${sidebarW + 80} ${PAGE_HEIGHT - 90} ${sidebarW + 140} ${PAGE_HEIGHT - 120} ${PAGE_WIDTH} ${PAGE_HEIGHT - 105} L ${PAGE_WIDTH} ${PAGE_HEIGHT} L ${sidebarW} ${PAGE_HEIGHT} Z`, x: 0, y: PAGE_HEIGHT, fill_color: "#6366F1", border_width: 0, z_index: 1 });

    let leftTop = MARGIN_TOP;
    const addLeftSection = (title: string) => {
      els.push({ id: generateId(), element_type: "text", page_id: "page-1", text: title, x: 10, y: PAGE_HEIGHT - leftTop - 12, width: sidebarW - 20, height: 12, font_size: 9.5, font_name: "Helvetica-Bold", text_color: "#38BDF8", z_index: 2 });
      leftTop += 14;
      els.push({ id: generateId(), element_type: "shape", shape_type: "line", page_id: "page-1", x: 10, y: PAGE_HEIGHT - leftTop, x2: sidebarW - 10, y2: PAGE_HEIGHT - leftTop, border_color: "#6366F1", border_width: 1, z_index: 2 });
      leftTop += 8;
    };

    addLeftSection("CONTACT & LINKS");
    const contactTexts = [data.contact.phone, data.contact.email, data.contact.linkedin];
    contactTexts.forEach(txt => {
      if (!txt) return;
      els.push({ id: generateId(), element_type: "text", page_id: "page-1", text: txt, x: 10, y: PAGE_HEIGHT - leftTop - 12, width: sidebarW - 20, height: 12, font_size: 8, font_name: FONT, text_color: "#F8FAFC", z_index: 2 });
      leftTop += 14;
    });
    leftTop += 10;

    if (data.skills.length >= 3) {
      addLeftSection("SKILL MATRIX ANALYSIS");
      const centerX = sidebarW / 2;
      const centerY = PAGE_HEIGHT - leftTop - 50;
      const radius = 38;
      
      const skills = data.skills.slice(0, 6);
      const points = [];
      const gridPoints = [];
      
      for (let i = 0; i < skills.length; i++) {
        const angle = i * (2 * Math.PI / skills.length) - (Math.PI / 2);
        const val = 0.7 + (Math.random() * 0.3); // Fake skill level
        points.push(centerX + radius * val * Math.cos(angle));
        points.push(centerY + radius * val * Math.sin(angle));
        gridPoints.push(centerX + radius * Math.cos(angle));
        gridPoints.push(centerY + radius * Math.sin(angle));
        
        els.push({ id: generateId(), element_type: "text", page_id: "page-1", text: skills[i], x: centerX + (radius+15)*Math.cos(angle) - 15, y: centerY + (radius+15)*Math.sin(angle) - 5, width: 30, height: 10, font_size: 6.5, font_name: "Helvetica-Bold", text_color: "#F8FAFC", align: "center", z_index: 3 });
      }
      
      els.push({ id: generateId(), element_type: "shape", shape_type: "polygon", page_id: "page-1", points: gridPoints, fill_color: "transparent", border_color: "#334155", border_width: 0.5, x: 0, y: PAGE_HEIGHT, z_index: 2 });
      els.push({ id: generateId(), element_type: "shape", shape_type: "polygon", page_id: "page-1", points, fill_color: "#38BDF844", border_color: "#38BDF8", border_width: 1.5, x: 0, y: PAGE_HEIGHT, z_index: 3 });
      leftTop += 120;
    }

    // Main Content
    const mainX = sidebarW + 20;
    const mainW = PAGE_WIDTH - mainX - 20;
    top = 25;

    els.push({ id: generateId(), element_type: "text", page_id: "page-1", text: fullName, x: mainX, y: toY(22), width: mainW, height: 22, font_size: 20, font_name: "Helvetica-Bold", text_color: "#F8FAFC", bold: true, z_index: 2 });
    top += 26;
    els.push({ id: generateId(), element_type: "text", page_id: "page-1", text: (data.experiences[0]?.role || "PROFESSIONAL").toUpperCase(), x: mainX, y: toY(12), width: mainW, height: 12, font_size: 9.5, font_name: "Helvetica-Bold", text_color: "#38BDF8", bold: true, z_index: 2 });
    
    top = 130;

    if (data.summary) {
      els.push({ id: generateId(), element_type: "text", page_id: "page-1", text: "PROFILE SUMMARY", x: mainX, y: toY(12), width: mainW, height: 12, font_size: 10.5, font_name: "Helvetica-Bold", text_color: "#6366F1", bold: true, z_index: 2 });
      top += 14;
      els.push({ id: generateId(), element_type: "shape", shape_type: "line", page_id: "page-1", x: mainX, y: toY(0), x2: mainX + mainW, y2: toY(0), border_color: "#6366F1", border_width: 1.2, z_index: 2 });
      top += 8;
      
      const h = estimateTextHeight(data.summary, 8.5, mainW, 1.4);
      els.push({ id: generateId(), element_type: "text", page_id: "page-1", text: data.summary, x: mainX, y: toY(h), width: mainW, height: h, font_size: 8.5, font_name: FONT, text_color: "#334155", line_height: 1.4, z_index: 2 });
      top += h + 12;
    }

    if (data.experiences.length > 0) {
      els.push({ id: generateId(), element_type: "text", page_id: "page-1", text: "ENGINEERING EXPERIENCE", x: mainX, y: toY(12), width: mainW, height: 12, font_size: 10.5, font_name: "Helvetica-Bold", text_color: "#6366F1", bold: true, z_index: 2 });
      top += 14;
      els.push({ id: generateId(), element_type: "shape", shape_type: "line", page_id: "page-1", x: mainX, y: toY(0), x2: mainX + mainW, y2: toY(0), border_color: "#6366F1", border_width: 1.2, z_index: 2 });
      top += 10;

      data.experiences.forEach(exp => {
        const titleH = estimateTextHeight(`${exp.role} | ${exp.company}`, 9, mainW - 100, 1.3);
        els.push({ id: generateId(), element_type: "text", page_id: "page-1", text: `${exp.role} | ${exp.company}`, x: mainX, y: toY(titleH), width: mainW - 100, height: titleH, font_size: 9, font_name: "Helvetica-Bold", text_color: "#334155", bold: true, z_index: 2 });
        els.push({ id: generateId(), element_type: "text", page_id: "page-1", text: `${exp.duration}`, x: mainX + mainW - 100, y: toY(titleH), width: 100, height: titleH, font_size: 9, font_name: FONT, text_color: "#94A3B8", align: "right", z_index: 2 });
        top += titleH + 4;
        
        const descH = estimateTextHeight(exp.description, 8.2, mainW, 1.4);
        els.push({ id: generateId(), element_type: "text", page_id: "page-1", text: exp.description, x: mainX + 8, y: toY(descH), width: mainW - 8, height: descH, font_size: 8.2, font_name: FONT, text_color: "#334155", line_height: 1.4, z_index: 2 });
        top += descH + 10;
      });
    }

    return els;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // LEVEL 1: BASIC (Default)
  // ═══════════════════════════════════════════════════════════════════════════

  text(fullName, 20, {
    x:     MARGIN_X,
    width: CONTENT_W,
    align: "center",
    color: "#1A2B4C",
    bold:  true,
    lineHeight: 1.2,
  });
  top += 6;

  const contactParts = [
    data.contact.email,
    data.contact.phone,
    [data.contact.state, data.contact.country].filter(Boolean).join(", "),
    data.contact.linkedin,
    data.contact.website,
  ].filter(Boolean);

  if (contactParts.length > 0) {
    text(contactParts.join("  ·  "), 8, {
      x:     MARGIN_X,
      width: CONTENT_W,
      align: "center",
      color: C_MUTED,
      lineHeight: 1.3,
    });
    top += 10;
  } else {
    top += 4;
  }

  hRule("#94a3b8", 1);
  top += 16;

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 2 – PROFESSIONAL SUMMARY
  // ═══════════════════════════════════════════════════════════════════════════
  if (data.summary && data.summary.trim()) {
    sectionHeader("PROFESSIONAL SUMMARY");
    text(data.summary, 9, {
      color:      C_BODY,
      width:      CONTENT_W,
      lineHeight: 1.55,
    });
    top += 4;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 3 – EXPERIENCE
  // ═══════════════════════════════════════════════════════════════════════════
  const validExps = (data.experiences || []).filter(e => e.role || e.company);
  if (validExps.length > 0) {
    sectionHeader("EXPERIENCE");

    for (const exp of validExps) {
      // Row: Job title (left) + Duration (right)
      twoColRow(
        exp.role    || "Role",
        10,
        { color: C_PRIMARY, bold: true },
        exp.duration || undefined,
        8.5
      );
      top += 2;

      // Company + location
      if (exp.company) {
        text(
          exp.company + (exp.location ? `  ·  ${exp.location}` : ""),
          9,
          { color: C_ACCENT, bold: true, lineHeight: 1.3 }
        );
        top += 3;
      }

      // Description
      if (exp.description && exp.description.trim()) {
        text(exp.description, 9, {
          color:      C_BODY,
          width:      CONTENT_W,
          lineHeight: 1.5,
        });
      }

      top += 10; // gap between jobs
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 4 – EDUCATION
  // ═══════════════════════════════════════════════════════════════════════════
  const validEdus = (data.educations || []).filter(e => e.degree || e.school);
  if (validEdus.length > 0) {
    sectionHeader("EDUCATION");

    for (const edu of validEdus) {
      const dates = [edu.startDate, edu.endDate].filter(Boolean).join(" – ");

      // Row: Degree (left) + Dates (right)
      twoColRow(
        edu.degree || "Degree",
        10,
        { color: C_PRIMARY, bold: true },
        dates || undefined,
        8.5
      );
      top += 2;

      // School
      if (edu.school) {
        text(edu.school, 9, { color: C_ACCENT, lineHeight: 1.3 });
        top += 2;
      }

      // GPA / note
      const note = [edu.gpa ? `GPA: ${edu.gpa}` : "", edu.note]
        .filter(Boolean)
        .join("  ·  ");
      if (note) {
        text(note, 8, { color: C_MUTED, lineHeight: 1.3 });
        top += 2;
      }

      top += 8;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 5 – SKILLS
  // ═══════════════════════════════════════════════════════════════════════════
  const validSkills = (data.skills || []).filter(Boolean);
  if (validSkills.length > 0) {
    sectionHeader("SKILLS");
    text(validSkills.join("  ·  "), 9, {
      color:      C_BODY,
      width:      CONTENT_W,
      lineHeight: 1.6,
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 6 – ADDITIONAL (languages, certificates, awards)
  // ═══════════════════════════════════════════════════════════════════════════
  const { languages, certificates, awards, extracurriculars, other } =
    data.additional || {};

  const hasAdditional =
    (languages && languages.length > 0) ||
    certificates?.trim() ||
    awards?.trim() ||
    extracurriculars?.trim() ||
    other?.trim();

  if (hasAdditional) {
    sectionHeader("ADDITIONAL");

    if (languages && languages.length > 0) {
      const langStr = languages
        .map(l => `${l.language} (${l.proficiency})`)
        .join("  ·  ");
      text(`Languages: ${langStr}`, 9, { color: C_BODY, lineHeight: 1.4 });
      top += 3;
    }
    if (certificates?.trim()) {
      text(`Certifications: ${certificates}`, 9, { color: C_BODY, lineHeight: 1.4 });
      top += 3;
    }
    if (awards?.trim()) {
      text(`Awards: ${awards}`, 9, { color: C_BODY, lineHeight: 1.4 });
      top += 3;
    }
    if (extracurriculars?.trim()) {
      text(`Activities: ${extracurriculars}`, 9, { color: C_BODY, lineHeight: 1.4 });
      top += 3;
    }
    if (other?.trim()) {
      text(other, 9, { color: C_BODY, lineHeight: 1.4 });
    }
  }

  return els;
}
