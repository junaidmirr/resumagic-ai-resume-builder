import * as pdfjsLib from 'pdfjs-dist';
import type { WizardData } from '../pages/WizardPage';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import type { EditorElement } from '../types/editor';

// Configure the worker for pdfjs
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

/**
 * Extracts raw text from a PDF File object while preserving line breaks.
 */
export async function extractTextFromPDF(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  
  let fullText = "";
  
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    
    // Sort items by Y descending (top to bottom), then X ascending (left to right)
    // In PDF coordinates, Y=0 is the bottom, so higher Y is higher on the page
    const items = content.items as any[];
    items.sort((a, b) => {
      const yA = a.transform[5];
      const yB = b.transform[5];
      if (Math.abs(yA - yB) > 3) {
        return yB - yA; // Sort top-to-bottom
      }
      return a.transform[4] - b.transform[4]; // Sort left-to-right
    });

    let lastY;
    let text = '';
    
    for (const item of items) {
      if (!item.str || item.str.trim() === '') {
          // If it's just whitespace, add it if we are on the same line to preserve gaps
          if (lastY !== undefined && Math.abs(lastY - item.transform[5]) <= 3) {
              text += ' ';
          }
          continue;
      }
      
      const currentY = item.transform[5];
      if (lastY !== undefined && Math.abs(lastY - currentY) > 3) {
        text += '\n';
      } else if (lastY !== undefined && Math.abs(lastY - currentY) <= 3) {
        text += ' '; // Same line, add space
      }
      
      text += item.str.trim();
      lastY = currentY;
    }
    
    fullText += text + "\n\n";
  }
  
  return fullText;
}

/**
 * Advanced visually-accurate parser that recreates the PDF as EditorElements.
 */
export async function extractVisualElementsFromPDF(file: File): Promise<Partial<EditorElement>[]> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const elements: Partial<EditorElement>[] = [];
  
  const gid = () => Math.random().toString(36).substring(2, 9);
  const pageId = "page_1";

  // Recreate elements from page 1
  const page = await pdf.getPage(1);
  const content = await page.getTextContent();
  const items = content.items as any[];

  let zIndex = 1;

  for (const item of items) {
    if (!item.str || item.str.trim() === '') continue;

    // PDF transform matrix: [scaleX, skewY, skewX, scaleY, tx, ty]
    // tx, ty is the bottom-left of the text baseline
    const fontSize = item.transform[0] || 12; // fallback to 12 if 0
    const x = item.transform[4];
    let y = item.transform[5];

    // Estimate a bounding box since we need width/height
    const width = item.width || (item.str.length * (fontSize * 0.5));
    const height = item.height || fontSize;

    // Y adjustment: pdfjs tx,ty is the baseline. 
    // In our system, y is the bottom boundary of the element.
    // The baseline is typically ~20% up from the bottom of the bounding box.
    // So if baseline is `y`, the bottom of the bounding box is `y - height*0.2`.
    y = y - (height * 0.2);

    // Font info
    const fontNameRaw = item.fontName || "";
    let fontName = "Helvetica";
    let isBold = false;
    let isItalic = false;

    if (fontNameRaw.toLowerCase().includes("bold")) isBold = true;
    if (fontNameRaw.toLowerCase().includes("italic") || fontNameRaw.toLowerCase().includes("oblique")) isItalic = true;

    // For font family, try to map standard ones
    if (fontNameRaw.toLowerCase().includes("times")) fontName = "Times-Roman";
    else if (fontNameRaw.toLowerCase().includes("courier")) fontName = "Courier";

    elements.push({
      id: gid(),
      element_type: "text",
      page_id: pageId,
      text: item.str,
      x: x,
      y: y,
      width: width,
      height: height,
      font_size: fontSize,
      font_name: fontName,
      text_color: "#000000", // Default since getTextContent doesn't expose color reliably
      bold: isBold,
      italic: isItalic,
      align: "left",
      z_index: zIndex++,
    });
  }

  return elements;
}

/**
 * Advanced heuristic parser that maps raw resume text into our structured WizardData format.
 */
