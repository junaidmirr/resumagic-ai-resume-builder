import type { EditorElement } from "../types/editor";

export type TemplateDef = {
  id: string;
  name: string;
  category: string;
  description: string;
  elements: (pageId: string, wizardData?: any) => Partial<EditorElement>[];
};

const gid = () => Math.random().toString(36).substring(2, 9);

// ─── Dynamic Data Extractor ──────────────────────────────────────────────────
export function getTemplateData(d?: any) {
  return {
    NAME: d?.contact?.firstName ? `${d.contact.firstName} ${d.contact.lastName}` : "ALEX MERCER",
    TITLE: d?.targetRole || "Senior Software Engineer",
    EMAIL: d?.contact?.email || "alex@mercer.dev",
    PHONE: d?.contact?.phone || "(555) 012-3456",
    LOCATION: d?.contact?.city ? `${d.contact.city}, ${d.contact.country}` : "San Francisco, CA",
    LINKEDIN: d?.contact?.linkedin || "linkedin.com/in/alexmercer",
    SUMMARY: d?.summary || "Innovative engineer with 8+ years building scalable cloud systems. Led teams across 3 continents, delivered $12M in cost savings, and shipped products used by 10M+ users worldwide.",
    
    EXP1_ROLE: d?.experiences?.[0] ? `${d.experiences[0].role} · ${d.experiences[0].company}` : "Lead Engineer · TechCorp Inc.",
    EXP1_DATE: d?.experiences?.[0]?.duration || "2021 – Present",
    EXP1_DESC: d?.experiences?.[0]?.description || "• Architected microservices serving 200M API calls/day\n• Reduced infra costs by 40% via serverless migration\n• Mentored 8 engineers across 2 teams",
    
    EXP2_ROLE: d?.experiences?.[1] ? `${d.experiences[1].role} · ${d.experiences[1].company}` : "Senior Developer · FinStart",
    EXP2_DATE: d?.experiences?.[1]?.duration || "2018 – 2021",
    EXP2_DESC: d?.experiences?.[1]?.description || "• Built real-time trading analytics dashboard\n• Shipped mobile app — 1M+ downloads in Month 1\n• Wrote 90% test coverage across core modules",
    
    EDU_TITLE: d?.educations?.[0]?.degree || "M.S. Computer Science",
    EDU_SCHOOL: d?.educations?.[0] ? `${d.educations[0].school}  ·  ${d.educations[0].startDate}–${d.educations[0].endDate}` : "Stanford University  ·  2016–2018",
    
    SKILLS: d?.skills?.length ? d.skills : ["React & Node.js", "Python / FastAPI", "PostgreSQL", "AWS / Docker", "TypeScript"]
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// TEMPLATE 1 — Obsidian Night
// ─────────────────────────────────────────────────────────────────────────────
function obsidianNight(pageId: string, wizardData?: any): Partial<EditorElement>[] {
  const { NAME, TITLE, EMAIL, PHONE, LOCATION, LINKEDIN, SUMMARY, EXP1_ROLE, EXP1_DATE, EXP1_DESC, EXP2_ROLE, EXP2_DATE, EXP2_DESC, EDU_TITLE, EDU_SCHOOL, SKILLS } = getTemplateData(wizardData);
  const sw = 210; 
  const els: Partial<EditorElement>[] = [];

  // Sidebar bg (y=0, covers full height)
  els.push({ id: gid(), element_type: "shape", shape_type: "rectangle", page_id: pageId, x: 0, y: 0, width: sw, height: 792, fill_color: "#0B1120", border_width: 0, z_index: 0 });
  // Accent strip
  els.push({ id: gid(), element_type: "shape", shape_type: "rectangle", page_id: pageId, x: sw - 3, y: 0, width: 3, height: 792, fill_color: "#6366F1", border_width: 0, z_index: 1 });

  // Hero name area (y = 792 - 115 = 677)
  els.push({ id: gid(), element_type: "shape", shape_type: "rectangle", page_id: pageId, x: sw, y: 792 - 115, width: 612 - sw, height: 115, fill_color: "#1E1B4B", border_width: 0, z_index: 0 });
  
  // Bezier wave accent below hero
  els.push({ id: gid(), element_type: "shape", shape_type: "path", page_id: pageId,
    path_d: `M ${sw} ${792 - 115} C ${sw + 90} ${792 - 98} ${sw + 180} ${792 - 132} ${612} ${792 - 115} L ${612} ${792 - 130} C ${sw + 180} ${792 - 147} ${sw + 90} ${792 - 113} ${sw} ${792 - 130} Z`,
    fill_color: "#6366F1", border_width: 0, x: 0, y: 0, z_index: 2 });

  // Name
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: NAME, x: sw + 18, y: 740, width: 380, height: 24, font_size: 22, font_name: "Helvetica-Bold", text_color: "#F8FAFC", bold: true, z_index: 3 });
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: TITLE, x: sw + 18, y: 720, width: 380, height: 14, font_size: 10.5, font_name: "Helvetica", text_color: "#A5B4FC", z_index: 3 });

  // Sidebar: profile circle placeholder (Center x=sw/2, y=690)
  els.push({ id: gid(), element_type: "shape", shape_type: "circle", page_id: pageId, x: sw / 2, y: 690, width: 120, height: 120, fill_color: "#1E2A45", border_width: 2, border_color: "#6366F1", z_index: 2 });
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: "AM", x: 15, y: 672, width: sw - 30, height: 36, font_size: 36, font_name: "Helvetica-Bold", text_color: "#6366F1", align: "center", bold: true, z_index: 3 });

  // Sidebar sections
  let ly = 600;
  const sSection = (title: string) => {
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: title, x: 15, y: ly, width: sw - 30, height: 12, font_size: 8.5, font_name: "Helvetica-Bold", text_color: "#A5B4FC", z_index: 3 });
    ly -= 4;
    els.push({ id: gid(), element_type: "shape", shape_type: "line", page_id: pageId, x: 15, y: ly, x2: sw - 15, y2: ly, border_color: "#312E81", border_width: 1, z_index: 3 });
    ly -= 15;
  };

  sSection("CONTACT");
  [EMAIL, PHONE, LOCATION, LINKEDIN].forEach(t => {
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: t, x: 15, y: ly, width: sw - 30, height: 11, font_size: 8, font_name: "Helvetica", text_color: "#CBD5E1", z_index: 3 });
    ly -= 15;
  });

  ly -= 10;
  sSection("CORE SKILLS");
  SKILLS.forEach((skill, i) => {
    const pct = (([95, 90, 88, 92, 85][i] || 85)) / 100;
    const bw = sw - 30;
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: skill, x: 15, y: ly, width: bw, height: 10, font_size: 7.5, font_name: "Helvetica-Bold", text_color: "#E2E8F0", z_index: 3 });
    ly -= 5;
    els.push({ id: gid(), element_type: "shape", shape_type: "rectangle", page_id: pageId, x: 15, y: ly - 5, width: bw, height: 5, fill_color: "#1E3A5F", border_width: 0, border_radius: 3, z_index: 3 });
    els.push({ id: gid(), element_type: "shape", shape_type: "rectangle", page_id: pageId, x: 15, y: ly - 5, width: bw * pct, height: 5, fill_color: "#6366F1", border_width: 0, border_radius: 3, z_index: 4 });
    ly -= 15;
  });

  // Main content
  let ry = 640;
  const mSection = (title: string) => {
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: title, x: sw + 25, y: ry, width: 350, height: 13, font_size: 9.5, font_name: "Helvetica-Bold", text_color: "#6366F1", bold: true, z_index: 3 });
    ry -= 4;
    els.push({ id: gid(), element_type: "shape", shape_type: "line", page_id: pageId, x: sw + 25, y: ry, x2: 587, y2: ry, border_color: "#312E81", border_width: 1, z_index: 3 });
    ry -= 15;
  };

  mSection("PROFILE SUMMARY");
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: SUMMARY, x: sw + 25, y: ry - 25, width: 350, height: 35, font_size: 8.8, font_name: "Helvetica", text_color: "#475569", line_height: 1.4, z_index: 3 });
  ry -= 45;

  mSection("WORK EXPERIENCE");
  [[EXP1_ROLE, EXP1_DATE, EXP1_DESC], [EXP2_ROLE, EXP2_DATE, EXP2_DESC]].forEach(([role, date, desc]) => {
    els.push({ id: gid(), element_type: "shape", shape_type: "circle", page_id: pageId, x: sw + 25, y: ry + 4, width: 8, height: 8, fill_color: "#6366F1", border_width: 0, z_index: 4 });
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: role, x: sw + 40, y: ry, width: 200, height: 11, font_size: 9.5, font_name: "Helvetica-Bold", text_color: "#1E293B", bold: true, z_index: 3 });
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: date, x: sw + 25, y: ry - 14, width: 350, height: 10, font_size: 8, font_name: "Helvetica", text_color: "#94A3B8", align: "right", z_index: 3 });
    ry -= 18;
    const h = desc.split("\n").length * 13;
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: desc, x: sw + 40, y: ry - h + 13, width: 335, height: h, font_size: 8.5, font_name: "Helvetica", text_color: "#475569", line_height: 1.4, z_index: 3 });
    ry -= h + 15;
  });

  mSection("EDUCATION");
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: EDU_TITLE, x: sw + 25, y: ry, width: 350, height: 11, font_size: 9.5, font_name: "Helvetica-Bold", text_color: "#1E293B", bold: true, z_index: 3 });
  ry -= 15;
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: EDU_SCHOOL, x: sw + 25, y: ry, width: 350, height: 10, font_size: 8.5, font_name: "Helvetica", text_color: "#64748B", z_index: 3 });

  return els;
}

// ─────────────────────────────────────────────────────────────────────────────
// TEMPLATE 2 — Aurora
// ─────────────────────────────────────────────────────────────────────────────
function aurora(pageId: string, wizardData?: any): Partial<EditorElement>[] {
  const { NAME, TITLE, EMAIL, PHONE, LOCATION, LINKEDIN, SUMMARY, EXP1_ROLE, EXP1_DATE, EXP1_DESC, EXP2_ROLE, EXP2_DATE, EXP2_DESC, EDU_TITLE, EDU_SCHOOL, SKILLS } = getTemplateData(wizardData);
  const els: Partial<EditorElement>[] = [];

  // Hero banner layers
  els.push({ id: gid(), element_type: "shape", shape_type: "rectangle", page_id: pageId, x: 0, y: 792 - 130, width: 612, height: 130, fill_color: "#0F172A", border_width: 0, z_index: 0 });

  // Decorative circles in header (centered on their coords)
  els.push({ id: gid(), element_type: "shape", shape_type: "circle", page_id: pageId, x: 480, y: 792 - 40, width: 160, height: 160, fill_color: "#1E3A5F", border_width: 0, z_index: 1 });
  els.push({ id: gid(), element_type: "shape", shape_type: "circle", page_id: pageId, x: 540, y: 792 - 10, width: 100, height: 100, fill_color: "#38BDF822", border_width: 0, z_index: 1 });
  els.push({ id: gid(), element_type: "shape", shape_type: "circle", page_id: pageId, x: -30, y: 792 - 20, width: 90, height: 90, fill_color: "#6366F122", border_width: 0, z_index: 1 });

  // Name block
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: NAME, x: 40, y: 730, width: 450, height: 26, font_size: 24, font_name: "Helvetica-Bold", text_color: "#F8FAFC", bold: true, z_index: 2 });
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: TITLE, x: 40, y: 710, width: 400, height: 14, font_size: 11, font_name: "Helvetica", text_color: "#38BDF8", z_index: 2 });
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: `${EMAIL}  ·  ${PHONE}  ·  ${LOCATION}`, x: 40, y: 680, width: 532, height: 11, font_size: 8.5, font_name: "Helvetica", text_color: "#94A3B8", z_index: 2 });

  // Wave divider
  els.push({ id: gid(), element_type: "shape", shape_type: "path", page_id: pageId,
    path_d: `M 0 ${792 - 130} C 150 ${792 - 118} 300 ${792 - 144} 612 ${792 - 130} L 612 ${792 - 145} C 300 ${792 - 159} 150 ${792 - 133} 0 ${792 - 145} Z`,
    fill_color: "#38BDF8", border_width: 0, x: 0, y: 0, z_index: 2 });

  // Two-column layout
  const lx = 40, lw = 230, rx = 310, rw = 265;
  let ly = 610, ry = 610;

  const lSection = (title: string) => {
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: title, x: lx, y: ly, width: lw, height: 13, font_size: 9, font_name: "Helvetica-Bold", text_color: "#0F172A", bold: true, z_index: 3 });
    ly -= 4;
    els.push({ id: gid(), element_type: "shape", shape_type: "rectangle", page_id: pageId, x: lx, y: ly - 3, width: 30, height: 3, fill_color: "#38BDF8", border_width: 0, z_index: 3 });
    ly -= 15;
  };
  const rSection = (title: string) => {
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: title, x: rx, y: ry, width: rw, height: 13, font_size: 9, font_name: "Helvetica-Bold", text_color: "#0F172A", bold: true, z_index: 3 });
    ry -= 4;
    els.push({ id: gid(), element_type: "shape", shape_type: "rectangle", page_id: pageId, x: rx, y: ry - 3, width: 30, height: 3, fill_color: "#38BDF8", border_width: 0, z_index: 3 });
    ry -= 15;
  };

  lSection("PROFILE");
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: SUMMARY, x: lx, y: ly - 40, width: lw, height: 50, font_size: 8.5, font_name: "Helvetica", text_color: "#334155", line_height: 1.4, z_index: 3 });
  ly -= 60;

  lSection("SKILLS");
  SKILLS.forEach((skill, i) => {
    const pct = [0.92, 0.88, 0.85, 0.90, 0.82][i] || 0.8;
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: skill, x: lx, y: ly, width: lw, height: 10, font_size: 8, font_name: "Helvetica-Bold", text_color: "#1E293B", z_index: 3 });
    ly -= 5;
    els.push({ id: gid(), element_type: "shape", shape_type: "rectangle", page_id: pageId, x: lx, y: ly - 5, width: lw, height: 5, fill_color: "#E2E8F0", border_width: 0, border_radius: 3, z_index: 3 });
    els.push({ id: gid(), element_type: "shape", shape_type: "rectangle", page_id: pageId, x: lx, y: ly - 5, width: lw * pct, height: 5, fill_color: "#38BDF8", border_width: 0, border_radius: 3, z_index: 4 });
    ly -= 15;
  });

  ly -= 10;
  lSection("EDUCATION");
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: EDU_TITLE, x: lx, y: ly, width: lw, height: 11, font_size: 9, font_name: "Helvetica-Bold", text_color: "#1E293B", bold: true, z_index: 3 });
  ly -= 15;
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: EDU_SCHOOL, x: lx, y: ly, width: lw, height: 10, font_size: 8, font_name: "Helvetica", text_color: "#64748B", z_index: 3 });

  // Vertical divider
  els.push({ id: gid(), element_type: "shape", shape_type: "line", page_id: pageId, x: 285, y: 620, x2: 285, y2: 50, border_color: "#E2E8F0", border_width: 1, z_index: 2 });

  rSection("EXPERIENCE");
  [[EXP1_ROLE, EXP1_DATE, EXP1_DESC], [EXP2_ROLE, EXP2_DATE, EXP2_DESC]].forEach(([role, date, desc]) => {
    // Timeline dot + line
    els.push({ id: gid(), element_type: "shape", shape_type: "circle", page_id: pageId, x: rx - 12, y: ry + 4, width: 8, height: 8, fill_color: "#38BDF8", border_width: 0, z_index: 4 });
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: role, x: rx, y: ry, width: rw, height: 11, font_size: 9, font_name: "Helvetica-Bold", text_color: "#1E293B", bold: true, z_index: 3 });
    ry -= 15;
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: date, x: rx, y: ry, width: rw, height: 10, font_size: 7.5, font_name: "Helvetica", text_color: "#0284C7", z_index: 3 });
    ry -= 15;
    const h = desc.split("\n").length * 12;
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: desc, x: rx, y: ry - h + 12, width: rw, height: h, font_size: 8, font_name: "Helvetica", text_color: "#475569", line_height: 1.4, z_index: 3 });
    ry -= h + 20;
  });

  return els;
}

// ─────────────────────────────────────────────────────────────────────────────
// TEMPLATE 3 — Crimson Executive
// ─────────────────────────────────────────────────────────────────────────────
function crimsonExecutive(pageId: string, wizardData?: any): Partial<EditorElement>[] {
  const { NAME, TITLE, EMAIL, PHONE, LOCATION, LINKEDIN, SUMMARY, EXP1_ROLE, EXP1_DATE, EXP1_DESC, EXP2_ROLE, EXP2_DATE, EXP2_DESC, EDU_TITLE, EDU_SCHOOL, SKILLS } = getTemplateData(wizardData);
  const els: Partial<EditorElement>[] = [];
  const ACC = "#DC2626";

  // Top banner
  els.push({ id: gid(), element_type: "shape", shape_type: "rectangle", page_id: pageId, x: 0, y: 792 - 110, width: 612, height: 110, fill_color: ACC, border_width: 0, z_index: 0 });
  // Diagonal cut effect
  els.push({ id: gid(), element_type: "shape", shape_type: "polygon", page_id: pageId,
    points: [0, 792 - 110, 612, 792 - 110, 612, 792 - 85, 0, 792 - 110],
    fill_color: "#FFF", border_width: 0, x: 0, y: 0, z_index: 1 });

  els.push({ id: gid(), element_type: "text", page_id: pageId, text: NAME, x: 45, y: 740, width: 400, height: 26, font_size: 24, font_name: "Helvetica-Bold", text_color: "#FFFFFF", bold: true, z_index: 2 });
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: TITLE, x: 45, y: 720, width: 400, height: 14, font_size: 11, font_name: "Helvetica", text_color: "#FEE2E2", z_index: 2 });
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: `${EMAIL}  |  ${PHONE}  |  ${LOCATION}`, x: 45, y: 695, width: 542, height: 12, font_size: 9, font_name: "Helvetica", text_color: "#374151", z_index: 2 });

  let y = 650;
  const section = (title: string) => {
    els.push({ id: gid(), element_type: "shape", shape_type: "rectangle", page_id: pageId, x: 45, y: y, width: 4, height: 14, fill_color: ACC, border_width: 0, z_index: 2 });
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: title, x: 56, y: y, width: 500, height: 13, font_size: 10, font_name: "Helvetica-Bold", text_color: "#111827", bold: true, z_index: 3 });
    y -= 6;
    els.push({ id: gid(), element_type: "shape", shape_type: "line", page_id: pageId, x: 45, y: y, x2: 567, y2: y, border_color: "#E5E7EB", border_width: 1, z_index: 2 });
    y -= 15;
  };

  section("EXECUTIVE SUMMARY");
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: SUMMARY, x: 45, y: y - 25, width: 522, height: 35, font_size: 9, font_name: "Helvetica", text_color: "#374151", line_height: 1.5, z_index: 3 });
  y -= 45;

  section("PROFESSIONAL EXPERIENCE");
  [[EXP1_ROLE, EXP1_DATE, EXP1_DESC], [EXP2_ROLE, EXP2_DATE, EXP2_DESC]].forEach(([role, date, desc]) => {
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: role, x: 45, y: y, width: 400, height: 11, font_size: 10, font_name: "Helvetica-Bold", text_color: "#111827", bold: true, z_index: 3 });
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: date, x: 450, y: y, width: 117, height: 10, font_size: 9, font_name: "Helvetica", text_color: ACC, align: "right", z_index: 3 });
    y -= 15;
    const h = desc.split("\n").length * 13;
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: desc, x: 45, y: y - h + 13, width: 522, height: h, font_size: 9, font_name: "Helvetica", text_color: "#374151", line_height: 1.4, z_index: 3 });
    y -= h + 15;
  });

  // Two column bottom: Education + Skills
  section("EDUCATION & SKILLS");
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: EDU_TITLE, x: 45, y: y, width: 260, height: 11, font_size: 9.5, font_name: "Helvetica-Bold", text_color: "#111827", bold: true, z_index: 3 });
  y -= 15;
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: EDU_SCHOOL, x: 45, y: y, width: 260, height: 10, font_size: 8.5, font_name: "Helvetica", text_color: "#6B7280", z_index: 3 });

  SKILLS.forEach((s, i) => {
    const col = i < 3 ? 320 : 455;
    const row = i < 3 ? i : i - 3;
    const ty = y + 15 - row * 18;
    els.push({ id: gid(), element_type: "shape", shape_type: "rectangle", page_id: pageId, x: col, y: ty - 13, width: 120, height: 13, fill_color: "#FEF2F2", border_color: "#FECACA", border_width: 1, border_radius: 6, z_index: 3 });
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: s, x: col, y: ty - 10, width: 120, height: 10, font_size: 7.5, font_name: "Helvetica-Bold", text_color: ACC, align: "center", z_index: 4 });
  });

  return els;
}

// ─────────────────────────────────────────────────────────────────────────────
// TEMPLATE 4 — Emerald Pro
// ─────────────────────────────────────────────────────────────────────────────
function emeraldPro(pageId: string, wizardData?: any): Partial<EditorElement>[] {
  const { NAME, TITLE, EMAIL, PHONE, LOCATION, LINKEDIN, SUMMARY, EXP1_ROLE, EXP1_DATE, EXP1_DESC, EXP2_ROLE, EXP2_DATE, EXP2_DESC, EDU_TITLE, EDU_SCHOOL, SKILLS } = getTemplateData(wizardData);
  const els: Partial<EditorElement>[] = [];
  const ACC = "#059669";
  const sw = 205;

  els.push({ id: gid(), element_type: "shape", shape_type: "rectangle", page_id: pageId, x: 0, y: 0, width: sw, height: 792, fill_color: "#064E3B", border_width: 0, z_index: 0 });
  els.push({ id: gid(), element_type: "shape", shape_type: "rectangle", page_id: pageId, x: 0, y: 792 - 145, width: sw, height: 145, fill_color: "#065F46", border_width: 0, z_index: 1 });

  els.push({ id: gid(), element_type: "text", page_id: pageId, text: "AM", x: 10, y: 710, width: sw - 20, height: 60, font_size: 52, font_name: "Helvetica-Bold", text_color: "#10B981", align: "center", bold: true, z_index: 2 });
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: NAME, x: 10, y: 620, width: sw - 20, height: 18, font_size: 11, font_name: "Helvetica-Bold", text_color: "#ECFDF5", align: "center", bold: true, z_index: 2 });
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: TITLE, x: 10, y: 600, width: sw - 20, height: 12, font_size: 8, font_name: "Helvetica", text_color: "#6EE7B7", align: "center", z_index: 2 });

  let ly = 570;
  const lSec = (t: string) => {
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: t, x: 15, y: ly, width: sw - 30, height: 11, font_size: 8, font_name: "Helvetica-Bold", text_color: "#6EE7B7", z_index: 3 });
    ly -= 5;
    els.push({ id: gid(), element_type: "shape", shape_type: "line", page_id: pageId, x: 15, y: ly, x2: sw - 15, y2: ly, border_color: "#065F46", border_width: 1, z_index: 3 });
    ly -= 15;
  };

  lSec("CONTACT");
  [{label: EMAIL}, {label: PHONE}, {label: LOCATION}].forEach(({label}) => {
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: label, x: 15, y: ly, width: sw - 30, height: 10, font_size: 7.5, font_name: "Helvetica", text_color: "#D1FAE5", z_index: 3 });
    ly -= 15;
  });
  ly -= 5;

  lSec("SKILLS");
  SKILLS.forEach((skill, i) => {
    const pct = [0.94, 0.88, 0.84, 0.91, 0.80][i] || 0.8;
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: skill, x: 15, y: ly, width: sw - 30, height: 10, font_size: 7.5, font_name: "Helvetica", text_color: "#D1FAE5", z_index: 3 });
    ly -= 5;
    els.push({ id: gid(), element_type: "shape", shape_type: "rectangle", page_id: pageId, x: 15, y: ly - 5, width: sw - 30, height: 5, fill_color: "#065F46", border_width: 0, border_radius: 2, z_index: 3 });
    els.push({ id: gid(), element_type: "shape", shape_type: "rectangle", page_id: pageId, x: 15, y: ly - 5, width: (sw - 30) * pct, height: 5, fill_color: "#10B981", border_width: 0, border_radius: 2, z_index: 4 });
    ly -= 15;
  });

  // Main content
  const mx = sw + 25, mw = 612 - sw - 40;
  let ry = 720;
  const mSec = (t: string) => {
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: t, x: mx, y: ry, width: mw, height: 12, font_size: 9, font_name: "Helvetica-Bold", text_color: ACC, bold: true, z_index: 3 });
    ry -= 5;
    els.push({ id: gid(), element_type: "shape", shape_type: "line", page_id: pageId, x: mx, y: ry, x2: mx + mw, y2: ry, border_color: "#D1FAE5", border_width: 1.5, z_index: 3 });
    ry -= 15;
  };

  mSec("PROFILE SUMMARY");
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: SUMMARY, x: mx, y: ry - 25, width: mw, height: 35, font_size: 8.5, font_name: "Helvetica", text_color: "#374151", line_height: 1.4, z_index: 3 });
  ry -= 45;

  mSec("WORK EXPERIENCE");
  [[EXP1_ROLE, EXP1_DATE, EXP1_DESC], [EXP2_ROLE, EXP2_DATE, EXP2_DESC]].forEach(([role, date, desc]) => {
    els.push({ id: gid(), element_type: "shape", shape_type: "circle", page_id: pageId, x: mx - 7, y: ry + 3, width: 8, height: 8, fill_color: ACC, border_width: 0, z_index: 4 });
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: role, x: mx + 8, y: ry, width: mw - 110, height: 11, font_size: 9.5, font_name: "Helvetica-Bold", text_color: "#111827", bold: true, z_index: 3 });
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: date, x: mx + mw - 120, y: ry, width: 120, height: 10, font_size: 8.5, font_name: "Helvetica", text_color: ACC, align: "right", z_index: 3 });
    ry -= 18;
    const h = desc.split("\n").length * 13;
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: desc, x: mx + 8, y: ry - h + 13, width: mw - 8, height: h, font_size: 8.5, font_name: "Helvetica", text_color: "#374151", line_height: 1.4, z_index: 3 });
    ry -= h + 15;
  });

  mSec("EDUCATION");
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: EDU_TITLE, x: mx, y: ry, width: mw, height: 11, font_size: 9.5, font_name: "Helvetica-Bold", text_color: "#111827", bold: true, z_index: 3 });
  ry -= 15;
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: EDU_SCHOOL, x: mx, y: ry, width: mw, height: 10, font_size: 8.5, font_name: "Helvetica", text_color: "#6B7280", z_index: 3 });

  return els;
}

// ─────────────────────────────────────────────────────────────────────────────
// TEMPLATE 5 — Midnight Blue
// ─────────────────────────────────────────────────────────────────────────────
function midnightBlue(pageId: string, wizardData?: any): Partial<EditorElement>[] {
  const { NAME, TITLE, EMAIL, PHONE, LOCATION, LINKEDIN, SUMMARY, EXP1_ROLE, EXP1_DATE, EXP1_DESC, EXP2_ROLE, EXP2_DATE, EXP2_DESC, EDU_TITLE, EDU_SCHOOL, SKILLS } = getTemplateData(wizardData);
  const els: Partial<EditorElement>[] = [];
  const ACC = "#3B82F6";
  const sw = 215;

  els.push({ id: gid(), element_type: "shape", shape_type: "rectangle", page_id: pageId, x: 0, y: 0, width: sw, height: 792, fill_color: "#0F172A", border_width: 0, z_index: 0 });
  els.push({ id: gid(), element_type: "shape", shape_type: "rectangle", page_id: pageId, x: sw, y: 792 - 105, width: 612 - sw, height: 105, fill_color: "#1E3A5F", border_width: 0, z_index: 0 });

  // Wave on hero
  els.push({ id: gid(), element_type: "shape", shape_type: "path", page_id: pageId,
    path_d: `M ${sw} ${792 - 105} C ${sw + 60} ${792 - 92} ${sw + 130} ${792 - 118} ${612} ${792 - 105} L ${612} ${792 - 120} C ${sw + 130} ${792 - 133} ${sw + 60} ${792 - 107} ${sw} ${792 - 120} Z`,
    fill_color: "#3B82F6", border_width: 0, x: 0, y: 0, z_index: 2 });

  // Sidebar top badge
  els.push({ id: gid(), element_type: "shape", shape_type: "rectangle", page_id: pageId, x: 0, y: 792 - 115, width: sw, height: 115, fill_color: "#1E3A5F", border_width: 0, z_index: 1 });

  // Name
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: NAME, x: sw + 25, y: 745, width: 350, height: 24, font_size: 20, font_name: "Helvetica-Bold", text_color: "#F8FAFC", bold: true, z_index: 3 });
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: TITLE, x: sw + 25, y: 725, width: 350, height: 13, font_size: 10, font_name: "Helvetica", text_color: "#93C5FD", z_index: 3 });
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: `${EMAIL}  ·  ${PHONE}`, x: sw + 25, y: 685, width: 350, height: 11, font_size: 8.5, font_name: "Helvetica", text_color: "#94A3B8", z_index: 3 });

  // Sidebar monogram
  els.push({ id: gid(), element_type: "shape", shape_type: "circle", page_id: pageId, x: sw / 2, y: 735, width: sw - 60, height: sw - 60, fill_color: "#1E3A5F", border_width: 2, border_color: "#3B82F6", z_index: 2 });
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: "AM", x: 30, y: 715, width: sw - 60, height: sw - 60, font_size: 42, font_name: "Helvetica-Bold", text_color: "#60A5FA", align: "center", bold: true, z_index: 3 });

  let ly = 580;
  const lSec = (t: string) => {
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: t, x: 15, y: ly, width: sw - 30, height: 11, font_size: 8, font_name: "Helvetica-Bold", text_color: "#60A5FA", z_index: 3 });
    ly -= 4;
    els.push({ id: gid(), element_type: "shape", shape_type: "line", page_id: pageId, x: 15, y: ly, x2: sw - 15, y2: ly, border_color: "#1E3A5F", border_width: 1, z_index: 3 });
    ly -= 15;
  };

  lSec("CONTACT");
  [EMAIL, PHONE, LOCATION, LINKEDIN].forEach(t => {
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: t, x: 15, y: ly, width: sw - 30, height: 10, font_size: 7.5, font_name: "Helvetica", text_color: "#CBD5E1", z_index: 3 });
    ly -= 15;
  });
  ly -= 10;

  // Radar chart!
  lSec("SKILL MATRIX");
  const cx = sw / 2, cy = ly - 45, rad = 45;
  const skillPts: number[] = [];
  const gridPts: number[] = [];
  SKILLS.forEach((skill, i) => {
    const angle = i * (2 * Math.PI / SKILLS.length) - Math.PI / 2;
    const val = [0.92, 0.88, 0.84, 0.91, 0.80][i] || 0.8;
    skillPts.push(cx + rad * val * Math.cos(angle), cy + rad * val * Math.sin(angle));
    gridPts.push(cx + rad * Math.cos(angle), cy + rad * Math.sin(angle));
    const lx2 = cx + (rad + 18) * Math.cos(angle);
    const ty = cy + (rad + 18) * Math.sin(angle);
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: skill.split(" ")[0], x: lx2 - 15, y: ty - 4, width: 30, height: 10, font_size: 6, font_name: "Helvetica-Bold", text_color: "#94A3B8", align: "center", z_index: 4 });
  });
  els.push({ id: gid(), element_type: "shape", shape_type: "polygon", page_id: pageId, points: gridPts, fill_color: "transparent", border_color: "#1E3A5F", border_width: 0.8, x: 0, y: 0, z_index: 3 });
  els.push({ id: gid(), element_type: "shape", shape_type: "polygon", page_id: pageId, points: skillPts, fill_color: "#3B82F633", border_color: "#3B82F6", border_width: 1.5, x: 0, y: 0, z_index: 4 });
  ly -= 110;

  // Main right content
  const mx = sw + 25, mw = 612 - sw - 40;
  let ry = 640;
  const mSec = (t: string) => {
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: t, x: mx, y: ry, width: mw, height: 12, font_size: 9, font_name: "Helvetica-Bold", text_color: ACC, bold: true, z_index: 3 });
    ry -= 4;
    els.push({ id: gid(), element_type: "shape", shape_type: "line", page_id: pageId, x: mx, y: ry, x2: mx + mw, y2: ry, border_color: "#1E3A5F", border_width: 1.2, z_index: 3 });
    ry -= 15;
  };

  mSec("PROFILE SUMMARY");
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: SUMMARY, x: mx, y: ry - 25, width: mw, height: 35, font_size: 8.5, font_name: "Helvetica", text_color: "#475569", line_height: 1.4, z_index: 3 });
  ry -= 45;

  mSec("WORK EXPERIENCE");
  [[EXP1_ROLE, EXP1_DATE, EXP1_DESC], [EXP2_ROLE, EXP2_DATE, EXP2_DESC]].forEach(([role, date, desc]) => {
    els.push({ id: gid(), element_type: "shape", shape_type: "rectangle", page_id: pageId, x: mx, y: ry - 8, width: 3, height: 12, fill_color: ACC, border_width: 0, z_index: 4 });
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: role, x: mx + 10, y: ry, width: mw - 110, height: 11, font_size: 9.5, font_name: "Helvetica-Bold", text_color: "#111827", bold: true, z_index: 3 });
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: date, x: mx + mw - 110, y: ry, width: 110, height: 10, font_size: 8.5, font_name: "Helvetica", text_color: "#94A3B8", align: "right", z_index: 3 });
    ry -= 18;
    const h = desc.split("\n").length * 13;
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: desc, x: mx + 10, y: ry - h + 13, width: mw - 10, height: h, font_size: 8.5, font_name: "Helvetica", text_color: "#374151", line_height: 1.4, z_index: 3 });
    ry -= h + 15;
  });

  mSec("EDUCATION");
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: EDU_TITLE, x: mx, y: ry, width: mw, height: 11, font_size: 9.5, font_name: "Helvetica-Bold", text_color: "#111827", bold: true, z_index: 3 });
  ry -= 15;
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: EDU_SCHOOL, x: mx, y: ry, width: mw, height: 10, font_size: 8.5, font_name: "Helvetica", text_color: "#6B7280", z_index: 3 });

  return els;
}

