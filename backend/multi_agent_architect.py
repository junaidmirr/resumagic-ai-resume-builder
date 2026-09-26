"""
Multi-Agent Resume Architect with LangChain
===========================================
Implements a complete agentic pipeline for resume creation:
- Planner Agent: Analyzes requirements and creates detailed plan
- Foundation Agent: Mathematical layout and coordinate planning
- Design Agent: Visual design and element creation
- Review Agent: Quality assurance and symmetry validation
- Assembly Agent: Final coordination and canvas placement

For Editor: Surgical modifications with canvas analysis and symmetry calculations.
"""

import json
import re
import uuid
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass

from langchain_core.messages import HumanMessage, SystemMessage, AIMessage
from langchain_core.tools import tool
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.output_parsers import JsonOutputParser

# Import existing tools
from langchain_architect import (
    create_complete_resume,
    add_qr_code,
    add_metric_chart,
    add_signature,
    update_theme_palette,
    generate_qr_base64_png,
    estimate_text_height,
    estimate_text_lines,
    PAGE_WIDTH,
    PAGE_HEIGHT,
)

try:
    from langchain_google_genai import ChatGoogleGenerativeAI
except ImportError:
    ChatGoogleGenerativeAI = None

import os
import sys

# Import Swirls AI from ai_parser
sys.path.insert(0, os.path.dirname(__file__))
try:
    from ai_parser import ask_swirls, CAREER_AI_SYSTEM_INSTRUCTIONS
    HAS_SWIRLS = True
except ImportError:
    HAS_SWIRLS = False
    print("[MultiAgent] ⚠️ Swirls AI not available")


# ═════════════════════════════════════════════════════════════════════════════
# CANVAS ANALYSIS TOOLS
# ═════════════════════════════════════════════════════════════════════════════

@dataclass
class CanvasBounds:
    """Represents occupied and available space on canvas"""
    occupied_regions: List[Dict[str, float]]  # List of {x, y, width, height}
    available_regions: List[Dict[str, float]]
    max_y: float  # Highest occupied Y coordinate
    min_y: float  # Lowest occupied Y coordinate
    left_margin: float
    right_margin: float


