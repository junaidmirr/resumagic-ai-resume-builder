export interface ArticleSection {
  heading: string;
  body: string[];
  callout?: {
    type: "tip" | "warning" | "metric" | "example";
    title: string;
    text: string;
  };
  table?: {
    headers: string[];
    rows: string[][];
  };
  bullets?: string[];
}

export interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  category:
    "ATS Optimization" | "Resume Writing" | "AI & Tech" | "Career Strategy";
  readTime: string;
  date: string;
  author: {
    name: string;
    role: string;
    avatar: string;
  };
  featured?: boolean;
  tags: string[];
  sections: ArticleSection[];
}

export const ARTICLES: Article[] = [
  {
    id: "ats-secrets-2026",
    title: "10 ATS Secrets to Pass Scanner Systems in 2026",
    slug: "ats-secrets-2026",
    excerpt:
      "Modern Applicant Tracking Systems now use semantic neural embeddings and structural layout analysis. Here is how modern systems parse resumes and how to ensure a 99%+ pass rate.",
    category: "ATS Optimization",
    readTime: "7 min read",
    date: "July 20, 2026",
    author: {
      name: "Dr. Elena Rostova",
      role: "Lead HR Tech Researcher",
      avatar:
        "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    },
    featured: true,
    tags: ["ATS", "Workday", "Greenhouse", "Parser Algorithm", "PDF"],
    sections: [
      {
        heading: "The Shift from Keyword Matching to Semantic Vector Parsing",
        body: [
          "For years, standard resume advice revolved around simplistic keyword frequency: candidates were advised to repeat phrases like 'Python' or 'Agile' as many times as possible across their document. In 2026, systems like Workday AI, Greenhouse Predictive, and Lever NextGen have replaced primitive regex scrapers with Large Language Models and dense vector embeddings.",
          "Instead of checking for verbatim strings, modern parsers map your resume into a multi-dimensional semantic vector space. The parser measures the cosine similarity between your experience cluster and the target job description's competency graph. If you write 'Spearheaded distributed backend refactoring' and the requisition asks for 'Microservices optimization', modern AI understands they represent identical competencies without penalizing for wording variations.",
        ],
        callout: {
          type: "metric",
          title: "Semantic Embedding Impact",
          text: "Over 82% of Global 2000 enterprises now utilize vector-based candidate matching algorithms rather than legacy keyword tally engines.",
        },
      },
      {
        heading: "Why Multi-Column Layouts Break in 38% of Enterprise Scanners",
        body: [
          "While dual-column resumes look stylish on screen, they often cause parsing failures when processed by older OCR scanning layers or text-linearization pipelines. When a parser encounters two columns without explicit semantic flow markers, it frequently reads text horizontally across both columns simultaneously.",
          "This blends your job title on the left with your dates or location on the right, corrupting dates, company associations, and job chronology. Single-column linear architectures remain the highest-reliability format for candidate screening.",
        ],
        table: {
          headers: [
            "Resume Architecture",
            "Parsing Reliability Rate",
            "Recommended Industry",
          ],
          rows: [
            [
              "Single-Column Linear Flow",
              "99.4%",
              "All corporate, Tech, Finance, Healthcare",
            ],
            [
              "Split 2-Column Sidebar",
              "61.8%",
              "Creative fields with direct portfolio links only",
            ],
            [
              "Floating Text-Box Overlay",
              "42.1%",
              "Not recommended for automated enterprise ATS",
            ],
          ],
        },
      },
      {
        heading:
          "10 Structural Rules to Guarantee Your Resume Passes Verification",
        body: [
          "Follow these ten evidence-backed principles when exporting and configuring your resume documents:",
        ],
        bullets: [
          "Always use standard standard section headers: 'Work Experience', 'Education', 'Technical Skills', 'Certifications'. Avoid colloquialisms like 'Where I have been' or 'My Superpowers'.",
          "Ensure font typography is embedded as true vector glyphs. Never submit rasterized scans or flattened canvas image exports.",
          "Always list chronological roles in 'Company - Role - City, State - Dates (Month Year)' sequence to maintain parser entity extraction precision.",
          "Keep contact details in the document body. Many legacy parsers completely skip PDF header and footer bounding boxes.",
          "Do not use complex HTML tables or layered shapes for skill ratings. Represent skills in clean comma-separated lists or categorical clusters.",
          "Quantify achievements using explicit metrics (%, $, ms, headcount) to trigger managerial and impact entity recognizers.",
          "Stick to UTF-8 standard punctuation. Replace decorative em-dashes and custom bullet shapes with standard bullet points.",
          "Maintain consistent date formatting throughout (e.g., 'Jan 2023 - Present' or '01/2023 - 08/2025') without alternating styles.",
          "Save files with clean naming conventions: 'FirstName_LastName_Resume_2026.pdf'.",
          "Always validate your text layer: open your exported PDF, press Ctrl+A/Cmd+A, and paste into Notepad to ensure clean linear extraction.",
        ],
        callout: {
          type: "tip",
          title: "Resumagic Architectural Advantage",
          text: "Every resume exported from Resumagic's vector engine outputs clean text stream trees, ensuring 100% extractable linear text for automated screeners.",
        },
      },
    ],
  },
  {
    id: "ai-prompt-engineering-resumes",
    title: "How to Prompt AI for High-Converting Impact Bullet Points",
    slug: "ai-prompt-engineering-resumes",
    excerpt:
      "Transforming passive task descriptions into quantified executive statements using Google's XYZ formula and high-leverage contextual prompting strategies.",
    category: "AI & Tech",
    readTime: "6 min read",
    date: "July 18, 2026",
    author: {
      name: "Marcus Vance",
      role: "AI Prompt Architect",
      avatar:
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    },
    featured: true,
    tags: ["AI Prompts", "Google XYZ", "Bullet Points", "Executive Writing"],
    sections: [
      {
        heading: "The Flaw of Generic Prompts: Avoiding the AI Resume Cliche",
        body: [
          "When candidates ask general chatbots to 'write resume bullet points for a product manager', they almost always receive generic buzzwords like 'spearheaded strategic initiatives' and 'collaborated with cross-functional teams'. Hiring managers recognize these robotic, adjective-heavy statements within three seconds.",
          "High-converting resume generation requires constraint-based prompting that enforces strict empirical logic, real business metrics, and precise architectural cause-and-effect.",
        ],
      },
      {
        heading: "The Google XYZ Framework: Structure & Engineering",
        body: [
          "Popularized by Laszlo Bock during his tenure as Google's SVP of People Operations, the XYZ formula is the industry benchmark for impact resumes: 'Accomplished [X], as measured by [Y], by doing [Z]'.",
          "When you supply raw work inputs to an AI prompt, your prompt must force the model to identify the metric [Y] and the technical mechanism [Z] before generating the outcome statement [X].",
        ],
        table: {
          headers: [
            "Before (Task Description)",
            "After (Google XYZ Impact Statement)",
          ],
          rows: [
            [
              "Responsible for managing the API gateway and improving backend speed.",
              "Accelerated p99 API throughput by 42% (Y) by re-architecting Redis connection pooling and deploying asynchronous worker queues (Z) across 12 microservices (X).",
            ],
            [
              "Helped improve sales onboarding and handled rep coaching.",
              "Shortened new account executive ramp time from 90 to 45 days (Y) by authoring a 14-module interactive deal negotiation framework (Z) adopted across 80 reps (X).",
            ],
            [
              "Managed paid ad budget and ran growth experiments.",
              "Generated $1.4M in incremental pipeline (Y) while reducing customer acquisition cost by 28% (Y) through automated multi-variant landing page testing (Z).",
            ],
          ],
        },
      },
      {
        heading: "Master Prompt Templates for Immediate Deployment",
        body: [
          "Copy and customize this exact system prompt when refining your achievements in Resumagic's AI Assistant or custom LLMs:",
        ],
        callout: {
          type: "example",
          title: "The Executive Impact Refiner Prompt",
          text: "Role: Executive Resume Strategist. Task: Convert the following raw project description into 3 tight, single-line bullet points using Laszlo Bock's XYZ formula ('Accomplished [X] as measured by [Y] by doing [Z]'). Constraints: 1) Start each bullet with an active verb. 2) Forbid buzzwords like 'synergized', 'spearheaded', or 'rockstar'. 3) Include at least one quantitative metric (percentage, dollar, latency, or scale). 4) Maximum 24 words per bullet.",
        },
      },
    ],
  },
  {
    id: "vector-pdf-formatting",
    title: "Why High-Resolution Vector PDFs Outperform Word Docs",
    slug: "vector-pdf-formatting",
    excerpt:
      "Why standard Microsoft Word exports fail corporate layout verification, and how vector PDF rendering guarantees identical visual geometry across all recruiter devices.",
    category: "Resume Writing",
    readTime: "5 min read",
    date: "July 14, 2026",
    author: {
      name: "Sophia Chen",
      role: "Core Design Architect",
      avatar:
        "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
    },
    featured: false,
    tags: ["PDF", "Typography", "Vector Rendering", "ATS Verification"],
    sections: [
      {
        heading: "The Danger of Microsoft Word (.docx) Rendering Discrepancies",
        body: [
          "For decades, candidates debated whether to submit .docx or .pdf files. While legacy recruiting agencies preferred editable Word documents to rebrand candidate resumes, submitting a .docx directly to enterprise companies introduces severe visual risks.",
          "Microsoft Word files do not store fixed geometry coordinates. Instead, they render dynamically based on the viewer's local system: default printer drivers, installed system fonts, and software version differences (Word 365 vs Word 2016 vs Apple Pages). A layout that fits onto exactly one page on your laptop can easily push two orphan lines onto page two on an HR screener's monitor.",
        ],
        callout: {
          type: "warning",
          title: "The Two-Page Trap",
          text: "If font substitution on a recruiter's computer increases line spacing by just 1.5 points, your clean single-page resume becomes a sloppy 1.1-page document with an empty trailing sheet.",
        },
      },
      {
        heading: "How Vector PDFs Retain Both Visual and Semantic Fidelity",
        body: [
          "A true vector PDF treats every element—text glyphs, rules, icons, and margins—as mathematical coordinates relative to the page bounding box (e.g., standard 612x792 pt letter size).",
          "Regardless of whether the recruiter views the document on a mobile phone, a high-DPI retina display, or an automated ATS text extractor, vector rendering preserves pixel-exact positioning and embedded font character tables.",
        ],
        bullets: [
          "Preserved Kerning & Leading: Mathematical glyph positions prevent unexpected line wraps and page overflows.",
          "Selectable Text Stream: Automated crawlers can read the underlying character sequence without OCR distortion.",
          "Universal Print Rendering: Guarantees that paper printouts for in-person panel interviews match your digital screen preview exactly.",
        ],
      },
    ],
  },
  {
    id: "executive-resume-transformation",
    title: "From Mid-Level to VP: Restructuring Your Leadership Story",
    slug: "executive-resume-transformation",
    excerpt:
      "A complete guide to repositioning your career narrative from individual execution to enterprise stewardship, EBITDA growth, and executive governance.",
    category: "Career Strategy",
    readTime: "9 min read",
    date: "July 10, 2026",
    author: {
      name: "David Miller",
      role: "Executive Career Coach",
      avatar:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    },
    featured: false,
    tags: ["Executive", "Leadership", "VP Roles", "Board Governance", "EBITDA"],
    sections: [
      {
        heading: "The Fundamental Pivot: From 'What I Did' to 'What I Enabled'",
        body: [
          "Mid-level resumes focus heavily on individual contributor mechanics: tickets completed, code pushed, campaigns executed, or spreadsheets reconciled. At the Director, VP, and C-suite levels, board committees and talent recruiters do not care about your daily tool usage.",
          "Executive candidates are evaluated on three pillars: Capital Efficiency (P&L stewardship), Organizational Architecture (hiring, retention, culture, scalability), and Market Strategy (defensibility, competitive positioning, enterprise value creation).",
        ],
      },
      {
        heading: "Structuring the Executive Summary",
        body: [
          "Replace outdated objective statements with an Executive Competency Profile. This section should immediately anchor your scope of authority, team size, budget allocation, and marquee career metric.",
        ],
        callout: {
          type: "example",
          title: "VP of Engineering Executive Profile Example",
          text: "Enterprise engineering leader with 14+ years scaling high-availability B2B SaaS platforms from $12M to $90M ARR. Built and mentored global 85-engineer organization across 4 time zones. Pioneered enterprise AI automation frameworks that reduced gross margins cost-to-serve by 22% while accelerating product shipment velocity 3x.",
        },
      },
      {
        heading: "Core Executive Metric Categories to Include",
        body: [
          "Every executive resume section should incorporate metrics across these three core enterprise dimensions:",
        ],
        table: {
          headers: [
            "Pillar",
            "Typical Mid-Level Phrasing",
            "Executive Level Transformation",
          ],
          rows: [
            [
              "Financial Impact",
              "Managed software development budget for the frontend group.",
              "Governed $14.5M annual engineering budget; re-negotiated enterprise vendor contracts to save $1.2M annually without service degradation.",
            ],
            [
              "Talent & People",
              "Conducted technical interviews and hired several engineers.",
              "Scaled engineering organization from 28 to 110 personnel over 24 months, achieving 94% annualized retention and decreasing time-to-hire by 35 days.",
            ],
            [
              "Strategic Velocity",
              "Built features on schedule according to product roadmaps.",
              "Formulated company-wide cloud migration roadmap, deprecating 3 legacy datacenters and unlocking ISO-27001 / SOC-2 enterprise compliance.",
            ],
          ],
        },
      },
    ],
  },
  {
    id: "linkedin-pdf-import-guide",
    title: "Instant Resume Creation: Harnessing LinkedIn PDF Import",
    slug: "linkedin-pdf-import-guide",
    excerpt:
      "How to extract your career data from LinkedIn's profile export and let AI transform messy chronological dumps into precision-styled resume designs.",
    category: "AI & Tech",
    readTime: "5 min read",
    date: "July 05, 2026",
    author: {
      name: "Marcus Vance",
      role: "AI Prompt Architect",
      avatar:
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    },
    featured: false,
    tags: ["LinkedIn", "PDF Parser", "AI Import", "Productivity"],
    sections: [
      {
        heading: "Why LinkedIn's Native PDF Export Fails as a Real Resume",
        body: [
          "LinkedIn provides a convenient 'Save to PDF' feature on every personal profile. However, if you submit this default export to recruiters, you immediately reveal lack of intentionality. LinkedIn's default PDF export has excessive spacing, lacks impact hierarchy, runs 4-5 pages long for experienced workers, and contains no targeted ATS keyword optimization.",
          "Instead, treating your LinkedIn PDF as a structured data archive allows AI parsing engines to extract work history, dates, skills, and titles into clean computational objects.",
        ],
      },
      {
        heading: "How Resumagic's Neural Parser Distills Your History",
        body: [
          "Resumagic's built-in PDF ingestion engine uses pattern-matching heuristics combined with neural language models to read your raw LinkedIn export. It extracts job titles, company names, start/end dates, and educational credentials into structured state trees.",
          "Once ingested, the AI Architect engine automatically curates the top 3-4 impactful bullets per role, applies professional typography templates, and fits your career narrative onto a single page.",
        ],
        bullets: [
          "Step 1: Go to your LinkedIn profile, click 'More' in your header, and select 'Save to PDF'.",
          "Step 2: Upload the generated PDF into Resumagic's Onboarding or Import screen.",
          "Step 3: Our parser cleans conversational prose into punchy, metric-driven achievement bullets.",
          "Step 4: Select an industry-tailored design preset (e.g., Stark Brutalist, Emerald Pro, Corporate Hierarchy) to preview instant vector output.",
        ],
      },
    ],
  },
  {
    id: "color-psychology-resumes",
    title: "Color Psychology in Resume Design: Dark Mode vs Classic Light",
    slug: "color-psychology-resumes",
    excerpt:
      "When to deploy modern high-contrast palettes versus conservative corporate monochrome themes to align with recruiter psychological expectations.",
    category: "Resume Writing",
    readTime: "6 min read",
    date: "June 28, 2026",
    author: {
      name: "Sophia Chen",
      role: "Design System Lead",
      avatar:
        "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
    },
    featured: false,
    tags: [
      "Design System",
      "Color Theory",
      "Recruiter Psychology",
      "Visual Hierarchy",
    ],
    sections: [
      {
        heading: "The 6-Second Glance: First Impressions in Recruiter Scanning",
        body: [
          "Eye-tracking studies by eye-tracking research teams consistently show that recruiters spend an average of 6 to 7.4 seconds on an initial resume review. In that brief window, visual balance and typographic contrast dictate whether the reviewer reads your accomplishments or discards the document.",
          "Color is not merely decorative; it is a navigational waypoint that directs the human eye to your role titles, company brands, and headline achievements.",
        ],
      },
      {
        heading: "Industry Norms by Color Palette",
        body: [
          "Different commercial sectors hold strong subconscious expectations about color restraint and presentation:",
        ],
        table: {
          headers: [
            "Industry Sector",
            "Recommended Palette",
            "Psychological Association",
          ],
          rows: [
            [
              "Fintech, Enterprise B2B, Cybersecurity",
              "Deep Slate (#0f172a) with Cyan accent",
              "Stability, precision, modern engineering",
            ],
            [
              "Management Consulting, Legal, Investment Banking",
              "Monochrome Slate with subtle Navy rules",
              "Institutional rigor, conservatism, compliance",
            ],
            [
              "Healthcare, BioTech, Environmental Tech",
              "Forest Emerald (#065f46) with Soft Ivory",
              "Growth, scientific credibility, human trust",
            ],
            [
              "Creative Tech, Web3, Indie Startups",
              "Stark Brutalist high-contrast borders",
              "Bold innovation, disruption, direct confidence",
            ],
          ],
        },
        callout: {
          type: "tip",
          title: "The 60-30-10 Rule of Document Design",
          text: "60% dominant canvas (white or subtle off-white background), 30% primary body text (deep charcoal or obsidian slate for readability), and 10% purposeful accent (section headers, divider lines, and metrics).",
        },
      },
    ],
  },
  {
    id: "cover-letter-strategy-2026",
    title: "The Death of the 5-Paragraph Cover Letter: The 3-Beat Memo",
    slug: "cover-letter-strategy-2026",
    excerpt:
      "Why nobody reads lengthy cover letters anymore, and how to write a concise 150-word impact memo that founders and hiring managers actually read.",
    category: "Career Strategy",
    readTime: "5 min read",
    date: "June 20, 2026",
    author: {
      name: "David Miller",
      role: "Executive Career Coach",
      avatar:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    },
    featured: true,
    tags: ["Cover Letters", "Hiring Managers", "Executive Memo", "Networking"],
    sections: [
      {
        heading: "Why the Traditional Cover Letter is Obsolete",
        body: [
          "The outdated formal letter—beginning with 'Dear Hiring Manager, I am writing to express my enthusiastic interest in your open role...'—is universally skipped by hiring teams. It offers zero unique insight into your problem-solving abilities and signals copy-paste automation.",
          "In modern high-velocity hiring, the best alternative is the '3-Beat Pain-Point Memo'. It takes less than 45 seconds to read and immediately frames you as a solution to their highest-priority business objective.",
        ],
      },
      {
        heading: "The 3-Beat Memo Structure",
        body: [
          "Format your cover letter into three concise sections without fluff:",
        ],
        bullets: [
          "Beat 1: The Context Anchor (1-2 sentences): Acknowledge a specific company milestone, product announcement, or scaling challenge they recently announced publicly.",
          "Beat 2: The Direct Proof (3-4 bullet points): Present 2-3 past achievements with clear metrics proving you have already solved this exact problem at comparable scale.",
          "Beat 3: The Forward Vision (1-2 sentences): Propose a clear hypothesis or discussion topic for a quick 15-minute introductory conversation.",
        ],
        callout: {
          type: "example",
          title: "High-Converting 3-Beat Memo Example",
          text: "Hi Sarah,\n\nI saw Stripe recently launched its new unified billing infrastructure for global SaaS. Scaling localized taxation across 40+ European currencies is typically where billing pipelines encounter edge-case latency bottlenecks.\n\nOver the past 3 years at FinFlow:\n• Engineered a zero-downtime VAT tax reconciliation microservice processing €340M in annual transactions.\n• Reduced invoice settlement API lag by 65% through event-driven Kafka message streaming.\n• Maintained 99.995% billing engine uptime across Black Friday transaction spikes.\n\nI'd love to share our architecture learnings and discuss your roadmap for Q4 European expansion.\n\nBest,\nAlex Rivera",
        },
      },
    ],
  },
  {
    id: "salary-negotiation-data-playbook",
    title: "Salary Negotiation: How to Counter-Offer Using Market Percentiles",
    slug: "salary-negotiation-data-playbook",
    excerpt:
      "A quantitative approach to countering initial job offers without risking offer rescission, supported by verifiable compensation datasets.",
    category: "Career Strategy",
    readTime: "8 min read",
    date: "June 12, 2026",
    author: {
      name: "Dr. Elena Rostova",
      role: "Lead HR Tech Researcher",
      avatar:
        "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    },
    featured: false,
    tags: [
      "Salary Negotiation",
      "Compensation",
      "Offers",
      "Equity",
      "Stock Grants",
    ],
    sections: [
      {
        heading:
          "The Psychology of Offer Generation in Modern Tech & Corporate",
        body: [
          "When an organization extends a job offer, they have already invested dozens of engineering hours, interview panels, and background screenings into your candidacy. They want you to sign.",
          "However, first offers almost always target the 50th or 60th percentile of internal compensation bands. Negotiating is not viewed as adversarial; senior hiring managers view respectful, data-backed counter-offers as evidence of strong executive negotiation and communication skills.",
        ],
      },
      {
        heading: "The Three Compensation Levers",
        body: [
          "Never negotiate base salary alone. Structure your counter around three distinct buckets:",
        ],
        table: {
          headers: ["Lever", "Flexibility Level", "Best Use Case"],
          rows: [
            [
              "Signing Bonus",
              "High (One-time budget)",
              "Bridge immediate gaps in annual equity vesting cliffs from your previous employer",
            ],
            [
              "Equity / RSU Grant",
              "Medium to High",
              "Long-term upside when base salary bands have strict internal pay-equity caps",
            ],
            [
              "Base Salary",
              "Medium (Fixed recurring cost)",
              "Establishes your baseline for annual percentage raises and bonus formulas",
            ],
          ],
        },
        callout: {
          type: "tip",
          title: "The Golden Rule of the First Counter",
          text: "Always express enthusiastic cultural alignment before presenting numbers. Anchor counter-proposals to specific 75th-90th percentile market data points rather than personal living expenses.",
        },
      },
    ],
  },
  {
    id: "skills-section-modernization",
    title: "How to Structure Your Skills Section for 2026 Semantic Parsers",
    slug: "skills-section-modernization",
    excerpt:
      "Why outdated skill progress bars hurt your ATS score, and how categorical taxonomy clustering helps AI parsers rank your seniority.",
    category: "ATS Optimization",
    readTime: "5 min read",
    date: "June 04, 2026",
    author: {
      name: "Marcus Vance",
      role: "AI Prompt Architect",
      avatar:
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    },
    featured: false,
    tags: [
      "Skills Taxonomy",
      "ATS Parsing",
      "Technical Skills",
      "Competencies",
    ],
    sections: [
      {
        heading: "The Fatal Flaw of Graphic Skill Progress Bars",
        body: [
          "Many graphic design templates display progress bars claiming 'Python: 90%' or 'Product Strategy: 4/5 stars'.",
          "Applicant Tracking Systems completely ignore or choke on graphic progress bars because graphical percentage shapes contain no standardized semantic value. Even worse, human hiring managers find arbitrary self-ratings meaningless: what does 85% in Leadership actually measure?",
        ],
      },
      {
        heading: "Categorical Taxonomy Clustering",
        body: [
          "Modern semantic parsers group competencies using taxonomic hierarchies. Group your technical and functional skills into logical sub-domains so parsers immediately index your breadth and depth.",
        ],
        bullets: [
          "Languages & Frameworks: TypeScript, Python, Go, React, Next.js, Node.js",
          "Data & Cloud Infrastructure: PostgreSQL, Redis, AWS (ECS, Lambda, S3), Docker, Terraform",
          "Methodologies & Systems: Distributed Systems Architecture, RESTful API Design, CI/CD Pipelines, SOC-2 Auditing",
        ],
      },
    ],
  },
];