// ─────────────────────────────────────────────────────────────────────────────
// TEMPLATE 6 — Solar Flare
// ─────────────────────────────────────────────────────────────────────────────
function solarFlare(pageId: string, wizardData?: any): Partial<EditorElement>[] {
  const { NAME, TITLE, EMAIL, PHONE, LOCATION, LINKEDIN, SUMMARY, EXP1_ROLE, EXP1_DATE, EXP1_DESC, EXP2_ROLE, EXP2_DATE, EXP2_DESC, EDU_TITLE, EDU_SCHOOL, SKILLS } = getTemplateData(wizardData);
  const els: Partial<EditorElement>[] = [];
  const ACC = "#F59E0B";

  // Diagonal header shape
  els.push({ id: gid(), element_type: "shape", shape_type: "polygon", page_id: pageId,
    points: [0, 792, 612, 792, 612, 792 - 90, 0, 792 - 130],
    fill_color: "#78350F", border_width: 0, x: 0, y: 0, z_index: 0 });
  els.push({ id: gid(), element_type: "shape", shape_type: "polygon", page_id: pageId,
    points: [0, 792, 612, 792, 612, 792 - 100, 0, 792 - 140],
    fill_color: ACC, border_width: 0, x: 0, y: 0, z_index: 1 });

  els.push({ id: gid(), element_type: "text", page_id: pageId, text: NAME, x: 45, y: 730, width: 420, height: 24, font_size: 24, font_name: "Helvetica-Bold", text_color: "#1C1917", bold: true, z_index: 3 });
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: TITLE, x: 45, y: 710, width: 420, height: 14, font_size: 11, font_name: "Helvetica", text_color: "#1C1917", z_index: 3 });
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: `${EMAIL}  ·  ${PHONE}  ·  ${LOCATION}`, x: 45, y: 640, width: 522, height: 11, font_size: 9, font_name: "Helvetica", text_color: "#57534E", z_index: 3 });

  // Left column
  const lx = 45, lw = 230, rx = 310, rw = 257;
  let ly = 600, ry = 600;

  const lSec = (t: string) => {
    els.push({ id: gid(), element_type: "shape", shape_type: "rectangle", page_id: pageId, x: lx, y: ly - 14, width: lw, height: 16, fill_color: "#FEF3C7", border_width: 0, border_radius: 4, z_index: 2 });
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: t, x: lx + 8, y: ly - 10, width: lw - 16, height: 11, font_size: 8.5, font_name: "Helvetica-Bold", text_color: "#92400E", bold: true, z_index: 3 });
    ly -= 30;
  };
  const rSec = (t: string) => {
    els.push({ id: gid(), element_type: "shape", shape_type: "rectangle", page_id: pageId, x: rx, y: ry - 14, width: rw, height: 16, fill_color: "#FEF3C7", border_width: 0, border_radius: 4, z_index: 2 });
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: t, x: rx + 8, y: ry - 10, width: rw - 16, height: 11, font_size: 8.5, font_name: "Helvetica-Bold", text_color: "#92400E", bold: true, z_index: 3 });
    ry -= 30;
  };

  lSec("ABOUT ME");
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: SUMMARY, x: lx, y: ly - 35, width: lw, height: 45, font_size: 8.5, font_name: "Helvetica", text_color: "#374151", line_height: 1.4, z_index: 3 });
  ly -= 50;

  lSec("SKILLS");
  SKILLS.forEach((skill, i) => {
    const pct = [0.94, 0.88, 0.84, 0.91, 0.80][i] || 0.8;
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: skill, x: lx, y: ly, width: lw, height: 10, font_size: 8, font_name: "Helvetica-Bold", text_color: "#1C1917", z_index: 3 });
    ly -= 5;
    els.push({ id: gid(), element_type: "shape", shape_type: "rectangle", page_id: pageId, x: lx, y: ly - 6, width: lw, height: 6, fill_color: "#FEF3C7", border_width: 0, border_radius: 3, z_index: 3 });
    els.push({ id: gid(), element_type: "shape", shape_type: "rectangle", page_id: pageId, x: lx, y: ly - 6, width: lw * pct, height: 6, fill_color: ACC, border_width: 0, border_radius: 3, z_index: 4 });
    ly -= 15;
  });

  // Vertical divider
  els.push({ id: gid(), element_type: "shape", shape_type: "line", page_id: pageId, x: 290, y: 610, x2: 290, y2: 50, border_color: "#E7E5E4", border_width: 1, z_index: 2 });

  rSec("EXPERIENCE");
  [[EXP1_ROLE, EXP1_DATE, EXP1_DESC], [EXP2_ROLE, EXP2_DATE, EXP2_DESC]].forEach(([role, date, desc]) => {
    els.push({ id: gid(), element_type: "shape", shape_type: "circle", page_id: pageId, x: rx - 14, y: ry + 4, width: 8, height: 8, fill_color: ACC, border_width: 0, z_index: 4 });
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: role, x: rx, y: ry, width: rw, height: 11, font_size: 9, font_name: "Helvetica-Bold", text_color: "#1C1917", bold: true, z_index: 3 });
    ry -= 15;
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: date, x: rx, y: ry, width: rw, height: 10, font_size: 8, font_name: "Helvetica", text_color: "#B45309", z_index: 3 });
    ry -= 15;
    const h = desc.split("\n").length * 12;
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: desc, x: rx, y: ry - h + 12, width: rw, height: h, font_size: 8, font_name: "Helvetica", text_color: "#374151", line_height: 1.4, z_index: 3 });
    ry -= h + 15;
  });

  rSec("EDUCATION");
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: EDU_TITLE, x: rx, y: ry, width: rw, height: 11, font_size: 9, font_name: "Helvetica-Bold", text_color: "#1C1917", bold: true, z_index: 3 });
  ry -= 15;
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: EDU_SCHOOL, x: rx, y: ry, width: rw, height: 10, font_size: 8, font_name: "Helvetica", text_color: "#57534E", z_index: 3 });

  return els;
}

// ─────────────────────────────────────────────────────────────────────────────
// TEMPLATE 7 — Crystal Clean
// ─────────────────────────────────────────────────────────────────────────────
function crystalClean(pageId: string, wizardData?: any): Partial<EditorElement>[] {
  const { NAME, TITLE, EMAIL, PHONE, LOCATION, LINKEDIN, SUMMARY, EXP1_ROLE, EXP1_DATE, EXP1_DESC, EXP2_ROLE, EXP2_DATE, EXP2_DESC, EDU_TITLE, EDU_SCHOOL, SKILLS } = getTemplateData(wizardData);
  const els: Partial<EditorElement>[] = [];
  const ACC = "#7C3AED";

  // Top accent bar
  els.push({ id: gid(), element_type: "shape", shape_type: "rectangle", page_id: pageId, x: 0, y: 792 - 6, width: 612, height: 6, fill_color: ACC, border_width: 0, z_index: 0 });

  els.push({ id: gid(), element_type: "text", page_id: pageId, text: NAME, x: 50, y: 730, width: 400, height: 26, font_size: 24, font_name: "Helvetica-Bold", text_color: "#1E1B4B", bold: true, z_index: 2 });
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: TITLE, x: 50, y: 710, width: 400, height: 14, font_size: 11, font_name: "Helvetica", text_color: "#7C3AED", z_index: 2 });
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: `${EMAIL}  ·  ${PHONE}  ·  ${LOCATION}  ·  ${LINKEDIN}`, x: 50, y: 685, width: 512, height: 11, font_size: 8.5, font_name: "Helvetica", text_color: "#6B7280", z_index: 2 });
  els.push({ id: gid(), element_type: "shape", shape_type: "line", page_id: pageId, x: 50, y: 670, x2: 562, y2: 670, border_color: "#EDE9FE", border_width: 1.5, z_index: 2 });

  let y = 635;
  const section = (title: string) => {
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: title, x: 50, y: y, width: 150, height: 12, font_size: 9, font_name: "Helvetica-Bold", text_color: ACC, bold: true, z_index: 3 });
    y -= 5;
    els.push({ id: gid(), element_type: "shape", shape_type: "line", page_id: pageId, x: 50, y: y, x2: 562, y2: y, border_color: "#EDE9FE", border_width: 1, z_index: 2 });
    y -= 15;
  };

  section("PROFILE SUMMARY");
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: SUMMARY, x: 50, y: y - 25, width: 512, height: 35, font_size: 9, font_name: "Helvetica", text_color: "#374151", line_height: 1.5, z_index: 3 });
  y -= 45;

  section("CORE SKILLS");
  let pillX = 50;
  SKILLS.forEach((skill) => {
    const pw = skill.length * 6.2 + 16;
    els.push({ id: gid(), element_type: "shape", shape_type: "rectangle", page_id: pageId, x: pillX, y: y - 16, width: pw, height: 16, fill_color: "#EDE9FE", border_color: "#C4B5FD", border_width: 1, border_radius: 8, z_index: 3 });
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: skill, x: pillX, y: y - 12, width: pw, height: 10, font_size: 7.5, font_name: "Helvetica-Bold", text_color: ACC, align: "center", z_index: 4 });
    pillX += pw + 8;
  });
  y -= 35;

  section("WORK EXPERIENCE");
  [[EXP1_ROLE, EXP1_DATE, EXP1_DESC], [EXP2_ROLE, EXP2_DATE, EXP2_DESC]].forEach(([role, date, desc]) => {
    const h = desc.split("\n").length * 13;
    const boxH = h + 25;
    els.push({ id: gid(), element_type: "shape", shape_type: "rectangle", page_id: pageId, x: 50, y: y - boxH, width: 512, height: boxH + 10, fill_color: "#FAFAFA", border_color: "#EDE9FE", border_width: 1, border_radius: 4, z_index: 2 });
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: role, x: 60, y: y - 5, width: 380, height: 11, font_size: 9.5, font_name: "Helvetica-Bold", text_color: "#1E1B4B", bold: true, z_index: 3 });
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: date, x: 410, y: y - 5, width: 140, height: 10, font_size: 8.5, font_name: "Helvetica", text_color: "#9CA3AF", align: "right", z_index: 3 });
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: desc, x: 60, y: y - h - 15, width: 492, height: h, font_size: 8.5, font_name: "Helvetica", text_color: "#374151", line_height: 1.4, z_index: 3 });
    y -= boxH + 20;
  });

  section("EDUCATION");
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: EDU_TITLE, x: 50, y: y, width: 400, height: 11, font_size: 9.5, font_name: "Helvetica-Bold", text_color: "#1E1B4B", bold: true, z_index: 3 });
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: EDU_SCHOOL, x: 50, y: y - 15, width: 400, height: 10, font_size: 8.5, font_name: "Helvetica", text_color: "#6B7280", z_index: 3 });

  return els;
}

// ─────────────────────────────────────────────────────────────────────────────
// TEMPLATE 8 — Slate Impact
// ─────────────────────────────────────────────────────────────────────────────
function slateImpact(pageId: string, wizardData?: any): Partial<EditorElement>[] {
  const { NAME, TITLE, EMAIL, PHONE, LOCATION, LINKEDIN, SUMMARY, EXP1_ROLE, EXP1_DATE, EXP1_DESC, EXP2_ROLE, EXP2_DATE, EXP2_DESC, EDU_TITLE, EDU_SCHOOL, SKILLS } = getTemplateData(wizardData);
  const els: Partial<EditorElement>[] = [];
  const ACC = "#0EA5E9";
  const rsw = 200;
  const rx = 612 - rsw;

  // Right sidebar (y=0)
  els.push({ id: gid(), element_type: "shape", shape_type: "rectangle", page_id: pageId, x: rx, y: 0, width: rsw, height: 792, fill_color: "#0C4A6E", border_width: 0, z_index: 0 });
  els.push({ id: gid(), element_type: "shape", shape_type: "rectangle", page_id: pageId, x: rx, y: 792 - 100, width: rsw, height: 100, fill_color: "#075985", border_width: 0, z_index: 1 });

  // Left main header
  els.push({ id: gid(), element_type: "shape", shape_type: "rectangle", page_id: pageId, x: 0, y: 792 - 100, width: rx, height: 100, fill_color: "#F0F9FF", border_width: 0, z_index: 0 });

  els.push({ id: gid(), element_type: "text", page_id: pageId, text: NAME, x: 35, y: 740, width: rx - 50, height: 26, font_size: 22, font_name: "Helvetica-Bold", text_color: "#0C4A6E", bold: true, z_index: 2 });
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: TITLE, x: 35, y: 720, width: rx - 50, height: 14, font_size: 11, font_name: "Helvetica", text_color: "#0369A1", z_index: 2 });
  els.push({ id: gid(), element_type: "shape", shape_type: "line", page_id: pageId, x: 35, y: 670, x2: rx - 20, y2: 670, border_color: "#BAE6FD", border_width: 1.5, z_index: 2 });
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: `${EMAIL}  ·  ${PHONE}  ·  ${LOCATION}`, x: 35, y: 650, width: rx - 50, height: 11, font_size: 8.5, font_name: "Helvetica", text_color: "#374151", z_index: 2 });

  let ly = 600;
  const lSec = (t: string) => {
    els.push({ id: gid(), element_type: "shape", shape_type: "rectangle", page_id: pageId, x: 35, y: ly - 4, width: 3, height: 16, fill_color: ACC, border_width: 0, z_index: 2 });
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: t, x: 45, y: ly, width: rx - 60, height: 12, font_size: 9, font_name: "Helvetica-Bold", text_color: "#0C4A6E", bold: true, z_index: 3 });
    ly -= 8;
    els.push({ id: gid(), element_type: "shape", shape_type: "line", page_id: pageId, x: 35, y: ly, x2: rx - 20, y2: ly, border_color: "#E0F2FE", border_width: 1, z_index: 2 });
    ly -= 15;
  };

  lSec("PROFILE SUMMARY");
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: SUMMARY, x: 35, y: ly - 25, width: rx - 55, height: 35, font_size: 8.8, font_name: "Helvetica", text_color: "#374151", line_height: 1.5, z_index: 3 });
  ly -= 45;

  lSec("WORK EXPERIENCE");
  [[EXP1_ROLE, EXP1_DATE, EXP1_DESC], [EXP2_ROLE, EXP2_DATE, EXP2_DESC]].forEach(([role, date, desc]) => {
    els.push({ id: gid(), element_type: "shape", shape_type: "circle", page_id: pageId, x: 35, y: ly + 4, width: 8, height: 8, fill_color: ACC, border_width: 0, z_index: 4 });
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: role, x: 48, y: ly, width: rx - 160, height: 11, font_size: 9.5, font_name: "Helvetica-Bold", text_color: "#0C4A6E", bold: true, z_index: 3 });
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: date, x: rx - 120, y: ly, width: 100, height: 10, font_size: 8.5, font_name: "Helvetica", text_color: "#0369A1", align: "right", z_index: 3 });
    ly -= 15;
    const h = desc.split("\n").length * 13;
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: desc, x: 48, y: ly - h + 13, width: rx - 68, height: h, font_size: 8.5, font_name: "Helvetica", text_color: "#374151", line_height: 1.4, z_index: 3 });
    ly -= h + 15;
  });

  lSec("EDUCATION");
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: EDU_TITLE, x: 35, y: ly, width: rx - 55, height: 11, font_size: 9.5, font_name: "Helvetica-Bold", text_color: "#0C4A6E", bold: true, z_index: 3 });
  ly -= 15;
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: EDU_SCHOOL, x: 35, y: ly, width: rx - 55, height: 10, font_size: 8.5, font_name: "Helvetica", text_color: "#4B5563", z_index: 3 });

  // Right sidebar content
  let rsy = 640;
  const rSec = (t: string) => {
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: t, x: rx + 15, y: rsy, width: rsw - 30, height: 11, font_size: 8, font_name: "Helvetica-Bold", text_color: "#BAE6FD", z_index: 3 });
    rsy -= 5;
    els.push({ id: gid(), element_type: "shape", shape_type: "line", page_id: pageId, x: rx + 15, y: rsy, x2: 612 - 15, y2: rsy, border_color: "#075985", border_width: 1, z_index: 3 });
    rsy -= 15;
  };

  rSec("CONTACT");
  [EMAIL, PHONE, LOCATION, LINKEDIN].forEach(t => {
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: t, x: rx + 15, y: rsy, width: rsw - 30, height: 10, font_size: 7.5, font_name: "Helvetica", text_color: "#E0F2FE", z_index: 3 });
    rsy -= 15;
  });
  rsy -= 10;

  rSec("CORE SKILLS");
  SKILLS.forEach((skill, i) => {
    const pct = [0.92, 0.88, 0.84, 0.91, 0.80][i] || 0.8;
    const bw = rsw - 30;
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: skill, x: rx + 15, y: rsy, width: bw, height: 10, font_size: 7.5, font_name: "Helvetica-Bold", text_color: "#E0F2FE", z_index: 3 });
    rsy -= 5;
    els.push({ id: gid(), element_type: "shape", shape_type: "rectangle", page_id: pageId, x: rx + 15, y: rsy - 5, width: bw, height: 5, fill_color: "#075985", border_width: 0, border_radius: 2, z_index: 3 });
    els.push({ id: gid(), element_type: "shape", shape_type: "rectangle", page_id: pageId, x: rx + 15, y: rsy - 5, width: bw * pct, height: 5, fill_color: ACC, border_width: 0, border_radius: 2, z_index: 4 });
    rsy -= 15;
  });

  return els;
}

// ─────────────────────────────────────────────────────────────────────────────
// TEMPLATE 9 — Charcoal Minimal
// ─────────────────────────────────────────────────────────────────────────────
function charcoalMinimal(pageId: string, wizardData?: any): Partial<EditorElement>[] {
  const { NAME, TITLE, EMAIL, PHONE, LOCATION, LINKEDIN, SUMMARY, EXP1_ROLE, EXP1_DATE, EXP1_DESC, EXP2_ROLE, EXP2_DATE, EXP2_DESC, EDU_TITLE, EDU_SCHOOL, SKILLS } = getTemplateData(wizardData);
  const els: Partial<EditorElement>[] = [];
  const ACC = "#18181B";

  els.push({ id: gid(), element_type: "shape", shape_type: "rectangle", page_id: pageId, x: 40, y: 792 - 40 - 5, width: 532, height: 5, fill_color: ACC, border_width: 0, z_index: 0 });

  els.push({ id: gid(), element_type: "text", page_id: pageId, text: NAME, x: 40, y: 700, width: 532, height: 26, font_size: 26, font_name: "Helvetica-Bold", text_color: ACC, bold: true, align: "center", z_index: 2 });
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: TITLE.toUpperCase(), x: 40, y: 680, width: 532, height: 14, font_size: 10, font_name: "Helvetica", text_color: "#71717A", align: "center", letter_spacing: 2, z_index: 2 });
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: `${EMAIL}   ${PHONE}   ${LOCATION}`, x: 40, y: 660, width: 532, height: 11, font_size: 8.5, font_name: "Helvetica", text_color: "#A1A1AA", align: "center", z_index: 2 });
  els.push({ id: gid(), element_type: "shape", shape_type: "line", page_id: pageId, x: 40, y: 650, x2: 572, y2: 650, border_color: "#E4E4E7", border_width: 1, z_index: 2 });

  let y = 620;
  const section = (title: string) => {
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: title, x: 40, y: y, width: 532, height: 12, font_size: 8.5, font_name: "Helvetica-Bold", text_color: "#A1A1AA", bold: true, letter_spacing: 2, z_index: 3 });
    y -= 5;
    els.push({ id: gid(), element_type: "shape", shape_type: "line", page_id: pageId, x: 40, y: y, x2: 572, y2: y, border_color: "#E4E4E7", border_width: 1, z_index: 2 });
    y -= 15;
  };

  section("SUMMARY");
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: SUMMARY, x: 40, y: y - 30, width: 532, height: 35, font_size: 9, font_name: "Helvetica", text_color: "#3F3F46", line_height: 1.55, z_index: 3 });
  y -= 45;

  section("EXPERIENCE");
  [[EXP1_ROLE, EXP1_DATE, EXP1_DESC], [EXP2_ROLE, EXP2_DATE, EXP2_DESC]].forEach(([role, date, desc]) => {
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: role, x: 40, y: y, width: 380, height: 11, font_size: 10, font_name: "Helvetica-Bold", text_color: ACC, bold: true, z_index: 3 });
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: date, x: 430, y: y, width: 142, height: 10, font_size: 8.5, font_name: "Helvetica", text_color: "#A1A1AA", align: "right", z_index: 3 });
    y -= 15;
    const h = desc.split("\n").length * 13;
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: desc, x: 52, y: y - h + 13, width: 520, height: h, font_size: 8.5, font_name: "Helvetica", text_color: "#52525B", line_height: 1.4, z_index: 3 });
    y -= h + 15;
  });

  section("EDUCATION");
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: EDU_TITLE, x: 40, y: y, width: 400, height: 11, font_size: 10, font_name: "Helvetica-Bold", text_color: ACC, bold: true, z_index: 3 });
  y -= 15;
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: EDU_SCHOOL, x: 40, y: y, width: 400, height: 10, font_size: 8.5, font_name: "Helvetica", text_color: "#71717A", z_index: 3 });
  y -= 25;

  section("SKILLS");
  let px = 40;
  SKILLS.forEach(skill => {
    const pw = skill.length * 6.5 + 18;
    els.push({ id: gid(), element_type: "shape", shape_type: "rectangle", page_id: pageId, x: px, y: y - 16, width: pw, height: 16, fill_color: "transparent", border_color: ACC, border_width: 1, border_radius: 3, z_index: 3 });
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: skill, x: px, y: y - 12, width: pw, height: 10, font_size: 7.5, font_name: "Helvetica-Bold", text_color: ACC, align: "center", z_index: 4 });
    px += pw + 8;
  });

  return els;
}

// ─────────────────────────────────────────────────────────────────────────────
// TEMPLATE 10 — Rose Gold
// ─────────────────────────────────────────────────────────────────────────────
function roseGold(pageId: string, wizardData?: any): Partial<EditorElement>[] {
  const { NAME, TITLE, EMAIL, PHONE, LOCATION, LINKEDIN, SUMMARY, EXP1_ROLE, EXP1_DATE, EXP1_DESC, EXP2_ROLE, EXP2_DATE, EXP2_DESC, EDU_TITLE, EDU_SCHOOL, SKILLS } = getTemplateData(wizardData);
  const els: Partial<EditorElement>[] = [];
  const ACC = "#BE185D";
  const sw = 205;

  els.push({ id: gid(), element_type: "shape", shape_type: "rectangle", page_id: pageId, x: 0, y: 0, width: sw, height: 792, fill_color: "#FFF1F2", border_width: 0, z_index: 0 });
  els.push({ id: gid(), element_type: "shape", shape_type: "rectangle", page_id: pageId, x: 0, y: 0, width: 5, height: 792, fill_color: ACC, border_width: 0, z_index: 1 });
  els.push({ id: gid(), element_type: "shape", shape_type: "rectangle", page_id: pageId, x: 0, y: 792 - 140, width: sw, height: 140, fill_color: "#FFE4E6", border_width: 0, z_index: 1 });

  // Monogram circle
  els.push({ id: gid(), element_type: "shape", shape_type: "circle", page_id: pageId, x: sw / 2, y: 720, width: 110, height: 110, fill_color: "#FFF1F2", border_width: 3, border_color: ACC, z_index: 2 });
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: "AM", x: sw/2 - 55, y: 706, width: 110, height: 110, font_size: 36, font_name: "Helvetica-Bold", text_color: ACC, align: "center", bold: true, z_index: 3 });

  els.push({ id: gid(), element_type: "text", page_id: pageId, text: "ALEX", x: 15, y: 630, width: sw - 30, height: 18, font_size: 14, font_name: "Helvetica-Bold", text_color: "#881337", align: "center", bold: true, z_index: 2 });
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: "MERCER", x: 15, y: 610, width: sw - 30, height: 18, font_size: 14, font_name: "Helvetica-Bold", text_color: ACC, align: "center", bold: true, z_index: 2 });
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: TITLE, x: 15, y: 590, width: sw - 30, height: 12, font_size: 8, font_name: "Helvetica", text_color: "#9F1239", align: "center", z_index: 2 });

  let ly = 550;
  const lSec = (t: string) => {
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: t, x: 20, y: ly, width: sw - 40, height: 11, font_size: 8, font_name: "Helvetica-Bold", text_color: ACC, z_index: 3 });
    ly -= 4;
    els.push({ id: gid(), element_type: "shape", shape_type: "line", page_id: pageId, x: 20, y: ly, x2: sw - 20, y2: ly, border_color: "#FECDD3", border_width: 1, z_index: 3 });
    ly -= 15;
  };

  lSec("CONTACT");
  [EMAIL, PHONE, LOCATION].forEach(t => {
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: t, x: 20, y: ly, width: sw - 40, height: 10, font_size: 7.5, font_name: "Helvetica", text_color: "#4C0519", z_index: 3 });
    ly -= 15;
  });
  ly -= 10;

  lSec("SKILLS");
  SKILLS.forEach((skill, i) => {
    const pct = [0.94, 0.88, 0.84, 0.91, 0.80][i] || 0.8;
    const bw = sw - 40;
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: skill, x: 20, y: ly, width: bw, height: 10, font_size: 7.5, font_name: "Helvetica-Bold", text_color: "#881337", z_index: 3 });
    ly -= 5;
    els.push({ id: gid(), element_type: "shape", shape_type: "rectangle", page_id: pageId, x: 20, y: ly - 5, width: bw, height: 5, fill_color: "#FECDD3", border_width: 0, border_radius: 2, z_index: 3 });
    els.push({ id: gid(), element_type: "shape", shape_type: "rectangle", page_id: pageId, x: 20, y: ly - 5, width: bw * pct, height: 5, fill_color: ACC, border_width: 0, border_radius: 2, z_index: 4 });
    ly -= 15;
  });

  // Main content
  const mx = sw + 25, mw = 612 - sw - 40;
  let ry = 720;
  const mSec = (t: string) => {
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: t, x: mx, y: ry, width: mw, height: 12, font_size: 9, font_name: "Helvetica-Bold", text_color: ACC, bold: true, z_index: 3 });
    ry -= 4;
    els.push({ id: gid(), element_type: "shape", shape_type: "line", page_id: pageId, x: mx, y: ry, x2: mx + mw, y2: ry, border_color: "#FECDD3", border_width: 1.2, z_index: 3 });
    ry -= 15;
  };

  mSec("PROFILE SUMMARY");
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: SUMMARY, x: mx, y: ry - 25, width: mw, height: 35, font_size: 8.8, font_name: "Helvetica", text_color: "#374151", line_height: 1.4, z_index: 3 });
  ry -= 45;

  mSec("WORK EXPERIENCE");
  [[EXP1_ROLE, EXP1_DATE, EXP1_DESC], [EXP2_ROLE, EXP2_DATE, EXP2_DESC]].forEach(([role, date, desc]) => {
    els.push({ id: gid(), element_type: "shape", shape_type: "circle", page_id: pageId, x: mx, y: ry + 4, width: 8, height: 8, fill_color: "#FECDD3", border_width: 2, border_color: ACC, z_index: 4 });
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: role, x: mx + 15, y: ry, width: mw - 125, height: 11, font_size: 9.5, font_name: "Helvetica-Bold", text_color: "#1C1917", bold: true, z_index: 3 });
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: date, x: mx + mw - 110, y: ry, width: 110, height: 10, font_size: 8.5, font_name: "Helvetica", text_color: "#BE185D", align: "right", z_index: 3 });
    ry -= 18;
    const h = desc.split("\n").length * 13;
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: desc, x: mx + 15, y: ry - h + 13, width: mw - 15, height: h, font_size: 8.5, font_name: "Helvetica", text_color: "#374151", line_height: 1.4, z_index: 3 });
    ry -= h + 15;
  });

  mSec("EDUCATION");
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: EDU_TITLE, x: mx, y: ry, width: mw, height: 11, font_size: 9.5, font_name: "Helvetica-Bold", text_color: "#1C1917", bold: true, z_index: 3 });
  ry -= 15;
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: EDU_SCHOOL, x: mx, y: ry, width: mw, height: 10, font_size: 8.5, font_name: "Helvetica", text_color: "#6B7280", z_index: 3 });

  return els;
}

