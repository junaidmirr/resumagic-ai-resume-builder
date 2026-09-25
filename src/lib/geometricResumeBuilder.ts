import type { EditorElement, TextElement, ShapeElement, ImageElement } from "../types/editor";
import type { WizardData } from "../pages/WizardPage";

export const PAGE_WIDTH = 612;
export const PAGE_HEIGHT = 792;
export const MARGIN_X = 40;
export const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_X * 2; // 532 pt

export const DEFAULT_QR_PNG =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAHgAAAB4CAYAAAA5ZDbSAAAAAklEQVR4AewaftIAAAOjSURBVO3BW27sOgLAQFLw/rfMOZ+CEMRxT+dxBVXZPxzbGhxbGxxbGxxbGxxbu/iAym+pmKncqXiFyqziHVR+S8VscGxtcGxtcGzt4gsqvovKUxVPqbyDyqziTsV3UfnM4Nja4Nja4Nja4NjaxYtUnqp4qmKlMqu4U7FSuaPyHVSeqnhqcGxtcGxtcGzt4o9TWVXMVFYVM5U7Kncq/ksGx9YGx9YGx9YGx9Yu/riKlcpTFXdU7qjMKv6ywbG1wbG1wbG1ixdV/BUVr1CZVfyUip8wOLY2OLY2OLY2OLZ28QUqv0VlVTFTWVXMVFYVM5VVxUxlVnFH5bcMjq0Njq0Njq3ZP/xhKquKOyp3KnY3OLY2OLY2OLZ28QGVWcVK5U7FTOWpineouKPyVMVKZVZxR2VVMVO5UzEbHFsbHFsbHFsbHFu7+AKVVcVTFXdUZiqvqJiprCruVMxU7lTMVFYVs4pXVHxmcGxtcGxtcGzt4gMVM5WVyqxipTKrWKnMKmYq/3UV71Dx1ODY2uDY2uDY2uDY2sUHVJ5SWVXMVFYVM5VZxR2VV6jMKlYqs4qZyqpiprKqmKncqXhqcGxtcGxtcGzt4gsqViqzipXKrGKlMquYqdypeAeVd1C5ozKrWKnMVO5UzAbH1gbH1gbH1gbH1i4+UHGnYqayqpiprCqeqpipvKLijspMZVaxUnmHijsqnxkcWxscWxscW7v4ApVXqMwqVio/oWKlMqtYVTxVcUfljsqdis8Mjq0Njq0Njq0Njq1dfEBlVvFdKmYqs4rvUnFHZVYxU1lVzFReUXFHZVYxGxxbGxxbGxxbs3/4RSqzijsqdypmKquKmcqqYqbyl1XMBsfWBsfWBsfWLn5ZxWdU7lTcqbhT8VTFK1RmFSuVWcVK5TODY2uDY2uDY2uDY2sXH1D5LRU/ReVOxVMqs4p3UHlqcGxtcGxtcGzt4gsqvovKd1CZVbxC5amKd6j4fw2OrQ2OrQ2OrQ2OrV28SOWpiqcqViozlVXFO1TMVGYq76CyqpiprCo+Mzi2Nji2Nji2dvHHqawqZiqvqHiqYqZyp2KlckfljsqsYjY4tjY4tjY4tjY4tnbxH6Qyq3gHlacqVipPVaxU7lR8ZnBsbXBsbXBs7eJFFT+hYqUyU/kuFZ9RWVV8h4qnBsfWBsfWBsfWBsfWLr5A5beo3KlYqcwqforKUyp3VO5UzAbH1gbH1gbH1uwfjm0Njq0Njq0Njq39DyNVnQ4/1URVAAAAAElFTkSuQmCC";

export interface ParsedCandidateData {
  name: string;
  headline?: string;
  email?: string;
  phone?: string;
  location?: string;
  linkedin?: string;
  github?: string;
  website?: string;
  summary?: string;
  experiences: {
    role: string;
    company: string;
    duration?: string;
    location?: string;
    bullets: string[];
  }[];
  educations: {
    degree: string;
    school: string;
    year?: string;
    gpa?: string;
    details?: string;
  }[];
  skills: {
    name: string;
    level?: number; // 0.60 to 0.98 for visual loaders
    category?: string;
  }[];
  projects?: {
    name: string;
    tech?: string;
    description: string;
    link?: string;
  }[];
  certifications?: string[];
}

