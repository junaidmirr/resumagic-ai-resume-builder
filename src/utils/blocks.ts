import type { EditorElement } from "../types/editor";

export interface ResumeBlock {
  id: string;
  name: string;
  icon: string;
  elements: (groupId: string, pageId: string, z: number, dynamicData?: any) => Partial<EditorElement>[];
}

export const RESUME_BLOCKS: ResumeBlock[] = [
  {
    id: "contact",
    name: "Contact Info",
    icon: "Contact2",
    elements: (groupId, pageId, z, dynamicData) => [
      { element_type: "text", page_id: pageId, groupId, text: "John Doe", x: 206, y: 700, width: 200, height: 30, font_size: 24, font_name: "Helvetica-Bold", text_color: "#0f172a", align: "center", bold: true, z_index: z },
      { element_type: "text", page_id: pageId, groupId, text: "john.doe@email.com • (555) 123-4567 • linkedin.com/in/johndoe", x: 106, y: 680, width: 400, height: 20, font_size: 10, font_name: "Helvetica", text_color: "#64748b", align: "center", z_index: z + 1 },
    ],
  },
  {
    id: "summary",
    name: "Professional Summary",
    icon: "FileText",
    elements: (groupId, pageId, z, dynamicData) => [
      { element_type: "text", page_id: pageId, groupId, text: "Professional Summary", x: 50, y: 650, width: 200, height: 20, font_size: 12, font_name: "Helvetica-Bold", text_color: "#0f172a", bold: true, z_index: z },
      { element_type: "shape", shape_type: "line", page_id: pageId, x: 50, y: 645, x2: 550, y2: 645, border_width: 1, border_color: "#cbd5e1", z_index: z + 1 },
      { element_type: "text", page_id: pageId, groupId, text: "Results-driven professional with over 5 years of experience in delivering high-quality solutions. Proven track record of improving processes, managing complex projects, and driving team success in fast-paced environments.", x: 50, y: 600, width: 500, height: 40, font_size: 10, font_name: "Helvetica", text_color: "#334155", line_height: 1.5, z_index: z + 2 },
    ],
  },
  {
    id: "experience",
    name: "Work Experience",
    icon: "Briefcase",
    elements: (groupId, pageId, z, dynamicData) => [
      { element_type: "text", page_id: pageId, groupId, text: "Senior Software Engineer", x: 50, y: 500, width: 250, height: 20, font_size: 12, font_name: "Helvetica-Bold", text_color: "#0f172a", bold: true, z_index: z },
      { element_type: "text", page_id: pageId, groupId, text: "Tech Company Inc. | San Francisco, CA", x: 50, y: 485, width: 250, height: 20, font_size: 10, font_name: "Helvetica", text_color: "#64748b", z_index: z + 1 },
      { element_type: "text", page_id: pageId, groupId, text: "Jan 2020 - Present", x: 400, y: 500, width: 150, height: 20, align: "right", font_size: 10, font_name: "Helvetica", text_color: "#64748b", italic: true, z_index: z + 2 },
      { element_type: "text", page_id: pageId, groupId, text: "• Spearheaded the development of a high-performance web application serving 100k+ MAU.\n• Reduced page load times by 40% through aggressive code splitting and asset optimization.\n• Mentored 3 junior engineers and established robust CI/CD pipelines.", x: 50, y: 420, width: 500, height: 60, font_size: 10, font_name: "Helvetica", text_color: "#334155", line_height: 1.5, z_index: z + 3 }
    ]
  },
  {
    id: "education",
    name: "Education",
    icon: "GraduationCap",
    elements: (groupId, pageId, z, dynamicData) => [
      { element_type: "text", page_id: pageId, groupId, text: "Bachelor of Science in Computer Science", x: 50, y: 300, width: 350, height: 20, font_size: 12, font_name: "Helvetica-Bold", text_color: "#0f172a", bold: true, z_index: z },
      { element_type: "text", page_id: pageId, groupId, text: "University of Technology | GPA: 3.8/4.0", x: 50, y: 285, width: 250, height: 20, font_size: 10, font_name: "Helvetica", text_color: "#64748b", z_index: z + 1 },
      { element_type: "text", page_id: pageId, groupId, text: "Sep 2016 - May 2020", x: 400, y: 300, width: 150, height: 20, align: "right", font_size: 10, font_name: "Helvetica", text_color: "#64748b", italic: true, z_index: z + 2 }
    ]
  },
  {
    id: "skills",
    name: "Skills Matrix",
    icon: "Code2",
    elements: (groupId, pageId, z, dynamicData) => [
      { element_type: "text", page_id: pageId, groupId, text: "Technical Skills", x: 50, y: 200, width: 150, height: 20, font_size: 12, font_name: "Helvetica-Bold", text_color: "#0f172a", bold: true, z_index: z },
      { element_type: "shape", shape_type: "line", page_id: pageId, x: 50, y: 195, x2: 550, y2: 195, border_width: 1, border_color: "#cbd5e1", z_index: z + 1 },
      { element_type: "text", page_id: pageId, groupId, text: "Languages: JavaScript, TypeScript, Python, Java, C++\nFrameworks: React, Node.js, Express, Django, Next.js\nTools: Git, Docker, AWS, Webpack, Figma", x: 50, y: 140, width: 500, height: 50, font_size: 10, font_name: "Helvetica", text_color: "#334155", line_height: 1.5, z_index: z + 2 }
    ]
  },
  {
    id: "projects",
    name: "Projects",
    icon: "FolderGit2",
    elements: (groupId, pageId, z, dynamicData) => [
      { element_type: "text", page_id: pageId, groupId, text: "E-Commerce Platform Redesign", x: 50, y: 100, width: 250, height: 20, font_size: 12, font_name: "Helvetica-Bold", text_color: "#0f172a", bold: true, z_index: z },
      { element_type: "text", page_id: pageId, groupId, text: "React, Node.js, PostgreSQL", x: 50, y: 85, width: 250, height: 20, font_size: 10, font_name: "Helvetica", text_color: "#64748b", italic: true, z_index: z + 1 },
      { element_type: "text", page_id: pageId, groupId, text: "Live Demo", x: 450, y: 100, width: 100, height: 20, align: "right", font_size: 10, font_name: "Helvetica", text_color: "#3b82f6", underline: true, z_index: z + 2 },
      { element_type: "text", page_id: pageId, groupId, text: "• Built a full-stack e-commerce solution handling 10k+ daily transactions.\n• Integrated Stripe payment gateway and OAuth2 authentication.", x: 50, y: 50, width: 500, height: 30, font_size: 10, font_name: "Helvetica", text_color: "#334155", line_height: 1.5, z_index: z + 3 }
    ]
  },
  {
    id: "certs",
    name: "Certifications",
    icon: "Award",
    elements: (groupId, pageId, z) => [
      { element_type: "text", page_id: pageId, groupId, text: "AWS Certified Solutions Architect", x: 50, y: 350, width: 250, height: 20, font_size: 12, font_name: "Helvetica-Bold", text_color: "#0f172a", bold: true, z_index: z },
      { element_type: "text", page_id: pageId, groupId, text: "Amazon Web Services", x: 50, y: 335, width: 250, height: 20, font_size: 10, font_name: "Helvetica", text_color: "#64748b", z_index: z + 1 },
      { element_type: "text", page_id: pageId, groupId, text: "Issued: Oct 2023", x: 450, y: 350, width: 100, height: 20, align: "right", font_size: 10, font_name: "Helvetica", text_color: "#64748b", z_index: z + 2 }
    ]
  },
  {
    id: "languages",
    name: "Languages",
    icon: "Globe",
    elements: (groupId, pageId, z) => [
      { element_type: "text", page_id: pageId, groupId, text: "Languages", x: 50, y: 300, width: 150, height: 20, font_size: 12, font_name: "Helvetica-Bold", text_color: "#0f172a", bold: true, z_index: z },
      { element_type: "shape", shape_type: "line", page_id: pageId, x: 50, y: 295, x2: 250, y2: 295, border_width: 1, border_color: "#cbd5e1", z_index: z + 1 },
      { element_type: "text", page_id: pageId, groupId, text: "English (Native)\nSpanish (Professional Working)\nFrench (Elementary)", x: 50, y: 245, width: 200, height: 45, font_size: 10, font_name: "Helvetica", text_color: "#334155", line_height: 1.5, z_index: z + 2 }
    ]
  },
  {
    id: "hobbies",
    name: "Hobbies",
    icon: "Heart",
    elements: (groupId, pageId, z) => [
      { element_type: "text", page_id: pageId, groupId, text: "Hobbies & Interests", x: 350, y: 300, width: 150, height: 20, font_size: 12, font_name: "Helvetica-Bold", text_color: "#0f172a", bold: true, z_index: z },
      { element_type: "shape", shape_type: "line", page_id: pageId, x: 350, y: 295, x2: 550, y2: 295, border_width: 1, border_color: "#cbd5e1", z_index: z + 1 },
      { element_type: "text", page_id: pageId, groupId, text: "• Marathon Running\n• Open Source Contributing\n• Photography", x: 350, y: 245, width: 200, height: 45, font_size: 10, font_name: "Helvetica", text_color: "#334155", line_height: 1.5, z_index: z + 2 }
    ]
  },
  {
    id: "awards",
    name: "Awards",
    icon: "Trophy",
    elements: (groupId, pageId, z) => [
      { element_type: "text", page_id: pageId, groupId, text: "Employee of the Year", x: 50, y: 200, width: 200, height: 20, font_size: 12, font_name: "Helvetica-Bold", text_color: "#0f172a", bold: true, z_index: z },
      { element_type: "text", page_id: pageId, groupId, text: "Tech Company Inc.", x: 50, y: 185, width: 200, height: 20, font_size: 10, font_name: "Helvetica", text_color: "#64748b", z_index: z + 1 },
      { element_type: "text", page_id: pageId, groupId, text: "2022", x: 450, y: 200, width: 100, height: 20, align: "right", font_size: 10, font_name: "Helvetica", text_color: "#64748b", z_index: z + 2 },
      { element_type: "text", page_id: pageId, groupId, text: "Awarded for exceptional performance and delivering the flagship product ahead of schedule.", x: 50, y: 165, width: 500, height: 15, font_size: 10, font_name: "Helvetica", text_color: "#334155", z_index: z + 3 }
    ]
  },
  {
    id: "references",
    name: "References",
    icon: "Users",
    elements: (groupId, pageId, z) => [
      { element_type: "text", page_id: pageId, groupId, text: "References", x: 50, y: 100, width: 150, height: 20, font_size: 12, font_name: "Helvetica-Bold", text_color: "#0f172a", bold: true, z_index: z },
      { element_type: "shape", shape_type: "line", page_id: pageId, x: 50, y: 95, x2: 550, y2: 95, border_width: 1, border_color: "#cbd5e1", z_index: z + 1 },
      { element_type: "text", page_id: pageId, groupId, text: "Jane Smith\nEngineering Manager at Tech Company Inc.\njane.smith@email.com", x: 50, y: 45, width: 250, height: 45, font_size: 10, font_name: "Helvetica", text_color: "#334155", line_height: 1.5, z_index: z + 2 },
      { element_type: "text", page_id: pageId, groupId, text: "Robert Johnson\nCTO at Startup LLC\nrobert@startup.com", x: 300, y: 45, width: 250, height: 45, font_size: 10, font_name: "Helvetica", text_color: "#334155", line_height: 1.5, z_index: z + 3 }
    ]
  },
  {
    id: "volunteer",
    name: "Volunteering",
    icon: "HeartHandshake",
    elements: (groupId, pageId, z) => [
      { element_type: "text", page_id: pageId, groupId, text: "Coding Bootcamp Mentor", x: 50, y: 450, width: 250, height: 20, font_size: 12, font_name: "Helvetica-Bold", text_color: "#0f172a", bold: true, z_index: z },
      { element_type: "text", page_id: pageId, groupId, text: "Non-Profit Tech Org", x: 50, y: 435, width: 250, height: 20, font_size: 10, font_name: "Helvetica", text_color: "#64748b", z_index: z + 1 },
      { element_type: "text", page_id: pageId, groupId, text: "2019 - 2021", x: 450, y: 450, width: 100, height: 20, align: "right", font_size: 10, font_name: "Helvetica", text_color: "#64748b", z_index: z + 2 },
      { element_type: "text", page_id: pageId, groupId, text: "• Mentored 20+ students from underrepresented backgrounds in full-stack web development.\n• Assisted in curriculum design and led weekly code review sessions.", x: 50, y: 400, width: 500, height: 30, font_size: 10, font_name: "Helvetica", text_color: "#334155", line_height: 1.5, z_index: z + 3 }
    ]
  },
  {
    id: "publications",
    name: "Publications",
    icon: "BookOpen",
    elements: (groupId, pageId, z) => [
      { element_type: "text", page_id: pageId, groupId, text: "Modern Web Architecture Patterns", x: 50, y: 550, width: 300, height: 20, font_size: 12, font_name: "Helvetica-Bold", text_color: "#0f172a", bold: true, z_index: z },
      { element_type: "text", page_id: pageId, groupId, text: "Published in Tech Journal", x: 50, y: 535, width: 250, height: 20, font_size: 10, font_name: "Helvetica", text_color: "#64748b", italic: true, z_index: z + 1 },
      { element_type: "text", page_id: pageId, groupId, text: "March 2022", x: 450, y: 550, width: 100, height: 20, align: "right", font_size: 10, font_name: "Helvetica", text_color: "#64748b", z_index: z + 2 },
      { element_type: "text", page_id: pageId, groupId, text: "A comprehensive guide on implementing micro-frontends in enterprise applications.", x: 50, y: 515, width: 500, height: 15, font_size: 10, font_name: "Helvetica", text_color: "#334155", z_index: z + 3 }
    ]
  },
  {
    id: "header_only",
    name: "Section Header",
    icon: "Heading",
    elements: (groupId, pageId, z, dynamicData) => [
      { element_type: "text", page_id: pageId, groupId, text: "Custom Section Header", x: 50, y: 600, width: 250, height: 20, font_size: 14, font_name: "Helvetica-Bold", text_color: "#0f172a", bold: true, z_index: z },
      { element_type: "shape", shape_type: "line", page_id: pageId, x: 50, y: 590, x2: 550, y2: 590, border_width: 2, border_color: "#0f172a", z_index: z + 1 },
    ]
  },
  {
    id: "table",
    name: "Data Table",
    icon: "Table",
    elements: (groupId, pageId, z, dynamicData) => [
      { element_type: "text", page_id: pageId, groupId, text: "Data Overview", x: 50, y: 400, width: 250, height: 20, font_size: 14, font_name: "Helvetica-Bold", text_color: "#0f172a", bold: true, z_index: z },
      { element_type: "shape", shape_type: "line", page_id: pageId, x: 50, y: 390, x2: 550, y2: 390, border_width: 2, border_color: "#0f172a", z_index: z + 1 },
      
      { element_type: "text", page_id: pageId, groupId, text: "Column 1", x: 60, y: 360, width: 150, height: 20, font_size: 10, font_name: "Helvetica-Bold", text_color: "#334155", bold: true, z_index: z + 2 },
      { element_type: "text", page_id: pageId, groupId, text: "Column 2", x: 230, y: 360, width: 150, height: 20, font_size: 10, font_name: "Helvetica-Bold", text_color: "#334155", bold: true, z_index: z + 3 },
      { element_type: "text", page_id: pageId, groupId, text: "Column 3", x: 400, y: 360, width: 150, height: 20, font_size: 10, font_name: "Helvetica-Bold", text_color: "#334155", bold: true, z_index: z + 4 },
      
      { element_type: "shape", shape_type: "line", page_id: pageId, x: 50, y: 350, x2: 550, y2: 350, border_width: 1, border_color: "#cbd5e1", z_index: z + 5 },
      
      { element_type: "text", page_id: pageId, groupId, text: "Data A1", x: 60, y: 320, width: 150, height: 20, font_size: 10, font_name: "Helvetica", text_color: "#64748b", z_index: z + 6 },
      { element_type: "text", page_id: pageId, groupId, text: "Data B1", x: 230, y: 320, width: 150, height: 20, font_size: 10, font_name: "Helvetica", text_color: "#64748b", z_index: z + 7 },
      { element_type: "text", page_id: pageId, groupId, text: "Data C1", x: 400, y: 320, width: 150, height: 20, font_size: 10, font_name: "Helvetica", text_color: "#64748b", z_index: z + 8 },
      
      { element_type: "shape", shape_type: "line", page_id: pageId, x: 50, y: 310, x2: 550, y2: 310, border_width: 1, border_color: "#cbd5e1", z_index: z + 9 },
      
      { element_type: "text", page_id: pageId, groupId, text: "Data A2", x: 60, y: 280, width: 150, height: 20, font_size: 10, font_name: "Helvetica", text_color: "#64748b", z_index: z + 10 },
      { element_type: "text", page_id: pageId, groupId, text: "Data B2", x: 230, y: 280, width: 150, height: 20, font_size: 10, font_name: "Helvetica", text_color: "#64748b", z_index: z + 11 },
      { element_type: "text", page_id: pageId, groupId, text: "Data C2", x: 400, y: 280, width: 150, height: 20, font_size: 10, font_name: "Helvetica", text_color: "#64748b", z_index: z + 12 },
    ]
  },
  {
    id: "sidebar",
    name: "Sidebar Container",
    icon: "Sidebar",
    elements: (groupId, pageId, z, dynamicData) => [
      { element_type: "shape", shape_type: "rectangle", page_id: pageId, groupId, x: 0, y: 792, width: 210, height: 792, fill_color: "#1E293B", border_width: 0, z_index: z },
      { element_type: "text", page_id: pageId, groupId, text: "CONTACT", x: 20, y: 700, width: 170, height: 20, font_size: 10, font_name: "Helvetica-Bold", text_color: "#38BDF8", z_index: z + 1 },
      { element_type: "shape", shape_type: "line", page_id: pageId, groupId, x: 20, y: 695, x2: 190, y2: 695, border_width: 1, border_color: "#6366F1", z_index: z + 2 },
    ]
  },
  {
    id: "skill_bars",
    name: "Skill Progress Bar",
    icon: "BarChart3",
    elements: (groupId, pageId, z, dynamicData) => {
      const name = dynamicData?.name || "Python & FastAPI";
      const percent = Math.min(100, Math.max(0, dynamicData?.percentage || 85));
      const totalWidth = 170;
      const fillWidth = totalWidth * (percent / 100);
      return [
        { element_type: "text", page_id: pageId, groupId, text: name, x: 50, y: 500, width: 170, height: 15, font_size: 8.5, font_name: "Helvetica-Bold", text_color: "#F8FAFC", z_index: z },
        { element_type: "shape", shape_type: "rectangle", page_id: pageId, groupId, x: 50, y: 485, width: totalWidth, height: 6, fill_color: "#334155", border_width: 0, border_radius: 3, z_index: z + 1 },
        { element_type: "shape", shape_type: "rectangle", page_id: pageId, groupId, x: 50, y: 485, width: fillWidth, height: 6, fill_color: "#38BDF8", border_width: 0, border_radius: 3, z_index: z + 2 },
      ];
    }
  },
  {
    id: "radar_chart",
    name: "Skill Radar Chart",
    icon: "Hexagon",
    elements: (groupId, pageId, z, dynamicData) => {
      const skills = (dynamicData && dynamicData.length > 0) ? dynamicData : [
        {name: "Python", percentage: 90},
        {name: "React", percentage: 80},
        {name: "SQL", percentage: 70}
      ];
      const sides = Math.max(3, skills.length);
      const centerX = 120, centerY = 600, radius = 50;
      
      const points = [];
      const textEls: Partial<EditorElement>[] = [];
      
      for (let i = 0; i < sides; i++) {
        const angle = i * ((Math.PI * 2) / sides) - (Math.PI / 2);
        const p = Math.min(100, Math.max(0, skills[i].percentage)) / 100;
        
        points.push(centerX + (radius * p) * Math.cos(angle));
        points.push(centerY + (radius * p) * Math.sin(angle));
        
        // Add text labels
        const textX = centerX + (radius + 15) * Math.cos(angle) - 15;
        const textY = centerY + (radius + 15) * Math.sin(angle) - 5;
        textEls.push({ 
          element_type: "text", 
          page_id: pageId, 
          groupId, 
          text: skills[i].name, 
          x: textX, 
          y: textY, 
          width: 30, 
          height: 10, 
          font_size: 7, 
          font_name: "Helvetica-Bold", 
          text_color: "#1E293B", 
          align: "center", 
          z_index: z + 1 
        });
      }
      return [
        { element_type: "shape", shape_type: "polygon", page_id: pageId, groupId, points, fill_color: "#38BDF844", border_color: "#38BDF8", border_width: 1.5, x: 0, y: 0, z_index: z },
        ...textEls
      ];
    }
  },
  {
    id: "pill_tags",
    name: "Pill Tags",
    icon: "Tags",
    elements: (groupId, pageId, z, dynamicData) => [
      { element_type: "shape", shape_type: "rectangle", page_id: pageId, groupId, x: 250, y: 500, width: 60, height: 16, fill_color: "#EEF2FF", border_color: "#C7D2FE", border_width: 1, border_radius: 8, z_index: z },
      { element_type: "text", page_id: pageId, groupId, text: "React", x: 250, y: 503, width: 60, height: 10, font_size: 7, font_name: "Helvetica-Bold", text_color: "#6366F1", align: "center", z_index: z + 1 },
      { element_type: "shape", shape_type: "rectangle", page_id: pageId, groupId, x: 320, y: 500, width: 70, height: 16, fill_color: "#EEF2FF", border_color: "#C7D2FE", border_width: 1, border_radius: 8, z_index: z + 2 },
      { element_type: "text", page_id: pageId, groupId, text: "FastAPI", x: 320, y: 503, width: 70, height: 10, font_size: 7, font_name: "Helvetica-Bold", text_color: "#6366F1", align: "center", z_index: z + 3 },
    ]
  },
  {
    id: "hero_header",
    name: "Magical Wave Header",
    icon: "Waves",
    elements: (groupId, pageId, z, dynamicData) => [
      { element_type: "shape", shape_type: "path", page_id: pageId, groupId, path_d: "M 205 687 C 285 702 345 672 612 687 L 612 692 L 205 692 Z", fill_color: "#6366F1", border_width: 0, x: 0, y: 0, z_index: z },
      { element_type: "shape", shape_type: "rectangle", page_id: pageId, groupId, x: 205, y: 792, width: 407, height: 105, fill_color: "#0F172A", border_width: 0, z_index: z + 1 },
      { element_type: "text", page_id: pageId, groupId, text: "ALEX MERCER", x: 220, y: 760, width: 300, height: 30, font_size: 22, font_name: "Helvetica-Bold", text_color: "#F8FAFC", z_index: z + 2 },
    ]
  }
];