// ─────────────────────────────────────────────────────────────────────────────
// TEMPLATE 11 — Neon Coder
// ─────────────────────────────────────────────────────────────────────────────
function neonCoder(pageId: string, wizardData?: any): Partial<EditorElement>[] {
  const { NAME, TITLE, EMAIL, PHONE, LOCATION, LINKEDIN, SUMMARY, EXP1_ROLE, EXP1_DATE, EXP1_DESC, EXP2_ROLE, EXP2_DATE, EXP2_DESC, EDU_TITLE, EDU_SCHOOL, SKILLS } = getTemplateData(wizardData);
  const els: Partial<EditorElement>[] = [];
  const ACC = "#22C55E";
  const BG = "#09090B";

  // Full background
  els.push({ id: gid(), element_type: "shape", shape_type: "rectangle", page_id: pageId, x: 0, y: 0, width: 612, height: 792, fill_color: BG, border_width: 0, z_index: 0 });
  // Header
  els.push({ id: gid(), element_type: "shape", shape_type: "rectangle", page_id: pageId, x: 0, y: 792 - 120, width: 612, height: 120, fill_color: "#052E16", border_width: 0, z_index: 1 });
  // Neon accent line
  els.push({ id: gid(), element_type: "shape", shape_type: "rectangle", page_id: pageId, x: 0, y: 792 - 122, width: 612, height: 2, fill_color: ACC, border_width: 0, z_index: 2 });

  els.push({ id: gid(), element_type: "text", page_id: pageId, text: `> ${NAME.toLowerCase().replace(" ", "_")}`, x: 30, y: 740, width: 450, height: 22, font_size: 20, font_name: "Courier", text_color: ACC, bold: true, z_index: 3 });
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: `// ${TITLE}`, x: 30, y: 720, width: 450, height: 14, font_size: 11, font_name: "Courier", text_color: "#86EFAC", z_index: 3 });
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: `${EMAIL}  |  ${PHONE}  |  ${LINKEDIN}`, x: 30, y: 690, width: 552, height: 11, font_size: 8.5, font_name: "Courier", text_color: "#4ADE80", z_index: 3 });

  // Two column
  const lx = 30, lw = 245, rx = 315, rw = 267;
  let ly = 630, ry = 630;

  const lSec = (t: string) => {
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: `/* ${t} */`, x: lx, y: ly, width: lw, height: 12, font_size: 8.5, font_name: "Courier", text_color: "#4ADE80", z_index: 3 });
    ly -= 15;
  };
  const rSec = (t: string) => {
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: `/* ${t} */`, x: rx, y: ry, width: rw, height: 12, font_size: 8.5, font_name: "Courier", text_color: "#4ADE80", z_index: 3 });
    ry -= 15;
  };

  lSec("SUMMARY");
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: SUMMARY, x: lx, y: ly - 35, width: lw, height: 45, font_size: 8.5, font_name: "Courier", text_color: "#A1A1AA", line_height: 1.4, z_index: 3 });
  ly -= 55;

  lSec("SKILLS");
  SKILLS.forEach((skill, i) => {
    const pct = [0.92, 0.88, 0.84, 0.91, 0.80][i] || 0.8;
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: `> ${skill}`, x: lx, y: ly, width: lw, height: 10, font_size: 8, font_name: "Courier", text_color: "#86EFAC", z_index: 3 });
    ly -= 5;
    els.push({ id: gid(), element_type: "shape", shape_type: "rectangle", page_id: pageId, x: lx, y: ly - 5, width: lw, height: 5, fill_color: "#052E16", border_width: 1, border_color: "#166534", border_radius: 0, z_index: 3 });
    els.push({ id: gid(), element_type: "shape", shape_type: "rectangle", page_id: pageId, x: lx, y: ly - 5, width: lw * pct, height: 5, fill_color: ACC, border_width: 0, border_radius: 0, z_index: 4 });
    ly -= 15;
  });

  // Vertical separator (code-style)
  els.push({ id: gid(), element_type: "shape", shape_type: "line", page_id: pageId, x: 300, y: 640, x2: 300, y2: 40, border_color: "#166534", border_width: 1, z_index: 2 });

  rSec("EXPERIENCE");
  [[EXP1_ROLE, EXP1_DATE, EXP1_DESC], [EXP2_ROLE, EXP2_DATE, EXP2_DESC]].forEach(([role, date, desc]) => {
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: `> ${role}`, x: rx, y: ry, width: rw, height: 11, font_size: 9, font_name: "Courier", text_color: "#FFFFFF", bold: true, z_index: 3 });
    ry -= 15;
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: `// ${date}`, x: rx, y: ry, width: rw, height: 10, font_size: 8, font_name: "Courier", text_color: "#4ADE80", z_index: 3 });
    ry -= 15;
    const h = desc.split("\n").length * 12;
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: desc, x: rx + 6, y: ry - h + 12, width: rw - 6, height: h, font_size: 8, font_name: "Courier", text_color: "#A1A1AA", line_height: 1.4, z_index: 3 });
    ry -= h + 20;
  });

  rSec("EDUCATION");
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: EDU_TITLE, x: rx, y: ry, width: rw, height: 11, font_size: 9, font_name: "Courier", text_color: "#FFFFFF", bold: true, z_index: 3 });
  ry -= 15;
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: EDU_SCHOOL, x: rx, y: ry, width: rw, height: 10, font_size: 8, font_name: "Courier", text_color: "#86EFAC", z_index: 3 });

  return els;
}

// ─────────────────────────────────────────────────────────────────────────────
// TEMPLATE 12 — Indigo Wave
// ─────────────────────────────────────────────────────────────────────────────
function indigoWave(pageId: string, wizardData?: any): Partial<EditorElement>[] {
  const { NAME, TITLE, EMAIL, PHONE, LOCATION, LINKEDIN, SUMMARY, EXP1_ROLE, EXP1_DATE, EXP1_DESC, EXP2_ROLE, EXP2_DATE, EXP2_DESC, EDU_TITLE, EDU_SCHOOL, SKILLS } = getTemplateData(wizardData);
  const els: Partial<EditorElement>[] = [];
  const ACC = "#4F46E5";

  // Dark footer bar
  els.push({ id: gid(), element_type: "shape", shape_type: "rectangle", page_id: pageId, x: 0, y: 0, width: 612, height: 45, fill_color: "#1E1B4B", border_width: 0, z_index: 0 });
  // Header block
  els.push({ id: gid(), element_type: "shape", shape_type: "rectangle", page_id: pageId, x: 0, y: 792 - 115, width: 612, height: 115, fill_color: "#312E81", border_width: 0, z_index: 0 });
  
  // Bezier wave under header
  els.push({ id: gid(), element_type: "shape", shape_type: "path", page_id: pageId,
    path_d: `M 0 ${792 - 115} C 150 ${792 - 100} 300 ${792 - 130} 612 ${792 - 115} L 612 ${792 - 130} C 300 ${792 - 145} 150 ${792 - 115} 0 ${792 - 130} Z`,
    fill_color: ACC, border_width: 0, x: 0, y: 0, z_index: 2 });

  els.push({ id: gid(), element_type: "text", page_id: pageId, text: NAME, x: 45, y: 735, width: 420, height: 26, font_size: 22, font_name: "Helvetica-Bold", text_color: "#F8FAFC", bold: true, z_index: 3 });
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: TITLE, x: 45, y: 715, width: 420, height: 14, font_size: 11, font_name: "Helvetica", text_color: "#A5B4FC", z_index: 3 });
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: `${EMAIL}  ·  ${PHONE}  ·  ${LOCATION}`, x: 45, y: 650, width: 522, height: 11, font_size: 8.5, font_name: "Helvetica", text_color: "#6B7280", z_index: 3 });

  let y = 600;
  const section = (title: string) => {
    els.push({ id: gid(), element_type: "shape", shape_type: "rectangle", page_id: pageId, x: 45, y: y - 14, width: 522, height: 18, fill_color: "#EEF2FF", border_width: 0, border_radius: 3, z_index: 2 });
    els.push({ id: gid(), element_type: "shape", shape_type: "rectangle", page_id: pageId, x: 45, y: y - 14, width: 4, height: 18, fill_color: ACC, border_width: 0, z_index: 3 });
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: title, x: 56, y: y - 10, width: 500, height: 12, font_size: 9, font_name: "Helvetica-Bold", text_color: ACC, bold: true, z_index: 3 });
    y -= 35;
  };

  section("PROFILE SUMMARY");
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: SUMMARY, x: 45, y: y - 25, width: 522, height: 35, font_size: 9, font_name: "Helvetica", text_color: "#374151", line_height: 1.5, z_index: 3 });
  y -= 45;

  section("WORK EXPERIENCE");
  [[EXP1_ROLE, EXP1_DATE, EXP1_DESC], [EXP2_ROLE, EXP2_DATE, EXP2_DESC]].forEach(([role, date, desc]) => {
    els.push({ id: gid(), element_type: "shape", shape_type: "circle", page_id: pageId, x: 45, y: y + 4, width: 8, height: 8, fill_color: ACC, border_width: 0, z_index: 4 });
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: role, x: 60, y: y, width: 370, height: 11, font_size: 9.5, font_name: "Helvetica-Bold", text_color: "#111827", bold: true, z_index: 3 });
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: date, x: 420, y: y, width: 147, height: 10, font_size: 8.5, font_name: "Helvetica", text_color: "#9CA3AF", align: "right", z_index: 3 });
    y -= 15;
    const h = desc.split("\n").length * 13;
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: desc, x: 60, y: y - h + 13, width: 507, height: h, font_size: 8.5, font_name: "Helvetica", text_color: "#374151", line_height: 1.4, z_index: 3 });
    y -= h + 15;
  });

  section("EDUCATION");
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: EDU_TITLE, x: 45, y: y, width: 400, height: 11, font_size: 9.5, font_name: "Helvetica-Bold", text_color: "#111827", bold: true, z_index: 3 });
  y -= 15;
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: EDU_SCHOOL, x: 45, y: y, width: 400, height: 10, font_size: 8.5, font_name: "Helvetica", text_color: "#6B7280", z_index: 3 });
  y -= 25;

  section("CORE SKILLS");
  let px = 45;
  SKILLS.forEach(skill => {
    const pw = skill.length * 6.2 + 18;
    els.push({ id: gid(), element_type: "shape", shape_type: "rectangle", page_id: pageId, x: px, y: y - 16, width: pw, height: 16, fill_color: "#EEF2FF", border_color: "#C7D2FE", border_width: 1, border_radius: 8, z_index: 3 });
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: skill, x: px, y: y - 12, width: pw, height: 10, font_size: 7.5, font_name: "Helvetica-Bold", text_color: ACC, align: "center", z_index: 4 });
    px += pw + 8;
  });

  // Footer text
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: `${LINKEDIN}  ·  Portfolio: alexmercer.dev`, x: 45, y: 15, width: 522, height: 10, font_size: 8, font_name: "Helvetica", text_color: "#A5B4FC", align: "center", z_index: 3 });

  return els;
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPORT
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// NEW TEMPLATES (13-24)
// ─────────────────────────────────────────────────────────────────────────────

// 13. Geometric Tech
function geometricTech(pageId: string, wizardData?: any): Partial<EditorElement>[] {
  const { NAME, TITLE, EMAIL, PHONE, LOCATION, LINKEDIN, SUMMARY, EXP1_ROLE, EXP1_DATE, EXP1_DESC, EXP2_ROLE, EXP2_DATE, EXP2_DESC, EDU_TITLE, EDU_SCHOOL, SKILLS } = getTemplateData(wizardData);
  const els: Partial<EditorElement>[] = [];
  
  // Background
  els.push({ id: gid(), element_type: "shape", shape_type: "rectangle", page_id: pageId, x: 0, y: 0, width: 612, height: 792, fill_color: "#0F172A", z_index: 0 });
  
  // Header Polygons
  els.push({ id: gid(), element_type: "shape", shape_type: "polygon", page_id: pageId, points: "0,0 612,0 612,180 0,120", x: 0, y: 792-180, width: 612, height: 180, fill_color: "#1E293B", z_index: 1 });
  els.push({ id: gid(), element_type: "shape", shape_type: "polygon", page_id: pageId, points: "0,120 612,180 612,190 0,140", x: 0, y: 792-190, width: 612, height: 70, fill_color: "#38BDF8", z_index: 2 });
  els.push({ id: gid(), element_type: "shape", shape_type: "polygon", page_id: pageId, points: "0,0 200,0 150,150 0,100", x: 0, y: 792-150, width: 200, height: 150, fill_color: "#818CF8", z_index: 2 });

  // Header Text
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: NAME, x: 40, y: 710, width: 500, height: 35, font_size: 32, font_name: "Helvetica-Bold", text_color: "#FFFFFF", bold: true, z_index: 3 });
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: TITLE, x: 40, y: 690, width: 500, height: 15, font_size: 12, font_name: "Helvetica", text_color: "#38BDF8", z_index: 3 });

  // Contact Strip
  let cx = 40;
  [EMAIL, PHONE, LOCATION, LINKEDIN].forEach(t => {
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: t, x: cx, y: 665, width: 130, height: 12, font_size: 9, font_name: "Helvetica", text_color: "#94A3B8", z_index: 3 });
    cx += 140;
  });

  // Body Layout
  let ly = 600;
  const section = (title: string, y_pos: number, x_pos: number, color: string = "#38BDF8") => {
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: title.toUpperCase(), x: x_pos, y: y_pos, width: 200, height: 14, font_size: 11, font_name: "Helvetica-Bold", text_color: color, bold: true, z_index: 3 });
    els.push({ id: gid(), element_type: "shape", shape_type: "line", page_id: pageId, x: x_pos, y: y_pos - 4, x2: x_pos + 40, y2: y_pos - 4, border_color: color, border_width: 2, z_index: 3 });
    return y_pos - 20;
  };

  // Left Column (Skills & Summary)
  let l_y = section("SUMMARY", ly, 40, "#818CF8");
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: SUMMARY, x: 40, y: l_y - 40, width: 180, height: 55, font_size: 9, font_name: "Helvetica", text_color: "#CBD5E1", line_height: 1.4, z_index: 3 });
  
  l_y -= 80;
  l_y = section("SKILLS", l_y, 40, "#818CF8");
  SKILLS.forEach((sk, i) => {
    els.push({ id: gid(), element_type: "shape", shape_type: "rectangle", page_id: pageId, x: 40, y: l_y - 12, width: 180, height: 20, fill_color: "#1E293B", border_radius: 4, border_width: 0, z_index: 3 });
    els.push({ id: gid(), element_type: "shape", shape_type: "rectangle", page_id: pageId, x: 40, y: l_y - 12, width: 3, height: 20, fill_color: "#38BDF8", border_radius: 0, border_width: 0, z_index: 4 });
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: sk, x: 50, y: l_y - 6, width: 160, height: 12, font_size: 9, font_name: "Helvetica-Bold", text_color: "#F8FAFC", z_index: 5 });
    l_y -= 26;
  });

  // Right Column (Experience & Ed)
  let r_y = section("EXPERIENCE", ly, 250);
  
  const addExp = (role: string, date: string, desc: string, y_start: number) => {
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: role, x: 250, y: y_start, width: 300, height: 14, font_size: 10, font_name: "Helvetica-Bold", text_color: "#F8FAFC", bold: true, z_index: 3 });
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: date, x: 250, y: y_start - 12, width: 300, height: 12, font_size: 8.5, font_name: "Helvetica", text_color: "#94A3B8", z_index: 3 });
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: desc, x: 250, y: y_start - 65, width: 320, height: 45, font_size: 9, font_name: "Helvetica", text_color: "#CBD5E1", line_height: 1.4, z_index: 3 });
    return y_start - 85;
  };
  
  r_y = addExp(EXP1_ROLE, EXP1_DATE, EXP1_DESC, r_y);
  r_y = addExp(EXP2_ROLE, EXP2_DATE, EXP2_DESC, r_y);

  r_y -= 10;
  r_y = section("EDUCATION", r_y, 250);
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: EDU_TITLE, x: 250, y: r_y, width: 300, height: 14, font_size: 10, font_name: "Helvetica-Bold", text_color: "#F8FAFC", bold: true, z_index: 3 });
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: EDU_SCHOOL, x: 250, y: r_y - 14, width: 300, height: 12, font_size: 9, font_name: "Helvetica", text_color: "#94A3B8", z_index: 3 });

  return els;
}

// 14. Elegant Scholar
function elegantScholar(pageId: string, wizardData?: any): Partial<EditorElement>[] {
  const { NAME, TITLE, EMAIL, PHONE, LOCATION, LINKEDIN, SUMMARY, EXP1_ROLE, EXP1_DATE, EXP1_DESC, EXP2_ROLE, EXP2_DATE, EXP2_DESC, EDU_TITLE, EDU_SCHOOL, SKILLS } = getTemplateData(wizardData);
  const els: Partial<EditorElement>[] = [];
  
  els.push({ id: gid(), element_type: "shape", shape_type: "rectangle", page_id: pageId, x: 0, y: 0, width: 612, height: 792, fill_color: "#FAFAFA", z_index: 0 });
  
  // Double borders
  els.push({ id: gid(), element_type: "shape", shape_type: "rectangle", page_id: pageId, x: 20, y: 20, width: 572, height: 752, fill_color: "transparent", border_color: "#111", border_width: 2, z_index: 1 });
  els.push({ id: gid(), element_type: "shape", shape_type: "rectangle", page_id: pageId, x: 24, y: 24, width: 564, height: 744, fill_color: "transparent", border_color: "#111", border_width: 0.5, z_index: 1 });

  els.push({ id: gid(), element_type: "text", page_id: pageId, text: NAME.toUpperCase(), x: 0, y: 710, width: 612, height: 35, font_size: 28, font_name: "Times-Roman", text_color: "#111", align: "center", z_index: 2 });
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: TITLE, x: 0, y: 690, width: 612, height: 16, font_size: 13, font_name: "Times-Italic", text_color: "#333", italic: true, align: "center", z_index: 2 });

  const contactStr = `${EMAIL}   |   ${PHONE}   |   ${LOCATION}   |   ${LINKEDIN}`;
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: contactStr, x: 0, y: 670, width: 612, height: 12, font_size: 9, font_name: "Times-Roman", text_color: "#444", align: "center", z_index: 2 });

  els.push({ id: gid(), element_type: "shape", shape_type: "line", page_id: pageId, x: 60, y: 655, x2: 552, y2: 655, border_color: "#111", border_width: 1, z_index: 2 });

  let curY = 620;
  const hSection = (title: string) => {
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: title.toUpperCase(), x: 60, y: curY, width: 492, height: 14, font_size: 12, font_name: "Times-Bold", text_color: "#111", bold: true, align: "center", z_index: 2 });
    els.push({ id: gid(), element_type: "shape", shape_type: "line", page_id: pageId, x: 250, y: curY - 5, x2: 362, y2: curY - 5, border_color: "#888", border_width: 0.5, z_index: 2 });
    curY -= 25;
  };

  hSection("Professional Summary");
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: SUMMARY, x: 60, y: curY - 30, width: 492, height: 45, font_size: 10, font_name: "Times-Roman", text_color: "#222", line_height: 1.5, align: "justify", z_index: 2 });
  curY -= 50;

  hSection("Experience");
  const addExp = (role: string, date: string, desc: string) => {
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: role, x: 60, y: curY, width: 400, height: 14, font_size: 11, font_name: "Times-Bold", text_color: "#111", bold: true, z_index: 2 });
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: date, x: 452, y: curY, width: 100, height: 14, font_size: 10, font_name: "Times-Italic", text_color: "#333", italic: true, align: "right", z_index: 2 });
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: desc, x: 60, y: curY - 45, width: 492, height: 40, font_size: 10, font_name: "Times-Roman", text_color: "#333", line_height: 1.4, z_index: 2 });
    curY -= 65;
  };
  
  addExp(EXP1_ROLE, EXP1_DATE, EXP1_DESC);
  addExp(EXP2_ROLE, EXP2_DATE, EXP2_DESC);

  curY -= 10;
  hSection("Education");
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: EDU_TITLE, x: 60, y: curY, width: 250, height: 14, font_size: 11, font_name: "Times-Bold", text_color: "#111", bold: true, z_index: 2 });
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: EDU_SCHOOL, x: 60, y: curY - 15, width: 250, height: 12, font_size: 10, font_name: "Times-Roman", text_color: "#333", z_index: 2 });

  return els;
}

// 15. Cyberpunk Edge
function cyberpunkEdge(pageId: string, wizardData?: any): Partial<EditorElement>[] {
  const { NAME, TITLE, EMAIL, PHONE, LOCATION, LINKEDIN, SUMMARY, EXP1_ROLE, EXP1_DATE, EXP1_DESC, EXP2_ROLE, EXP2_DATE, EXP2_DESC, EDU_TITLE, EDU_SCHOOL, SKILLS } = getTemplateData(wizardData);
  const els: Partial<EditorElement>[] = [];
  
  els.push({ id: gid(), element_type: "shape", shape_type: "rectangle", page_id: pageId, x: 0, y: 0, width: 612, height: 792, fill_color: "#0a0a0a", z_index: 0 });
  
  // Cyberpunk slashes
  els.push({ id: gid(), element_type: "shape", shape_type: "path", page_id: pageId, path_d: "M 0 792 L 612 650 L 612 792 Z", fill_color: "#FF003C", border_width: 0, x: 0, y: 0, z_index: 1 });
  els.push({ id: gid(), element_type: "shape", shape_type: "path", page_id: pageId, path_d: "M 0 792 L 612 670 L 612 792 Z", fill_color: "#00E5FF", border_width: 0, x: 0, y: 0, z_index: 2 });
  els.push({ id: gid(), element_type: "shape", shape_type: "path", page_id: pageId, path_d: "M 0 792 L 612 690 L 612 792 Z", fill_color: "#0a0a0a", border_width: 0, x: 0, y: 0, z_index: 3 });

  els.push({ id: gid(), element_type: "text", page_id: pageId, text: NAME, x: 30, y: 720, width: 400, height: 40, font_size: 38, font_name: "Helvetica-Bold", text_color: "#FCEE0A", bold: true, z_index: 4 });
  els.push({ id: gid(), element_type: "shape", shape_type: "rectangle", page_id: pageId, x: 30, y: 700, width: 120, height: 18, fill_color: "#00E5FF", z_index: 4 });
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: TITLE, x: 35, y: 703, width: 110, height: 12, font_size: 10, font_name: "Helvetica-Bold", text_color: "#0a0a0a", bold: true, z_index: 5 });

  const cX = 30;
  let cY = 660;
  [EMAIL, PHONE, LOCATION].forEach(t => {
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: `> ${t}`, x: cX, y: cY, width: 200, height: 12, font_size: 10, font_name: "Courier", text_color: "#FCEE0A", z_index: 4 });
    cY -= 15;
  });

  const sec = (title: string, x: number, y: number, color: string = "#FF003C") => {
    els.push({ id: gid(), element_type: "shape", shape_type: "rectangle", page_id: pageId, x: x, y: y, width: 15, height: 15, fill_color: color, z_index: 4 });
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: title, x: x + 22, y: y+1, width: 200, height: 14, font_size: 12, font_name: "Helvetica-Bold", text_color: "#FFF", bold: true, z_index: 4 });
    return y - 25;
  };

  let ry = sec("SYS.SUMMARY", 250, 660, "#00E5FF");
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: SUMMARY, x: 250, y: ry - 30, width: 330, height: 45, font_size: 10, font_name: "Courier", text_color: "#CCC", line_height: 1.3, z_index: 4 });
  
  ry -= 55;
  ry = sec("SYS.EXPERIENCE", 250, ry);
  const ax = (r: string, d: string, de: string) => {
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: r, x: 250, y: ry, width: 300, height: 14, font_size: 11, font_name: "Helvetica-Bold", text_color: "#00E5FF", bold: true, z_index: 4 });
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: d, x: 250, y: ry-14, width: 300, height: 12, font_size: 9, font_name: "Courier", text_color: "#888", z_index: 4 });
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: de, x: 250, y: ry-65, width: 330, height: 45, font_size: 9.5, font_name: "Courier", text_color: "#CCC", line_height: 1.3, z_index: 4 });
    ry -= 85;
  };
  ax(EXP1_ROLE, EXP1_DATE, EXP1_DESC);
  ax(EXP2_ROLE, EXP2_DATE, EXP2_DESC);

  let ly = sec("SYS.SKILLS", 30, 580, "#FCEE0A");
  SKILLS.forEach(sk => {
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: `[${sk}]`, x: 30, y: ly, width: 200, height: 12, font_size: 10, font_name: "Courier", text_color: "#00E5FF", z_index: 4 });
    ly -= 20;
  });

  return els;
}

// 16. Corporate Hierarchy
function corporateHierarchy(pageId: string, wizardData?: any): Partial<EditorElement>[] {
  const { NAME, TITLE, EMAIL, PHONE, LOCATION, LINKEDIN, SUMMARY, EXP1_ROLE, EXP1_DATE, EXP1_DESC, EXP2_ROLE, EXP2_DATE, EXP2_DESC, EDU_TITLE, EDU_SCHOOL, SKILLS } = getTemplateData(wizardData);
  const els: Partial<EditorElement>[] = [];
  
  els.push({ id: gid(), element_type: "shape", shape_type: "rectangle", page_id: pageId, x: 0, y: 0, width: 612, height: 792, fill_color: "#FFFFFF", z_index: 0 });
  els.push({ id: gid(), element_type: "shape", shape_type: "rectangle", page_id: pageId, x: 0, y: 650, width: 612, height: 142, fill_color: "#1E3A8A", z_index: 1 });

  els.push({ id: gid(), element_type: "text", page_id: pageId, text: NAME, x: 50, y: 720, width: 400, height: 35, font_size: 28, font_name: "Helvetica-Bold", text_color: "#FFFFFF", bold: true, z_index: 2 });
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: TITLE, x: 50, y: 695, width: 400, height: 16, font_size: 14, font_name: "Helvetica", text_color: "#93C5FD", z_index: 2 });

  let cx = 50;
  [EMAIL, PHONE, LOCATION].forEach(t => {
    els.push({ id: gid(), element_type: "shape", shape_type: "circle", page_id: pageId, x: cx, y: 668, width: 6, height: 6, fill_color: "#60A5FA", z_index: 2 });
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: t, x: cx + 12, y: 665, width: 140, height: 12, font_size: 10, font_name: "Helvetica", text_color: "#DBEAFE", z_index: 2 });
    cx += 160;
  });

  els.push({ id: gid(), element_type: "shape", shape_type: "rectangle", page_id: pageId, x: 50, y: 560, width: 512, height: 60, fill_color: "#F3F4F6", border_radius: 8, z_index: 1 });
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: "EXECUTIVE SUMMARY", x: 70, y: 600, width: 472, height: 12, font_size: 10, font_name: "Helvetica-Bold", text_color: "#1E3A8A", bold: true, z_index: 2 });
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: SUMMARY, x: 70, y: 568, width: 472, height: 28, font_size: 10, font_name: "Helvetica", text_color: "#4B5563", line_height: 1.4, z_index: 2 });

  // Timeline
  els.push({ id: gid(), element_type: "shape", shape_type: "line", page_id: pageId, x: 60, y: 100, x2: 60, y2: 520, border_color: "#E5E7EB", border_width: 3, z_index: 1 });
  
  let y = 500;
  const tNode = (role: string, date: string, desc: string) => {
    els.push({ id: gid(), element_type: "shape", shape_type: "circle", page_id: pageId, x: 56, y: y+4, width: 11, height: 11, fill_color: "#1E3A8A", border_color: "#FFF", border_width: 2, z_index: 2 });
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: date, x: 80, y: y, width: 100, height: 12, font_size: 10, font_name: "Helvetica-Bold", text_color: "#3B82F6", bold: true, z_index: 2 });
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: role, x: 190, y: y, width: 350, height: 14, font_size: 12, font_name: "Helvetica-Bold", text_color: "#111827", bold: true, z_index: 2 });
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: desc, x: 190, y: y - 55, width: 370, height: 45, font_size: 10, font_name: "Helvetica", text_color: "#4B5563", line_height: 1.4, z_index: 2 });
    y -= 85;
  };

  tNode(EXP1_ROLE, EXP1_DATE, EXP1_DESC);
  tNode(EXP2_ROLE, EXP2_DATE, EXP2_DESC);

  els.push({ id: gid(), element_type: "shape", shape_type: "circle", page_id: pageId, x: 56, y: y+4, width: 11, height: 11, fill_color: "#60A5FA", border_color: "#FFF", border_width: 2, z_index: 2 });
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: "EDUCATION", x: 80, y: y, width: 100, height: 12, font_size: 10, font_name: "Helvetica-Bold", text_color: "#3B82F6", bold: true, z_index: 2 });
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: EDU_TITLE, x: 190, y: y, width: 350, height: 12, font_size: 11, font_name: "Helvetica-Bold", text_color: "#111827", bold: true, z_index: 2 });
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: EDU_SCHOOL, x: 190, y: y-15, width: 350, height: 12, font_size: 10, font_name: "Helvetica", text_color: "#4B5563", z_index: 2 });

  return els;
}