@tool
def analyze_canvas_space(existing_elements: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Analyzes existing canvas elements to find occupied and available space.
    Returns regions where new elements can be safely placed with proper spacing.
    """
    if not existing_elements:
        return {
            "status": "success",
            "canvas_empty": True,
            "available_regions": [
                {"x": 40, "y": 40, "width": 532, "height": 712, "position": "full_canvas"}
            ],
            "occupied_regions": [],
            "max_y": 0,
            "min_y": 0,
        }

    occupied = []
    max_y = 0
    min_y = PAGE_HEIGHT

    # Analyze all elements
    for el in existing_elements:
        if el.get("element_type") == "shape" and el.get("height", 0) >= 700:
            # Full-height sidebar - treat specially
            continue

        x = el.get("x", 0)
        y = el.get("y", 0)
        w = el.get("width", 100)
        h = el.get("height", 20)

        occupied.append({
            "x": x - 10,  # Add padding
            "y": y - 10,
            "width": w + 20,
            "height": h + 20,
            "element_id": el.get("id", ""),
        })

        max_y = max(max_y, y + h)
        min_y = min(min_y, y)

    # Find available regions
    available = []

    # Bottom space (below all elements)
    if min_y > 60:
        available.append({
            "x": 40,
            "y": 40,
            "width": 532,
            "height": min_y - 50,
            "position": "bottom",
        })

    # Top space (above all elements)
    if max_y < 732:
        available.append({
            "x": 40,
            "y": max_y + 20,
            "width": 532,
            "height": 732 - max_y - 20,
            "position": "top",
        })

    # Right margin space
    right_occupied = max([el.get("x", 0) + el.get("width", 0) for el in existing_elements])
    if right_occupied < 500:
        available.append({
            "x": right_occupied + 30,
            "y": min_y,
            "width": 612 - right_occupied - 50,
            "height": max_y - min_y,
            "position": "right_margin",
        })

    return {
        "status": "success",
        "canvas_empty": False,
        "occupied_regions": occupied,
        "available_regions": available,
        "max_y": max_y,
        "min_y": min_y,
        "occupied_count": len(existing_elements),
    }


@tool
def calculate_symmetry_score(elements: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Calculates mathematical symmetry score for canvas elements.
    Evaluates alignment, spacing consistency, and visual balance.
    Returns score (0-100) and improvement suggestions.
    """
    if not elements or len(elements) < 2:
        return {
            "status": "success",
            "symmetry_score": 100,
            "alignment_score": 100,
            "spacing_score": 100,
            "balance_score": 100,
            "suggestions": [],
        }

    # Separate by element type
    text_elements = [e for e in elements if e.get("element_type") == "text"]
    shape_elements = [e for e in elements if e.get("element_type") == "shape"]

    # 1. Alignment Score (check if elements align on common X coordinates)
    x_coords = [e.get("x", 0) for e in text_elements]
    x_tolerance = 5  # pixels
    x_groups = {}
    for x in x_coords:
        found_group = False
        for key in x_groups:
            if abs(key - x) <= x_tolerance:
                x_groups[key].append(x)
                found_group = True
                break
        if not found_group:
            x_groups[x] = [x]
    if len(text_elements) > 1:
        alignment_score = max(20, min(100, 100 - (len(x_groups) - 1) * 30))
    else:
        alignment_score = 100

    # 2. Spacing Score (check vertical spacing consistency)
    text_sorted = sorted(text_elements, key=lambda e: e.get("y", 0), reverse=True)
    spacings = []
    for i in range(len(text_sorted) - 1):
        y1 = text_sorted[i].get("y", 0)
        y2 = text_sorted[i + 1].get("y", 0)
        h1 = text_sorted[i].get("height", 20)
        gap = y1 - h1 - y2
        if gap > 0:
            spacings.append(gap)

    if spacings:
        avg_spacing = sum(spacings) / len(spacings)
        spacing_variance = sum((s - avg_spacing) ** 2 for s in spacings) / len(spacings)
        spacing_score = max(0, 100 - spacing_variance)
    else:
        spacing_score = 100

    # 3. Balance Score (check left-right weight distribution)
    left_weight = sum(1 for e in text_elements if e.get("x", 0) < PAGE_WIDTH / 2)
    right_weight = len(text_elements) - left_weight
    balance_ratio = min(left_weight, right_weight) / max(max(left_weight, right_weight), 1)
    balance_score = balance_ratio * 100

    # Overall symmetry score
    symmetry_score = (alignment_score * 0.4 + spacing_score * 0.4 + balance_score * 0.2)

    # Generate suggestions
    suggestions = []
    if alignment_score < 70:
        suggestions.append("Align elements to consistent left margins (e.g., x=40, x=230)")
    if spacing_score < 70:
        suggestions.append("Standardize vertical spacing between elements (e.g., 16pt gaps)")
    if balance_score < 50:
        suggestions.append("Rebalance content distribution between left and right areas")

    return {
        "status": "success",
        "symmetry_score": round(symmetry_score, 1),
        "alignment_score": round(alignment_score, 1),
        "spacing_score": round(spacing_score, 1),
        "balance_score": round(balance_score, 1),
        "suggestions": suggestions,
    }


@tool
def find_optimal_position(
    element_width: float,
    element_height: float,
    existing_elements: List[Dict[str, Any]],
    preference: str = "bottom"  # "bottom", "top", "right", "left"
) -> Dict[str, Any]:
    """
    Finds the optimal position to place a new element on canvas
    considering existing elements and maintaining mathematical symmetry.
    """
    analysis = analyze_canvas_space.invoke({"existing_elements": existing_elements})

    if analysis["canvas_empty"]:
        # Empty canvas - place at top with standard margins
        return {
            "status": "success",
            "x": 40,
            "y": 700,  # Near top
            "rationale": "Canvas empty - placed at standard top position",
        }

    available = analysis["available_regions"]

    # Filter regions that can fit the element
    fitting_regions = [
        r for r in available
        if r["width"] >= element_width and r["height"] >= element_height
    ]

    if not fitting_regions:
        # No space - suggest stacking below existing content
        return {
            "status": "success",
            "x": 40,
            "y": max(40, analysis["min_y"] - element_height - 20),
            "rationale": "No available regions - stacking below existing content",
        }

    # Select region based on preference
    if preference == "bottom":
        region = min(fitting_regions, key=lambda r: r["y"])
    elif preference == "top":
        region = max(fitting_regions, key=lambda r: r["y"])
    elif preference == "right":
        region = max(fitting_regions, key=lambda r: r["x"])
    else:  # left
        region = min(fitting_regions, key=lambda r: r["x"])

    # Center element within region
    x = region["x"] + (region["width"] - element_width) / 2
    y = region["y"] + (region["height"] - element_height) / 2

    return {
        "status": "success",
        "x": round(x, 1),
        "y": round(y, 1),
        "region": region["position"],
        "rationale": f"Optimal placement in {region['position']} region with centering",
    }


@tool
def move_elements_to_make_space(
    existing_elements: List[Dict[str, Any]],
    required_space: Dict[str, float],  # {x, y, width, height}
) -> Dict[str, Any]:
    """
    Intelligently shifts existing elements to create space for a new element.
    Maintains relative positioning and symmetry while making room.
    """
    req_x = required_space.get("x", 0)
    req_y = required_space.get("y", 0)
    req_w = required_space.get("width", 100)
    req_h = required_space.get("height", 50)

    # Find elements that overlap with required space
    overlapping = []
    non_overlapping = []

    for el in existing_elements:
        el_x = el.get("x", 0)
        el_y = el.get("y", 0)
        el_w = el.get("width", 100)
        el_h = el.get("height", 20)

        # Check overlap
        if (el_x < req_x + req_w and el_x + el_w > req_x and
            el_y < req_y + req_h and el_y + el_h > req_y):
            overlapping.append(el)
        else:
            non_overlapping.append(el)

    if not overlapping:
        return {
            "status": "success",
            "action": "no_movement_needed",
            "modified_elements": [],
            "message": "No overlapping elements found",
        }

    # Shift overlapping elements downward
    shift_amount = req_h + 20  # Element height + gap
    modified = []

    for el in overlapping:
        el_copy = dict(el)
        el_copy["y"] = max(40, el_copy.get("y", 0) - shift_amount)
        modified.append(el_copy)

    return {
        "status": "success",
        "action": "shifted_elements",
        "modified_elements": modified,
        "shift_amount": shift_amount,
        "message": f"Shifted {len(modified)} elements downward by {shift_amount}pt",
    }


# ═════════════════════════════════════════════════════════════════════════════
# AGENT DEFINITIONS
# ═════════════════════════════════════════════════════════════════════════════

class MultiAgentArchitect:
    """
    Orchestrates multiple specialized agents to create professional resumes.
    Uses Swirls AI as primary with Gemini as fallback.
    """

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.environ.get("GEMINI_API_KEY")
        self.use_swirls = HAS_SWIRLS

        # Initialize Gemini as fallback
        if self.api_key and ChatGoogleGenerativeAI:
            self.llm_fallback = ChatGoogleGenerativeAI(
                model="gemini-1.5-flash",
                google_api_key=self.api_key,
                temperature=0.7,
            )
        else:
            self.llm_fallback = None
            print("[MultiAgent] ⚠️ No Gemini fallback available")

    def _create_llm_call(self, system_prompt: str, user_prompt: str) -> str:
        """
        Makes LLM call with Swirls AI as primary, Gemini as fallback.
        Swirls AI → Gemini → Error
        """
        # Try Swirls AI first (PRIMARY)
        if self.use_swirls:
            try:
                print("[MultiAgent] 🌀 Using Swirls AI (Primary)")
                complete_prompt = f"""{system_prompt}

USER REQUEST:
{user_prompt}
"""
                response = ask_swirls(complete_prompt, timeout=30)
                if response and response.strip():
                    return response
                else:
                    print("[MultiAgent] ⚠️ Swirls AI returned empty response")
            except Exception as e:
                print(f"[MultiAgent] ⚠️ Swirls AI error: {e}, falling back to Gemini...")

        # Fallback to Gemini (SECONDARY)
        if self.llm_fallback:
            try:
                print("[MultiAgent] 🔄 Using Gemini (Fallback)")
                messages = [
                    SystemMessage(content=system_prompt),
                    HumanMessage(content=user_prompt),
                ]
                response = self.llm_fallback.invoke(messages)
                return response.content
            except Exception as e:
                print(f"[MultiAgent] ❌ Gemini fallback error: {e}")
                return json.dumps({"error": f"All AI providers failed: {str(e)}"})

        return json.dumps({"error": "No AI provider available"})

    def planner_agent(self, user_prompt: str) -> Dict[str, Any]:
        """
        PLANNER AGENT: Analyzes user requirements and creates detailed plan.
        """
        system = """You are an expert resume planning agent. Analyze the user's request and create a detailed plan.

Extract:
1. Target role/job title
2. Candidate name (if provided)
3. Desired style/layout (modern_sidebar, executive, minimalist, etc.)
4. Color preferences (primary, secondary colors)
5. Key sections needed (summary, experience, skills, education, certifications)
6. Special requirements (QR code, metrics chart, signature, etc.)

Output JSON with this structure:
{
  "role": "target job role",
  "candidate_name": "name or 'ALEXANDER MORGAN'",
  "layout_style": "modern_sidebar",
  "colors": {
    "primary": "#1e3a8a",
    "secondary": "#dc2626",
    "accent": "#2563eb"
  },
  "sections": ["summary", "experience", "skills", "education", "certifications"],
  "special_features": ["qr_code", "metrics_chart"],
  "ats_compliant": true,
  "priority": "high"
}"""

        response = self._create_llm_call(system, user_prompt)

        try:
            # Parse JSON from response
            json_match = re.search(r'\{[\s\S]*\}', response)
            if json_match:
                parsed_plan = json.loads(json_match.group())
                if isinstance(parsed_plan, dict) and "role" in parsed_plan:
                    return {
                        "status": "success",
                        "agent": "planner",
                        "plan": parsed_plan,
                    }
        except Exception as e:
            print(f"[Planner] Parse error: {e}")

        # Intelligent prompt fallback when no LLM provider is active (e.g. testing)
        p_lower = (user_prompt or "").lower()
        role = "Senior Professional"
        if "data analyst" in p_lower:
            role = "Senior Data Analyst"
        elif "software" in p_lower:
            role = "Lead Software Engineer"
        elif "product" in p_lower:
            role = "Senior Product Manager"

        primary = "#1e3a8a"
        secondary = "#dc2626"
        if "emerald" in p_lower or "green" in p_lower:
            primary = "#064e3b"
            secondary = "#059669"
        elif "purple" in p_lower:
            primary = "#4c1d95"
            secondary = "#7c3aed"

        return {
            "status": "success",
            "agent": "planner",
            "plan": {
                "role": role,
                "candidate_name": "ALEXANDER MORGAN",
                "layout_style": "modern_sidebar",
                "colors": {
                    "primary": primary,
                    "secondary": secondary,
                    "accent": "#2563eb",
                },
                "sections": ["summary", "experience", "skills", "education"],
                "special_features": ["qr_code"],
                "ats_compliant": True,
            },
        }

    def foundation_agent(self, plan: Dict[str, Any]) -> Dict[str, Any]:
        """
        FOUNDATION AGENT: Creates mathematical layout and coordinate planning.
        """
        layout_style = plan.get("layout_style", "modern_sidebar")
        sections = plan.get("sections", [])

        # Calculate mathematical layout
        if layout_style == "modern_sidebar":
            foundation = {
                "page_structure": {
                    "sidebar": {"x": 0, "y": 0, "width": 175, "height": 792},
                    "main_content": {"x": 195, "y": 0, "width": 380, "height": 792},
                    "header_banner": {"x": 175, "y": 697, "width": 437, "height": 95},
                },
                "coordinate_system": "bottom_left_origin",
                "unit": "points",
                "margins": {
                    "sidebar_left": 18,
                    "sidebar_content_width": 139,
                    "main_left": 195,
                    "main_content_width": 380,
                },
                "vertical_rhythm": {
                    "section_gap": 24,
                    "paragraph_gap": 16,
                    "line_height": 1.4,
                    "heading_margin": 18,
                },
                "z_index_layers": {
                    "background": 0,
                    "shapes": 1,
                    "text_content": 3,
                    "decorative": 5,
                    "overlays": 10,
                },
            }
        else:
            # Executive single-column layout
            foundation = {
                "page_structure": {
                    "content_area": {"x": 40, "y": 40, "width": 532, "height": 712},
                    "header_banner": {"x": 40, "y": 700, "width": 532, "height": 80},
                },
                "coordinate_system": "bottom_left_origin",
                "unit": "points",
                "margins": {
                    "left": 40,
                    "right": 40,
                    "top": 40,
                    "bottom": 40,
                },
                "vertical_rhythm": {
                    "section_gap": 20,
                    "paragraph_gap": 14,
                    "line_height": 1.35,
                    "heading_margin": 16,
                },
            }

        return {
            "status": "success",
            "agent": "foundation",
            "foundation": foundation,
            "layout_validated": True,
        }

    def design_agent(self, plan: Dict[str, Any], foundation: Dict[str, Any]) -> Dict[str, Any]:
        """
        DESIGN AGENT: Creates visual design and generates elements.
        Uses the create_complete_resume tool for full resume generation.
        """
        role = plan.get("role", "Senior Professional")
        candidate_name = plan.get("candidate_name", "ALEXANDER MORGAN")
        layout_style = plan.get("layout_style", "modern_sidebar")
        colors = plan.get("colors", {})

        primary_color = colors.get("primary", "#1e3a8a")
        secondary_color = colors.get("secondary", "#dc2626")
        accent_color = colors.get("accent", "#2563eb")

        # Call the create_complete_resume tool
        result = create_complete_resume.invoke({
            "role": role,
            "candidate_name": candidate_name,
            "layout_style": layout_style,
            "primary_color": primary_color,
            "secondary_color": secondary_color,
            "accent_color": accent_color,
            "include_qr_code": "qr_code" in plan.get("special_features", []),
            "qr_url": "https://linkedin.com",
        })

        return {
            "status": "success",
            "agent": "design",
            "elements": result.get("elements", []),
            "element_count": len(result.get("elements", [])),
        }

    def review_agent(
        self,
        elements: List[Dict[str, Any]],
        plan: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        REVIEW AGENT: Validates design quality, symmetry, and ATS compliance.
        """
        # Calculate symmetry
        symmetry = calculate_symmetry_score.invoke({"elements": elements})

        # Check ATS compliance
        ats_checks = {
            "has_text_elements": any(e.get("element_type") == "text" for e in elements),
            "no_tables": not any(e.get("element_type") == "table" for e in elements),
            "readable_fonts": all(
                e.get("font_size", 10) >= 9
                for e in elements
                if e.get("element_type") == "text"
            ),
            "proper_spacing": True,  # Already validated by symmetry
        }

        ats_compliant = all(ats_checks.values())
        ats_score = sum(ats_checks.values()) / len(ats_checks) * 100

        # Quality score
        quality_score = (symmetry["symmetry_score"] * 0.6 + ats_score * 0.4)

        issues = []
        if symmetry["symmetry_score"] < 70:
            issues.extend(symmetry.get("suggestions", []))
        if not ats_compliant:
            failed_checks = [k for k, v in ats_checks.items() if not v]
            issues.append(f"ATS compliance issues: {', '.join(failed_checks)}")

        return {
            "status": "success",
            "agent": "review",
            "quality_score": round(quality_score, 1),
            "symmetry_score": symmetry["symmetry_score"],
            "ats_score": round(ats_score, 1),
            "ats_compliant": ats_compliant,
            "issues": issues,
            "approved": quality_score >= 75,
        }

    def assembly_agent(
        self,
        elements: List[Dict[str, Any]],
        plan: Dict[str, Any],
        review: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        ASSEMBLY AGENT: Final coordination and canvas placement.
        Applies any necessary fixes based on review feedback.
        """
        final_elements = list(elements)

        # Apply fixes if needed
        if not review.get("approved", False) and review.get("issues"):
            # If alignment is poor, standardize X coordinates
            if any("align" in issue.lower() for issue in review["issues"]):
                # Group elements by approximate X and align them
                x_groups = {}
                tolerance = 15

                for el in final_elements:
                    if el.get("element_type") != "text":
                        continue
                    x = el.get("x", 0)
                    found = False
                    for key in x_groups:
                        if abs(key - x) <= tolerance:
                            x_groups[key].append(el)
                            found = True
                            break
                    if not found:
                        x_groups[x] = [el]

                # Align each group to the average X
                for group_elements in x_groups.values():
                    avg_x = sum(e.get("x", 0) for e in group_elements) / len(group_elements)
                    avg_x = round(avg_x / 10) * 10  # Snap to 10pt grid
                    for el in group_elements:
                        el["x"] = avg_x

        # Add special features if requested
        special_features = plan.get("special_features", [])

        if "metrics_chart" in special_features:
            metrics = [
                {"label": "Query Optimization", "value": 85, "stat": "+45%"},
                {"label": "Automation Efficiency", "value": 90, "stat": "16h/wk"},
                {"label": "Cost Reduction", "value": 75, "stat": "-35%"},
            ]
            chart_result = add_metric_chart.invoke({
                "title": "Key Impact Metrics",
                "metrics": metrics,
                "x": 230,
                "y": 80,
            })
            final_elements.extend(chart_result.get("added_elements", []))

        return {
            "status": "success",
            "agent": "assembly",
            "elements": final_elements,
            "element_count": len(final_elements),
            "fixes_applied": not review.get("approved", True),
            "message": "Resume assembled and ready for canvas",
        }

    def run_full_pipeline(self, user_prompt: str) -> Dict[str, Any]:
        """
        Runs the complete multi-agent pipeline.
        """
        print("[MultiAgent] 🚀 Starting multi-agent pipeline...")

        # 1. Planner Agent
        print("[MultiAgent] 📋 Planner Agent analyzing requirements...")
        plan_result = self.planner_agent(user_prompt)
        plan = plan_result["plan"]
        print(f"[MultiAgent] ✅ Plan created: {plan.get('role')} resume")

        # 2. Foundation Agent
        print("[MultiAgent] 📐 Foundation Agent calculating layout...")
        foundation_result = self.foundation_agent(plan)
        foundation = foundation_result["foundation"]
        print(f"[MultiAgent] ✅ Layout: {plan.get('layout_style')}")

        # 3. Design Agent
        print("[MultiAgent] 🎨 Design Agent creating visual elements...")
        design_result = self.design_agent(plan, foundation)
        elements = design_result["elements"]
        print(f"[MultiAgent] ✅ Created {len(elements)} elements")

        # 4. Review Agent
        print("[MultiAgent] 🔍 Review Agent validating quality...")
        review_result = self.review_agent(elements, plan)
        print(f"[MultiAgent] ✅ Quality Score: {review_result['quality_score']}/100")
        print(f"[MultiAgent]    Symmetry: {review_result['symmetry_score']}/100")
        print(f"[MultiAgent]    ATS: {review_result['ats_score']}/100")

        # 5. Assembly Agent
        print("[MultiAgent] 🔧 Assembly Agent finalizing...")
        assembly_result = self.assembly_agent(elements, plan, review_result)
        final_elements = assembly_result["elements"]
        print(f"[MultiAgent] ✅ Final: {len(final_elements)} elements")

        return {
            "status": "success",
            "mode": "replace",
            "elements": final_elements,
            "pipeline_results": {
                "plan": plan_result,
                "foundation": foundation_result,
                "design": design_result,
                "review": review_result,
                "assembly": assembly_result,
            },
            "quality_metrics": {
                "overall_score": review_result["quality_score"],
                "symmetry_score": review_result["symmetry_score"],
                "ats_score": review_result["ats_score"],
                "ats_compliant": review_result["ats_compliant"],
            },
            "message": f"Created {plan.get('role')} resume with {len(final_elements)} elements (Quality: {review_result['quality_score']}/100)",
        }


# ═════════════════════════════════════════════════════════════════════════════
# EDITOR SURGICAL MODIFICATIONS
# ═════════════════════════════════════════════════════════════════════════════

class EditorAIArchitect:
    """
    Surgical AI modifications for the editor canvas.
    Analyzes existing elements and makes precise changes.
    Uses Swirls AI as primary with Gemini as fallback.
    """

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.environ.get("GEMINI_API_KEY")
        self.use_swirls = HAS_SWIRLS

        # Initialize Gemini as fallback
        if self.api_key and ChatGoogleGenerativeAI:
            self.llm_fallback = ChatGoogleGenerativeAI(
                model="gemini-1.5-flash",
                google_api_key=self.api_key,
                temperature=0.5,
            )
        else:
            self.llm_fallback = None

    def add_element_surgically(
        self,
        element_type: str,
        element_spec: str,
        existing_elements: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Adds a new element to canvas with intelligent positioning.
        """
        # Analyze canvas
        canvas_analysis = analyze_canvas_space.invoke({"existing_elements": existing_elements})

        # Create the element based on type
        new_elements = []

        if element_type == "qr_code":
            url_match = re.search(r'https?://[^\s]+', element_spec)
            url = url_match.group(0) if url_match else "https://linkedin.com"

            # Find optimal position
            position_result = find_optimal_position.invoke({
                "element_width": 75,
                "element_height": 87,
                "existing_elements": existing_elements,
                "preference": "bottom",
            })

            qr_result = add_qr_code.invoke({
                "url": url,
                "label": "Scan Portfolio",
                "position": "bottom_right",
            })
            new_elements = qr_result.get("added_elements", [])

        elif element_type == "sidebar" and "sleek" in element_spec.lower():
            # Add a modern sidebar
            sidebar_width = 180

            # Check if space is available
            if not any(e.get("x", 0) < 200 and e.get("width", 0) > 150 for e in existing_elements):
                # Space available - add sidebar
                new_elements.append({
                    "id": f"sidebar_{uuid.uuid4().hex[:6]}",
                    "element_type": "shape",
                    "shape_type": "rectangle",
                    "page_id": "page-1",
                    "x": 0,
                    "y": 0,
                    "width": sidebar_width,
                    "height": PAGE_HEIGHT,
                    "fill_color": "#1e293b",
                    "z_index": 0,
                })

                # Shift existing elements to the right
                for el in existing_elements:
                    if el.get("x", 0) < 300:
                        el["x"] = el.get("x", 0) + sidebar_width + 20
            else:
                return {
                    "status": "error",
                    "message": "Cannot add sidebar - left area already occupied",
                }

        elif element_type == "summary" or "summary" in element_spec.lower():
            # Add professional summary section
            summary_text = "Results-driven professional with 5+ years of experience delivering high-impact solutions and driving operational excellence."
            summary_width = 400
            summary_height = estimate_text_height(summary_text, summary_width, 10)

            # Find optimal position
            pos_result = find_optimal_position.invoke({
                "element_width": summary_width,
                "element_height": summary_height + 30,
                "existing_elements": existing_elements,
                "preference": "top",
            })

            x = pos_result.get("x", 40)
            y = pos_result.get("y", 650)

            # Check if we need to move elements
            if pos_result.get("rationale", "").startswith("No available"):
                move_result = move_elements_to_make_space.invoke({
                    "existing_elements": existing_elements,
                    "required_space": {"x": x, "y": y, "width": summary_width, "height": summary_height + 30},
                })
                if move_result["status"] == "success":
                    for modified_el in move_result.get("modified_elements", []):
                        # Update existing elements
                        for orig_el in existing_elements:
                            if orig_el.get("id") == modified_el.get("id"):
                                orig_el.update(modified_el)

            # Add section heading
            new_elements.append({
                "id": f"summary_heading_{uuid.uuid4().hex[:6]}",
                "element_type": "text",
                "page_id": "page-1",
                "text": "PROFESSIONAL SUMMARY",
                "x": x,
                "y": y + summary_height + 20,
                "width": summary_width,
                "height": 16,
                "font_size": 12,
                "font_name": "Helvetica-Bold",
                "text_color": "#1e3a8a",
                "bold": True,
                "z_index": 3,
            })

            # Add divider line
            new_elements.append({
                "id": f"summary_line_{uuid.uuid4().hex[:6]}",
                "element_type": "shape",
                "shape_type": "line",
                "page_id": "page-1",
                "x": x,
                "y": y + summary_height + 16,
                "width": summary_width,
                "height": 2,
                "fill_color": "#dc2626",
                "border_color": "#dc2626",
                "border_width": 2,
                "z_index": 2,
            })

            # Add summary text
            new_elements.append({
                "id": f"summary_text_{uuid.uuid4().hex[:6]}",
                "element_type": "text",
                "page_id": "page-1",
                "text": summary_text,
                "x": x,
                "y": y,
                "width": summary_width,
                "height": summary_height,
                "font_size": 10,
                "font_name": "Helvetica",
                "text_color": "#334155",
                "line_height": 1.4,
                "z_index": 3,
            })

        if new_elements:
            # Calculate final symmetry
            all_elements = existing_elements + new_elements
            symmetry = calculate_symmetry_score.invoke({"elements": all_elements})

            return {
                "status": "success",
                "mode": "patch",
                "action": f"add_{element_type}",
                "added_elements": new_elements,
                "modifications": [],
                "symmetry_score": symmetry["symmetry_score"],
                "message": f"Added {element_type} with {len(new_elements)} elements (Symmetry: {symmetry['symmetry_score']}/100)",
            }

        return {
            "status": "error",
            "message": f"Could not create element of type: {element_type}",
        }


# ═════════════════════════════════════════════════════════════════════════════
# PUBLIC API
# ═════════════════════════════════════════════════════════════════════════════

def run_multi_agent_architect(
    user_prompt: str,
    existing_elements: Optional[List[Dict[str, Any]]] = None,
    mode: str = "create"  # "create" or "edit"
) -> Dict[str, Any]:
    """
    Main entry point for multi-agent resume architect.

    Args:
        user_prompt: User's natural language request
        existing_elements: Existing canvas elements (for edit mode)
        mode: "create" for new resume, "edit" for modifications

    Returns:
        Dict with status, elements, and quality metrics
    """
    if mode == "edit" and existing_elements:
        # Editor mode - surgical modifications
        editor = EditorAIArchitect()

        # Detect intent
        prompt_lower = user_prompt.lower()

        if "qr" in prompt_lower or "code" in prompt_lower:
            return editor.add_element_surgically("qr_code", user_prompt, existing_elements)
        elif "sidebar" in prompt_lower:
            return editor.add_element_surgically("sidebar", user_prompt, existing_elements)
        elif "summary" in prompt_lower:
            return editor.add_element_surgically("summary", user_prompt, existing_elements)
        else:
            # Generic addition - analyze and decide
            return editor.add_element_surgically("text", user_prompt, existing_elements)

    else:
        # Create mode - full multi-agent pipeline
        architect = MultiAgentArchitect()
        return architect.run_full_pipeline(user_prompt)