export function parseResumeTextToWizardData(rawText: string): WizardData {
  // Normalize line endings and clean up multiple spaces
  const text = rawText.replace(/\r/g, '').replace(/\n{3,}/g, '\n\n').trim();
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  
  const data: WizardData = {
    contact: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      linkedin: "",
      website: "",
      country: "",
      state: "",
    },
    experienceLevel: "Mid Level",
    experiences: [],
    educations: [],
    skills: [],
    summary: "",
    additional: {
      languages: [],
      extracurriculars: "",
      certificates: "",
      awards: "",
      other: "",
    }
  };

  if (lines.length === 0) return data;

  // 1. Guess Name (First line that doesn't look like contact info)
  let nameExtracted = false;
  for (const line of lines) {
    if (line.length < 40 && !line.includes('@') && !line.match(/\d{4,}/)) {
      const parts = line.split(' ');
      data.contact.firstName = parts[0];
      data.contact.lastName = parts.slice(1).join(' ');
      nameExtracted = true;
      break;
    }
  }

  // 2. Extract Contact Info
  for (const line of lines) {
    // Email
    const emailMatch = line.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    if (emailMatch && !data.contact.email) data.contact.email = emailMatch[0];

    // Phone
    const phoneMatch = line.match(/(?:(?:\+?1\s*(?:[.-]\s*)?)?(?:\(\s*([2-9]1[02-9]|[2-9][02-8]1|[2-9][02-8][02-9])\s*\)|([2-9]1[02-9]|[2-9][02-8]1|[2-9][02-8][02-9]))\s*(?:[.-]\s*)?)?([2-9]1[02-9]|[2-9][02-9]1|[2-9][02-9]{2})\s*(?:[.-]\s*)?([0-9]{4})(?:\s*(?:#|x\.?|ext\.?|extension)\s*(\d+))?/i);
    if (phoneMatch && !data.contact.phone) data.contact.phone = phoneMatch[0];

    // LinkedIn
    if (line.toLowerCase().includes('linkedin.com') && !data.contact.linkedin) {
       const urlMatch = line.match(/linkedin\.com\/in\/[a-zA-Z0-9_-]+/i);
       if (urlMatch) data.contact.linkedin = urlMatch[0];
    }
  }

  // 3. Section Parsing
  let currentSection = "";
  let currentBlock: string[] = [];

  const processBlock = () => {
    if (currentBlock.length === 0) return;
    
    if (currentSection === "experience" || currentSection === "employment") {
      // Very naive experience parsing
      const titleLine = currentBlock[0];
      const companyLine = currentBlock.length > 1 ? currentBlock[1] : "";
      const desc = currentBlock.slice(2).join('\n');
      data.experiences.push({
        id: Math.random().toString(36).substring(7),
        jobTitle: titleLine,
        company: companyLine,
        location: "",
        startDate: "",
        endDate: "",
        current: false,
        description: desc
      });
    } else if (currentSection === "education") {
      const degreeLine = currentBlock[0];
      const schoolLine = currentBlock.length > 1 ? currentBlock[1] : "";
      data.educations.push({
        id: Math.random().toString(36).substring(7),
        degree: degreeLine,
        school: schoolLine,
        location: "",
        startDate: "",
        endDate: "",
        description: currentBlock.slice(2).join('\n')
      });
    } else if (currentSection === "skills") {
      const skillsStr = currentBlock.join(', ');
      // Split by comma or bullet
      data.skills = skillsStr.split(/[,•|]/).map(s => s.trim()).filter(s => s.length > 0);
    } else if (currentSection === "summary" || currentSection === "profile") {
      data.summary += currentBlock.join('\n') + '\n';
    }
    
    currentBlock = [];
  };

  const sectionHeaders = ["experience", "employment", "education", "skills", "summary", "profile", "projects", "certifications"];

  for (const line of lines) {
    const lowerLine = line.toLowerCase();
    let isHeader = false;
    
    for (const header of sectionHeaders) {
      if (lowerLine === header || lowerLine === header + ":" || lowerLine === "professional " + header) {
        processBlock();
        currentSection = header;
        isHeader = true;
        break;
      }
    }

    if (!isHeader) {
      // If we haven't hit a section yet, it might be summary or just garbage
      if (currentSection === "" && nameExtracted && line.length > 50) {
        currentSection = "summary";
      }
      currentBlock.push(line);
    }
  }
  
  processBlock(); // process the last block
  data.summary = data.summary.trim();

  return data;
}