// 17. Creative Portfolio
function creativePortfolio(pageId: string, wizardData?: any): Partial<EditorElement>[] {
  const { NAME, TITLE, EMAIL, PHONE, LOCATION, LINKEDIN, SUMMARY, EXP1_ROLE, EXP1_DATE, EXP1_DESC, EXP2_ROLE, EXP2_DATE, EXP2_DESC, EDU_TITLE, EDU_SCHOOL, SKILLS } = getTemplateData(wizardData);
  const els: Partial<EditorElement>[] = [];
  
  els.push({ id: gid(), element_type: "shape", shape_type: "rectangle", page_id: pageId, x: 0, y: 0, width: 612, height: 792, fill_color: "#FFF5F5", z_index: 0 });
  
  // Massive circles
  els.push({ id: gid(), element_type: "shape", shape_type: "circle", page_id: pageId, x: -100, y: 550, width: 400, height: 400, fill_color: "#FF8A65", z_index: 1 });
  els.push({ id: gid(), element_type: "shape", shape_type: "circle", page_id: pageId, x: 450, y: -50, width: 300, height: 300, fill_color: "#FFCC80", z_index: 1 });

  els.push({ id: gid(), element_type: "text", page_id: pageId, text: NAME.split(" ")[0] || "", x: 50, y: 700, width: 400, height: 50, font_size: 48, font_name: "Helvetica-Bold", text_color: "#FFFFFF", bold: true, z_index: 2 });
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: NAME.split(" ")[1] || "", x: 50, y: 655, width: 400, height: 50, font_size: 48, font_name: "Helvetica-Bold", text_color: "#BF360C", bold: true, z_index: 2 });
  
  els.push({ id: gid(), element_type: "shape", shape_type: "rectangle", page_id: pageId, x: 50, y: 635, width: 200, height: 4, fill_color: "#FFCC80", z_index: 2 });
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: TITLE, x: 50, y: 615, width: 400, height: 16, font_size: 14, font_name: "Helvetica-Bold", text_color: "#D84315", z_index: 2 });

  // Grid layout for info
  els.push({ id: gid(), element_type: "shape", shape_type: "rectangle", page_id: pageId, x: 380, y: 610, width: 200, height: 140, fill_color: "#FFFFFF", border_radius: 12, z_index: 2 });
  let cx = 395, cy = 725;
  [EMAIL, PHONE, LOCATION, LINKEDIN].forEach(t => {
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: t, x: cx, y: cy, width: 170, height: 12, font_size: 9, font_name: "Helvetica", text_color: "#BF360C", z_index: 3 });
    cy -= 25;
  });

  let ly = 550;
  const s = (t: string) => {
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: t, x: 50, y: ly, width: 512, height: 20, font_size: 16, font_name: "Helvetica-Bold", text_color: "#D84315", bold: true, z_index: 2 });
    ly -= 30;
  };

  s("Hello.");
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: SUMMARY, x: 50, y: ly-20, width: 512, height: 45, font_size: 11, font_name: "Helvetica", text_color: "#5D4037", line_height: 1.5, z_index: 2 });
  ly -= 70;

  s("Experience.");
  const ae = (role: string, date: string, desc: string) => {
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: role, x: 50, y: ly, width: 350, height: 14, font_size: 12, font_name: "Helvetica-Bold", text_color: "#BF360C", bold: true, z_index: 2 });
    els.push({ id: gid(), element_type: "shape", shape_type: "rectangle", page_id: pageId, x: 450, y: ly, width: 112, height: 16, fill_color: "#FFE0B2", border_radius: 8, z_index: 2 });
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: date, x: 450, y: ly+3, width: 112, height: 12, font_size: 9, font_name: "Helvetica-Bold", text_color: "#D84315", align: "center", z_index: 3 });
    ly -= 50;
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: desc, x: 50, y: ly, width: 512, height: 45, font_size: 10, font_name: "Helvetica", text_color: "#5D4037", line_height: 1.4, z_index: 2 });
    ly -= 30;
  };
  ae(EXP1_ROLE, EXP1_DATE, EXP1_DESC);
  ae(EXP2_ROLE, EXP2_DATE, EXP2_DESC);

  return els;
}

// 18. Minimalist Grid
function minimalistGrid(pageId: string, wizardData?: any): Partial<EditorElement>[] {
  const { NAME, TITLE, EMAIL, PHONE, LOCATION, LINKEDIN, SUMMARY, EXP1_ROLE, EXP1_DATE, EXP1_DESC, EXP2_ROLE, EXP2_DATE, EXP2_DESC, EDU_TITLE, EDU_SCHOOL, SKILLS } = getTemplateData(wizardData);
  const els: Partial<EditorElement>[] = [];
  
  els.push({ id: gid(), element_type: "shape", shape_type: "rectangle", page_id: pageId, x: 0, y: 0, width: 612, height: 792, fill_color: "#FFFFFF", z_index: 0 });
  
  // Grid lines
  els.push({ id: gid(), element_type: "shape", shape_type: "line", page_id: pageId, x: 200, y: 20, x2: 200, y2: 772, border_color: "#E5E5E5", border_width: 1, z_index: 1 });
  els.push({ id: gid(), element_type: "shape", shape_type: "line", page_id: pageId, x: 20, y: 650, x2: 592, y2: 650, border_color: "#E5E5E5", border_width: 1, z_index: 1 });
  els.push({ id: gid(), element_type: "shape", shape_type: "line", page_id: pageId, x: 20, y: 550, x2: 592, y2: 550, border_color: "#E5E5E5", border_width: 1, z_index: 1 });
  
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: NAME, x: 220, y: 720, width: 350, height: 35, font_size: 32, font_name: "Helvetica-Bold", text_color: "#000000", bold: true, z_index: 2 });
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: TITLE.toUpperCase(), x: 220, y: 690, width: 350, height: 14, font_size: 11, font_name: "Helvetica", text_color: "#666666", z_index: 2 });

  let cy = 720;
  [EMAIL, PHONE, LOCATION].forEach(t => {
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: t, x: 30, y: cy, width: 160, height: 12, font_size: 9, font_name: "Helvetica", text_color: "#333", align: "right", z_index: 2 });
    cy -= 18;
  });

  els.push({ id: gid(), element_type: "text", page_id: pageId, text: "PROFILE", x: 30, y: 610, width: 160, height: 12, font_size: 9, font_name: "Helvetica-Bold", text_color: "#000", align: "right", bold: true, z_index: 2 });
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: SUMMARY, x: 220, y: 565, width: 350, height: 60, font_size: 10, font_name: "Helvetica", text_color: "#444", line_height: 1.5, z_index: 2 });

  els.push({ id: gid(), element_type: "text", page_id: pageId, text: "EXPERIENCE", x: 30, y: 510, width: 160, height: 12, font_size: 9, font_name: "Helvetica-Bold", text_color: "#000", align: "right", bold: true, z_index: 2 });
  
  let ey = 510;
  const ax = (r: string, d: string, de: string) => {
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: r, x: 220, y: ey, width: 250, height: 14, font_size: 11, font_name: "Helvetica-Bold", text_color: "#000", bold: true, z_index: 2 });
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: d, x: 470, y: ey, width: 100, height: 12, font_size: 9, font_name: "Helvetica", text_color: "#888", align: "right", z_index: 2 });
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: de, x: 220, y: ey-50, width: 350, height: 45, font_size: 10, font_name: "Helvetica", text_color: "#444", line_height: 1.4, z_index: 2 });
    ey -= 75;
  };
  ax(EXP1_ROLE, EXP1_DATE, EXP1_DESC);
  ax(EXP2_ROLE, EXP2_DATE, EXP2_DESC);

  els.push({ id: gid(), element_type: "shape", shape_type: "line", page_id: pageId, x: 20, y: ey+20, x2: 592, y2: ey+20, border_color: "#E5E5E5", border_width: 1, z_index: 1 });
  
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: "SKILLS", x: 30, y: ey-10, width: 160, height: 12, font_size: 9, font_name: "Helvetica-Bold", text_color: "#000", align: "right", bold: true, z_index: 2 });
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: SKILLS.join("   •   "), x: 220, y: ey-10, width: 350, height: 20, font_size: 9, font_name: "Helvetica", text_color: "#444", z_index: 2 });

  return els;
}

// 19. Gradient Flow
function gradientFlow(pageId: string, wizardData?: any): Partial<EditorElement>[] {
  const { NAME, TITLE, EMAIL, PHONE, LOCATION, LINKEDIN, SUMMARY, EXP1_ROLE, EXP1_DATE, EXP1_DESC, EXP2_ROLE, EXP2_DATE, EXP2_DESC, EDU_TITLE, EDU_SCHOOL, SKILLS } = getTemplateData(wizardData);
  const els: Partial<EditorElement>[] = [];
  
  els.push({ id: gid(), element_type: "shape", shape_type: "rectangle", page_id: pageId, x: 0, y: 0, width: 612, height: 792, fill_color: "#F8FAFC", z_index: 0 });
  
  // Wavy header using path
  els.push({ id: gid(), element_type: "shape", shape_type: "path", page_id: pageId, path_d: "M 0 792 L 612 792 L 612 650 C 450 600 150 700 0 620 Z", fill_color: "#0284C7", border_width: 0, x: 0, y: 0, z_index: 1 });
  els.push({ id: gid(), element_type: "shape", shape_type: "path", page_id: pageId, path_d: "M 0 792 L 612 792 L 612 670 C 400 630 200 690 0 640 Z", fill_color: "#0369A1", border_width: 0, x: 0, y: 0, z_index: 2 });
  
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: NAME, x: 40, y: 720, width: 400, height: 35, font_size: 32, font_name: "Helvetica-Bold", text_color: "#F0F9FF", bold: true, z_index: 3 });
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: TITLE, x: 40, y: 695, width: 400, height: 16, font_size: 13, font_name: "Helvetica", text_color: "#BAE6FD", z_index: 3 });

  let cx = 40;
  [EMAIL, PHONE, LOCATION].forEach(t => {
    els.push({ id: gid(), element_type: "shape", shape_type: "rectangle", page_id: pageId, x: cx, y: 673, width: 100, height: 16, fill_color: "#0EA5E9", border_radius: 8, z_index: 3 });
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: t, x: cx, y: 676, width: 100, height: 12, font_size: 8, font_name: "Helvetica-Bold", text_color: "#F0F9FF", align: "center", z_index: 4 });
    cx += 110;
  });

  const sec = (title: string, y: number) => {
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: title.toUpperCase(), x: 40, y: y, width: 200, height: 14, font_size: 11, font_name: "Helvetica-Bold", text_color: "#0369A1", bold: true, z_index: 2 });
    els.push({ id: gid(), element_type: "shape", shape_type: "line", page_id: pageId, x: 40, y: y-5, x2: 572, y2: y-5, border_color: "#E0F2FE", border_width: 2, z_index: 2 });
    return y - 25;
  };

  let ry = sec("SUMMARY", 600);
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: SUMMARY, x: 40, y: ry-30, width: 532, height: 45, font_size: 10, font_name: "Helvetica", text_color: "#334155", line_height: 1.4, z_index: 2 });
  
  ry -= 50;
  ry = sec("EXPERIENCE", ry);
  const ax = (r: string, d: string, de: string) => {
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: r, x: 40, y: ry, width: 300, height: 14, font_size: 11, font_name: "Helvetica-Bold", text_color: "#0F172A", bold: true, z_index: 2 });
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: d, x: 472, y: ry, width: 100, height: 12, font_size: 9, font_name: "Helvetica-Bold", text_color: "#0EA5E9", align: "right", z_index: 2 });
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: de, x: 40, y: ry-50, width: 532, height: 45, font_size: 10, font_name: "Helvetica", text_color: "#475569", line_height: 1.4, z_index: 2 });
    ry -= 70;
  };
  ax(EXP1_ROLE, EXP1_DATE, EXP1_DESC);
  ax(EXP2_ROLE, EXP2_DATE, EXP2_DESC);

  return els;
}

// 20. Stark Brutalist
function starkBrutalist(pageId: string, wizardData?: any): Partial<EditorElement>[] {
  const { NAME, TITLE, EMAIL, PHONE, LOCATION, LINKEDIN, SUMMARY, EXP1_ROLE, EXP1_DATE, EXP1_DESC, EXP2_ROLE, EXP2_DATE, EXP2_DESC, EDU_TITLE, EDU_SCHOOL, SKILLS } = getTemplateData(wizardData);
  const els: Partial<EditorElement>[] = [];
  
  els.push({ id: gid(), element_type: "shape", shape_type: "rectangle", page_id: pageId, x: 0, y: 0, width: 612, height: 792, fill_color: "#FFFFFF", z_index: 0 });
  
  // Massive black borders
  els.push({ id: gid(), element_type: "shape", shape_type: "rectangle", page_id: pageId, x: 15, y: 15, width: 582, height: 762, fill_color: "transparent", border_color: "#000", border_width: 8, z_index: 1 });
  els.push({ id: gid(), element_type: "shape", shape_type: "rectangle", page_id: pageId, x: 15, y: 640, width: 582, height: 137, fill_color: "#000", z_index: 1 });
  
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: NAME.toUpperCase(), x: 30, y: 720, width: 552, height: 45, font_size: 40, font_name: "Helvetica-Bold", text_color: "#FFF", bold: true, z_index: 2 });
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: TITLE.toUpperCase(), x: 30, y: 690, width: 552, height: 18, font_size: 14, font_name: "Helvetica-Bold", text_color: "#FFF", bold: true, z_index: 2 });
  
  els.push({ id: gid(), element_type: "shape", shape_type: "rectangle", page_id: pageId, x: 15, y: 600, width: 582, height: 40, fill_color: "#000", z_index: 1 });
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: `${EMAIL}  //  ${PHONE}  //  ${LOCATION}`, x: 30, y: 613, width: 552, height: 14, font_size: 10, font_name: "Helvetica-Bold", text_color: "#FFF", align: "center", bold: true, z_index: 2 });

  const h = (t: string, y: number) => {
    els.push({ id: gid(), element_type: "shape", shape_type: "rectangle", page_id: pageId, x: 30, y: y, width: 180, height: 30, fill_color: "#000", z_index: 2 });
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: t.toUpperCase(), x: 40, y: y+8, width: 160, height: 16, font_size: 12, font_name: "Helvetica-Bold", text_color: "#FFF", bold: true, z_index: 3 });
    return y - 20;
  };

  let cy = 540;
  cy = h("SUMMARY", cy);
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: SUMMARY, x: 30, y: cy-35, width: 552, height: 45, font_size: 11, font_name: "Helvetica-Bold", text_color: "#000", line_height: 1.3, z_index: 2 });
  
  cy -= 65;
  cy = h("EXPERIENCE", cy);
  const ax = (r: string, d: string, de: string) => {
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: r.toUpperCase(), x: 30, y: cy, width: 400, height: 16, font_size: 13, font_name: "Helvetica-Bold", text_color: "#000", bold: true, z_index: 2 });
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: d, x: 432, y: cy, width: 150, height: 14, font_size: 12, font_name: "Helvetica-Bold", text_color: "#000", align: "right", z_index: 2 });
    els.push({ id: gid(), element_type: "shape", shape_type: "line", page_id: pageId, x: 30, y: cy-5, x2: 582, y2: cy-5, border_color: "#000", border_width: 3, z_index: 2 });
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: de, x: 30, y: cy-55, width: 552, height: 45, font_size: 10, font_name: "Helvetica", text_color: "#000", line_height: 1.3, z_index: 2 });
    cy -= 80;
  };
  ax(EXP1_ROLE, EXP1_DATE, EXP1_DESC);
  ax(EXP2_ROLE, EXP2_DATE, EXP2_DESC);

  return els;
}

// 21. Dual Tone Horizon
function dualToneHorizon(pageId: string, wizardData?: any): Partial<EditorElement>[] {
  const { NAME, TITLE, EMAIL, PHONE, LOCATION, LINKEDIN, SUMMARY, EXP1_ROLE, EXP1_DATE, EXP1_DESC, EXP2_ROLE, EXP2_DATE, EXP2_DESC, EDU_TITLE, EDU_SCHOOL, SKILLS } = getTemplateData(wizardData);
  const els: Partial<EditorElement>[] = [];
  
  els.push({ id: gid(), element_type: "shape", shape_type: "rectangle", page_id: pageId, x: 0, y: 0, width: 612, height: 792, fill_color: "#F9FAFB", z_index: 0 });
  els.push({ id: gid(), element_type: "shape", shape_type: "rectangle", page_id: pageId, x: 0, y: 592, width: 612, height: 200, fill_color: "#991B1B", z_index: 1 });
  
  els.push({ id: gid(), element_type: "shape", shape_type: "circle", page_id: pageId, x: 306-60, y: 592-60, width: 120, height: 120, fill_color: "#7F1D1D", border_width: 4, border_color: "#FFFFFF", z_index: 2 });
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: NAME.charAt(0), x: 306-60, y: 550, width: 120, height: 60, font_size: 60, font_name: "Helvetica-Bold", text_color: "#FECACA", align: "center", bold: true, z_index: 3 });

  els.push({ id: gid(), element_type: "text", page_id: pageId, text: NAME.toUpperCase(), x: 50, y: 720, width: 512, height: 35, font_size: 32, font_name: "Helvetica-Bold", text_color: "#FFFFFF", align: "center", bold: true, z_index: 2 });
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: TITLE, x: 50, y: 695, width: 512, height: 16, font_size: 14, font_name: "Helvetica", text_color: "#FECACA", align: "center", z_index: 2 });

  let cy = 480;
  const col = (t: string, y: number, clr: string) => {
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: t.toUpperCase(), x: 50, y: y, width: 512, height: 14, font_size: 11, font_name: "Helvetica-Bold", text_color: clr, align: "center", bold: true, z_index: 2 });
    els.push({ id: gid(), element_type: "shape", shape_type: "line", page_id: pageId, x: 250, y: y-5, x2: 362, y2: y-5, border_color: clr, border_width: 2, z_index: 2 });
    return y - 25;
  };

  cy = col("SUMMARY", cy, "#991B1B");
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: SUMMARY, x: 100, y: cy-30, width: 412, height: 45, font_size: 10, font_name: "Helvetica", text_color: "#4B5563", align: "center", line_height: 1.4, z_index: 2 });
  cy -= 60;

  cy = col("EXPERIENCE", cy, "#991B1B");
  const ax = (r: string, d: string, de: string) => {
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: r, x: 100, y: cy, width: 300, height: 14, font_size: 11, font_name: "Helvetica-Bold", text_color: "#111827", bold: true, z_index: 2 });
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: d, x: 412, y: cy, width: 100, height: 12, font_size: 9, font_name: "Helvetica-Bold", text_color: "#B91C1C", align: "right", z_index: 2 });
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: de, x: 100, y: cy-50, width: 412, height: 45, font_size: 10, font_name: "Helvetica", text_color: "#4B5563", line_height: 1.4, z_index: 2 });
    cy -= 70;
  };
  ax(EXP1_ROLE, EXP1_DATE, EXP1_DESC);
  ax(EXP2_ROLE, EXP2_DATE, EXP2_DESC);

  return els;
}

// 22. Nature Botanist
function natureBotanist(pageId: string, wizardData?: any): Partial<EditorElement>[] {
  const { NAME, TITLE, EMAIL, PHONE, LOCATION, LINKEDIN, SUMMARY, EXP1_ROLE, EXP1_DATE, EXP1_DESC, EXP2_ROLE, EXP2_DATE, EXP2_DESC, EDU_TITLE, EDU_SCHOOL, SKILLS } = getTemplateData(wizardData);
  const els: Partial<EditorElement>[] = [];
  
  els.push({ id: gid(), element_type: "shape", shape_type: "rectangle", page_id: pageId, x: 0, y: 0, width: 612, height: 792, fill_color: "#FDFBF7", z_index: 0 });
  
  // Leaf motif paths
  els.push({ id: gid(), element_type: "shape", shape_type: "path", page_id: pageId, path_d: "M 0 792 C 150 792 200 650 0 650 Z", fill_color: "#166534", border_width: 0, x: 0, y: 0, z_index: 1 });
  els.push({ id: gid(), element_type: "shape", shape_type: "path", page_id: pageId, path_d: "M 612 0 C 450 0 400 150 612 150 Z", fill_color: "#86EFAC", border_width: 0, x: 0, y: 0, z_index: 1 });

  els.push({ id: gid(), element_type: "text", page_id: pageId, text: NAME, x: 150, y: 720, width: 400, height: 40, font_size: 36, font_name: "Times-Roman", text_color: "#14532D", z_index: 2 });
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: TITLE, x: 152, y: 695, width: 400, height: 16, font_size: 14, font_name: "Times-Italic", text_color: "#166534", italic: true, z_index: 2 });

  els.push({ id: gid(), element_type: "shape", shape_type: "rectangle", page_id: pageId, x: 150, y: 660, width: 400, height: 25, fill_color: "#DCFCE7", border_radius: 12, z_index: 1 });
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: `${EMAIL}   |   ${PHONE}   |   ${LOCATION}`, x: 150, y: 667, width: 400, height: 12, font_size: 9, font_name: "Times-Roman", text_color: "#166534", align: "center", z_index: 2 });

  let cy = 600;
  const h = (t: string) => {
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: t.toUpperCase(), x: 60, y: cy, width: 492, height: 14, font_size: 12, font_name: "Times-Bold", text_color: "#14532D", bold: true, z_index: 2 });
    els.push({ id: gid(), element_type: "shape", shape_type: "line", page_id: pageId, x: 60, y: cy-5, x2: 552, y2: cy-5, border_color: "#BBF7D0", border_width: 2, z_index: 2 });
    return cy - 25;
  };

  cy = h("Summary");
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: SUMMARY, x: 60, y: cy-35, width: 492, height: 45, font_size: 10, font_name: "Times-Roman", text_color: "#404040", line_height: 1.5, z_index: 2 });
  
  cy -= 60;
  cy = h("Experience");
  const ax = (r: string, d: string, de: string) => {
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: r, x: 60, y: cy, width: 350, height: 14, font_size: 11, font_name: "Times-Bold", text_color: "#166534", bold: true, z_index: 2 });
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: d, x: 452, y: cy, width: 100, height: 12, font_size: 10, font_name: "Times-Italic", text_color: "#166534", italic: true, align: "right", z_index: 2 });
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: de, x: 60, y: cy-45, width: 492, height: 40, font_size: 10, font_name: "Times-Roman", text_color: "#404040", line_height: 1.4, z_index: 2 });
    cy -= 65;
  };
  ax(EXP1_ROLE, EXP1_DATE, EXP1_DESC);
  ax(EXP2_ROLE, EXP2_DATE, EXP2_DESC);

  return els;
}

// 23. Executive Gold
function executiveGold(pageId: string, wizardData?: any): Partial<EditorElement>[] {
  const { NAME, TITLE, EMAIL, PHONE, LOCATION, LINKEDIN, SUMMARY, EXP1_ROLE, EXP1_DATE, EXP1_DESC, EXP2_ROLE, EXP2_DATE, EXP2_DESC, EDU_TITLE, EDU_SCHOOL, SKILLS } = getTemplateData(wizardData);
  const els: Partial<EditorElement>[] = [];
  
  els.push({ id: gid(), element_type: "shape", shape_type: "rectangle", page_id: pageId, x: 0, y: 0, width: 612, height: 792, fill_color: "#FFFFFF", z_index: 0 });
  els.push({ id: gid(), element_type: "shape", shape_type: "rectangle", page_id: pageId, x: 0, y: 0, width: 220, height: 792, fill_color: "#1C1917", z_index: 1 });
  
  // Gold accent line
  els.push({ id: gid(), element_type: "shape", shape_type: "rectangle", page_id: pageId, x: 218, y: 0, width: 4, height: 792, fill_color: "#D4AF37", z_index: 2 });

  els.push({ id: gid(), element_type: "text", page_id: pageId, text: NAME.toUpperCase(), x: 20, y: 720, width: 180, height: 60, font_size: 24, font_name: "Helvetica-Bold", text_color: "#D4AF37", bold: true, z_index: 3 });
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: TITLE, x: 20, y: 690, width: 180, height: 16, font_size: 11, font_name: "Helvetica", text_color: "#A8A29E", z_index: 3 });

  let cy = 640;
  [EMAIL, PHONE, LOCATION, LINKEDIN].forEach(t => {
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: t, x: 20, y: cy, width: 180, height: 12, font_size: 9, font_name: "Helvetica", text_color: "#E7E5E4", z_index: 3 });
    cy -= 20;
  });

  cy -= 40;
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: "SKILLS", x: 20, y: cy, width: 180, height: 14, font_size: 11, font_name: "Helvetica-Bold", text_color: "#D4AF37", bold: true, z_index: 3 });
  cy -= 25;
  SKILLS.forEach(sk => {
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: `•  ${sk}`, x: 20, y: cy, width: 180, height: 12, font_size: 9, font_name: "Helvetica", text_color: "#E7E5E4", z_index: 3 });
    cy -= 15;
  });

  let ry = 720;
  const rh = (t: string) => {
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: t.toUpperCase(), x: 250, y: ry, width: 330, height: 16, font_size: 14, font_name: "Helvetica-Bold", text_color: "#D4AF37", bold: true, z_index: 2 });
    els.push({ id: gid(), element_type: "shape", shape_type: "line", page_id: pageId, x: 250, y: ry-5, x2: 582, y2: ry-5, border_color: "#E7E5E4", border_width: 1, z_index: 2 });
    return ry - 25;
  };

  ry = rh("Professional Profile");
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: SUMMARY, x: 250, y: ry-35, width: 330, height: 45, font_size: 10, font_name: "Helvetica", text_color: "#44403C", line_height: 1.4, z_index: 2 });
  
  ry -= 65;
  ry = rh("Experience");
  const ax = (r: string, d: string, de: string) => {
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: r, x: 250, y: ry, width: 200, height: 14, font_size: 11, font_name: "Helvetica-Bold", text_color: "#1C1917", bold: true, z_index: 2 });
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: d, x: 450, y: ry, width: 132, height: 12, font_size: 9, font_name: "Helvetica-Bold", text_color: "#D4AF37", align: "right", z_index: 2 });
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: de, x: 250, y: ry-50, width: 332, height: 45, font_size: 10, font_name: "Helvetica", text_color: "#57534E", line_height: 1.4, z_index: 2 });
    ry -= 75;
  };
  ax(EXP1_ROLE, EXP1_DATE, EXP1_DESC);
  ax(EXP2_ROLE, EXP2_DATE, EXP2_DESC);

  return els;
}

// 24. Retro Terminal
function retroTerminal(pageId: string, wizardData?: any): Partial<EditorElement>[] {
  const { NAME, TITLE, EMAIL, PHONE, LOCATION, LINKEDIN, SUMMARY, EXP1_ROLE, EXP1_DATE, EXP1_DESC, EXP2_ROLE, EXP2_DATE, EXP2_DESC, EDU_TITLE, EDU_SCHOOL, SKILLS } = getTemplateData(wizardData);
  const els: Partial<EditorElement>[] = [];
  
  els.push({ id: gid(), element_type: "shape", shape_type: "rectangle", page_id: pageId, x: 0, y: 0, width: 612, height: 792, fill_color: "#0C0C0C", z_index: 0 });
  
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: "user@system:~$ ./init_resume.sh", x: 30, y: 750, width: 552, height: 14, font_size: 11, font_name: "Courier", text_color: "#22C55E", z_index: 1 });
  
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: NAME.toUpperCase(), x: 30, y: 710, width: 552, height: 30, font_size: 28, font_name: "Courier", text_color: "#4ADE80", bold: true, z_index: 2 });
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: `[TITLE]: ${TITLE}`, x: 30, y: 690, width: 552, height: 12, font_size: 10, font_name: "Courier", text_color: "#22C55E", z_index: 2 });

  let cy = 660;
  [EMAIL, PHONE, LOCATION].forEach(t => {
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: `  > ${t}`, x: 30, y: cy, width: 552, height: 12, font_size: 9, font_name: "Courier", text_color: "#16A34A", z_index: 2 });
    cy -= 15;
  });

  const section = (title: string, y: number) => {
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: `user@system:~$ cat ${title.toLowerCase()}.txt`, x: 30, y: y, width: 552, height: 12, font_size: 10, font_name: "Courier", text_color: "#22C55E", z_index: 2 });
    return y - 20;
  };

  cy -= 20;
  cy = section("SUMMARY", cy);
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: SUMMARY, x: 30, y: cy-35, width: 552, height: 45, font_size: 9.5, font_name: "Courier", text_color: "#86EFAC", line_height: 1.3, z_index: 2 });
  
  cy -= 60;
  cy = section("EXPERIENCE", cy);
  const ax = (r: string, d: string, de: string) => {
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: `[${d}] ${r}`, x: 30, y: cy, width: 552, height: 12, font_size: 10, font_name: "Courier", text_color: "#4ADE80", bold: true, z_index: 2 });
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: de, x: 45, y: cy-50, width: 537, height: 45, font_size: 9, font_name: "Courier", text_color: "#86EFAC", line_height: 1.3, z_index: 2 });
    cy -= 75;
  };
  ax(EXP1_ROLE, EXP1_DATE, EXP1_DESC);
  ax(EXP2_ROLE, EXP2_DATE, EXP2_DESC);

  return els;
}




// ─────────────────────────────────────────────────────────────────────────────
// NEW TEMPLATES (10 PER CATEGORY EXPANSION)
// ─────────────────────────────────────────────────────────────────────────────

// TEMPLATE 25 — Monarch Classic (Professional)
function monarchClassic(pageId: string, wizardData?: any): Partial<EditorElement>[] {
  const { NAME, TITLE, EMAIL, PHONE, LOCATION, LINKEDIN, SUMMARY, EXP1_ROLE, EXP1_DATE, EXP1_DESC, EXP2_ROLE, EXP2_DATE, EXP2_DESC, EDU_TITLE, EDU_SCHOOL, SKILLS } = getTemplateData(wizardData);
  const els: Partial<EditorElement>[] = [];
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: NAME, x: 50, y: 730, width: 512, height: 28, font_size: 24, font_name: "Times-Bold", text_color: "#1E293B", align: "center", bold: true, z_index: 2 });
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: TITLE.toUpperCase(), x: 50, y: 708, width: 512, height: 14, font_size: 10, font_name: "Times-Roman", text_color: "#D97706", align: "center", z_index: 2 });
  els.push({ id: gid(), element_type: "shape", shape_type: "line", page_id: pageId, x: 50, y: 698, x2: 562, y2: 698, border_color: "#D97706", border_width: 1.5, z_index: 2 });
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: `${EMAIL}  •  ${PHONE}  •  ${LOCATION}  •  ${LINKEDIN}`, x: 50, y: 680, width: 512, height: 12, font_size: 8.5, font_name: "Times-Roman", text_color: "#64748B", align: "center", z_index: 2 });

  let y = 645;
  const section = (title: string) => {
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: title.toUpperCase(), x: 50, y: y, width: 512, height: 14, font_size: 11, font_name: "Times-Bold", text_color: "#1E293B", bold: true, z_index: 2 });
    y -= 3;
    els.push({ id: gid(), element_type: "shape", shape_type: "line", page_id: pageId, x: 50, y: y, x2: 562, y2: y, border_color: "#CBD5E1", border_width: 0.75, z_index: 2 });
    y -= 16;
  };

  section("Executive Summary");
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: SUMMARY, x: 50, y: y-35, width: 512, height: 40, font_size: 9.5, font_name: "Times-Roman", text_color: "#334155", line_height: 1.35, z_index: 2 });
  y -= 50;

  section("Professional Experience");
  const exp = (role: string, date: string, desc: string) => {
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: role, x: 50, y: y, width: 380, height: 14, font_size: 10.5, font_name: "Times-Bold", text_color: "#0F172A", bold: true, z_index: 2 });
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: date, x: 430, y: y, width: 132, height: 14, font_size: 9.5, font_name: "Times-Italic", text_color: "#64748B", align: "right", z_index: 2 });
    y -= 16;
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: desc, x: 50, y: y-40, width: 512, height: 45, font_size: 9, font_name: "Times-Roman", text_color: "#334155", line_height: 1.35, z_index: 2 });
    y -= 55;
  };
  exp(EXP1_ROLE, EXP1_DATE, EXP1_DESC);
  exp(EXP2_ROLE, EXP2_DATE, EXP2_DESC);

  section("Education");
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: EDU_TITLE, x: 50, y: y, width: 350, height: 14, font_size: 10, font_name: "Times-Bold", text_color: "#0F172A", bold: true, z_index: 2 });
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: EDU_SCHOOL, x: 50, y: y-15, width: 512, height: 12, font_size: 9, font_name: "Times-Roman", text_color: "#64748B", z_index: 2 });
  y -= 35;

  section("Core Competencies");
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: SKILLS.join("  •  "), x: 50, y: y-10, width: 512, height: 20, font_size: 9.5, font_name: "Times-Roman", text_color: "#1E293B", z_index: 2 });
  return els;
}