/**
 * Estimates text height based on font size, container width, and line wrapping.
 */
export function estimateTextHeight(
  text: string,
  fontSize: number,
  availableWidth: number,
  lineHeight: number = 1.35,
): number {
  if (!text || text.trim().length === 0) return Math.ceil(fontSize * lineHeight);
  // Average character width for proportional sans-serif fonts is ~0.52 to 0.55 * fontSize
  const avgCharWidth = fontSize * 0.52;
  const charsPerLine = Math.max(12, Math.floor(availableWidth / avgCharWidth));

  // Split on manual line breaks first
  const manualLines = text.split("\n");
  let totalLines = 0;
  for (const line of manualLines) {
    const trimmed = line.trim();
    if (trimmed.length === 0) {
      totalLines += 0.5;
    } else {
      totalLines += Math.max(1, Math.ceil(trimmed.length / charsPerLine));
    }
  }

  return Math.ceil(Math.max(1, totalLines) * fontSize * lineHeight);
}

const gid = () => `el_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

/**
 * Converts WizardData into ParsedCandidateData for unified geometric building.
 */
export function wizardDataToCandidateData(w: WizardData): ParsedCandidateData {
  const name = `${w.contact.firstName || ""} ${w.contact.lastName || ""}`.trim() || "Alex Mercer";
  const location = [w.contact.state, w.contact.country].filter(Boolean).join(", ");

  const experiences = (w.experiences || []).map((exp) => {
    const rawDesc = exp.description || "";
    const rawBullets = rawDesc
      .split(/\n|•|;|(?<=\.)\s+(?=[A-Z])/)
      .map((b) => b.trim())
      .filter((b) => b.length > 5);

    return {
      role: exp.role || (exp as any).jobTitle || "Professional",
      company: exp.company || "",
      duration: exp.duration || (exp as any).startDate ? `${(exp as any).startDate || ""} - ${(exp as any).endDate || "Present"}` : "",
      location: exp.location || "",
      bullets: rawBullets.length > 0 ? rawBullets : [rawDesc.trim() || "Delivered key engineering milestones and collaborated with cross-functional partners."],
    };
  });

  const educations = (w.educations || []).map((edu) => ({
    degree: edu.degree || "Bachelor of Science",
    school: edu.school || "University",
    year: edu.endDate ? `${edu.startDate ? edu.startDate + " - " : ""}${edu.endDate}` : (edu as any).duration || "",
    gpa: edu.gpa || "",
    details: edu.note || "",
  }));

  const skills = (w.skills || []).map((s, idx) => {
    // Generate realistic proficiency percentages (80% - 95%)
    const pct = Math.min(0.98, Math.max(0.75, 0.95 - (idx % 5) * 0.04));
    return { name: s, level: pct };
  });

  const headline = experiences[0]?.role || "Senior Professional";

  return {
    name,
    headline,
    email: w.contact.email,
    phone: w.contact.phone,
    location,
    linkedin: w.contact.linkedin,
    website: w.contact.website,
    summary: w.summary,
    experiences,
    educations,
    skills,
    certifications: w.additional?.certificates ? [w.additional.certificates] : [],
  };
}

/**
 * Builds an Executive Single-Column Geometrically Balanced Resume.
 */
export function buildExecutiveLayout(data: ParsedCandidateData, palette = {
  primary: "#0F172A",
  secondary: "#2563EB",
  accent: "#CBD5E1",
  text: "#334155",
  muted: "#64748B",
}): EditorElement[] {
  const els: EditorElement[] = [];
  const pageId = "page-1";
  let top = 40; // distance from top margin in pt

  const toY = (h: number) => Math.round(PAGE_HEIGHT - top - h);

  // 1. Candidate Name (Centered)
  const nameH = 28;
  els.push({
    id: gid(),
    element_type: "text",
    page_id: pageId,
    text: (data.name || "CANDIDATE NAME").toUpperCase(),
    x: MARGIN_X,
    y: toY(nameH),
    width: CONTENT_WIDTH,
    height: nameH,
    font_size: 22,
    font_name: "Helvetica-Bold",
    text_color: palette.primary,
    bold: true,
    align: "center",
    letter_spacing: 1.2,
    z_index: 2,
  } as TextElement);
  top += nameH + 4;

  // 2. Headline / Target Role
  if (data.headline) {
    const headH = 16;
    els.push({
      id: gid(),
      element_type: "text",
      page_id: pageId,
      text: data.headline,
      x: MARGIN_X,
      y: toY(headH),
      width: CONTENT_WIDTH,
      height: headH,
      font_size: 11,
      font_name: "Helvetica-Bold",
      text_color: palette.secondary,
      bold: true,
      align: "center",
      letter_spacing: 0.8,
      z_index: 2,
    } as TextElement);
    top += headH + 6;
  }

  // 3. Contact Details Row (Phone • Email • Location • LinkedIn)
  const contactParts = [
    data.phone,
    data.email,
    data.location,
    data.linkedin,
    data.website || data.github,
  ].filter(Boolean);

  if (contactParts.length > 0) {
    const contactText = contactParts.join("   •   ");
    const contactH = estimateTextHeight(contactText, 8.5, CONTENT_WIDTH, 1.3);
    els.push({
      id: gid(),
      element_type: "text",
      page_id: pageId,
      text: contactText,
      x: MARGIN_X,
      y: toY(contactH),
      width: CONTENT_WIDTH,
      height: contactH,
      font_size: 8.5,
      font_name: "Helvetica",
      text_color: palette.muted,
      align: "center",
      z_index: 2,
    } as TextElement);
    top += contactH + 10;
  }

  // Header Divider Line
  els.push({
    id: gid(),
    element_type: "shape",
    shape_type: "line",
    page_id: pageId,
    x: MARGIN_X,
    y: Math.round(PAGE_HEIGHT - top),
    x2: PAGE_WIDTH - MARGIN_X,
    y2: Math.round(PAGE_HEIGHT - top),
    border_color: palette.secondary,
    border_width: 1.5,
    z_index: 1,
  } as ShapeElement);
  top += 12;

  // Section Generator Helper
  const addSectionHeader = (title: string) => {
    top += 4;
    const h = 14;
    els.push({
      id: gid(),
      element_type: "text",
      page_id: pageId,
      text: title.toUpperCase(),
      x: MARGIN_X,
      y: toY(h),
      width: CONTENT_WIDTH,
      height: h,
      font_size: 10,
      font_name: "Helvetica-Bold",
      text_color: palette.primary,
      bold: true,
      letter_spacing: 1.2,
      z_index: 2,
    } as TextElement);
    top += h + 3;

    els.push({
      id: gid(),
      element_type: "shape",
      shape_type: "line",
      page_id: pageId,
      x: MARGIN_X,
      y: Math.round(PAGE_HEIGHT - top),
      x2: PAGE_WIDTH - MARGIN_X,
      y2: Math.round(PAGE_HEIGHT - top),
      border_color: palette.accent,
      border_width: 1,
      z_index: 1,
    } as ShapeElement);
    top += 8;
  };

  // 4. Professional Summary
  if (data.summary && data.summary.trim().length > 10) {
    addSectionHeader("Professional Summary");
    const sumH = estimateTextHeight(data.summary, 8.5, CONTENT_WIDTH, 1.4);
    els.push({
      id: gid(),
      element_type: "text",
      page_id: pageId,
      text: data.summary.trim(),
      x: MARGIN_X,
      y: toY(sumH),
      width: CONTENT_WIDTH,
      height: sumH,
      font_size: 8.5,
      font_name: "Helvetica",
      text_color: palette.text,
      line_height: 1.4,
      z_index: 2,
    } as TextElement);
    top += sumH + 10;
  }

  // 5. Work Experience
  if (data.experiences && data.experiences.length > 0) {
    addSectionHeader("Professional Experience");

    data.experiences.slice(0, 4).forEach((exp) => {
      // Job Title & Company (Left) + Duration & Location (Right)
      const titleLine = `${exp.role}${exp.company ? "  ·  " + exp.company : ""}`;
      const metaRight = [exp.duration, exp.location].filter(Boolean).join("  |  ");

      const titleW = CONTENT_WIDTH - 140;
      const titleH = 14;
      const curY = toY(titleH);

      els.push({
        id: gid(),
        element_type: "text",
        page_id: pageId,
        text: titleLine,
        x: MARGIN_X,
        y: curY,
        width: titleW,
        height: titleH,
        font_size: 9.5,
        font_name: "Helvetica-Bold",
        text_color: palette.primary,
        bold: true,
        z_index: 2,
      } as TextElement);

      if (metaRight) {
        els.push({
          id: gid(),
          element_type: "text",
          page_id: pageId,
          text: metaRight,
          x: MARGIN_X + titleW,
          y: curY,
          width: 140,
          height: titleH,
          font_size: 8.5,
          font_name: "Helvetica",
          text_color: palette.muted,
          align: "right",
          z_index: 2,
        } as TextElement);
      }
      top += titleH + 4;

      // Bullet points
      const bullets = exp.bullets.slice(0, 4);
      bullets.forEach((bullet) => {
        const bulletText = bullet.startsWith("•") ? bullet : `•  ${bullet}`;
        const bH = estimateTextHeight(bulletText, 8.2, CONTENT_WIDTH - 12, 1.35);
        els.push({
          id: gid(),
          element_type: "text",
          page_id: pageId,
          text: bulletText,
          x: MARGIN_X + 12,
          y: toY(bH),
          width: CONTENT_WIDTH - 12,
          height: bH,
          font_size: 8.2,
          font_name: "Helvetica",
          text_color: palette.text,
          line_height: 1.35,
          z_index: 2,
        } as TextElement);
        top += bH + 3;
      });

      top += 6;
    });
  }

  // 6. Education
  if (data.educations && data.educations.length > 0) {
    addSectionHeader("Education & Credentials");

    data.educations.slice(0, 2).forEach((edu) => {
      const eduTitle = `${edu.degree}${edu.school ? "  ·  " + edu.school : ""}`;
      const eduW = CONTENT_WIDTH - 130;
      const eduH = 13;
      const curY = toY(eduH);

      els.push({
        id: gid(),
        element_type: "text",
        page_id: pageId,
        text: eduTitle,
        x: MARGIN_X,
        y: curY,
        width: eduW,
        height: eduH,
        font_size: 9,
        font_name: "Helvetica-Bold",
        text_color: palette.primary,
        bold: true,
        z_index: 2,
      } as TextElement);

      if (edu.year) {
        els.push({
          id: gid(),
          element_type: "text",
          page_id: pageId,
          text: edu.year,
          x: MARGIN_X + eduW,
          y: curY,
          width: 130,
          height: eduH,
          font_size: 8.5,
          font_name: "Helvetica",
          text_color: palette.muted,
          align: "right",
          z_index: 2,
        } as TextElement);
      }
      top += eduH + 5;
    });
  }

  // 7. Core Skills & Technologies
  if (data.skills && data.skills.length > 0) {
    addSectionHeader("Core Competencies & Technical Skills");
    const skillList = data.skills.map((s) => s.name).join("   •   ");
    const skillH = estimateTextHeight(skillList, 8.5, CONTENT_WIDTH, 1.4);
    els.push({
      id: gid(),
      element_type: "text",
      page_id: pageId,
      text: skillList,
      x: MARGIN_X,
      y: toY(skillH),
      width: CONTENT_WIDTH,
      height: skillH,
      font_size: 8.5,
      font_name: "Helvetica",
      text_color: palette.text,
      line_height: 1.4,
      z_index: 2,
    } as TextElement);
    top += skillH + 8;
  }

  return els;
}

/**
 * Builds a Modern Two-Column Layout with Dark/Accent Sidebar, Skill Loaders & QR Block.
 */
export function buildSidebarModernLayout(data: ParsedCandidateData, palette = {
  sidebarBg: "#0F172A",
  sidebarText: "#F8FAFC",
  sidebarMuted: "#94A3B8",
  primary: "#1E293B",
  secondary: "#2563EB",
  accent: "#38BDF8",
  text: "#334155",
  muted: "#64748B",
  barBg: "#334155",
}): EditorElement[] {
  const els: EditorElement[] = [];
  const pageId = "page-1";
  const sidebarW = 185;

  // 1. Sidebar Background (covers y=0 to y=792 full page height)
  els.push({
    id: gid(),
    element_type: "shape",
    shape_type: "rectangle",
    page_id: pageId,
    x: 0,
    y: 0, // In EditorCanvas bottom coordinate: y=0 + height=792 covers the full page
    width: sidebarW,
    height: PAGE_HEIGHT,
    fill_color: palette.sidebarBg,
    border_width: 0,
    z_index: 0,
  } as ShapeElement);

  // Sidebar Vertical Accent Line
  els.push({
    id: gid(),
    element_type: "shape",
    shape_type: "line",
    page_id: pageId,
    x: sidebarW,
    y: 0,
    x2: sidebarW,
    y2: PAGE_HEIGHT,
    border_color: palette.accent,
    border_width: 2,
    z_index: 1,
  } as ShapeElement);

  // ── LEFT SIDEBAR CONTENT STREAM ───────────────────────────────────────────
  let leftTop = 36;
  const leftToY = (h: number) => Math.round(PAGE_HEIGHT - leftTop - h);

  // Monogram Avatar
  const nameParts = (data.name || "A M").trim().split(" ");
  const initials = `${nameParts[0]?.[0] || "A"}${nameParts[nameParts.length - 1]?.[0] || "M"}`.toUpperCase();

  els.push({
    id: gid(),
    element_type: "shape",
    shape_type: "circle",
    page_id: pageId,
    x: Math.round(sidebarW / 2 - 26),
    y: leftToY(52),
    width: 52,
    height: 52,
    fill_color: palette.secondary,
    border_width: 2,
    border_color: palette.accent,
    z_index: 1,
  } as ShapeElement);

  els.push({
    id: gid(),
    element_type: "text",
    page_id: pageId,
    text: initials,
    x: 0,
    y: leftToY(52) + 14,
    width: sidebarW,
    height: 24,
    font_size: 18,
    font_name: "Helvetica-Bold",
    text_color: "#FFFFFF",
    align: "center",
    bold: true,
    z_index: 2,
  } as TextElement);
  leftTop += 52 + 18;

  const addSidebarSection = (title: string) => {
    leftTop += 6;
    const h = 12;
    els.push({
      id: gid(),
      element_type: "text",
      page_id: pageId,
      text: title.toUpperCase(),
      x: 16,
      y: leftToY(h),
      width: sidebarW - 32,
      height: h,
      font_size: 8.5,
      font_name: "Helvetica-Bold",
      text_color: palette.accent,
      bold: true,
      letter_spacing: 1.2,
      z_index: 2,
    } as TextElement);
    leftTop += h + 3;

    els.push({
      id: gid(),
      element_type: "shape",
      shape_type: "line",
      page_id: pageId,
      x: 16,
      y: Math.round(PAGE_HEIGHT - leftTop),
      x2: sidebarW - 16,
      y2: Math.round(PAGE_HEIGHT - leftTop),
      border_color: "#334155",
      border_width: 1,
      z_index: 1,
    } as ShapeElement);
    leftTop += 6;
  };

  // Contact Info
  addSidebarSection("Contact");
  const contacts = [
    { text: data.phone, icon: "Phone" },
    { text: data.email, icon: "Mail" },
    { text: data.location, icon: "MapPin" },
    { text: data.linkedin, icon: "Linkedin" },
    { text: data.website || data.github, icon: "Globe" },
  ].filter((c) => Boolean(c.text));

  contacts.forEach((c) => {
    const h = estimateTextHeight(c.text!, 7.5, sidebarW - 34, 1.3);
    els.push({
      id: gid(),
      element_type: "text",
      page_id: pageId,
      text: c.text!,
      x: 16,
      y: leftToY(h),
      width: sidebarW - 32,
      height: h,
      font_size: 7.5,
      font_name: "Helvetica",
      text_color: palette.sidebarMuted,
      line_height: 1.3,
      z_index: 2,
    } as TextElement);
    leftTop += h + 4;
  });

  // Skills with Visual Progress Bars
  if (data.skills && data.skills.length > 0) {
    addSidebarSection("Core Skills & Mastery");
    const skillsToRender = data.skills.slice(0, 6);

    skillsToRender.forEach((s) => {
      const pct = s.level || 0.85;
      const pctFormatted = Math.round(pct * 100);
      const textH = 10;
      const barH = 5;
      const barW = sidebarW - 32;

      // Skill Label + Percentage Text
      els.push({
        id: gid(),
        element_type: "text",
        page_id: pageId,
        text: `${s.name} (${pctFormatted}%)`,
        x: 16,
        y: leftToY(textH),
        width: barW,
        height: textH,
        font_size: 7.5,
        font_name: "Helvetica",
        text_color: palette.sidebarText,
        z_index: 2,
      } as TextElement);
      leftTop += textH + 3;

      // Background Bar
      els.push({
        id: gid(),
        element_type: "shape",
        shape_type: "rectangle",
        page_id: pageId,
        x: 16,
        y: leftToY(barH),
        width: barW,
        height: barH,
        fill_color: palette.barBg,
        border_width: 0,
        border_radius: 3,
        z_index: 1,
      } as ShapeElement);

      // Foreground Filled Progress Bar
      els.push({
        id: gid(),
        element_type: "shape",
        shape_type: "rectangle",
        page_id: pageId,
        x: 16,
        y: leftToY(barH),
        width: Math.round(barW * pct),
        height: barH,
        fill_color: palette.accent,
        border_width: 0,
        border_radius: 3,
        z_index: 2,
      } as ShapeElement);

      leftTop += barH + 8;
    });
  }

  // Portfolio QR Code Block
  addSidebarSection("Portfolio QR");
  const qrSize = 64;
  const qrY = leftToY(qrSize);
  els.push({
    id: gid(),
    element_type: "shape",
    shape_type: "rectangle",
    page_id: pageId,
    x: Math.round(sidebarW / 2 - qrSize / 2),
    y: qrY,
    width: qrSize,
    height: qrSize,
    fill_color: "#FFFFFF",
    border_color: palette.accent,
    border_width: 1.5,
    border_radius: 6,
    z_index: 1,
  } as ShapeElement);

  // Real Scannable QR Code Image
  const qrInnerSize = qrSize - 12;
  els.push({
    id: gid(),
    element_type: "image",
    page_id: pageId,
    x: Math.round(sidebarW / 2 - qrInnerSize / 2),
    y: qrY + 6,
    width: qrInnerSize,
    height: qrInnerSize,
    image_path: DEFAULT_QR_PNG,
    z_index: 2,
  } as ImageElement);

  leftTop += qrSize + 4;
  els.push({
    id: gid(),
    element_type: "text",
    page_id: pageId,
    text: "SCAN FOR PORTFOLIO",
    x: 16,
    y: leftToY(10),
    width: sidebarW - 32,
    height: 10,
    font_size: 6.5,
    font_name: "Helvetica-Bold",
    text_color: palette.sidebarMuted,
    align: "center",
    bold: true,
    letter_spacing: 0.5,
    z_index: 2,
  } as TextElement);

  // ── RIGHT MAIN COLUMN CONTENT STREAM ──────────────────────────────────────
  const mainX = sidebarW + 20;
  const mainW = PAGE_WIDTH - mainX - 24; // ~383 pt usable width
  let mainTop = 36;
  const mainToY = (h: number) => Math.round(PAGE_HEIGHT - mainTop - h);

  // Candidate Name
  const mNameH = 26;
  els.push({
    id: gid(),
    element_type: "text",
    page_id: pageId,
    text: (data.name || "CANDIDATE NAME").toUpperCase(),
    x: mainX,
    y: mainToY(mNameH),
    width: mainW,
    height: mNameH,
    font_size: 20,
    font_name: "Helvetica-Bold",
    text_color: palette.primary,
    bold: true,
    letter_spacing: 1.0,
    z_index: 2,
  } as TextElement);
  mainTop += mNameH + 2;

  // Headline
  if (data.headline) {
    const mHeadH = 15;
    els.push({
      id: gid(),
      element_type: "text",
      page_id: pageId,
      text: data.headline,
      x: mainX,
      y: mainToY(mHeadH),
      width: mainW,
      height: mHeadH,
      font_size: 11,
      font_name: "Helvetica-Bold",
      text_color: palette.secondary,
      bold: true,
      z_index: 2,
    } as TextElement);
    mainTop += mHeadH + 8;
  }

  const addMainSectionHeader = (title: string) => {
    mainTop += 6;
    const h = 13;
    els.push({
      id: gid(),
      element_type: "text",
      page_id: pageId,
      text: title.toUpperCase(),
      x: mainX,
      y: mainToY(h),
      width: mainW,
      height: h,
      font_size: 9.5,
      font_name: "Helvetica-Bold",
      text_color: palette.primary,
      bold: true,
      letter_spacing: 1.2,
      z_index: 2,
    } as TextElement);
    mainTop += h + 3;

    els.push({
      id: gid(),
      element_type: "shape",
      shape_type: "line",
      page_id: pageId,
      x: mainX,
      y: Math.round(PAGE_HEIGHT - mainTop),
      x2: PAGE_WIDTH - 24,
      y2: Math.round(PAGE_HEIGHT - mainTop),
      border_color: palette.secondary,
      border_width: 1.5,
      z_index: 1,
    } as ShapeElement);
    mainTop += 8;
  };

  // Summary
  if (data.summary && data.summary.trim().length > 10) {
    addMainSectionHeader("Executive Summary");
    const sumH = estimateTextHeight(data.summary, 8.5, mainW, 1.4);
    els.push({
      id: gid(),
      element_type: "text",
      page_id: pageId,
      text: data.summary.trim(),
      x: mainX,
      y: mainToY(sumH),
      width: mainW,
      height: sumH,
      font_size: 8.5,
      font_name: "Helvetica",
      text_color: palette.text,
      line_height: 1.4,
      z_index: 2,
    } as TextElement);
    mainTop += sumH + 8;
  }

  // Experience
  if (data.experiences && data.experiences.length > 0) {
    addMainSectionHeader("Professional Work Experience");

    data.experiences.slice(0, 3).forEach((exp) => {
      const titleLine = `${exp.role}${exp.company ? "  ·  " + exp.company : ""}`;
      const titleH = 13;
      const titleW = mainW - 110;
      const curY = mainToY(titleH);

      els.push({
        id: gid(),
        element_type: "text",
        page_id: pageId,
        text: titleLine,
        x: mainX,
        y: curY,
        width: titleW,
        height: titleH,
        font_size: 9,
        font_name: "Helvetica-Bold",
        text_color: palette.primary,
        bold: true,
        z_index: 2,
      } as TextElement);

      if (exp.duration) {
        els.push({
          id: gid(),
          element_type: "text",
          page_id: pageId,
          text: exp.duration,
          x: mainX + titleW,
          y: curY,
          width: 110,
          height: titleH,
          font_size: 8,
          font_name: "Helvetica",
          text_color: palette.muted,
          align: "right",
          z_index: 2,
        } as TextElement);
      }
      mainTop += titleH + 3;

      const bullets = exp.bullets.slice(0, 3);
      bullets.forEach((bullet) => {
        const bulletText = bullet.startsWith("•") ? bullet : `•  ${bullet}`;
        const bH = estimateTextHeight(bulletText, 8, mainW - 10, 1.35);
        els.push({
          id: gid(),
          element_type: "text",
          page_id: pageId,
          text: bulletText,
          x: mainX + 10,
          y: mainToY(bH),
          width: mainW - 10,
          height: bH,
          font_size: 8,
          font_name: "Helvetica",
          text_color: palette.text,
          line_height: 1.35,
          z_index: 2,
        } as TextElement);
        mainTop += bH + 2.5;
      });

      mainTop += 5;
    });
  }

  // Education
  if (data.educations && data.educations.length > 0) {
    addMainSectionHeader("Education & Credentials");

    data.educations.slice(0, 2).forEach((edu) => {
      const eduTitle = `${edu.degree}${edu.school ? "  ·  " + edu.school : ""}`;
      const eduH = 12;
      const eduW = mainW - 100;
      const curY = mainToY(eduH);

      els.push({
        id: gid(),
        element_type: "text",
        page_id: pageId,
        text: eduTitle,
        x: mainX,
        y: curY,
        width: eduW,
        height: eduH,
        font_size: 8.5,
        font_name: "Helvetica-Bold",
        text_color: palette.primary,
        bold: true,
        z_index: 2,
      } as TextElement);

      if (edu.year) {
        els.push({
          id: gid(),
          element_type: "text",
          page_id: pageId,
          text: edu.year,
          x: mainX + eduW,
          y: curY,
          width: 100,
          height: eduH,
          font_size: 8,
          font_name: "Helvetica",
          text_color: palette.muted,
          align: "right",
          z_index: 2,
        } as TextElement);
      }
      mainTop += eduH + 4;
    });
  }

  return els;
}

/**
 * Master generator function that chooses the best layout theme based on user prompt or data.
 */
export function generateGeometricResume(
  data: ParsedCandidateData,
  layoutType: "sidebar" | "executive" | "minimalist" = "sidebar",
  customPalette?: any,
): EditorElement[] {
  if (layoutType === "sidebar") {
    return buildSidebarModernLayout(data, customPalette);
  }
  return buildExecutiveLayout(data, customPalette);
}
