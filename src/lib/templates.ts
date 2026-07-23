import { RESUME_TEMPLATES } from "../utils/templates";
import type { EditorElement } from "../types/editor";

import obsidianNightThumb from "../assets/templates/obsidian_night.png";
import auroraThumb from "../assets/templates/aurora.png";
import crimsonExecutiveThumb from "../assets/templates/crimson_executive.png";
import emeraldProThumb from "../assets/templates/emerald_pro.png";
import midnightBlueThumb from "../assets/templates/midnight_blue.png";
import solarFlareThumb from "../assets/templates/solar_flare.png";
import crystalCleanThumb from "../assets/templates/crystal_clean.png";
import slateImpactThumb from "../assets/templates/slate_impact.png";
import charcoalMinimalThumb from "../assets/templates/charcoal_minimal.png";
import roseGoldThumb from "../assets/templates/rose_gold.png";
import neonCoderThumb from "../assets/templates/neon_coder.png";
import indigoWaveThumb from "../assets/templates/indigo_wave.png";
import geometricTechThumb from "../assets/templates/geometric_tech.png";
import elegantScholarThumb from "../assets/templates/elegant_scholar.png";
import cyberpunkEdgeThumb from "../assets/templates/cyberpunk_edge.png";
import corporateHierarchyThumb from "../assets/templates/corporate_hierarchy.png";
import creativePortfolioThumb from "../assets/templates/creative_portfolio.png";
import minimalistGridThumb from "../assets/templates/minimalist_grid.png";
import gradientFlowThumb from "../assets/templates/gradient_flow.png";
import starkBrutalistThumb from "../assets/templates/stark_brutalist.png";
import dualToneHorizonThumb from "../assets/templates/dual_tone_horizon.png";
import natureBotanistThumb from "../assets/templates/nature_botanist.png";
import executiveGoldThumb from "../assets/templates/executive_gold.png";
import retroTerminalThumb from "../assets/templates/retro_terminal.png";

const thumbMap: Record<string, string> = {
  obsidian_night: obsidianNightThumb,
  aurora: auroraThumb,
  crimson_executive: crimsonExecutiveThumb,
  emerald_pro: emeraldProThumb,
  midnight_blue: midnightBlueThumb,
  solar_flare: solarFlareThumb,
  crystal_clean: crystalCleanThumb,
  slate_impact: slateImpactThumb,
  charcoal_minimal: charcoalMinimalThumb,
  rose_gold: roseGoldThumb,
  neon_coder: neonCoderThumb,
  indigo_wave: indigoWaveThumb,
  geometric_tech: geometricTechThumb,
  elegant_scholar: elegantScholarThumb,
  cyberpunk_edge: cyberpunkEdgeThumb,
  corporate_hierarchy: corporateHierarchyThumb,
  creative_portfolio: creativePortfolioThumb,
  minimalist_grid: minimalistGridThumb,
  gradient_flow: gradientFlowThumb,
  stark_brutalist: starkBrutalistThumb,
  dual_tone_horizon: dualToneHorizonThumb,
  nature_botanist: natureBotanistThumb,
  executive_gold: executiveGoldThumb,
  retro_terminal: retroTerminalThumb,
};

export interface Template {
  id: string;
  name: string;
  category: "Professional" | "Creative" | "Minimal" | "Tech" | string;
  thumbnailUrl: string;
  isPremium: boolean;
  generateElements: (wizardData?: any) => EditorElement[];
  elements: (pageId: string, wizardData?: any) => EditorElement[];
}

export const templates: Template[] = RESUME_TEMPLATES.map(t => {
  const isFree = t.id === "minimalist_grid" || t.id === "corporate_hierarchy";
  return {
    id: t.id,
    name: t.name,
    category: t.category,
    thumbnailUrl: thumbMap[t.id] || "",
    isPremium: !isFree,
    generateElements: (wizardData?: any) => t.elements("page-1", wizardData) as EditorElement[],
    elements: (pageId: string, wizardData?: any) => t.elements(pageId, wizardData) as EditorElement[],
  };
});