// TEMPLATE 26 — Beacon Executive (Professional)
function beaconExecutive(pageId: string, wizardData?: any): Partial<EditorElement>[] {
  const { NAME, TITLE, EMAIL, PHONE, LOCATION, LINKEDIN, SUMMARY, EXP1_ROLE, EXP1_DATE, EXP1_DESC, EXP2_ROLE, EXP2_DATE, EXP2_DESC, EDU_TITLE, EDU_SCHOOL, SKILLS } = getTemplateData(wizardData);
  const els: Partial<EditorElement>[] = [];
  els.push({ id: gid(), element_type: "shape", shape_type: "rectangle", page_id: pageId, x: 0, y: 700, width: 612, height: 92, fill_color: "#1E293B", border_width: 0, z_index: 0 });
  els.push({ id: gid(), element_type: "shape", shape_type: "rectangle", page_id: pageId, x: 0, y: 696, width: 612, height: 4, fill_color: "#0284C7", border_width: 0, z_index: 1 });
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: NAME, x: 40, y: 745, width: 532, height: 26, font_size: 22, font_name: "Helvetica-Bold", text_color: "#FFFFFF", bold: true, z_index: 2 });
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: TITLE, x: 40, y: 724, width: 532, height: 14, font_size: 11, font_name: "Helvetica", text_color: "#38BDF8", z_index: 2 });

  let y = 665;
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: `${EMAIL}  |  ${PHONE}  |  ${LOCATION}  |  ${LINKEDIN}`, x: 40, y: y, width: 532, height: 12, font_size: 8.5, font_name: "Helvetica", text_color: "#64748B", z_index: 2 });
  y -= 25;

  const section = (title: string) => {
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: title.toUpperCase(), x: 40, y: y, width: 532, height: 14, font_size: 10, font_name: "Helvetica-Bold", text_color: "#0284C7", bold: true, z_index: 2 });
    y -= 3;
    els.push({ id: gid(), element_type: "shape", shape_type: "line", page_id: pageId, x: 40, y: y, x2: 572, y2: y, border_color: "#E2E8F0", border_width: 1, z_index: 2 });
    y -= 16;
  };

  section("Executive Profile");
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: SUMMARY, x: 40, y: y-35, width: 532, height: 40, font_size: 9.5, font_name: "Helvetica", text_color: "#334155", line_height: 1.35, z_index: 2 });
  y -= 50;

  section("Work Experience");
  const exp = (role: string, date: string, desc: string) => {
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: role, x: 40, y: y, width: 400, height: 14, font_size: 10.5, font_name: "Helvetica-Bold", text_color: "#0F172A", bold: true, z_index: 2 });
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: date, x: 440, y: y, width: 132, height: 14, font_size: 9, font_name: "Helvetica", text_color: "#64748B", align: "right", z_index: 2 });
    y -= 16;
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: desc, x: 40, y: y-40, width: 532, height: 45, font_size: 9, font_name: "Helvetica", text_color: "#334155", line_height: 1.35, z_index: 2 });
    y -= 55;
  };
  exp(EXP1_ROLE, EXP1_DATE, EXP1_DESC);
  exp(EXP2_ROLE, EXP2_DATE, EXP2_DESC);

  section("Education & Certification");
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: EDU_TITLE, x: 40, y: y, width: 350, height: 14, font_size: 10, font_name: "Helvetica-Bold", text_color: "#0F172A", bold: true, z_index: 2 });
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: EDU_SCHOOL, x: 40, y: y-15, width: 532, height: 12, font_size: 9, font_name: "Helvetica", text_color: "#64748B", z_index: 2 });
  y -= 35;

  section("Key Skills");
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: SKILLS.join("   •   "), x: 40, y: y-10, width: 532, height: 20, font_size: 9.5, font_name: "Helvetica-Bold", text_color: "#0F172A", z_index: 2 });
  return els;
}

// TEMPLATE 27 — Sterling Corporate (Professional)
function sterlingCorporate(pageId: string, wizardData?: any): Partial<EditorElement>[] {
  const { NAME, TITLE, EMAIL, PHONE, LOCATION, LINKEDIN, SUMMARY, EXP1_ROLE, EXP1_DATE, EXP1_DESC, EXP2_ROLE, EXP2_DATE, EXP2_DESC, EDU_TITLE, EDU_SCHOOL, SKILLS } = getTemplateData(wizardData);
  const els: Partial<EditorElement>[] = [];
  els.push({ id: gid(), element_type: "shape", shape_type: "rectangle", page_id: pageId, x: 40, y: 700, width: 532, height: 75, fill_color: "#F8FAFC", border_color: "#CBD5E1", border_width: 1, z_index: 0 });
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: NAME, x: 55, y: 740, width: 500, height: 24, font_size: 20, font_name: "Helvetica-Bold", text_color: "#0F172A", bold: true, z_index: 2 });
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: TITLE, x: 55, y: 722, width: 500, height: 14, font_size: 10, font_name: "Helvetica", text_color: "#475569", z_index: 2 });
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: `${EMAIL}  |  ${PHONE}  |  ${LOCATION}`, x: 55, y: 706, width: 500, height: 11, font_size: 8, font_name: "Helvetica", text_color: "#64748B", z_index: 2 });

  let y = 675;
  const section = (title: string) => {
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: title.toUpperCase(), x: 40, y: y, width: 532, height: 14, font_size: 10, font_name: "Helvetica-Bold", text_color: "#334155", bold: true, z_index: 2 });
    y -= 3;
    els.push({ id: gid(), element_type: "shape", shape_type: "line", page_id: pageId, x: 40, y: y, x2: 572, y2: y, border_color: "#94A3B8", border_width: 1, z_index: 2 });
    y -= 16;
  };

  section("Summary");
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: SUMMARY, x: 40, y: y-35, width: 532, height: 40, font_size: 9.5, font_name: "Helvetica", text_color: "#334155", line_height: 1.35, z_index: 2 });
  y -= 50;

  section("Experience");
  const exp = (role: string, date: string, desc: string) => {
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: role, x: 40, y: y, width: 400, height: 14, font_size: 10, font_name: "Helvetica-Bold", text_color: "#0F172A", bold: true, z_index: 2 });
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: date, x: 440, y: y, width: 132, height: 14, font_size: 9, font_name: "Helvetica", text_color: "#64748B", align: "right", z_index: 2 });
    y -= 16;
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: desc, x: 40, y: y-40, width: 532, height: 45, font_size: 9, font_name: "Helvetica", text_color: "#334155", line_height: 1.35, z_index: 2 });
    y -= 55;
  };
  exp(EXP1_ROLE, EXP1_DATE, EXP1_DESC);
  exp(EXP2_ROLE, EXP2_DATE, EXP2_DESC);

  section("Education");
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: EDU_TITLE, x: 40, y: y, width: 350, height: 14, font_size: 10, font_name: "Helvetica-Bold", text_color: "#0F172A", bold: true, z_index: 2 });
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: EDU_SCHOOL, x: 40, y: y-15, width: 532, height: 12, font_size: 9, font_name: "Helvetica", text_color: "#64748B", z_index: 2 });
  y -= 35;

  section("Skills & Qualifications");
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: SKILLS.join("  •  "), x: 40, y: y-10, width: 532, height: 20, font_size: 9.5, font_name: "Helvetica", text_color: "#0F172A", z_index: 2 });
  return els;
}

// TEMPLATE 28 — Vanguard Officer (Professional)
function vanguardOfficer(pageId: string, wizardData?: any): Partial<EditorElement>[] {
  const { NAME, TITLE, EMAIL, PHONE, LOCATION, LINKEDIN, SUMMARY, EXP1_ROLE, EXP1_DATE, EXP1_DESC, EXP2_ROLE, EXP2_DATE, EXP2_DESC, EDU_TITLE, EDU_SCHOOL, SKILLS } = getTemplateData(wizardData);
  const els: Partial<EditorElement>[] = [];
  els.push({ id: gid(), element_type: "shape", shape_type: "rectangle", page_id: pageId, x: 0, y: 720, width: 612, height: 72, fill_color: "#0F172A", border_width: 0, z_index: 0 });
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: NAME, x: 40, y: 750, width: 532, height: 24, font_size: 20, font_name: "Helvetica-Bold", text_color: "#FFFFFF", bold: true, z_index: 2 });
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: TITLE, x: 40, y: 732, width: 532, height: 14, font_size: 10, font_name: "Helvetica", text_color: "#94A3B8", z_index: 2 });

  let y = 695;
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: `${EMAIL}  |  ${PHONE}  |  ${LOCATION}  |  ${LINKEDIN}`, x: 40, y: y, width: 532, height: 12, font_size: 8.5, font_name: "Helvetica", text_color: "#475569", z_index: 2 });
  y -= 25;

  const section = (title: string) => {
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: title.toUpperCase(), x: 40, y: y, width: 532, height: 14, font_size: 10, font_name: "Helvetica-Bold", text_color: "#0F172A", bold: true, z_index: 2 });
    y -= 3;
    els.push({ id: gid(), element_type: "shape", shape_type: "line", page_id: pageId, x: 40, y: y, x2: 572, y2: y, border_color: "#0F172A", border_width: 1.5, z_index: 2 });
    y -= 16;
  };

  section("Executive Summary");
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: SUMMARY, x: 40, y: y-35, width: 532, height: 40, font_size: 9.5, font_name: "Helvetica", text_color: "#334155", line_height: 1.35, z_index: 2 });
  y -= 50;

  section("Key Leadership & Experience");
  const exp = (role: string, date: string, desc: string) => {
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: role, x: 40, y: y, width: 400, height: 14, font_size: 10, font_name: "Helvetica-Bold", text_color: "#0F172A", bold: true, z_index: 2 });
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: date, x: 440, y: y, width: 132, height: 14, font_size: 9, font_name: "Helvetica", text_color: "#64748B", align: "right", z_index: 2 });
    y -= 16;
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: desc, x: 40, y: y-40, width: 532, height: 45, font_size: 9, font_name: "Helvetica", text_color: "#334155", line_height: 1.35, z_index: 2 });
    y -= 55;
  };
  exp(EXP1_ROLE, EXP1_DATE, EXP1_DESC);
  exp(EXP2_ROLE, EXP2_DATE, EXP2_DESC);

  section("Education");
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: EDU_TITLE, x: 40, y: y, width: 350, height: 14, font_size: 10, font_name: "Helvetica-Bold", text_color: "#0F172A", bold: true, z_index: 2 });
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: EDU_SCHOOL, x: 40, y: y-15, width: 532, height: 12, font_size: 9, font_name: "Helvetica", text_color: "#64748B", z_index: 2 });
  y -= 35;

  section("Competencies");
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: SKILLS.join("  •  "), x: 40, y: y-10, width: 532, height: 20, font_size: 9.5, font_name: "Helvetica", text_color: "#0F172A", z_index: 2 });
  return els;
}

// TEMPLATE 29 — Prism Vivid (Creative)
function prismVivid(pageId: string, wizardData?: any): Partial<EditorElement>[] {
  const { NAME, TITLE, EMAIL, PHONE, LOCATION, LINKEDIN, SUMMARY, EXP1_ROLE, EXP1_DATE, EXP1_DESC, EXP2_ROLE, EXP2_DATE, EXP2_DESC, EDU_TITLE, EDU_SCHOOL, SKILLS } = getTemplateData(wizardData);
  const els: Partial<EditorElement>[] = [];
  els.push({ id: gid(), element_type: "shape", shape_type: "rectangle", page_id: pageId, x: 0, y: 720, width: 612, height: 72, fill_color: "#7C3AED", border_width: 0, z_index: 0 });
  els.push({ id: gid(), element_type: "shape", shape_type: "rectangle", page_id: pageId, x: 0, y: 715, width: 612, height: 5, fill_color: "#06B6D4", border_width: 0, z_index: 1 });
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: NAME, x: 40, y: 748, width: 532, height: 26, font_size: 22, font_name: "Helvetica-Bold", text_color: "#FFFFFF", bold: true, z_index: 2 });
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: TITLE, x: 40, y: 728, width: 532, height: 14, font_size: 11, font_name: "Helvetica", text_color: "#CFFAFE", z_index: 2 });

  let y = 685;
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: `${EMAIL}   |   ${PHONE}   |   ${LOCATION}`, x: 40, y: y, width: 532, height: 12, font_size: 8.5, font_name: "Helvetica", text_color: "#64748B", z_index: 2 });
  y -= 25;

  const section = (title: string) => {
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: title.toUpperCase(), x: 40, y: y, width: 532, height: 14, font_size: 10, font_name: "Helvetica-Bold", text_color: "#7C3AED", bold: true, z_index: 2 });
    y -= 3;
    els.push({ id: gid(), element_type: "shape", shape_type: "line", page_id: pageId, x: 40, y: y, x2: 572, y2: y, border_color: "#06B6D4", border_width: 1, z_index: 2 });
    y -= 16;
  };

  section("Creative Overview");
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: SUMMARY, x: 40, y: y-35, width: 532, height: 40, font_size: 9.5, font_name: "Helvetica", text_color: "#334155", line_height: 1.35, z_index: 2 });
  y -= 50;

  section("Experience");
  const exp = (role: string, date: string, desc: string) => {
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: role, x: 40, y: y, width: 400, height: 14, font_size: 10.5, font_name: "Helvetica-Bold", text_color: "#0F172A", bold: true, z_index: 2 });
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: date, x: 440, y: y, width: 132, height: 14, font_size: 9, font_name: "Helvetica", text_color: "#7C3AED", align: "right", z_index: 2 });
    y -= 16;
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: desc, x: 40, y: y-40, width: 532, height: 45, font_size: 9, font_name: "Helvetica", text_color: "#334155", line_height: 1.35, z_index: 2 });
    y -= 55;
  };
  exp(EXP1_ROLE, EXP1_DATE, EXP1_DESC);
  exp(EXP2_ROLE, EXP2_DATE, EXP2_DESC);

  section("Education & Skills");
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: `${EDU_TITLE} - ${EDU_SCHOOL}`, x: 40, y: y, width: 532, height: 14, font_size: 9.5, font_name: "Helvetica", text_color: "#0F172A", z_index: 2 });
  y -= 20;
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: SKILLS.join("   •   "), x: 40, y: y, width: 532, height: 14, font_size: 9, font_name: "Helvetica-Bold", text_color: "#7C3AED", z_index: 2 });
  return els;
}

// TEMPLATE 30 — Mono Sleek (Minimal)
function monoSleek(pageId: string, wizardData?: any): Partial<EditorElement>[] {
  const { NAME, TITLE, EMAIL, PHONE, LOCATION, LINKEDIN, SUMMARY, EXP1_ROLE, EXP1_DATE, EXP1_DESC, EXP2_ROLE, EXP2_DATE, EXP2_DESC, EDU_TITLE, EDU_SCHOOL, SKILLS } = getTemplateData(wizardData);
  const els: Partial<EditorElement>[] = [];
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: NAME, x: 40, y: 740, width: 532, height: 24, font_size: 20, font_name: "Helvetica", text_color: "#0F172A", z_index: 2 });
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: TITLE.toUpperCase(), x: 40, y: 722, width: 532, height: 12, font_size: 9, font_name: "Helvetica", text_color: "#64748B", z_index: 2 });
  els.push({ id: gid(), element_type: "shape", shape_type: "line", page_id: pageId, x: 40, y: 712, x2: 572, y2: 712, border_color: "#E2E8F0", border_width: 1, z_index: 2 });
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: `${EMAIL}  /  ${PHONE}  /  ${LOCATION}`, x: 40, y: 695, width: 532, height: 11, font_size: 8, font_name: "Helvetica", text_color: "#94A3B8", z_index: 2 });

  let y = 665;
  const section = (title: string) => {
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: title.toUpperCase(), x: 40, y: y, width: 532, height: 12, font_size: 8.5, font_name: "Helvetica-Bold", text_color: "#0F172A", bold: true, z_index: 2 });
    y -= 14;
  };

  section("Profile");
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: SUMMARY, x: 40, y: y-35, width: 532, height: 40, font_size: 9, font_name: "Helvetica", text_color: "#475569", line_height: 1.35, z_index: 2 });
  y -= 45;

  section("Experience");
  const exp = (role: string, date: string, desc: string) => {
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: role, x: 40, y: y, width: 400, height: 14, font_size: 9.5, font_name: "Helvetica-Bold", text_color: "#0F172A", bold: true, z_index: 2 });
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: date, x: 440, y: y, width: 132, height: 14, font_size: 8.5, font_name: "Helvetica", text_color: "#94A3B8", align: "right", z_index: 2 });
    y -= 14;
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: desc, x: 40, y: y-40, width: 532, height: 45, font_size: 8.5, font_name: "Helvetica", text_color: "#475569", line_height: 1.35, z_index: 2 });
    y -= 50;
  };
  exp(EXP1_ROLE, EXP1_DATE, EXP1_DESC);
  exp(EXP2_ROLE, EXP2_DATE, EXP2_DESC);

  section("Education");
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: `${EDU_TITLE} — ${EDU_SCHOOL}`, x: 40, y: y, width: 532, height: 12, font_size: 8.5, font_name: "Helvetica", text_color: "#475569", z_index: 2 });
  y -= 25;

  section("Skills");
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: SKILLS.join("   "), x: 40, y: y, width: 532, height: 12, font_size: 8.5, font_name: "Helvetica", text_color: "#0F172A", z_index: 2 });
  return els;
}

// TEMPLATE 31 — Zenith Clean (Minimal)
function zenithClean(pageId: string, wizardData?: any): Partial<EditorElement>[] {
  const { NAME, TITLE, EMAIL, PHONE, LOCATION, SUMMARY, EXP1_ROLE, EXP1_DATE, EXP1_DESC, EXP2_ROLE, EXP2_DATE, EXP2_DESC, EDU_TITLE, EDU_SCHOOL, SKILLS } = getTemplateData(wizardData);
  const els: Partial<EditorElement>[] = [];
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: NAME, x: 45, y: 740, width: 522, height: 22, font_size: 18, font_name: "Helvetica-Bold", text_color: "#1E293B", bold: true, z_index: 2 });
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: `${TITLE}  •  ${EMAIL}  •  ${PHONE}`, x: 45, y: 722, width: 522, height: 12, font_size: 8.5, font_name: "Helvetica", text_color: "#64748B", z_index: 2 });
  els.push({ id: gid(), element_type: "shape", shape_type: "line", page_id: pageId, x: 45, y: 712, x2: 567, y2: 712, border_color: "#CBD5E1", border_width: 0.75, z_index: 2 });

  let y = 690;
  const section = (title: string) => {
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: title, x: 45, y: y, width: 522, height: 12, font_size: 9, font_name: "Helvetica-Bold", text_color: "#334155", bold: true, z_index: 2 });
    y -= 14;
  };

  section("SUMMARY");
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: SUMMARY, x: 45, y: y-30, width: 522, height: 35, font_size: 8.5, font_name: "Helvetica", text_color: "#475569", line_height: 1.3, z_index: 2 });
  y -= 45;

  section("EXPERIENCE");
  const exp = (role: string, date: string, desc: string) => {
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: role, x: 45, y: y, width: 380, height: 12, font_size: 9, font_name: "Helvetica-Bold", text_color: "#0F172A", bold: true, z_index: 2 });
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: date, x: 430, y: y, width: 137, height: 12, font_size: 8, font_name: "Helvetica", text_color: "#64748B", align: "right", z_index: 2 });
    y -= 14;
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: desc, x: 45, y: y-35, width: 522, height: 40, font_size: 8.5, font_name: "Helvetica", text_color: "#475569", line_height: 1.3, z_index: 2 });
    y -= 45;
  };
  exp(EXP1_ROLE, EXP1_DATE, EXP1_DESC);
  exp(EXP2_ROLE, EXP2_DATE, EXP2_DESC);

  section("EDUCATION & SKILLS");
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: `${EDU_TITLE} — ${EDU_SCHOOL}`, x: 45, y: y, width: 522, height: 12, font_size: 8.5, font_name: "Helvetica", text_color: "#334155", z_index: 2 });
  y -= 15;
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: `Skills: ${SKILLS.join(", ")}`, x: 45, y: y, width: 522, height: 12, font_size: 8.5, font_name: "Helvetica", text_color: "#64748B", z_index: 2 });
  return els;
}

// TEMPLATE 32 — Dev Matrix (Tech)
function devMatrix(pageId: string, wizardData?: any): Partial<EditorElement>[] {
  const { NAME, TITLE, EMAIL, PHONE, LOCATION, SUMMARY, EXP1_ROLE, EXP1_DATE, EXP1_DESC, EXP2_ROLE, EXP2_DATE, EXP2_DESC, EDU_TITLE, EDU_SCHOOL, SKILLS } = getTemplateData(wizardData);
  const els: Partial<EditorElement>[] = [];
  els.push({ id: gid(), element_type: "shape", shape_type: "rectangle", page_id: pageId, x: 0, y: 0, width: 612, height: 792, fill_color: "#051A10", border_width: 0, z_index: 0 });
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: `// AUTHOR: ${NAME.toUpperCase()}`, x: 35, y: 745, width: 542, height: 22, font_size: 16, font_name: "Courier-Bold", text_color: "#10B981", bold: true, z_index: 2 });
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: `// ROLE: ${TITLE}`, x: 35, y: 726, width: 542, height: 14, font_size: 10, font_name: "Courier", text_color: "#059669", z_index: 2 });
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: `/* CONTACT: ${EMAIL} | ${PHONE} | ${LOCATION} */`, x: 35, y: 708, width: 542, height: 12, font_size: 8.5, font_name: "Courier", text_color: "#047857", z_index: 2 });

  let y = 675;
  const section = (title: string) => {
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: `func Get${title}() {`, x: 35, y: y, width: 542, height: 14, font_size: 10, font_name: "Courier-Bold", text_color: "#34D399", bold: true, z_index: 2 });
    y -= 16;
  };

  section("Summary");
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: `	"${SUMMARY}"`, x: 35, y: y-35, width: 542, height: 40, font_size: 8.5, font_name: "Courier", text_color: "#A7F3D0", line_height: 1.3, z_index: 2 });
  y -= 45;
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: `}`, x: 35, y: y, width: 542, height: 12, font_size: 10, font_name: "Courier", text_color: "#34D399", z_index: 2 });
  y -= 20;

  section("Experience");
  const exp = (role: string, date: string, desc: string) => {
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: `	// ${role} (${date})`, x: 35, y: y, width: 542, height: 12, font_size: 9, font_name: "Courier-Bold", text_color: "#10B981", bold: true, z_index: 2 });
    y -= 14;
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: `	${desc}`, x: 35, y: y-35, width: 542, height: 40, font_size: 8.5, font_name: "Courier", text_color: "#A7F3D0", line_height: 1.3, z_index: 2 });
    y -= 45;
  };
  exp(EXP1_ROLE, EXP1_DATE, EXP1_DESC);
  exp(EXP2_ROLE, EXP2_DATE, EXP2_DESC);
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: `}`, x: 35, y: y, width: 542, height: 12, font_size: 10, font_name: "Courier", text_color: "#34D399", z_index: 2 });
  y -= 20;

  section("TechStack");
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: `	return []string{${SKILLS.map(s => `"${s}"`).join(", ")}}`, x: 35, y: y, width: 542, height: 14, font_size: 8.5, font_name: "Courier", text_color: "#6EE7B7", z_index: 2 });
  y -= 16;
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: `}`, x: 35, y: y, width: 542, height: 12, font_size: 10, font_name: "Courier", text_color: "#34D399", z_index: 2 });
  return els;
}

// TEMPLATE 33 — Quantum Core (Tech)
function quantumCore(pageId: string, wizardData?: any): Partial<EditorElement>[] {
  const { NAME, TITLE, EMAIL, PHONE, LOCATION, SUMMARY, EXP1_ROLE, EXP1_DATE, EXP1_DESC, EXP2_ROLE, EXP2_DATE, EXP2_DESC, EDU_TITLE, EDU_SCHOOL, SKILLS } = getTemplateData(wizardData);
  const sw = 190;
  const els: Partial<EditorElement>[] = [];
  els.push({ id: gid(), element_type: "shape", shape_type: "rectangle", page_id: pageId, x: 0, y: 0, width: sw, height: 792, fill_color: "#0F172A", border_width: 0, z_index: 0 });
  els.push({ id: gid(), element_type: "shape", shape_type: "rectangle", page_id: pageId, x: sw-2, y: 0, width: 2, height: 792, fill_color: "#06B6D4", border_width: 0, z_index: 1 });

  els.push({ id: gid(), element_type: "text", page_id: pageId, text: NAME, x: 15, y: 740, width: sw-30, height: 24, font_size: 18, font_name: "Helvetica-Bold", text_color: "#FFFFFF", bold: true, z_index: 2 });
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: TITLE, x: 15, y: 722, width: sw-30, height: 12, font_size: 9.5, font_name: "Helvetica", text_color: "#22D3EE", z_index: 2 });

  let ly = 680;
  const sSection = (title: string) => {
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: title.toUpperCase(), x: 15, y: ly, width: sw-30, height: 12, font_size: 8.5, font_name: "Helvetica-Bold", text_color: "#06B6D4", bold: true, z_index: 2 });
    ly -= 14;
  };

  sSection("Contact");
  [EMAIL, PHONE, LOCATION].forEach(t => {
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: t, x: 15, y: ly, width: sw-30, height: 11, font_size: 8, font_name: "Helvetica", text_color: "#94A3B8", z_index: 2 });
    ly -= 14;
  });

  ly -= 15;
  sSection("Skills Matrix");
  SKILLS.forEach(s => {
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: `> ${s}`, x: 15, y: ly, width: sw-30, height: 11, font_size: 8, font_name: "Helvetica", text_color: "#E2E8F0", z_index: 2 });
    ly -= 14;
  });

  let ry = 740;
  const mSection = (title: string) => {
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: title.toUpperCase(), x: sw+25, y: ry, width: 350, height: 14, font_size: 10, font_name: "Helvetica-Bold", text_color: "#0F172A", bold: true, z_index: 2 });
    ry -= 3;
    els.push({ id: gid(), element_type: "shape", shape_type: "line", page_id: pageId, x: sw+25, y: ry, x2: 572, y2: ry, border_color: "#06B6D4", border_width: 1, z_index: 2 });
    ry -= 16;
  };

  mSection("System Architecture & Profile");
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: SUMMARY, x: sw+25, y: ry-35, width: 352, height: 40, font_size: 9, font_name: "Helvetica", text_color: "#334155", line_height: 1.35, z_index: 2 });
  ry -= 50;

  mSection("Engineering History");
  const exp = (role: string, date: string, desc: string) => {
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: role, x: sw+25, y: ry, width: 250, height: 14, font_size: 10, font_name: "Helvetica-Bold", text_color: "#0F172A", bold: true, z_index: 2 });
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: date, x: sw+270, y: ry, width: 100, height: 14, font_size: 8.5, font_name: "Helvetica", text_color: "#64748B", align: "right", z_index: 2 });
    ry -= 16;
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: desc, x: sw+25, y: ry-40, width: 352, height: 45, font_size: 8.5, font_name: "Helvetica", text_color: "#334155", line_height: 1.35, z_index: 2 });
    ry -= 55;
  };
  exp(EXP1_ROLE, EXP1_DATE, EXP1_DESC);
  exp(EXP2_ROLE, EXP2_DATE, EXP2_DESC);
  return els;
}



// ─────────────────────────────────────────────────────────────────────────────
// 20 NEW CREATIVE & ATS-OPTIMIZED TEMPLATE DEFINITIONS (TOTAL: 60 TEMPLATES)
// ─────────────────────────────────────────────────────────────────────────────

// TEMPLATE 34 — Apex Director (Professional)
function apexDirector(pageId: string, wizardData?: any): Partial<EditorElement>[] {
  const { NAME, TITLE, EMAIL, PHONE, LOCATION, LINKEDIN, SUMMARY, EXP1_ROLE, EXP1_DATE, EXP1_DESC, EXP2_ROLE, EXP2_DATE, EXP2_DESC, EDU_TITLE, EDU_SCHOOL, SKILLS } = getTemplateData(wizardData);
  const els: Partial<EditorElement>[] = [];
  els.push({ id: gid(), element_type: "shape", shape_type: "rectangle", page_id: pageId, x: 0, y: 705, width: 612, height: 87, fill_color: "#881337", border_width: 0, z_index: 0 });
  els.push({ id: gid(), element_type: "shape", shape_type: "rectangle", page_id: pageId, x: 0, y: 701, width: 612, height: 4, fill_color: "#F43F5E", border_width: 0, z_index: 1 });
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: NAME, x: 40, y: 748, width: 532, height: 26, font_size: 22, font_name: "Helvetica-Bold", text_color: "#FFFFFF", bold: true, z_index: 2 });
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: TITLE, x: 40, y: 728, width: 532, height: 14, font_size: 11, font_name: "Helvetica", text_color: "#FECDD3", z_index: 2 });

  let y = 670;
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: `${EMAIL}   |   ${PHONE}   |   ${LOCATION}   |   ${LINKEDIN}`, x: 40, y: y, width: 532, height: 12, font_size: 8.5, font_name: "Helvetica", text_color: "#64748B", z_index: 2 });
  y -= 25;

  const section = (title: string) => {
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: title.toUpperCase(), x: 40, y: y, width: 532, height: 14, font_size: 10, font_name: "Helvetica-Bold", text_color: "#881337", bold: true, z_index: 2 });
    y -= 3;
    els.push({ id: gid(), element_type: "shape", shape_type: "line", page_id: pageId, x: 40, y: y, x2: 572, y2: y, border_color: "#F43F5E", border_width: 1, z_index: 2 });
    y -= 16;
  };

  section("Executive Summary");
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: SUMMARY, x: 40, y: y-35, width: 532, height: 40, font_size: 9.5, font_name: "Helvetica", text_color: "#334155", line_height: 1.35, z_index: 2 });
  y -= 50;

  section("Leadership Experience");
  const exp = (role: string, date: string, desc: string) => {
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: role, x: 40, y: y, width: 400, height: 14, font_size: 10.5, font_name: "Helvetica-Bold", text_color: "#0F172A", bold: true, z_index: 2 });
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: date, x: 440, y: y, width: 132, height: 14, font_size: 9, font_name: "Helvetica", text_color: "#881337", align: "right", z_index: 2 });
    y -= 16;
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: desc, x: 40, y: y-40, width: 532, height: 45, font_size: 9, font_name: "Helvetica", text_color: "#334155", line_height: 1.35, z_index: 2 });
    y -= 55;
  };
  exp(EXP1_ROLE, EXP1_DATE, EXP1_DESC);
  exp(EXP2_ROLE, EXP2_DATE, EXP2_DESC);

  section("Education & Credentials");
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: EDU_TITLE, x: 40, y: y, width: 350, height: 14, font_size: 10, font_name: "Helvetica-Bold", text_color: "#0F172A", bold: true, z_index: 2 });
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: EDU_SCHOOL, x: 40, y: y-15, width: 532, height: 12, font_size: 9, font_name: "Helvetica", text_color: "#64748B", z_index: 2 });
  y -= 35;

  section("Core Strategic Competencies");
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: SKILLS.join("   •   "), x: 40, y: y-10, width: 532, height: 20, font_size: 9.5, font_name: "Helvetica-Bold", text_color: "#0F172A", z_index: 2 });
  return els;
}

// TEMPLATE 35 — Diplomat Formal (Professional)
function diplomatFormal(pageId: string, wizardData?: any): Partial<EditorElement>[] {
  const { NAME, TITLE, EMAIL, PHONE, LOCATION, SUMMARY, EXP1_ROLE, EXP1_DATE, EXP1_DESC, EXP2_ROLE, EXP2_DATE, EXP2_DESC, EDU_TITLE, EDU_SCHOOL, SKILLS } = getTemplateData(wizardData);
  const els: Partial<EditorElement>[] = [];
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: NAME, x: 40, y: 735, width: 532, height: 26, font_size: 22, font_name: "Times-Bold", text_color: "#0F172A", align: "center", bold: true, z_index: 2 });
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: TITLE.toUpperCase(), x: 40, y: 715, width: 532, height: 12, font_size: 9.5, font_name: "Times-Roman", text_color: "#475569", align: "center", z_index: 2 });
  els.push({ id: gid(), element_type: "shape", shape_type: "line", page_id: pageId, x: 40, y: 705, x2: 572, y2: 705, border_color: "#0F172A", border_width: 1.5, z_index: 2 });
  els.push({ id: gid(), element_type: "shape", shape_type: "line", page_id: pageId, x: 40, y: 702, x2: 572, y2: 702, border_color: "#0F172A", border_width: 0.5, z_index: 2 });
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: `${EMAIL}  •  ${PHONE}  •  ${LOCATION}`, x: 40, y: 686, width: 532, height: 12, font_size: 8.5, font_name: "Times-Roman", text_color: "#64748B", align: "center", z_index: 2 });

  let y = 650;
  const section = (title: string) => {
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: title.toUpperCase(), x: 40, y: y, width: 532, height: 14, font_size: 10.5, font_name: "Times-Bold", text_color: "#0F172A", bold: true, z_index: 2 });
    y -= 3;
    els.push({ id: gid(), element_type: "shape", shape_type: "line", page_id: pageId, x: 40, y: y, x2: 572, y2: y, border_color: "#94A3B8", border_width: 0.75, z_index: 2 });
    y -= 16;
  };

  section("Executive Profile");
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: SUMMARY, x: 40, y: y-35, width: 532, height: 40, font_size: 9.5, font_name: "Times-Roman", text_color: "#334155", line_height: 1.35, z_index: 2 });
  y -= 50;

  section("Professional History");
  const exp = (role: string, date: string, desc: string) => {
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: role, x: 40, y: y, width: 400, height: 14, font_size: 10, font_name: "Times-Bold", text_color: "#0F172A", bold: true, z_index: 2 });
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: date, x: 440, y: y, width: 132, height: 14, font_size: 9, font_name: "Times-Italic", text_color: "#64748B", align: "right", z_index: 2 });
    y -= 16;
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: desc, x: 40, y: y-40, width: 532, height: 45, font_size: 9, font_name: "Times-Roman", text_color: "#334155", line_height: 1.35, z_index: 2 });
    y -= 55;
  };
  exp(EXP1_ROLE, EXP1_DATE, EXP1_DESC);
  exp(EXP2_ROLE, EXP2_DATE, EXP2_DESC);

  section("Education");
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: `${EDU_TITLE} - ${EDU_SCHOOL}`, x: 40, y: y, width: 532, height: 14, font_size: 9.5, font_name: "Times-Roman", text_color: "#0F172A", z_index: 2 });
  y -= 25;

  section("Areas of Expertise");
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: SKILLS.join("   •   "), x: 40, y: y, width: 532, height: 14, font_size: 9.5, font_name: "Times-Roman", text_color: "#0F172A", z_index: 2 });
  return els;
}

// TEMPLATE 36 — Prestige Leadership (Professional)
function prestigeLeadership(pageId: string, wizardData?: any): Partial<EditorElement>[] {
  const { NAME, TITLE, EMAIL, PHONE, LOCATION, SUMMARY, EXP1_ROLE, EXP1_DATE, EXP1_DESC, EXP2_ROLE, EXP2_DATE, EXP2_DESC, EDU_TITLE, EDU_SCHOOL, SKILLS } = getTemplateData(wizardData);
  const els: Partial<EditorElement>[] = [];
  els.push({ id: gid(), element_type: "shape", shape_type: "rectangle", page_id: pageId, x: 40, y: 700, width: 532, height: 75, fill_color: "#0F172A", border_width: 0, z_index: 0 });
  els.push({ id: gid(), element_type: "shape", shape_type: "rectangle", page_id: pageId, x: 40, y: 700, width: 6, height: 75, fill_color: "#D97706", border_width: 0, z_index: 1 });
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: NAME, x: 60, y: 742, width: 490, height: 24, font_size: 20, font_name: "Helvetica-Bold", text_color: "#FFFFFF", bold: true, z_index: 2 });
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: TITLE, x: 60, y: 724, width: 490, height: 14, font_size: 10, font_name: "Helvetica", text_color: "#FCD34D", z_index: 2 });
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: `${EMAIL}  |  ${PHONE}  |  ${LOCATION}`, x: 60, y: 708, width: 490, height: 11, font_size: 8, font_name: "Helvetica", text_color: "#94A3B8", z_index: 2 });

  let y = 675;
  const section = (title: string) => {
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: title.toUpperCase(), x: 40, y: y, width: 532, height: 14, font_size: 10, font_name: "Helvetica-Bold", text_color: "#D97706", bold: true, z_index: 2 });
    y -= 3;
    els.push({ id: gid(), element_type: "shape", shape_type: "line", page_id: pageId, x: 40, y: y, x2: 572, y2: y, border_color: "#CBD5E1", border_width: 1, z_index: 2 });
    y -= 16;
  };

  section("Executive Overview");
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: SUMMARY, x: 40, y: y-35, width: 532, height: 40, font_size: 9.5, font_name: "Helvetica", text_color: "#334155", line_height: 1.35, z_index: 2 });
  y -= 50;

  section("Career Achievements");
  const exp = (role: string, date: string, desc: string) => {
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: role, x: 40, y: y, width: 400, height: 14, font_size: 10, font_name: "Helvetica-Bold", text_color: "#0F172A", bold: true, z_index: 2 });
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: date, x: 440, y: y, width: 132, height: 14, font_size: 9, font_name: "Helvetica", text_color: "#D97706", align: "right", z_index: 2 });
    y -= 16;
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: desc, x: 40, y: y-40, width: 532, height: 45, font_size: 9, font_name: "Helvetica", text_color: "#334155", line_height: 1.35, z_index: 2 });
    y -= 55;
  };
  exp(EXP1_ROLE, EXP1_DATE, EXP1_DESC);
  exp(EXP2_ROLE, EXP2_DATE, EXP2_DESC);

  section("Education & Credentials");
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: `${EDU_TITLE} — ${EDU_SCHOOL}`, x: 40, y: y, width: 532, height: 14, font_size: 9.5, font_name: "Helvetica", text_color: "#0F172A", z_index: 2 });
  y -= 25;

  section("Core Competencies");
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: SKILLS.join("   •   "), x: 40, y: y, width: 532, height: 14, font_size: 9.5, font_name: "Helvetica-Bold", text_color: "#0F172A", z_index: 2 });
  return els;
}

// TEMPLATE 37 — Sovereign Suite (Professional)
function sovereignSuite(pageId: string, wizardData?: any): Partial<EditorElement>[] {
  const { NAME, TITLE, EMAIL, PHONE, LOCATION, SUMMARY, EXP1_ROLE, EXP1_DATE, EXP1_DESC, EXP2_ROLE, EXP2_DATE, EXP2_DESC, EDU_TITLE, EDU_SCHOOL, SKILLS } = getTemplateData(wizardData);
  const els: Partial<EditorElement>[] = [];
  els.push({ id: gid(), element_type: "shape", shape_type: "rectangle", page_id: pageId, x: 0, y: 710, width: 612, height: 82, fill_color: "#1E1B4B", border_width: 0, z_index: 0 });
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: NAME, x: 40, y: 750, width: 532, height: 24, font_size: 22, font_name: "Helvetica-Bold", text_color: "#FFFFFF", bold: true, z_index: 2 });
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: TITLE, x: 40, y: 732, width: 532, height: 14, font_size: 10.5, font_name: "Helvetica", text_color: "#C7D2FE", z_index: 2 });

  let y = 675;
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: `${EMAIL}  |  ${PHONE}  |  ${LOCATION}`, x: 40, y: y, width: 532, height: 12, font_size: 8.5, font_name: "Helvetica", text_color: "#475569", z_index: 2 });
  y -= 25;

  const section = (title: string) => {
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: title.toUpperCase(), x: 40, y: y, width: 532, height: 14, font_size: 10, font_name: "Helvetica-Bold", text_color: "#1E1B4B", bold: true, z_index: 2 });
    y -= 3;
    els.push({ id: gid(), element_type: "shape", shape_type: "line", page_id: pageId, x: 40, y: y, x2: 572, y2: y, border_color: "#6366F1", border_width: 1, z_index: 2 });
    y -= 16;
  };

  section("Executive Summary");
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: SUMMARY, x: 40, y: y-35, width: 532, height: 40, font_size: 9.5, font_name: "Helvetica", text_color: "#334155", line_height: 1.35, z_index: 2 });
  y -= 50;

  section("Career Track");
  const exp = (role: string, date: string, desc: string) => {
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: role, x: 40, y: y, width: 400, height: 14, font_size: 10, font_name: "Helvetica-Bold", text_color: "#0F172A", bold: true, z_index: 2 });
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: date, x: 440, y: y, width: 132, height: 14, font_size: 9, font_name: "Helvetica", text_color: "#6366F1", align: "right", z_index: 2 });
    y -= 16;
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: desc, x: 40, y: y-40, width: 532, height: 45, font_size: 9, font_name: "Helvetica", text_color: "#334155", line_height: 1.35, z_index: 2 });
    y -= 55;
  };
  exp(EXP1_ROLE, EXP1_DATE, EXP1_DESC);
  exp(EXP2_ROLE, EXP2_DATE, EXP2_DESC);

  section("Education & Skills");
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: `${EDU_TITLE} — ${EDU_SCHOOL}`, x: 40, y: y, width: 532, height: 14, font_size: 9.5, font_name: "Helvetica", text_color: "#0F172A", z_index: 2 });
  y -= 20;
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: SKILLS.join("   •   "), x: 40, y: y, width: 532, height: 14, font_size: 9.5, font_name: "Helvetica-Bold", text_color: "#1E1B4B", z_index: 2 });
  return els;
}

// TEMPLATE 38 — Cosmic Starlight (Creative)
function cosmicStarlight(pageId: string, wizardData?: any): Partial<EditorElement>[] {
  const { NAME, TITLE, EMAIL, PHONE, LOCATION, SUMMARY, EXP1_ROLE, EXP1_DATE, EXP1_DESC, EXP2_ROLE, EXP2_DATE, EXP2_DESC, EDU_TITLE, EDU_SCHOOL, SKILLS } = getTemplateData(wizardData);
  const els: Partial<EditorElement>[] = [];
  els.push({ id: gid(), element_type: "shape", shape_type: "rectangle", page_id: pageId, x: 0, y: 715, width: 612, height: 77, fill_color: "#312E81", border_width: 0, z_index: 0 });
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: NAME, x: 40, y: 752, width: 532, height: 24, font_size: 22, font_name: "Helvetica-Bold", text_color: "#FFFFFF", bold: true, z_index: 2 });
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: TITLE, x: 40, y: 732, width: 532, height: 14, font_size: 11, font_name: "Helvetica", text_color: "#DDD6FE", z_index: 2 });

  let y = 680;
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: `${EMAIL}  |  ${PHONE}  |  ${LOCATION}`, x: 40, y: y, width: 532, height: 12, font_size: 8.5, font_name: "Helvetica", text_color: "#64748B", z_index: 2 });
  y -= 25;

  const section = (title: string) => {
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: title.toUpperCase(), x: 40, y: y, width: 532, height: 14, font_size: 10, font_name: "Helvetica-Bold", text_color: "#4338CA", bold: true, z_index: 2 });
    y -= 3;
    els.push({ id: gid(), element_type: "shape", shape_type: "line", page_id: pageId, x: 40, y: y, x2: 572, y2: y, border_color: "#818CF8", border_width: 1, z_index: 2 });
    y -= 16;
  };

  section("Creative Vision");
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: SUMMARY, x: 40, y: y-35, width: 532, height: 40, font_size: 9.5, font_name: "Helvetica", text_color: "#334155", line_height: 1.35, z_index: 2 });
  y -= 50;

  section("Selected Projects & Work");
  const exp = (role: string, date: string, desc: string) => {
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: role, x: 40, y: y, width: 400, height: 14, font_size: 10, font_name: "Helvetica-Bold", text_color: "#0F172A", bold: true, z_index: 2 });
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: date, x: 440, y: y, width: 132, height: 14, font_size: 9, font_name: "Helvetica", text_color: "#4338CA", align: "right", z_index: 2 });
    y -= 16;
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: desc, x: 40, y: y-40, width: 532, height: 45, font_size: 9, font_name: "Helvetica", text_color: "#334155", line_height: 1.35, z_index: 2 });
    y -= 55;
  };
  exp(EXP1_ROLE, EXP1_DATE, EXP1_DESC);
  exp(EXP2_ROLE, EXP2_DATE, EXP2_DESC);

  section("Education & Skills");
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: `${EDU_TITLE} - ${EDU_SCHOOL}`, x: 40, y: y, width: 532, height: 14, font_size: 9.5, font_name: "Helvetica", text_color: "#0F172A", z_index: 2 });
  y -= 20;
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: SKILLS.join("   •   "), x: 40, y: y, width: 532, height: 14, font_size: 9, font_name: "Helvetica-Bold", text_color: "#4338CA", z_index: 2 });
  return els;
}

// TEMPLATE 39 — Velvet Artisan (Creative)
function velvetArtisan(pageId: string, wizardData?: any): Partial<EditorElement>[] {
  const { NAME, TITLE, EMAIL, PHONE, LOCATION, SUMMARY, EXP1_ROLE, EXP1_DATE, EXP1_DESC, EXP2_ROLE, EXP2_DATE, EXP2_DESC, EDU_TITLE, EDU_SCHOOL, SKILLS } = getTemplateData(wizardData);
  const els: Partial<EditorElement>[] = [];
  els.push({ id: gid(), element_type: "shape", shape_type: "rectangle", page_id: pageId, x: 0, y: 715, width: 612, height: 77, fill_color: "#991B1B", border_width: 0, z_index: 0 });
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: NAME, x: 40, y: 752, width: 532, height: 24, font_size: 22, font_name: "Helvetica-Bold", text_color: "#FFFFFF", bold: true, z_index: 2 });
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: TITLE, x: 40, y: 732, width: 532, height: 14, font_size: 11, font_name: "Helvetica", text_color: "#FCA5A5", z_index: 2 });

  let y = 680;
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: `${EMAIL}  |  ${PHONE}  |  ${LOCATION}`, x: 40, y: y, width: 532, height: 12, font_size: 8.5, font_name: "Helvetica", text_color: "#64748B", z_index: 2 });
  y -= 25;

  const section = (title: string) => {
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: title.toUpperCase(), x: 40, y: y, width: 532, height: 14, font_size: 10, font_name: "Helvetica-Bold", text_color: "#991B1B", bold: true, z_index: 2 });
    y -= 3;
    els.push({ id: gid(), element_type: "shape", shape_type: "line", page_id: pageId, x: 40, y: y, x2: 572, y2: y, border_color: "#F87171", border_width: 1, z_index: 2 });
    y -= 16;
  };

  section("Profile");
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: SUMMARY, x: 40, y: y-35, width: 532, height: 40, font_size: 9.5, font_name: "Helvetica", text_color: "#334155", line_height: 1.35, z_index: 2 });
  y -= 50;

  section("Experience");
  const exp = (role: string, date: string, desc: string) => {
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: role, x: 40, y: y, width: 400, height: 14, font_size: 10, font_name: "Helvetica-Bold", text_color: "#0F172A", bold: true, z_index: 2 });
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: date, x: 440, y: y, width: 132, height: 14, font_size: 9, font_name: "Helvetica", text_color: "#991B1B", align: "right", z_index: 2 });
    y -= 16;
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: desc, x: 40, y: y-40, width: 532, height: 45, font_size: 9, font_name: "Helvetica", text_color: "#334155", line_height: 1.35, z_index: 2 });
    y -= 55;
  };
  exp(EXP1_ROLE, EXP1_DATE, EXP1_DESC);
  exp(EXP2_ROLE, EXP2_DATE, EXP2_DESC);

  section("Education & Skills");
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: `${EDU_TITLE} - ${EDU_SCHOOL}`, x: 40, y: y, width: 532, height: 14, font_size: 9.5, font_name: "Helvetica", text_color: "#0F172A", z_index: 2 });
  y -= 20;
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: SKILLS.join("   •   "), x: 40, y: y, width: 532, height: 14, font_size: 9, font_name: "Helvetica-Bold", text_color: "#991B1B", z_index: 2 });
  return els;
}

// TEMPLATE 40 — Nordic Clean (Minimal)
function nordicClean(pageId: string, wizardData?: any): Partial<EditorElement>[] {
  const { NAME, TITLE, EMAIL, PHONE, LOCATION, SUMMARY, EXP1_ROLE, EXP1_DATE, EXP1_DESC, EXP2_ROLE, EXP2_DATE, EXP2_DESC, EDU_TITLE, EDU_SCHOOL, SKILLS } = getTemplateData(wizardData);
  const els: Partial<EditorElement>[] = [];
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: NAME, x: 40, y: 745, width: 532, height: 22, font_size: 18, font_name: "Helvetica", text_color: "#0F172A", z_index: 2 });
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: `${TITLE}  |  ${EMAIL}  |  ${PHONE}`, x: 40, y: 728, width: 532, height: 12, font_size: 8.5, font_name: "Helvetica", text_color: "#64748B", z_index: 2 });
  els.push({ id: gid(), element_type: "shape", shape_type: "line", page_id: pageId, x: 40, y: 718, x2: 572, y2: 718, border_color: "#E2E8F0", border_width: 0.75, z_index: 2 });

  let y = 690;
  const section = (title: string) => {
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: title.toUpperCase(), x: 40, y: y, width: 532, height: 12, font_size: 8.5, font_name: "Helvetica-Bold", text_color: "#334155", bold: true, z_index: 2 });
    y -= 14;
  };

  section("About");
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: SUMMARY, x: 40, y: y-30, width: 532, height: 35, font_size: 8.5, font_name: "Helvetica", text_color: "#475569", line_height: 1.3, z_index: 2 });
  y -= 45;

  section("Experience");
  const exp = (role: string, date: string, desc: string) => {
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: role, x: 40, y: y, width: 380, height: 12, font_size: 9, font_name: "Helvetica-Bold", text_color: "#0F172A", bold: true, z_index: 2 });
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: date, x: 430, y: y, width: 142, height: 12, font_size: 8, font_name: "Helvetica", text_color: "#94A3B8", align: "right", z_index: 2 });
    y -= 14;
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: desc, x: 40, y: y-35, width: 532, height: 40, font_size: 8.5, font_name: "Helvetica", text_color: "#475569", line_height: 1.3, z_index: 2 });
    y -= 45;
  };
  exp(EXP1_ROLE, EXP1_DATE, EXP1_DESC);
  exp(EXP2_ROLE, EXP2_DATE, EXP2_DESC);

  section("Education & Skills");
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: `${EDU_TITLE} — ${EDU_SCHOOL}`, x: 40, y: y, width: 532, height: 12, font_size: 8.5, font_name: "Helvetica", text_color: "#334155", z_index: 2 });
  y -= 15;
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: SKILLS.join(", "), x: 40, y: y, width: 532, height: 12, font_size: 8.5, font_name: "Helvetica", text_color: "#64748B", z_index: 2 });
  return els;
}

// TEMPLATE 41 — Swiss Grid (Minimal)
function swissGrid(pageId: string, wizardData?: any): Partial<EditorElement>[] {
  const { NAME, TITLE, EMAIL, PHONE, LOCATION, SUMMARY, EXP1_ROLE, EXP1_DATE, EXP1_DESC, EXP2_ROLE, EXP2_DATE, EXP2_DESC, EDU_TITLE, EDU_SCHOOL, SKILLS } = getTemplateData(wizardData);
  const els: Partial<EditorElement>[] = [];
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: NAME, x: 40, y: 740, width: 532, height: 24, font_size: 20, font_name: "Helvetica-Bold", text_color: "#000000", bold: true, z_index: 2 });
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: `${TITLE} / ${EMAIL} / ${PHONE}`, x: 40, y: 722, width: 532, height: 12, font_size: 8.5, font_name: "Helvetica", text_color: "#666666", z_index: 2 });
  els.push({ id: gid(), element_type: "shape", shape_type: "line", page_id: pageId, x: 40, y: 712, x2: 572, y2: 712, border_color: "#000000", border_width: 1, z_index: 2 });

  let y = 685;
  const section = (title: string) => {
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: title.toUpperCase(), x: 40, y: y, width: 532, height: 12, font_size: 8.5, font_name: "Helvetica-Bold", text_color: "#000000", bold: true, z_index: 2 });
    y -= 14;
  };

  section("SUMMARY");
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: SUMMARY, x: 40, y: y-30, width: 532, height: 35, font_size: 8.5, font_name: "Helvetica", text_color: "#333333", line_height: 1.3, z_index: 2 });
  y -= 45;

  section("EXPERIENCE");
  const exp = (role: string, date: string, desc: string) => {
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: role, x: 40, y: y, width: 380, height: 12, font_size: 9, font_name: "Helvetica-Bold", text_color: "#000000", bold: true, z_index: 2 });
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: date, x: 430, y: y, width: 142, height: 12, font_size: 8, font_name: "Helvetica", text_color: "#666666", align: "right", z_index: 2 });
    y -= 14;
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: desc, x: 40, y: y-35, width: 532, height: 40, font_size: 8.5, font_name: "Helvetica", text_color: "#333333", line_height: 1.3, z_index: 2 });
    y -= 45;
  };
  exp(EXP1_ROLE, EXP1_DATE, EXP1_DESC);
  exp(EXP2_ROLE, EXP2_DATE, EXP2_DESC);

  section("EDUCATION & SKILLS");
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: `${EDU_TITLE} - ${EDU_SCHOOL}`, x: 40, y: y, width: 532, height: 12, font_size: 8.5, font_name: "Helvetica", text_color: "#333333", z_index: 2 });
  y -= 15;
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: SKILLS.join(" / "), x: 40, y: y, width: 532, height: 12, font_size: 8.5, font_name: "Helvetica", text_color: "#000000", z_index: 2 });
  return els;
}

// TEMPLATE 42 — Rust Kernel (Tech)
function rustKernel(pageId: string, wizardData?: any): Partial<EditorElement>[] {
  const { NAME, TITLE, EMAIL, PHONE, LOCATION, SUMMARY, EXP1_ROLE, EXP1_DATE, EXP1_DESC, EXP2_ROLE, EXP2_DATE, EXP2_DESC, EDU_TITLE, EDU_SCHOOL, SKILLS } = getTemplateData(wizardData);
  const els: Partial<EditorElement>[] = [];
  els.push({ id: gid(), element_type: "shape", shape_type: "rectangle", page_id: pageId, x: 0, y: 0, width: 612, height: 792, fill_color: "#18181B", border_width: 0, z_index: 0 });
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: `fn main() -> Result<(), SystemError> {`, x: 35, y: 748, width: 542, height: 16, font_size: 11, font_name: "Courier-Bold", text_color: "#F97316", bold: true, z_index: 2 });
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: `    let developer = "${NAME}";`, x: 35, y: 730, width: 542, height: 14, font_size: 10, font_name: "Courier", text_color: "#FB923C", z_index: 2 });
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: `    let title = "${TITLE}";`, x: 35, y: 712, width: 542, height: 14, font_size: 10, font_name: "Courier", text_color: "#FDBA74", z_index: 2 });

  let y = 675;
  const section = (title: string) => {
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: `    // --- ${title.toUpperCase()} ---`, x: 35, y: y, width: 542, height: 14, font_size: 9.5, font_name: "Courier-Bold", text_color: "#F97316", bold: true, z_index: 2 });
    y -= 16;
  };

  section("Summary");
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: `    let summary = "${SUMMARY}";`, x: 35, y: y-35, width: 542, height: 40, font_size: 8.5, font_name: "Courier", text_color: "#E4E4E7", line_height: 1.3, z_index: 2 });
  y -= 45;

  section("Experience");
  const exp = (role: string, date: string, desc: string) => {
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: `    // ${role} (${date})`, x: 35, y: y, width: 542, height: 12, font_size: 9, font_name: "Courier-Bold", text_color: "#FB923C", bold: true, z_index: 2 });
    y -= 14;
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: `    ${desc}`, x: 35, y: y-35, width: 542, height: 40, font_size: 8.5, font_name: "Courier", text_color: "#E4E4E7", line_height: 1.3, z_index: 2 });
    y -= 45;
  };
  exp(EXP1_ROLE, EXP1_DATE, EXP1_DESC);
  exp(EXP2_ROLE, EXP2_DATE, EXP2_DESC);

  section("Skills");
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: `    let skills = vec![${SKILLS.map(s => `"${s}"`).join(", ")}];`, x: 35, y: y, width: 542, height: 14, font_size: 8.5, font_name: "Courier", text_color: "#FDBA74", z_index: 2 });
  y -= 25;
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: `    Ok(()) 
}`, x: 35, y: y, width: 542, height: 20, font_size: 10, font_name: "Courier-Bold", text_color: "#F97316", z_index: 2 });
  return els;
}

// TEMPLATE 43 — Neural Network (Tech)
function neuralNetwork(pageId: string, wizardData?: any): Partial<EditorElement>[] {
  const { NAME, TITLE, EMAIL, PHONE, LOCATION, SUMMARY, EXP1_ROLE, EXP1_DATE, EXP1_DESC, EXP2_ROLE, EXP2_DATE, EXP2_DESC, EDU_TITLE, EDU_SCHOOL, SKILLS } = getTemplateData(wizardData);
  const els: Partial<EditorElement>[] = [];
  els.push({ id: gid(), element_type: "shape", shape_type: "rectangle", page_id: pageId, x: 0, y: 710, width: 612, height: 82, fill_color: "#0284C7", border_width: 0, z_index: 0 });
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: NAME, x: 40, y: 750, width: 532, height: 24, font_size: 22, font_name: "Helvetica-Bold", text_color: "#FFFFFF", bold: true, z_index: 2 });
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: `[AI / ML ARCHITECT]: ${TITLE}`, x: 40, y: 732, width: 532, height: 14, font_size: 10.5, font_name: "Helvetica", text_color: "#E0F2FE", z_index: 2 });

  let y = 675;
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: `${EMAIL}  |  ${PHONE}  |  ${LOCATION}`, x: 40, y: y, width: 532, height: 12, font_size: 8.5, font_name: "Helvetica", text_color: "#475569", z_index: 2 });
  y -= 25;

  const section = (title: string) => {
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: title.toUpperCase(), x: 40, y: y, width: 532, height: 14, font_size: 10, font_name: "Helvetica-Bold", text_color: "#0284C7", bold: true, z_index: 2 });
    y -= 3;
    els.push({ id: gid(), element_type: "shape", shape_type: "line", page_id: pageId, x: 40, y: y, x2: 572, y2: y, border_color: "#38BDF8", border_width: 1, z_index: 2 });
    y -= 16;
  };

  section("Model Architecture & Summary");
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: SUMMARY, x: 40, y: y-35, width: 532, height: 40, font_size: 9.5, font_name: "Helvetica", text_color: "#334155", line_height: 1.35, z_index: 2 });
  y -= 50;

  section("Engineering History");
  const exp = (role: string, date: string, desc: string) => {
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: role, x: 40, y: y, width: 400, height: 14, font_size: 10, font_name: "Helvetica-Bold", text_color: "#0F172A", bold: true, z_index: 2 });
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: date, x: 440, y: y, width: 132, height: 14, font_size: 9, font_name: "Helvetica", text_color: "#0284C7", align: "right", z_index: 2 });
    y -= 16;
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: desc, x: 40, y: y-40, width: 532, height: 45, font_size: 9, font_name: "Helvetica", text_color: "#334155", line_height: 1.35, z_index: 2 });
    y -= 55;
  };
  exp(EXP1_ROLE, EXP1_DATE, EXP1_DESC);
  exp(EXP2_ROLE, EXP2_DATE, EXP2_DESC);

  section("Education & ML Frameworks");
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: `${EDU_TITLE} - ${EDU_SCHOOL}`, x: 40, y: y, width: 532, height: 14, font_size: 9.5, font_name: "Helvetica", text_color: "#0F172A", z_index: 2 });
  y -= 20;
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: SKILLS.join("   •   "), x: 40, y: y, width: 532, height: 14, font_size: 9.5, font_name: "Helvetica-Bold", text_color: "#0284C7", z_index: 2 });
  return els;
}

// TEMPLATE 44 — Titan Corporate (Professional)
function titanCorporate(pageId: string, wizardData?: any): Partial<EditorElement>[] {
  const { NAME, TITLE, EMAIL, PHONE, LOCATION, SUMMARY, EXP1_ROLE, EXP1_DATE, EXP1_DESC, EXP2_ROLE, EXP2_DATE, EXP2_DESC, EDU_TITLE, EDU_SCHOOL, SKILLS } = getTemplateData(wizardData);
  const els: Partial<EditorElement>[] = [];
  els.push({ id: gid(), element_type: "shape", shape_type: "rectangle", page_id: pageId, x: 35, y: 700, width: 542, height: 75, fill_color: "#0F172A", border_width: 2, border_color: "#D97706", border_radius: 8, z_index: 0 });
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: NAME, x: 50, y: 740, width: 512, height: 24, font_size: 20, font_name: "Helvetica-Bold", text_color: "#F8FAFC", bold: true, z_index: 2 });
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: `${TITLE}  |  ${EMAIL}  |  ${PHONE}`, x: 50, y: 718, width: 512, height: 12, font_size: 9, font_name: "Helvetica", text_color: "#FCD34D", z_index: 2 });

  let y = 675;
  const section = (title: string) => {
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: title.toUpperCase(), x: 35, y: y, width: 542, height: 14, font_size: 10, font_name: "Helvetica-Bold", text_color: "#D97706", bold: true, z_index: 2 });
    y -= 3;
    els.push({ id: gid(), element_type: "shape", shape_type: "line", page_id: pageId, x: 35, y: y, x2: 577, y2: y, border_color: "#D97706", border_width: 1.5, z_index: 2 });
    y -= 16;
  };

  section("Executive Mandate");
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: SUMMARY, x: 35, y: y-35, width: 542, height: 40, font_size: 9.5, font_name: "Helvetica", text_color: "#334155", line_height: 1.35, z_index: 2 });
  y -= 50;

  section("Leadership History");
  const exp = (role: string, date: string, desc: string) => {
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: role, x: 35, y: y, width: 400, height: 14, font_size: 10.5, font_name: "Helvetica-Bold", text_color: "#0F172A", bold: true, z_index: 2 });
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: date, x: 440, y: y, width: 137, height: 14, font_size: 9, font_name: "Helvetica", text_color: "#B45309", align: "right", z_index: 2 });
    y -= 16;
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: desc, x: 35, y: y-40, width: 542, height: 45, font_size: 9, font_name: "Helvetica", text_color: "#334155", line_height: 1.35, z_index: 2 });
    y -= 55;
  };
  exp(EXP1_ROLE, EXP1_DATE, EXP1_DESC);
  exp(EXP2_ROLE, EXP2_DATE, EXP2_DESC);

  section("Qualifications & Core Domains");
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: `${EDU_TITLE} - ${EDU_SCHOOL}`, x: 35, y: y, width: 542, height: 14, font_size: 9.5, font_name: "Helvetica", text_color: "#0F172A", z_index: 2 });
  y -= 20;
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: SKILLS.join("   •   "), x: 35, y: y, width: 542, height: 14, font_size: 9.5, font_name: "Helvetica-Bold", text_color: "#B45309", z_index: 2 });
  return els;
}

// TEMPLATE 45 — Hyper Gradient (Creative)
function hyperGradient(pageId: string, wizardData?: any): Partial<EditorElement>[] {
  const { NAME, TITLE, EMAIL, PHONE, LOCATION, SUMMARY, EXP1_ROLE, EXP1_DATE, EXP1_DESC, EXP2_ROLE, EXP2_DATE, EXP2_DESC, EDU_TITLE, EDU_SCHOOL, SKILLS } = getTemplateData(wizardData);
  const els: Partial<EditorElement>[] = [];
  els.push({ id: gid(), element_type: "shape", shape_type: "rectangle", page_id: pageId, x: 0, y: 700, width: 612, height: 92, fill_color: "#7E22CE", border_width: 0, z_index: 0 });
  els.push({ id: gid(), element_type: "shape", shape_type: "rectangle", page_id: pageId, x: 0, y: 694, width: 612, height: 6, fill_color: "#EC4899", border_width: 0, z_index: 1 });
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: NAME, x: 40, y: 745, width: 532, height: 26, font_size: 24, font_name: "Helvetica-Bold", text_color: "#FFFFFF", bold: true, z_index: 2 });
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: TITLE, x: 40, y: 722, width: 532, height: 14, font_size: 11, font_name: "Helvetica", text_color: "#F472B6", z_index: 2 });

  let y = 665;
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: `${EMAIL}  •  ${PHONE}  •  ${LOCATION}`, x: 40, y: y, width: 532, height: 12, font_size: 8.5, font_name: "Helvetica", text_color: "#64748B", z_index: 2 });
  y -= 25;

  const section = (title: string) => {
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: title.toUpperCase(), x: 40, y: y, width: 532, height: 14, font_size: 10, font_name: "Helvetica-Bold", text_color: "#9333EA", bold: true, z_index: 2 });
    y -= 3;
    els.push({ id: gid(), element_type: "shape", shape_type: "line", page_id: pageId, x: 40, y: y, x2: 572, y2: y, border_color: "#F472B6", border_width: 1, z_index: 2 });
    y -= 16;
  };

  section("Bio");
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: SUMMARY, x: 40, y: y-35, width: 532, height: 40, font_size: 9.5, font_name: "Helvetica", text_color: "#334155", line_height: 1.35, z_index: 2 });
  y -= 50;

  section("Experience");
  const exp = (role: string, date: string, desc: string) => {
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: role, x: 40, y: y, width: 400, height: 14, font_size: 10.5, font_name: "Helvetica-Bold", text_color: "#0F172A", bold: true, z_index: 2 });
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: date, x: 440, y: y, width: 132, height: 14, font_size: 9, font_name: "Helvetica", text_color: "#DB2777", align: "right", z_index: 2 });
    y -= 16;
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: desc, x: 40, y: y-40, width: 532, height: 45, font_size: 9, font_name: "Helvetica", text_color: "#334155", line_height: 1.35, z_index: 2 });
    y -= 55;
  };
  exp(EXP1_ROLE, EXP1_DATE, EXP1_DESC);
  exp(EXP2_ROLE, EXP2_DATE, EXP2_DESC);

  section("Skills & Learning");
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: SKILLS.join("   •   "), x: 40, y: y, width: 532, height: 14, font_size: 9.5, font_name: "Helvetica-Bold", text_color: "#7E22CE", z_index: 2 });
  return els;
}

// TEMPLATE 46 — Studio Minimalist (Creative)
function studioMinimalist(pageId: string, wizardData?: any): Partial<EditorElement>[] {
  const { NAME, TITLE, EMAIL, PHONE, LOCATION, SUMMARY, EXP1_ROLE, EXP1_DATE, EXP1_DESC, EXP2_ROLE, EXP2_DATE, EXP2_DESC, EDU_TITLE, EDU_SCHOOL, SKILLS } = getTemplateData(wizardData);
  const els: Partial<EditorElement>[] = [];
  els.push({ id: gid(), element_type: "shape", shape_type: "rectangle", page_id: pageId, x: 40, y: 0, width: 6, height: 792, fill_color: "#059669", border_width: 0, z_index: 1 });
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: NAME, x: 65, y: 740, width: 500, height: 26, font_size: 24, font_name: "Helvetica-Bold", text_color: "#0F172A", bold: true, z_index: 2 });
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: TITLE, x: 65, y: 718, width: 500, height: 14, font_size: 11, font_name: "Helvetica", text_color: "#059669", z_index: 2 });

  let y = 675;
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: `${EMAIL}  |  ${PHONE}  |  ${LOCATION}`, x: 65, y: y, width: 500, height: 12, font_size: 8.5, font_name: "Helvetica", text_color: "#64748B", z_index: 2 });
  y -= 25;

  const section = (title: string) => {
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: title.toUpperCase(), x: 65, y: y, width: 500, height: 14, font_size: 10, font_name: "Helvetica-Bold", text_color: "#059669", bold: true, z_index: 2 });
    y -= 16;
  };

  section("Profile");
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: SUMMARY, x: 65, y: y-35, width: 500, height: 40, font_size: 9.5, font_name: "Helvetica", text_color: "#334155", line_height: 1.35, z_index: 2 });
  y -= 50;

  section("Selected Works");
  const exp = (role: string, date: string, desc: string) => {
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: role, x: 65, y: y, width: 380, height: 14, font_size: 10.5, font_name: "Helvetica-Bold", text_color: "#0F172A", bold: true, z_index: 2 });
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: date, x: 440, y: y, width: 125, height: 14, font_size: 9, font_name: "Helvetica", text_color: "#059669", align: "right", z_index: 2 });
    y -= 16;
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: desc, x: 65, y: y-40, width: 500, height: 45, font_size: 9, font_name: "Helvetica", text_color: "#334155", line_height: 1.35, z_index: 2 });
    y -= 55;
  };
  exp(EXP1_ROLE, EXP1_DATE, EXP1_DESC);
  exp(EXP2_ROLE, EXP2_DATE, EXP2_DESC);

  section("Tools & Skills");
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: SKILLS.join("   •   "), x: 65, y: y, width: 500, height: 14, font_size: 9.5, font_name: "Helvetica-Bold", text_color: "#0F172A", z_index: 2 });
  return els;
}

// TEMPLATE 47 — Spectrum Pulse (Creative)
function spectrumPulse(pageId: string, wizardData?: any): Partial<EditorElement>[] {
  const { NAME, TITLE, EMAIL, PHONE, LOCATION, SUMMARY, EXP1_ROLE, EXP1_DATE, EXP1_DESC, EXP2_ROLE, EXP2_DATE, EXP2_DESC, EDU_TITLE, EDU_SCHOOL, SKILLS } = getTemplateData(wizardData);
  const els: Partial<EditorElement>[] = [];
  els.push({ id: gid(), element_type: "shape", shape_type: "rectangle", page_id: pageId, x: 0, y: 720, width: 612, height: 72, fill_color: "#0284C7", border_width: 0, z_index: 0 });
  els.push({ id: gid(), element_type: "shape", shape_type: "rectangle", page_id: pageId, x: 0, y: 715, width: 612, height: 5, fill_color: "#A855F7", border_width: 0, z_index: 1 });
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: NAME, x: 40, y: 755, width: 532, height: 24, font_size: 22, font_name: "Helvetica-Bold", text_color: "#FFFFFF", bold: true, z_index: 2 });
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: TITLE, x: 40, y: 735, width: 532, height: 14, font_size: 11, font_name: "Helvetica", text_color: "#E0F2FE", z_index: 2 });

  let y = 680;
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: `${EMAIL}  |  ${PHONE}  |  ${LOCATION}`, x: 40, y: y, width: 532, height: 12, font_size: 8.5, font_name: "Helvetica", text_color: "#64748B", z_index: 2 });
  y -= 25;

  const section = (title: string) => {
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: title.toUpperCase(), x: 40, y: y, width: 532, height: 14, font_size: 10, font_name: "Helvetica-Bold", text_color: "#0284C7", bold: true, z_index: 2 });
    y -= 3;
    els.push({ id: gid(), element_type: "shape", shape_type: "line", page_id: pageId, x: 40, y: y, x2: 572, y2: y, border_color: "#A855F7", border_width: 1, z_index: 2 });
    y -= 16;
  };

  section("Overview");
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: SUMMARY, x: 40, y: y-35, width: 532, height: 40, font_size: 9.5, font_name: "Helvetica", text_color: "#334155", line_height: 1.35, z_index: 2 });
  y -= 50;

  section("Impact History");
  const exp = (role: string, date: string, desc: string) => {
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: role, x: 40, y: y, width: 400, height: 14, font_size: 10.5, font_name: "Helvetica-Bold", text_color: "#0F172A", bold: true, z_index: 2 });
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: date, x: 440, y: y, width: 132, height: 14, font_size: 9, font_name: "Helvetica", text_color: "#9333EA", align: "right", z_index: 2 });
    y -= 16;
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: desc, x: 40, y: y-40, width: 532, height: 45, font_size: 9, font_name: "Helvetica", text_color: "#334155", line_height: 1.35, z_index: 2 });
    y -= 55;
  };
  exp(EXP1_ROLE, EXP1_DATE, EXP1_DESC);
  exp(EXP2_ROLE, EXP2_DATE, EXP2_DESC);

  section("Competencies");
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: SKILLS.join("   •   "), x: 40, y: y, width: 532, height: 14, font_size: 9.5, font_name: "Helvetica-Bold", text_color: "#0284C7", z_index: 2 });
  return els;
}

// TEMPLATE 48 — Pure Typography (Minimal)
function pureTypography(pageId: string, wizardData?: any): Partial<EditorElement>[] {
  const { NAME, TITLE, EMAIL, PHONE, LOCATION, SUMMARY, EXP1_ROLE, EXP1_DATE, EXP1_DESC, EXP2_ROLE, EXP2_DATE, EXP2_DESC, EDU_TITLE, EDU_SCHOOL, SKILLS } = getTemplateData(wizardData);
  const els: Partial<EditorElement>[] = [];
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: NAME, x: 50, y: 735, width: 512, height: 28, font_size: 24, font_name: "Times-Bold", text_color: "#0F172A", align: "center", bold: true, z_index: 2 });
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: TITLE.toUpperCase(), x: 50, y: 712, width: 512, height: 14, font_size: 10, font_name: "Times-Roman", text_color: "#475569", align: "center", z_index: 2 });
  els.push({ id: gid(), element_type: "shape", shape_type: "line", page_id: pageId, x: 200, y: 700, x2: 412, y2: 700, border_color: "#0F172A", border_width: 1, z_index: 2 });
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: `${EMAIL}  •  ${PHONE}  •  ${LOCATION}`, x: 50, y: 682, width: 512, height: 12, font_size: 8.5, font_name: "Times-Roman", text_color: "#64748B", align: "center", z_index: 2 });

  let y = 645;
  const section = (title: string) => {
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: title.toUpperCase(), x: 50, y: y, width: 512, height: 14, font_size: 10.5, font_name: "Times-Bold", text_color: "#0F172A", bold: true, z_index: 2 });
    y -= 3;
    els.push({ id: gid(), element_type: "shape", shape_type: "line", page_id: pageId, x: 50, y: y, x2: 562, y2: y, border_color: "#CBD5E1", border_width: 0.5, z_index: 2 });
    y -= 16;
  };

  section("Summary");
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: SUMMARY, x: 50, y: y-35, width: 512, height: 40, font_size: 9.5, font_name: "Times-Roman", text_color: "#334155", line_height: 1.35, z_index: 2 });
  y -= 50;

  section("Experience");
  const exp = (role: string, date: string, desc: string) => {
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: role, x: 50, y: y, width: 380, height: 14, font_size: 10, font_name: "Times-Bold", text_color: "#0F172A", bold: true, z_index: 2 });
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: date, x: 430, y: y, width: 132, height: 14, font_size: 9, font_name: "Times-Italic", text_color: "#64748B", align: "right", z_index: 2 });
    y -= 16;
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: desc, x: 50, y: y-40, width: 512, height: 45, font_size: 9, font_name: "Times-Roman", text_color: "#334155", line_height: 1.35, z_index: 2 });
    y -= 55;
  };
  exp(EXP1_ROLE, EXP1_DATE, EXP1_DESC);
  exp(EXP2_ROLE, EXP2_DATE, EXP2_DESC);

  section("Skills & Qualifications");
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: SKILLS.join("  •  "), x: 50, y: y, width: 512, height: 14, font_size: 9.5, font_name: "Times-Roman", text_color: "#0F172A", z_index: 2 });
  return els;
}

// TEMPLATE 49 — Air Minimal (Minimal)
function airMinimal(pageId: string, wizardData?: any): Partial<EditorElement>[] {
  const { NAME, TITLE, EMAIL, PHONE, LOCATION, SUMMARY, EXP1_ROLE, EXP1_DATE, EXP1_DESC, EXP2_ROLE, EXP2_DATE, EXP2_DESC, EDU_TITLE, EDU_SCHOOL, SKILLS } = getTemplateData(wizardData);
  const els: Partial<EditorElement>[] = [];
  els.push({ id: gid(), element_type: "shape", shape_type: "rectangle", page_id: pageId, x: 0, y: 730, width: 612, height: 62, fill_color: "#F0F9FF", border_width: 0, z_index: 0 });
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: NAME, x: 45, y: 756, width: 522, height: 24, font_size: 22, font_name: "Helvetica-Bold", text_color: "#0369A1", bold: true, z_index: 2 });
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: TITLE, x: 45, y: 738, width: 522, height: 14, font_size: 10.5, font_name: "Helvetica", text_color: "#0284C7", z_index: 2 });

  let y = 690;
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: `${EMAIL}   |   ${PHONE}   |   ${LOCATION}`, x: 45, y: y, width: 522, height: 12, font_size: 8.5, font_name: "Helvetica", text_color: "#64748B", z_index: 2 });
  y -= 30;

  const section = (title: string) => {
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: title.toUpperCase(), x: 45, y: y, width: 522, height: 14, font_size: 9.5, font_name: "Helvetica-Bold", text_color: "#0369A1", bold: true, z_index: 2 });
    y -= 16;
  };

  section("Profile");
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: SUMMARY, x: 45, y: y-35, width: 522, height: 40, font_size: 9.5, font_name: "Helvetica", text_color: "#334155", line_height: 1.35, z_index: 2 });
  y -= 50;

  section("Experience");
  const exp = (role: string, date: string, desc: string) => {
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: role, x: 45, y: y, width: 380, height: 14, font_size: 10, font_name: "Helvetica-Bold", text_color: "#0F172A", bold: true, z_index: 2 });
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: date, x: 435, y: y, width: 132, height: 14, font_size: 9, font_name: "Helvetica", text_color: "#0284C7", align: "right", z_index: 2 });
    y -= 16;
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: desc, x: 45, y: y-40, width: 522, height: 45, font_size: 9, font_name: "Helvetica", text_color: "#334155", line_height: 1.35, z_index: 2 });
    y -= 55;
  };
  exp(EXP1_ROLE, EXP1_DATE, EXP1_DESC);
  exp(EXP2_ROLE, EXP2_DATE, EXP2_DESC);

  section("Skills");
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: SKILLS.join("   •   "), x: 45, y: y, width: 522, height: 14, font_size: 9.5, font_name: "Helvetica-Bold", text_color: "#0369A1", z_index: 2 });
  return els;
}

// TEMPLATE 50 — Paper Craft (Minimal)
function paperCraft(pageId: string, wizardData?: any): Partial<EditorElement>[] {
  const { NAME, TITLE, EMAIL, PHONE, LOCATION, SUMMARY, EXP1_ROLE, EXP1_DATE, EXP1_DESC, EXP2_ROLE, EXP2_DATE, EXP2_DESC, EDU_TITLE, EDU_SCHOOL, SKILLS } = getTemplateData(wizardData);
  const els: Partial<EditorElement>[] = [];
  els.push({ id: gid(), element_type: "shape", shape_type: "rectangle", page_id: pageId, x: 20, y: 20, width: 572, height: 752, fill_color: "#FAFAF9", border_color: "#E7E5E4", border_width: 1, border_radius: 12, z_index: 0 });
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: NAME, x: 45, y: 730, width: 522, height: 24, font_size: 22, font_name: "Helvetica-Bold", text_color: "#1C1917", bold: true, z_index: 2 });
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: `${TITLE}  •  ${EMAIL}  •  ${PHONE}`, x: 45, y: 710, width: 522, height: 14, font_size: 9.5, font_name: "Helvetica", text_color: "#78716C", z_index: 2 });

  let y = 675;
  const section = (title: string) => {
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: title.toUpperCase(), x: 45, y: y, width: 522, height: 14, font_size: 10, font_name: "Helvetica-Bold", text_color: "#44403C", bold: true, z_index: 2 });
    y -= 3;
    els.push({ id: gid(), element_type: "shape", shape_type: "line", page_id: pageId, x: 45, y: y, x2: 567, y2: y, border_color: "#D6D3D1", border_width: 1, z_index: 2 });
    y -= 16;
  };

  section("Summary");
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: SUMMARY, x: 45, y: y-35, width: 522, height: 40, font_size: 9.5, font_name: "Helvetica", text_color: "#292524", line_height: 1.35, z_index: 2 });
  y -= 50;

  section("Experience");
  const exp = (role: string, date: string, desc: string) => {
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: role, x: 45, y: y, width: 380, height: 14, font_size: 10, font_name: "Helvetica-Bold", text_color: "#1C1917", bold: true, z_index: 2 });
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: date, x: 435, y: y, width: 132, height: 14, font_size: 9, font_name: "Helvetica", text_color: "#78716C", align: "right", z_index: 2 });
    y -= 16;
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: desc, x: 45, y: y-40, width: 522, height: 45, font_size: 9, font_name: "Helvetica", text_color: "#292524", line_height: 1.35, z_index: 2 });
    y -= 55;
  };
  exp(EXP1_ROLE, EXP1_DATE, EXP1_DESC);
  exp(EXP2_ROLE, EXP2_DATE, EXP2_DESC);

  section("Skills");
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: SKILLS.join("   •   "), x: 45, y: y, width: 522, height: 14, font_size: 9.5, font_name: "Helvetica-Bold", text_color: "#44403C", z_index: 2 });
  return els;
}

// TEMPLATE 51 — Silicon Clean (Minimal)
function siliconClean(pageId: string, wizardData?: any): Partial<EditorElement>[] {
  const { NAME, TITLE, EMAIL, PHONE, LOCATION, SUMMARY, EXP1_ROLE, EXP1_DATE, EXP1_DESC, EXP2_ROLE, EXP2_DATE, EXP2_DESC, EDU_TITLE, EDU_SCHOOL, SKILLS } = getTemplateData(wizardData);
  const els: Partial<EditorElement>[] = [];
  els.push({ id: gid(), element_type: "shape", shape_type: "circle", page_id: pageId, x: 40, y: 745, width: 10, height: 10, fill_color: "#0D9488", border_width: 0, z_index: 2 });
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: NAME, x: 58, y: 742, width: 500, height: 24, font_size: 22, font_name: "Helvetica-Bold", text_color: "#0F172A", bold: true, z_index: 2 });
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: `${TITLE}  //  ${EMAIL}  //  ${LOCATION}`, x: 58, y: 722, width: 500, height: 14, font_size: 9.5, font_name: "Courier", text_color: "#0D9488", z_index: 2 });

  let y = 680;
  const section = (title: string) => {
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: title.toUpperCase(), x: 40, y: y, width: 532, height: 14, font_size: 10, font_name: "Helvetica-Bold", text_color: "#0F172A", bold: true, z_index: 2 });
    y -= 3;
    els.push({ id: gid(), element_type: "shape", shape_type: "line", page_id: pageId, x: 40, y: y, x2: 572, y2: y, border_color: "#CCFBF1", border_width: 2, z_index: 2 });
    y -= 16;
  };

  section("Overview");
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: SUMMARY, x: 40, y: y-35, width: 532, height: 40, font_size: 9.5, font_name: "Helvetica", text_color: "#334155", line_height: 1.35, z_index: 2 });
  y -= 50;

  section("Experience");
  const exp = (role: string, date: string, desc: string) => {
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: role, x: 40, y: y, width: 400, height: 14, font_size: 10, font_name: "Helvetica-Bold", text_color: "#0F172A", bold: true, z_index: 2 });
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: date, x: 440, y: y, width: 132, height: 14, font_size: 9, font_name: "Courier", text_color: "#0D9488", align: "right", z_index: 2 });
    y -= 16;
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: desc, x: 40, y: y-40, width: 532, height: 45, font_size: 9, font_name: "Helvetica", text_color: "#334155", line_height: 1.35, z_index: 2 });
    y -= 55;
  };
  exp(EXP1_ROLE, EXP1_DATE, EXP1_DESC);
  exp(EXP2_ROLE, EXP2_DATE, EXP2_DESC);

  section("Technologies");
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: SKILLS.join("   |   "), x: 40, y: y, width: 532, height: 14, font_size: 9, font_name: "Courier-Bold", text_color: "#0D9488", z_index: 2 });
  return els;
}

// TEMPLATE 52 — Subtle Line (Minimal)
function subtleLine(pageId: string, wizardData?: any): Partial<EditorElement>[] {
  const { NAME, TITLE, EMAIL, PHONE, LOCATION, SUMMARY, EXP1_ROLE, EXP1_DATE, EXP1_DESC, EXP2_ROLE, EXP2_DATE, EXP2_DESC, EDU_TITLE, EDU_SCHOOL, SKILLS } = getTemplateData(wizardData);
  const els: Partial<EditorElement>[] = [];
  els.push({ id: gid(), element_type: "shape", shape_type: "rectangle", page_id: pageId, x: 0, y: 0, width: 20, height: 792, fill_color: "#334155", border_width: 0, z_index: 0 });
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: NAME, x: 45, y: 740, width: 522, height: 24, font_size: 22, font_name: "Helvetica-Bold", text_color: "#0F172A", bold: true, z_index: 2 });
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: `${TITLE}  •  ${EMAIL}  •  ${PHONE}`, x: 45, y: 720, width: 522, height: 14, font_size: 9.5, font_name: "Helvetica", text_color: "#475569", z_index: 2 });

  let y = 680;
  const section = (title: string) => {
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: title.toUpperCase(), x: 45, y: y, width: 522, height: 14, font_size: 10, font_name: "Helvetica-Bold", text_color: "#334155", bold: true, z_index: 2 });
    y -= 3;
    els.push({ id: gid(), element_type: "shape", shape_type: "line", page_id: pageId, x: 45, y: y, x2: 567, y2: y, border_color: "#CBD5E1", border_width: 0.75, z_index: 2 });
    y -= 16;
  };

  section("Executive Summary");
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: SUMMARY, x: 45, y: y-35, width: 522, height: 40, font_size: 9.5, font_name: "Helvetica", text_color: "#334155", line_height: 1.35, z_index: 2 });
  y -= 50;

  section("Experience");
  const exp = (role: string, date: string, desc: string) => {
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: role, x: 45, y: y, width: 380, height: 14, font_size: 10, font_name: "Helvetica-Bold", text_color: "#0F172A", bold: true, z_index: 2 });
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: date, x: 435, y: y, width: 132, height: 14, font_size: 9, font_name: "Helvetica", text_color: "#64748B", align: "right", z_index: 2 });
    y -= 16;
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: desc, x: 45, y: y-40, width: 522, height: 45, font_size: 9, font_name: "Helvetica", text_color: "#334155", line_height: 1.35, z_index: 2 });
    y -= 55;
  };
  exp(EXP1_ROLE, EXP1_DATE, EXP1_DESC);
  exp(EXP2_ROLE, EXP2_DATE, EXP2_DESC);

  section("Skills & Expertise");
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: SKILLS.join("   •   "), x: 45, y: y, width: 522, height: 14, font_size: 9.5, font_name: "Helvetica-Bold", text_color: "#334155", z_index: 2 });
  return els;
}

// TEMPLATE 53 — Linear Purity (Minimal)
function linearPurity(pageId: string, wizardData?: any): Partial<EditorElement>[] {
  const { NAME, TITLE, EMAIL, PHONE, LOCATION, SUMMARY, EXP1_ROLE, EXP1_DATE, EXP1_DESC, EXP2_ROLE, EXP2_DATE, EXP2_DESC, EDU_TITLE, EDU_SCHOOL, SKILLS } = getTemplateData(wizardData);
  const els: Partial<EditorElement>[] = [];
  els.push({ id: gid(), element_type: "shape", shape_type: "rectangle", page_id: pageId, x: 40, y: 710, width: 532, height: 65, fill_color: "#F0FDF4", border_color: "#86EFAC", border_width: 1, border_radius: 8, z_index: 0 });
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: NAME, x: 55, y: 745, width: 500, height: 22, font_size: 18, font_name: "Helvetica-Bold", text_color: "#166534", bold: true, z_index: 2 });
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: `${TITLE}  |  ${EMAIL}  |  ${PHONE}`, x: 55, y: 725, width: 500, height: 12, font_size: 8.5, font_name: "Helvetica", text_color: "#15803D", z_index: 2 });

  let y = 675;
  const section = (title: string) => {
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: title.toUpperCase(), x: 40, y: y, width: 532, height: 14, font_size: 10, font_name: "Helvetica-Bold", text_color: "#166534", bold: true, z_index: 2 });
    y -= 3;
    els.push({ id: gid(), element_type: "shape", shape_type: "line", page_id: pageId, x: 40, y: y, x2: 572, y2: y, border_color: "#86EFAC", border_width: 1, z_index: 2 });
    y -= 16;
  };

  section("Profile");
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: SUMMARY, x: 40, y: y-35, width: 532, height: 40, font_size: 9.5, font_name: "Helvetica", text_color: "#334155", line_height: 1.35, z_index: 2 });
  y -= 50;

  section("Experience");
  const exp = (role: string, date: string, desc: string) => {
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: role, x: 40, y: y, width: 400, height: 14, font_size: 10, font_name: "Helvetica-Bold", text_color: "#0F172A", bold: true, z_index: 2 });
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: date, x: 440, y: y, width: 132, height: 14, font_size: 9, font_name: "Helvetica", text_color: "#166534", align: "right", z_index: 2 });
    y -= 16;
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: desc, x: 40, y: y-40, width: 532, height: 45, font_size: 9, font_name: "Helvetica", text_color: "#334155", line_height: 1.35, z_index: 2 });
    y -= 55;
  };
  exp(EXP1_ROLE, EXP1_DATE, EXP1_DESC);
  exp(EXP2_ROLE, EXP2_DATE, EXP2_DESC);

  section("Skills");
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: SKILLS.join("   •   "), x: 40, y: y, width: 532, height: 14, font_size: 9.5, font_name: "Helvetica-Bold", text_color: "#15803D", z_index: 2 });
  return els;
}

// TEMPLATE 54 — Architect Blueprint (Minimal)
function architectBlueprint(pageId: string, wizardData?: any): Partial<EditorElement>[] {
  const { NAME, TITLE, EMAIL, PHONE, LOCATION, SUMMARY, EXP1_ROLE, EXP1_DATE, EXP1_DESC, EXP2_ROLE, EXP2_DATE, EXP2_DESC, EDU_TITLE, EDU_SCHOOL, SKILLS } = getTemplateData(wizardData);
  const els: Partial<EditorElement>[] = [];
  els.push({ id: gid(), element_type: "shape", shape_type: "rectangle", page_id: pageId, x: 0, y: 700, width: 612, height: 92, fill_color: "#1E3A8A", border_width: 0, z_index: 0 });
  els.push({ id: gid(), element_type: "shape", shape_type: "line", page_id: pageId, x: 0, y: 698, x2: 612, y2: 698, border_color: "#93C5FD", border_width: 1.5, z_index: 1 });
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: NAME, x: 40, y: 745, width: 532, height: 24, font_size: 22, font_name: "Courier-Bold", text_color: "#FFFFFF", bold: true, z_index: 2 });
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: `SYSTEM ARCHITECT: ${TITLE}`, x: 40, y: 724, width: 532, height: 14, font_size: 10, font_name: "Courier", text_color: "#93C5FD", z_index: 2 });

  let y = 665;
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: `${EMAIL}  |  ${PHONE}  |  ${LOCATION}`, x: 40, y: y, width: 532, height: 12, font_size: 8.5, font_name: "Courier", text_color: "#475569", z_index: 2 });
  y -= 25;

  const section = (title: string) => {
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: `[ ${title.toUpperCase()} ]`, x: 40, y: y, width: 532, height: 14, font_size: 10, font_name: "Courier-Bold", text_color: "#1E3A8A", bold: true, z_index: 2 });
    y -= 3;
    els.push({ id: gid(), element_type: "shape", shape_type: "line", page_id: pageId, x: 40, y: y, x2: 572, y2: y, border_color: "#93C5FD", border_width: 1, z_index: 2 });
    y -= 16;
  };

  section("Specifications");
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: SUMMARY, x: 40, y: y-35, width: 532, height: 40, font_size: 9, font_name: "Courier", text_color: "#334155", line_height: 1.35, z_index: 2 });
  y -= 50;

  section("Architectural Experience");
  const exp = (role: string, date: string, desc: string) => {
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: role, x: 40, y: y, width: 400, height: 14, font_size: 10, font_name: "Courier-Bold", text_color: "#0F172A", bold: true, z_index: 2 });
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: date, x: 440, y: y, width: 132, height: 14, font_size: 9, font_name: "Courier", text_color: "#1E3A8A", align: "right", z_index: 2 });
    y -= 16;
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: desc, x: 40, y: y-40, width: 532, height: 45, font_size: 8.5, font_name: "Courier", text_color: "#334155", line_height: 1.35, z_index: 2 });
    y -= 55;
  };
  exp(EXP1_ROLE, EXP1_DATE, EXP1_DESC);
  exp(EXP2_ROLE, EXP2_DATE, EXP2_DESC);

  section("Technical Stack");
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: SKILLS.join("   •   "), x: 40, y: y, width: 532, height: 14, font_size: 9, font_name: "Courier-Bold", text_color: "#1E3A8A", z_index: 2 });
  return els;
}

// TEMPLATE 55 — Stack Overflow (Tech)
function stackOverflow(pageId: string, wizardData?: any): Partial<EditorElement>[] {
  const { NAME, TITLE, EMAIL, PHONE, LOCATION, SUMMARY, EXP1_ROLE, EXP1_DATE, EXP1_DESC, EXP2_ROLE, EXP2_DATE, EXP2_DESC, EDU_TITLE, EDU_SCHOOL, SKILLS } = getTemplateData(wizardData);
  const els: Partial<EditorElement>[] = [];
  els.push({ id: gid(), element_type: "shape", shape_type: "rectangle", page_id: pageId, x: 0, y: 0, width: 612, height: 792, fill_color: "#2D2D2D", border_width: 0, z_index: 0 });
  els.push({ id: gid(), element_type: "shape", shape_type: "rectangle", page_id: pageId, x: 0, y: 720, width: 612, height: 72, fill_color: "#F48024", border_width: 0, z_index: 1 });
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: NAME, x: 40, y: 755, width: 532, height: 24, font_size: 22, font_name: "Helvetica-Bold", text_color: "#FFFFFF", bold: true, z_index: 2 });
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: `${TITLE}  //  ${EMAIL}`, x: 40, y: 735, width: 532, height: 14, font_size: 10, font_name: "Courier", text_color: "#FFF", z_index: 2 });

  let y = 680;
  const section = (title: string) => {
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: `// ${title.toUpperCase()}`, x: 40, y: y, width: 532, height: 14, font_size: 10, font_name: "Courier-Bold", text_color: "#F48024", bold: true, z_index: 2 });
    y -= 16;
  };

  section("About Developer");
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: SUMMARY, x: 40, y: y-35, width: 532, height: 40, font_size: 9, font_name: "Courier", text_color: "#D4D4D4", line_height: 1.35, z_index: 2 });
  y -= 50;

  section("Work History");
  const exp = (role: string, date: string, desc: string) => {
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: role, x: 40, y: y, width: 400, height: 14, font_size: 10, font_name: "Courier-Bold", text_color: "#FFFFFF", bold: true, z_index: 2 });
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: date, x: 440, y: y, width: 132, height: 14, font_size: 8.5, font_name: "Courier", text_color: "#BC6D25", align: "right", z_index: 2 });
    y -= 16;
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: desc, x: 40, y: y-40, width: 532, height: 45, font_size: 8.5, font_name: "Courier", text_color: "#D4D4D4", line_height: 1.35, z_index: 2 });
    y -= 55;
  };
  exp(EXP1_ROLE, EXP1_DATE, EXP1_DESC);
  exp(EXP2_ROLE, EXP2_DATE, EXP2_DESC);

  section("Tag Stack");
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: SKILLS.map(s => `[${s}]`).join("  "), x: 40, y: y, width: 532, height: 14, font_size: 9, font_name: "Courier-Bold", text_color: "#F48024", z_index: 2 });
  return els;
}

// TEMPLATE 56 — Cloud Native (Tech)
function cloudNative(pageId: string, wizardData?: any): Partial<EditorElement>[] {
  const { NAME, TITLE, EMAIL, PHONE, LOCATION, SUMMARY, EXP1_ROLE, EXP1_DATE, EXP1_DESC, EXP2_ROLE, EXP2_DATE, EXP2_DESC, EDU_TITLE, EDU_SCHOOL, SKILLS } = getTemplateData(wizardData);
  const els: Partial<EditorElement>[] = [];
  els.push({ id: gid(), element_type: "shape", shape_type: "rectangle", page_id: pageId, x: 0, y: 700, width: 612, height: 92, fill_color: "#0F172A", border_width: 0, z_index: 0 });
  els.push({ id: gid(), element_type: "shape", shape_type: "rectangle", page_id: pageId, x: 0, y: 695, width: 612, height: 5, fill_color: "#38BDF8", border_width: 0, z_index: 1 });
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: NAME, x: 40, y: 745, width: 532, height: 24, font_size: 22, font_name: "Helvetica-Bold", text_color: "#FFFFFF", bold: true, z_index: 2 });
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: `CLOUD NATIVE ARCHITECT  •  ${TITLE}`, x: 40, y: 724, width: 532, height: 14, font_size: 10, font_name: "Helvetica", text_color: "#38BDF8", z_index: 2 });

  let y = 665;
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: `${EMAIL}  |  ${PHONE}  |  ${LOCATION}`, x: 40, y: y, width: 532, height: 12, font_size: 8.5, font_name: "Helvetica", text_color: "#64748B", z_index: 2 });
  y -= 25;

  const section = (title: string) => {
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: title.toUpperCase(), x: 40, y: y, width: 532, height: 14, font_size: 10, font_name: "Helvetica-Bold", text_color: "#0284C7", bold: true, z_index: 2 });
    y -= 3;
    els.push({ id: gid(), element_type: "shape", shape_type: "line", page_id: pageId, x: 40, y: y, x2: 572, y2: y, border_color: "#38BDF8", border_width: 1, z_index: 2 });
    y -= 16;
  };

  section("Infrastructure Mandate");
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: SUMMARY, x: 40, y: y-35, width: 532, height: 40, font_size: 9.5, font_name: "Helvetica", text_color: "#334155", line_height: 1.35, z_index: 2 });
  y -= 50;

  section("DevOps & Platform Engineering");
  const exp = (role: string, date: string, desc: string) => {
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: role, x: 40, y: y, width: 400, height: 14, font_size: 10, font_name: "Helvetica-Bold", text_color: "#0F172A", bold: true, z_index: 2 });
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: date, x: 440, y: y, width: 132, height: 14, font_size: 9, font_name: "Helvetica", text_color: "#0284C7", align: "right", z_index: 2 });
    y -= 16;
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: desc, x: 40, y: y-40, width: 532, height: 45, font_size: 9, font_name: "Helvetica", text_color: "#334155", line_height: 1.35, z_index: 2 });
    y -= 55;
  };
  exp(EXP1_ROLE, EXP1_DATE, EXP1_DESC);
  exp(EXP2_ROLE, EXP2_DATE, EXP2_DESC);

  section("Container Ecosystem & Cloud Tools");
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: SKILLS.join("   •   "), x: 40, y: y, width: 532, height: 14, font_size: 9.5, font_name: "Helvetica-Bold", text_color: "#0284C7", z_index: 2 });
  return els;
}

// TEMPLATE 57 — Cyber Architect (Tech)
function cyberArchitect(pageId: string, wizardData?: any): Partial<EditorElement>[] {
  const { NAME, TITLE, EMAIL, PHONE, LOCATION, SUMMARY, EXP1_ROLE, EXP1_DATE, EXP1_DESC, EXP2_ROLE, EXP2_DATE, EXP2_DESC, EDU_TITLE, EDU_SCHOOL, SKILLS } = getTemplateData(wizardData);
  const els: Partial<EditorElement>[] = [];
  els.push({ id: gid(), element_type: "shape", shape_type: "rectangle", page_id: pageId, x: 0, y: 0, width: 612, height: 792, fill_color: "#090D16", border_width: 0, z_index: 0 });
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: `$ root@cyber:~# cat profile.sys`, x: 35, y: 750, width: 542, height: 16, font_size: 11, font_name: "Courier-Bold", text_color: "#22C55E", bold: true, z_index: 2 });
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: `NAME="${NAME}" ROLE="${TITLE}"`, x: 35, y: 730, width: 542, height: 14, font_size: 10, font_name: "Courier", text_color: "#4ADE80", z_index: 2 });

  let y = 690;
  const section = (title: string) => {
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: `$ ./execute --section=${title.toLowerCase()}`, x: 35, y: y, width: 542, height: 14, font_size: 9.5, font_name: "Courier-Bold", text_color: "#22C55E", bold: true, z_index: 2 });
    y -= 16;
  };

  section("summary");
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: SUMMARY, x: 35, y: y-35, width: 542, height: 40, font_size: 8.5, font_name: "Courier", text_color: "#E2E8F0", line_height: 1.3, z_index: 2 });
  y -= 45;

  section("logs");
  const exp = (role: string, date: string, desc: string) => {
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: `[LOG]: ${role} (${date})`, x: 35, y: y, width: 542, height: 12, font_size: 9, font_name: "Courier-Bold", text_color: "#4ADE80", bold: true, z_index: 2 });
    y -= 14;
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: desc, x: 35, y: y-35, width: 542, height: 40, font_size: 8.5, font_name: "Courier", text_color: "#CBD5E1", line_height: 1.3, z_index: 2 });
    y -= 45;
  };
  exp(EXP1_ROLE, EXP1_DATE, EXP1_DESC);
  exp(EXP2_ROLE, EXP2_DATE, EXP2_DESC);

  section("capabilities");
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: SKILLS.join("   "), x: 35, y: y, width: 542, height: 14, font_size: 8.5, font_name: "Courier-Bold", text_color: "#86EFAC", z_index: 2 });
  return els;
}

// TEMPLATE 58 — Cyber Deck (Tech)
function cyberDeck(pageId: string, wizardData?: any): Partial<EditorElement>[] {
  const { NAME, TITLE, EMAIL, PHONE, LOCATION, SUMMARY, EXP1_ROLE, EXP1_DATE, EXP1_DESC, EXP2_ROLE, EXP2_DATE, EXP2_DESC, EDU_TITLE, EDU_SCHOOL, SKILLS } = getTemplateData(wizardData);
  const els: Partial<EditorElement>[] = [];
  els.push({ id: gid(), element_type: "shape", shape_type: "rectangle", page_id: pageId, x: 0, y: 700, width: 612, height: 92, fill_color: "#18181B", border_width: 0, z_index: 0 });
  els.push({ id: gid(), element_type: "shape", shape_type: "rectangle", page_id: pageId, x: 0, y: 694, width: 612, height: 6, fill_color: "#EAB308", border_width: 0, z_index: 1 });
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: NAME, x: 40, y: 745, width: 532, height: 24, font_size: 22, font_name: "Courier-Bold", text_color: "#FACC15", bold: true, z_index: 2 });
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: `SYSTEM OPERATOR: ${TITLE}`, x: 40, y: 724, width: 532, height: 14, font_size: 10, font_name: "Courier", text_color: "#FFFFFF", z_index: 2 });

  let y = 665;
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: `${EMAIL}  |  ${PHONE}  |  ${LOCATION}`, x: 40, y: y, width: 532, height: 12, font_size: 8.5, font_name: "Courier", text_color: "#71717A", z_index: 2 });
  y -= 25;

  const section = (title: string) => {
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: `[ ${title.toUpperCase()} ]`, x: 40, y: y, width: 532, height: 14, font_size: 10, font_name: "Courier-Bold", text_color: "#CA8A04", bold: true, z_index: 2 });
    y -= 3;
    els.push({ id: gid(), element_type: "shape", shape_type: "line", page_id: pageId, x: 40, y: y, x2: 572, y2: y, border_color: "#EAB308", border_width: 1, z_index: 2 });
    y -= 16;
  };

  section("Profile");
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: SUMMARY, x: 40, y: y-35, width: 532, height: 40, font_size: 9, font_name: "Courier", text_color: "#27272A", line_height: 1.35, z_index: 2 });
  y -= 50;

  section("Deployment History");
  const exp = (role: string, date: string, desc: string) => {
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: role, x: 40, y: y, width: 400, height: 14, font_size: 10, font_name: "Courier-Bold", text_color: "#09090B", bold: true, z_index: 2 });
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: date, x: 440, y: y, width: 132, height: 14, font_size: 9, font_name: "Courier", text_color: "#CA8A04", align: "right", z_index: 2 });
    y -= 16;
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: desc, x: 40, y: y-40, width: 532, height: 45, font_size: 8.5, font_name: "Courier", text_color: "#27272A", line_height: 1.35, z_index: 2 });
    y -= 55;
  };
  exp(EXP1_ROLE, EXP1_DATE, EXP1_DESC);
  exp(EXP2_ROLE, EXP2_DATE, EXP2_DESC);

  section("Stack");
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: SKILLS.join("   •   "), x: 40, y: y, width: 532, height: 14, font_size: 9, font_name: "Courier-Bold", text_color: "#CA8A04", z_index: 2 });
  return els;
}

// TEMPLATE 59 — Docker Cloud (Tech)
function dockerCloud(pageId: string, wizardData?: any): Partial<EditorElement>[] {
  const { NAME, TITLE, EMAIL, PHONE, LOCATION, SUMMARY, EXP1_ROLE, EXP1_DATE, EXP1_DESC, EXP2_ROLE, EXP2_DATE, EXP2_DESC, EDU_TITLE, EDU_SCHOOL, SKILLS } = getTemplateData(wizardData);
  const els: Partial<EditorElement>[] = [];
  els.push({ id: gid(), element_type: "shape", shape_type: "rectangle", page_id: pageId, x: 0, y: 700, width: 612, height: 92, fill_color: "#0369A1", border_width: 0, z_index: 0 });
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: NAME, x: 40, y: 745, width: 532, height: 24, font_size: 22, font_name: "Helvetica-Bold", text_color: "#FFFFFF", bold: true, z_index: 2 });
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: `CONTAINER ARCHITECT  •  ${TITLE}`, x: 40, y: 724, width: 532, height: 14, font_size: 10, font_name: "Helvetica", text_color: "#BAE6FD", z_index: 2 });

  let y = 665;
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: `${EMAIL}  |  ${PHONE}  |  ${LOCATION}`, x: 40, y: y, width: 532, height: 12, font_size: 8.5, font_name: "Helvetica", text_color: "#64748B", z_index: 2 });
  y -= 25;

  const section = (title: string) => {
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: title.toUpperCase(), x: 40, y: y, width: 532, height: 14, font_size: 10, font_name: "Helvetica-Bold", text_color: "#0369A1", bold: true, z_index: 2 });
    y -= 3;
    els.push({ id: gid(), element_type: "shape", shape_type: "line", page_id: pageId, x: 40, y: y, x2: 572, y2: y, border_color: "#BAE6FD", border_width: 1, z_index: 2 });
    y -= 16;
  };

  section("Cluster Overview");
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: SUMMARY, x: 40, y: y-35, width: 532, height: 40, font_size: 9.5, font_name: "Helvetica", text_color: "#334155", line_height: 1.35, z_index: 2 });
  y -= 50;

  section("Deployment History");
  const exp = (role: string, date: string, desc: string) => {
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: role, x: 40, y: y, width: 400, height: 14, font_size: 10, font_name: "Helvetica-Bold", text_color: "#0F172A", bold: true, z_index: 2 });
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: date, x: 440, y: y, width: 132, height: 14, font_size: 9, font_name: "Helvetica", text_color: "#0284C7", align: "right", z_index: 2 });
    y -= 16;
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: desc, x: 40, y: y-40, width: 532, height: 45, font_size: 9, font_name: "Helvetica", text_color: "#334155", line_height: 1.35, z_index: 2 });
    y -= 55;
  };
  exp(EXP1_ROLE, EXP1_DATE, EXP1_DESC);
  exp(EXP2_ROLE, EXP2_DATE, EXP2_DESC);

  section("Container Engine & Tooling");
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: SKILLS.join("   •   "), x: 40, y: y, width: 532, height: 14, font_size: 9.5, font_name: "Helvetica-Bold", text_color: "#0369A1", z_index: 2 });
  return els;
}

// TEMPLATE 60 — Wasm Edge (Tech)
function wasmEdge(pageId: string, wizardData?: any): Partial<EditorElement>[] {
  const { NAME, TITLE, EMAIL, PHONE, LOCATION, SUMMARY, EXP1_ROLE, EXP1_DATE, EXP1_DESC, EXP2_ROLE, EXP2_DATE, EXP2_DESC, EDU_TITLE, EDU_SCHOOL, SKILLS } = getTemplateData(wizardData);
  const els: Partial<EditorElement>[] = [];
  els.push({ id: gid(), element_type: "shape", shape_type: "rectangle", page_id: pageId, x: 0, y: 700, width: 612, height: 92, fill_color: "#451A03", border_width: 0, z_index: 0 });
  els.push({ id: gid(), element_type: "shape", shape_type: "rectangle", page_id: pageId, x: 0, y: 694, width: 612, height: 6, fill_color: "#F59E0B", border_width: 0, z_index: 1 });
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: NAME, x: 40, y: 745, width: 532, height: 24, font_size: 22, font_name: "Courier-Bold", text_color: "#FBBF24", bold: true, z_index: 2 });
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: `WASM EDGE DEVELOPER  •  ${TITLE}`, x: 40, y: 724, width: 532, height: 14, font_size: 10, font_name: "Courier", text_color: "#FDE68A", z_index: 2 });

  let y = 665;
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: `${EMAIL}  |  ${PHONE}  |  ${LOCATION}`, x: 40, y: y, width: 532, height: 12, font_size: 8.5, font_name: "Courier", text_color: "#78350F", z_index: 2 });
  y -= 25;

  const section = (title: string) => {
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: `// ${title.toUpperCase()}`, x: 40, y: y, width: 532, height: 14, font_size: 10, font_name: "Courier-Bold", text_color: "#D97706", bold: true, z_index: 2 });
    y -= 3;
    els.push({ id: gid(), element_type: "shape", shape_type: "line", page_id: pageId, x: 40, y: y, x2: 572, y2: y, border_color: "#FBBF24", border_width: 1, z_index: 2 });
    y -= 16;
  };

  section("Runtime Profile");
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: SUMMARY, x: 40, y: y-35, width: 532, height: 40, font_size: 9, font_name: "Courier", text_color: "#451A03", line_height: 1.35, z_index: 2 });
  y -= 50;

  section("Edge Deployments");
  const exp = (role: string, date: string, desc: string) => {
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: role, x: 40, y: y, width: 400, height: 14, font_size: 10, font_name: "Courier-Bold", text_color: "#78350F", bold: true, z_index: 2 });
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: date, x: 440, y: y, width: 132, height: 14, font_size: 9, font_name: "Courier", text_color: "#D97706", align: "right", z_index: 2 });
    y -= 16;
    els.push({ id: gid(), element_type: "text", page_id: pageId, text: desc, x: 40, y: y-40, width: 532, height: 45, font_size: 8.5, font_name: "Courier", text_color: "#451A03", line_height: 1.35, z_index: 2 });
    y -= 55;
  };
  exp(EXP1_ROLE, EXP1_DATE, EXP1_DESC);
  exp(EXP2_ROLE, EXP2_DATE, EXP2_DESC);

  section("Compiled Modules");
  els.push({ id: gid(), element_type: "text", page_id: pageId, text: SKILLS.join("   •   "), x: 40, y: y, width: 532, height: 14, font_size: 9, font_name: "Courier-Bold", text_color: "#B45309", z_index: 2 });
  return els;
}

export const RESUME_TEMPLATES: TemplateDef[] = [
  // ───────────────────────────────────────────────────────────────────────────
  // 1. PROFESSIONAL CATEGORY (15 TEMPLATES)
  // ───────────────────────────────────────────────────────────────────────────
  { id: "corporate_hierarchy", name: "Corporate Hierarchy", category: "Professional", description: "Structured timeline using interconnected circles and vertical lines.", elements: (p, d) => corporateHierarchy(p, d) },
  { id: "elegant_scholar", name: "Elegant Scholar", category: "Professional", description: "Clean, double-bordered formal layout using classic Times-Roman typography.", elements: (p, d) => elegantScholar(p, d) },
  { id: "crimson_executive", name: "Crimson Executive", category: "Professional", description: "Bold crimson diagonal header cut with pill-style skill tags.", elements: (p, d) => crimsonExecutive(p, d) },
  { id: "emerald_pro", name: "Emerald Pro", category: "Professional", description: "Deep forest-green sidebar with monogram avatar and skill progress bars.", elements: (p, d) => emeraldPro(p, d) },
  { id: "executive_gold", name: "Executive Gold", category: "Professional", description: "Rich charcoal sidebar with elegant gold accents for C-Suite executives.", elements: (p, d) => executiveGold(p, d) },
  { id: "slate_impact", name: "Slate Impact", category: "Professional", description: "Right-sidebar in deep blue with skill bars. Two-pane layout.", elements: (p, d) => slateImpact(p, d) },
  { id: "monarch_classic", name: "Monarch Classic", category: "Professional", description: "Formal monarch header with golden rules and Times-Bold typography.", elements: (p, d) => monarchClassic(p, d) },
  { id: "beacon_executive", name: "Beacon Executive", category: "Professional", description: "Navy blue top banner cut with sky blue accent strip.", elements: (p, d) => beaconExecutive(p, d) },
  { id: "sterling_corporate", name: "Sterling Corporate", category: "Professional", description: "Corporate boxed header layout with slate section dividers.", elements: (p, d) => sterlingCorporate(p, d) },
  { id: "vanguard_officer", name: "Vanguard Officer", category: "Professional", description: "Header card with solid dark bar and executive summary box.", elements: (p, d) => vanguardOfficer(p, d) },
  { id: "apex_director", name: "Apex Director", category: "Professional", description: "Deep rose header bar cut with crisp white typography for directors.", elements: (p, d) => apexDirector(p, d) },
  { id: "diplomat_formal", name: "Diplomat Formal", category: "Professional", description: "Formal diplomat header with double lines and serif typography.", elements: (p, d) => diplomatFormal(p, d) },
  { id: "prestige_leadership", name: "Prestige Leadership", category: "Professional", description: "Dark navy card header with amber accent strip for senior leadership.", elements: (p, d) => prestigeLeadership(p, d) },
  { id: "sovereign_suite", name: "Sovereign Suite", category: "Professional", description: "Deep indigo top banner with indigo section underline rules.", elements: (p, d) => sovereignSuite(p, d) },
  { id: "titan_corporate", name: "Titan Corporate", category: "Professional", description: "High-density executive layout tailored for enterprise leaders.", elements: (p, d) => titanCorporate(p, d) },

  // ───────────────────────────────────────────────────────────────────────────
  // 2. CREATIVE CATEGORY (15 TEMPLATES)
  // ───────────────────────────────────────────────────────────────────────────
  { id: "cyberpunk_edge", name: "Cyberpunk Edge", category: "Creative", description: "Angular bezier paths cutting sharply across a dark background.", elements: (p, d) => cyberpunkEdge(p, d) },
  { id: "creative_portfolio", name: "Creative Portfolio", category: "Creative", description: "Overlapping circular background shapes for a bubbly aesthetic.", elements: (p, d) => creativePortfolio(p, d) },
  { id: "gradient_flow", name: "Gradient Flow", category: "Creative", description: "Smooth, flowing Bezier curves at the top and bottom margins.", elements: (p, d) => gradientFlow(p, d) },
  { id: "aurora", name: "Aurora", category: "Creative", description: "Deep navy banner, geometric circle accents, and teal wave divider.", elements: (p, d) => aurora(p, d) },
  { id: "rose_gold", name: "Rose Gold", category: "Creative", description: "Elegant rose-pink sidebar with circular avatar monogram.", elements: (p, d) => roseGold(p, d) },
  { id: "dual_tone_horizon", name: "Dual Tone Horizon", category: "Creative", description: "Bold top color block split horizontally with profile circle.", elements: (p, d) => dualToneHorizon(p, d) },
  { id: "nature_botanist", name: "Nature Botanist", category: "Creative", description: "Earth tones and subtle leaf-like bezier header paths.", elements: (p, d) => natureBotanist(p, d) },
  { id: "solar_flare", name: "Solar Flare", category: "Creative", description: "Amber diagonal polygon splash header for designers.", elements: (p, d) => solarFlare(p, d) },
  { id: "indigo_wave", name: "Indigo Wave", category: "Creative", description: "Deep indigo header with bezier wave cutout and pill skill tags.", elements: (p, d) => indigoWave(p, d) },
  { id: "prism_vivid", name: "Prism Vivid", category: "Creative", description: "Vivid violet top header cut with cyan divider strip.", elements: (p, d) => prismVivid(p, d) },
  { id: "cosmic_starlight", name: "Cosmic Starlight", category: "Creative", description: "Deep violet header block with lavender role subtitle.", elements: (p, d) => cosmicStarlight(p, d) },
  { id: "velvet_artisan", name: "Velvet Artisan", category: "Creative", description: "Rich crimson header bar with soft rose typography.", elements: (p, d) => velvetArtisan(p, d) },
  { id: "hyper_gradient", name: "Hyper Gradient", category: "Creative", description: "Dynamic color gradient hero with wave path dividers.", elements: (p, d) => hyperGradient(p, d) },
  { id: "studio_minimalist", name: "Studio Minimalist", category: "Creative", description: "Artistic header block with modern asymmetrical spacing.", elements: (p, d) => studioMinimalist(p, d) },
  { id: "spectrum_pulse", name: "Spectrum Pulse", category: "Creative", description: "Bold banner with vibrant pulse accent lines.", elements: (p, d) => spectrumPulse(p, d) },

  // ───────────────────────────────────────────────────────────────────────────
  // 3. MINIMAL CATEGORY (15 TEMPLATES)
  // ───────────────────────────────────────────────────────────────────────────
  { id: "minimalist_grid", name: "Minimalist Grid", category: "Minimal", description: "Subtle underlying grid structure of thin grey lines.", elements: (p, d) => minimalistGrid(p, d) },
  { id: "stark_brutalist", name: "Stark Brutalist", category: "Minimal", description: "Pure black and white with heavy geometric framing.", elements: (p, d) => starkBrutalist(p, d) },
  { id: "crystal_clean", name: "Crystal Clean", category: "Minimal", description: "Purple accents on white with skill pill tags.", elements: (p, d) => crystalClean(p, d) },
  { id: "charcoal_minimal", name: "Charcoal Minimal", category: "Minimal", description: "Pure black and white. No color distractions — clean typography.", elements: (p, d) => charcoalMinimal(p, d) },
  { id: "mono_sleek", name: "Mono Sleek", category: "Minimal", description: "Ultra-sleek single rule divider with mono alignment.", elements: (p, d) => monoSleek(p, d) },
  { id: "zenith_clean", name: "Zenith Clean", category: "Minimal", description: "Compact minimalist layout with subtle slate dividers.", elements: (p, d) => zenithClean(p, d) },
  { id: "pure_typography", name: "Pure Typography", category: "Minimal", description: "Hierarchy relying strictly on typography and white space.", elements: (p, d) => pureTypography(p, d) },
  { id: "air_minimal", name: "Air Minimal", category: "Minimal", description: "Spacious margin bounds with ultra-light rules.", elements: (p, d) => airMinimal(p, d) },
  { id: "paper_craft", name: "Paper Craft", category: "Minimal", description: "Subtle boxed margin outline creating a paper feel.", elements: (p, d) => paperCraft(p, d) },
  { id: "silicon_clean", name: "Silicon Clean", category: "Minimal", description: "Silicon Valley aesthetic with micro horizontal dividers.", elements: (p, d) => siliconClean(p, d) },
  { id: "nordic_clean", name: "Nordic Clean", category: "Minimal", description: "Ultra-thin rule dividers with spacious character tracking.", elements: (p, d) => nordicClean(p, d) },
  { id: "swiss_grid", name: "Swiss Grid", category: "Minimal", description: "Swiss international typographic grid layout.", elements: (p, d) => swissGrid(p, d) },
  { id: "subtle_line", name: "Subtle Line", category: "Minimal", description: "Minimal grey margin frame with high ATS text density.", elements: (p, d) => subtleLine(p, d) },
  { id: "linear_purity", name: "Linear Purity", category: "Minimal", description: "Clean linear hierarchy with border pill tags.", elements: (p, d) => linearPurity(p, d) },
  { id: "architect_blueprint", name: "Architect Blueprint", category: "Minimal", description: "Blueprint structural layout lines with crisp margins.", elements: (p, d) => architectBlueprint(p, d) },

  // ───────────────────────────────────────────────────────────────────────────
  // 4. TECH CATEGORY (15 TEMPLATES)
  // ───────────────────────────────────────────────────────────────────────────
  { id: "geometric_tech", name: "Geometric Tech", category: "Tech", description: "Overlapping polygons, dark theme, and neon cyan accents.", elements: (p, d) => geometricTech(p, d) },
  { id: "retro_terminal", name: "Retro Terminal", category: "Tech", description: "Hacker-themed vintage command-line terminal layout.", elements: (p, d) => retroTerminal(p, d) },
  { id: "neon_coder", name: "Neon Coder", category: "Tech", description: "Hacker-dark background with green progress bars.", elements: (p, d) => neonCoder(p, d) },
  { id: "obsidian_night", name: "Obsidian Night", category: "Tech", description: "Ultra-dark sidebar with indigo accents for tech leads.", elements: (p, d) => obsidianNight(p, d) },
  { id: "midnight_blue", name: "Midnight Blue", category: "Tech", description: "Dark navy with radar skill chart and wave hero.", elements: (p, d) => midnightBlue(p, d) },
  { id: "dev_matrix", name: "Dev Matrix", category: "Tech", description: "Dark matrix green IDE terminal theme with function syntax.", elements: (p, d) => devMatrix(p, d) },
  { id: "quantum_core", name: "Quantum Core", category: "Tech", description: "Dark slate sidebar with cyan borders and system headers.", elements: (p, d) => quantumCore(p, d) },
  { id: "stack_overflow", name: "Stack Overflow", category: "Tech", description: "Hacker-dark IDE theme with syntax highlighting.", elements: (p, d) => stackOverflow(p, d) },
  { id: "cloud_native", name: "Cloud Native", category: "Tech", description: "Microservice timeline layout with cyan node markers.", elements: (p, d) => cloudNative(p, d) },
  { id: "cyber_architect", name: "Cyber Architect", category: "Tech", description: "Terminal layout with monospace code comments.", elements: (p, d) => cyberArchitect(p, d) },
  { id: "rust_kernel", name: "Rust Kernel", category: "Tech", description: "Rust system programming dark IDE theme with code blocks.", elements: (p, d) => rustKernel(p, d) },
  { id: "neural_network", name: "Neural Network", category: "Tech", description: "AI / ML Architect layout with sky blue top banner.", elements: (p, d) => neuralNetwork(p, d) },
  { id: "cyber_deck", name: "Cyber Deck", category: "Tech", description: "Cyberpunk monospace layout with dark background.", elements: (p, d) => cyberDeck(p, d) },
  { id: "docker_cloud", name: "Docker Cloud", category: "Tech", description: "Kubernetes container badge layout with cloud metrics.", elements: (p, d) => dockerCloud(p, d) },
  { id: "wasm_edge", name: "Wasm Edge", category: "Tech", description: "Edge microservices network layout with dark terminal theme.", elements: (p, d) => wasmEdge(p, d) }
];
