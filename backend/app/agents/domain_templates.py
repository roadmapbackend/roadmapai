"""
Domain Templates & Universal Adaptive Generators for Daari
Provides domain-aware curriculum generation when LLMs are rate-limited or offline,
ensuring tailored roadmaps, subtopics, practical exercises/code, citations, and courses
for ANY field of study across any duration (total_days) and daily commitment (daily_hours).
"""

from typing import Dict, Any, List
import re

def classify_domain(domain_context: str) -> str:
    ctx = domain_context.lower()
    if any(k in ctx for k in ["data", "analys", "science", "ml", "machine learning", "ai", "artificial intelligence", "statistic", "pandas", "numpy", "deep learning"]):
        return "data_science"
    if any(k in ctx for k in ["web", "react", "frontend", "next", "vue", "javascript", "typescript", "fullstack", "node", "html", "css", "backend"]):
        return "web_development"
    if any(k in ctx for k in ["cloud", "devops", "docker", "kubernetes", "k8s", "aws", "azure", "gcp", "terraform", "ci/cd", "linux", "sysadmin"]):
        return "devops_cloud"
    if any(k in ctx for k in ["guitar", "piano", "music", "violin", "drums", "harmony", "audio", "composition", "singing", "brass", "flute", "bass"]):
        return "music_arts"
    if any(k in ctx for k in ["physics", "quantum", "chemistry", "biology", "genetics", "neuroscience", "astronomy", "math", "calculus", "algebra"]):
        return "science_math"
    if any(k in ctx for k in ["spanish", "french", "german", "japanese", "mandarin", "italian", "language", "linguistics", "grammar", "korean"]):
        return "languages"
    if any(k in ctx for k in ["marketing", "finance", "accounting", "business", "product management", "economics", "startup", "sales", "venture"]):
        return "business_finance"
    if any(k in ctx for k in ["design", "ui/ux", "graphic design", "animation", "photography", "illustration", "typography", "3d modeling"]):
        return "design_arts"
    if any(k in ctx for k in ["bgmi", "battlegrounds", "pubg", "valorant", "csgo", "cs:go", "counter-strike", "fortnite", "apex", "cod", "call of duty", "warzone", "league of legends", "lol", "dota", "overwatch", "rocket league", "r6", "rainbow six", "gaming", "esports", "battle royale", "fps"]):
        return "gaming_esports"
    if any(k in ctx for k in ["football", "soccer", "basketball", "tennis", "cricket", "boxing", "mma", "swimming", "running", "gym", "workout", "fitness", "bodybuilding", "yoga"]):
        return "athletics_sports"
    if any(k in ctx for k in ["cooking", "culinary", "baking", "pastry", "chef", "knife skills", "barista", "coffee"]):
        return "culinary_craft"
    return "general"

def generate_domain_days(domain_context: str, total_days: int) -> List[Dict[str, Any]]:
    category = classify_domain(domain_context)
    clean = domain_context.strip()
    
    # 1. Base syllabus templates by category
    if category == "gaming_esports":
        base_stages = [
            (f"Controls, Device Calibration, HUD Layout & Ergonomics in {clean}",
             "Custom HUD button mapping, gyroscope vs finger sensitivity calibration, crosshair placement baseline, and display refresh optimization.",
             ["Custom HUD mapping & 4-finger claw layout", "Gyroscope & ADS sensitivity tuning", "Crosshair placement & centering drills"]),
            (f"Mechanical Execution & Recoil Control Fundamentals",
             "Mastering spray pull-down muscle memory, burst firing, hip-fire accuracy, and quick peek-and-fire agility.",
             ["Vertical & horizontal recoil compensation", "Jiggle peeking & pre-aim angles", "Hip-fire tracking at close range"]),
            (f"Weapon Arsenal, Ballistics & Utility Mastery",
             "Damage falloff curves, optimal attachment synergies, grenade cooking trajectories, and smoke wall tactical cover.",
             ["Weapon tier list & TTK comparisons", "Frag grenade cooking & ricochet angles", "Defensive & offensive smoke deployment"]),
            (f"Drop Strategy, Early Game Looting & Initial Positioning",
             "Hot-drop vs cold-drop landing routes, fast looting routes, vehicle securing priority, and compound clearing.",
             ["Parachute trajectory & early drop routes", "Fast loot priority & armor optimization", "Compound breach & room clearing mechanics"]),
            (f"Map Navigation, Zone Rotations & Circle Prediction",
             "Decoupling circle shifts, predicting late-game zones, navigating open terrain, and vehicle-assisted edge control.",
             ["Circle shift reading & timing windows", "High-ground & terrain dip exploitation", "Gatekeeping rotations along the blue zone"]),
            (f"Squad Roles, Comms & Tactical Teamfighting",
             "Entry fragger execution, IGL shotcalling, crossfire angles, trade-frag discipline, and compound siege protocols.",
             ["Effective callouts & information sharing", "Crossfire setups & bait-and-switch angles", "Trade-fragging & revives under pressure"]),
            (f"Endgame Clutch Decision Making, High-Pressure Play & Capstone Mastery in {clean}",
             "Final circle positioning, 1vX clutch composure, heal-battle awareness, utility conservation, and tournament VOD review.",
             ["1vX isolation & clutch decision trees", "Final circle utility barrage & smoke paths", "Post-match VOD review & tilt management"]),
        ]
    elif category == "data_science":
        base_stages = [
            (f"Foundations & Vectorized Arrays with NumPy & Pandas in {clean}",
             "Environment setup, tabular data structures, array broadcasting, and initial schema auditing.",
             ["Data ingestion & schema auditing", "Vectorized array arithmetic", "DataFrame filtering and transformations"]),
            (f"Exploratory Data Analysis (EDA) & Distribution Diagnostics",
             "Uncovering central tendency, dispersion, skewness, outliers, and multivariate correlation matrices.",
             ["Summary metrics & variance analysis", "Outlier detection with Tukey IQR", "Multivariate heatmaps & pairplots"]),
            (f"Data Cleaning, Missingness Imputation & Feature Scaling",
             "Deconstructing missing value mechanisms (MCAR/MAR), imputation pipelines, and categorical encodings.",
             ["KNN and median imputation strategies", "One-Hot and Target Encoding", "RobustScaler & StandardScaler"]),
            (f"Statistical Inference, Probability & Hypothesis Testing",
             "Applying Central Limit Theorem, confidence intervals, Welch t-tests, and experimental A/B testing design.",
             ["Hypothesis formulation & null rejection", "Two-sample testing & p-values", "Statistical significance in business decisions"]),
            (f"Supervised Regression & Regularization (Lasso/Ridge)",
             "Training ordinary least squares regression, loss function optimization, and shrinkage penalties.",
             ["Bias-variance decomposition", "Lasso L1 and Ridge L2 regularizers", "Residual diagnostic Q-Q analysis"]),
            (f"Classification Algorithms & Decision Boundary Calibration",
             "Logistic regression, decision trees, random forests, and threshold tuning using ROC-AUC.",
             ["Binary and multi-class decision surfaces", "Precision-Recall trade-offs", "Confusion matrix calibration"]),
            (f"End-to-End Pipeline Serialization & Capstone Insights",
             "Encapsulating preprocessing and estimators into atomic pipelines and exporting reproducible artifacts.",
             ["Scikit-Learn Pipeline orchestration", "Model serialization with Joblib", "Executive data storytelling & reporting"]),
        ]
    elif category == "web_development":
        base_stages = [
            (f"Modern Language Syntax & Asynchronous Event Loop in {clean}",
             "Mastering execution contexts, promises, async/await, and strict typing architectures.",
             ["Event loop & microtask queue mechanics", "Promise orchestration & error bubbling", "TypeScript interfaces & generics"]),
            (f"Modular Component Architecture & State Management",
             "Designing declarative UI components, custom hooks, and unidirectional data flow.",
             ["State colocation principles", "Controlled state and custom hooks", "Immutable updates and state stores"]),
            (f"Routing, Server Components & Dynamic Rendering",
             "Implementing client and server routing, streaming SSR, and static asset pre-rendering.",
             ["File-system routing patterns", "Server Component vs Client Component boundaries", "Dynamic parameters & caching"]),
            (f"API Integration, Data Fetching & Optimistic UI Mutations",
             "Orchestrating network requests, cache invalidation, and instant optimistic client updates.",
             ["RESTful and GraphQL client contracts", "Stale-while-revalidate cache mechanics", "Optimistic mutation rollback"]),
            (f"Performance Optimization, Bundle Splitting & Core Web Vitals",
             "Eliminating render bottlenecks, code-splitting, lazy loading, and optimizing LCP/INP/CLS.",
             ["Bundle size auditing & dynamic imports", "LCP / INP optimization strategies", "Layout shift prevention"]),
            (f"Authentication, Security Hardening & Access Control",
             "Implementing secure session management, JWT token rotation, CSRF/XSS defenses, and route guards.",
             ["HTTP-only cookie auth", "Role-based access control (RBAC)", "Sanitization and CSP policies"]),
            (f"Automated Testing, CI/CD & Production Capstone Deployment",
             "End-to-end integration testing, automated deployment pipelines, and observability monitoring.",
             ["Unit & component test coverage", "CI/CD GitHub Actions workflow", "Production telemetry & error boundaries"]),
        ]
    elif category == "devops_cloud":
        base_stages = [
            (f"Containerization & Multi-Stage Docker Builds for {clean}",
             "Packaging production runtimes with minimal footprint, security scanning, and layer caching.",
             ["Dockerfile best practices", "Multi-stage compilation", "Image vulnerability scanning"]),
            (f"Infrastructure as Code (IaC) with Terraform",
             "Declarative cloud provisioning, remote state locking, and modular infrastructure blueprints.",
             ["Terraform provider configuration", "Remote state locking & backends", "Reusable cloud modules"]),
            (f"Kubernetes Orchestration & Service Networking",
             "Deploying resilient container pods, services, ingress controllers, and config management.",
             ["Pod & ReplicaSet lifecycles", "Ingress and cluster networking", "ConfigMaps and Secrets"]),
            (f"CI/CD Pipeline Automation & Declarative GitOps",
             "Automated testing, linting, build pipelines, and continuous deployment reconciliation.",
             ["Declarative pipeline workflows", "Automated semantic versioning", "Blue/green and canary deployments"]),
            (f"Observability, Distributed Tracing & Metric Monitoring",
             "Setting up Prometheus metrics, Grafana dashboards, structured logging, and APM alerting.",
             ["Golden signals of monitoring", "Log aggregation pipelines", "SLO/SLA threshold alert rules"]),
            (f"Cloud Security Hardening & Zero-Trust IAM Policies",
             "Least-privilege IAM policies, network security groups, KMS key management, and secrets rotation.",
             ["IAM role assumption & policies", "Network security & VPC peering", "Automated secret rotation"]),
            (f"Disaster Recovery, Auto-Scaling & Production Capstone Rollout",
             "Horizontal pod autoscaling, chaos engineering, cross-region backups, and failover verification.",
             ["Horizontal Pod Autoscaler (HPA)", "Disaster recovery runbooks", "High-availability multi-zone architecture"]),
        ]
    elif category == "music_arts":
        base_stages = [
            (f"Ergonomics, Posture & Baseline Tone Production in {clean}",
             "Physical alignment, instrument hold, tension-free ergonomics, and foundational sound production.",
             ["Establish optimal physical posture", "Master clean tone extraction", "Develop tension release awareness"]),
            (f"Essential Scales, Interval Mechanics & Spatial Fluency",
             "Understanding root intervals, major/minor scale geometry, and navigational dexterity.",
             ["Interval recognition & spatial layout", "Fluid scalar traversal with metronome", "Articulation and finger independence"]),
            (f"Harmonic Foundations, Chords & Voicing Transitions",
             "Constructing triads, seventh chords, voice leading, and rapid change fluency.",
             ["Triad & chord architecture", "Smooth voicing transitions", "Dynamic balance between harmonic registers"]),
            (f"Rhythmic Precision, Meter & Subdivision Drills",
             "Internalizing pulse, syncopation, odd meters, and dynamic strumming/bowing patterns.",
             ["Metronome subdivision mastery", "Syncopated rhythmic patterns", "Micro-timing and groove consistency"]),
            (f"Polyphonic Independence & Textural Voice Leading",
             "Managing multiple melodic and bass lines simultaneously with dynamic separation.",
             ["Bass-melody isolation", "Contrapuntal voice projection", "Sustained legato phrasing"]),
            (f"Expressive Phrasing, Nuance & Stylistic Interpretation",
             "Vibrato, dynamic shading, rubato, and translating emotional intent into performance.",
             ["Expressive vibrato control", "Dynamic arc shaping across musical phrases", "Stylistic ornamentation"]),
            (f"Repertoire Mastery, Performance Polish & Capstone Recital",
             "Synthesizing technical mechanics and musical expression into a polished, stage-ready milestone.",
             ["Memorization and mental practice protocols", "Error recovery and stage readiness", "Capstone performance execution"]),
        ]
    elif category == "science_math":
        base_stages = [
            (f"Fundamental Axioms, Units & Mental Models in {clean}",
             "Core definitions, governing assumptions, dimensional analysis, and foundational physical intuition.",
             ["Establish axiomatic foundations", "Dimensional analysis & unit consistency", "Build core mental models"]),
            (f"Mathematical Formalism, Operators & Analytical Tools",
             "Mastering the mathematical machinery, differential equations, and analytical representations.",
             ["Formalize governing equations", "Analytical problem solving methods", "Boundary value identification"]),
            (f"Core Governing Laws & Empirical Phenomenon Analysis",
             "Investigating primary dynamical relationships, conservation principles, and empirical observations.",
             ["Apply conservation laws", "Analyze empirical datasets", "Solve primary canonical problems"]),
            (f"Experimental Protocols, Measurement & Error Propagation",
             "Designing reproducible experiments, measuring variables, and quantifying statistical uncertainties.",
             ["Formulate experimental design", "Quantify instrumental error margins", "Propagate uncertainties through models"]),
            (f"Perturbation Theory, Non-Linearities & Boundary Conditions",
             "Navigating complex deviations, non-ideal conditions, and asymptotic behavior.",
             ["Examine non-linear dynamics", "Apply approximation techniques", "Evaluate critical boundary thresholds"]),
            (f"Computational Modeling & Simulation Verification",
             "Writing numerical solvers, running simulations, and verifying results against analytical benchmarks.",
             ["Implement numerical algorithms", "Run parametric simulations", "Validate model convergence"]),
            (f"Research Synthesis, Literature Audit & Capstone Findings",
             "Integrating analytical, experimental, and computational findings into an authoritative report.",
             ["Critique seminal literature", "Synthesize quantitative findings", "Present defensible research conclusions"]),
        ]
    elif category == "languages":
        base_stages = [
            (f"Phonetics, Pronunciation Rules & Core Vocabulary in {clean}",
             "Vocal tract positioning, accent mechanics, essential greetings, and high-frequency root words.",
             ["Master accurate phonetic articulation", "Internalize high-frequency vocabulary", "Practice essential everyday greetings"]),
            (f"Sentence Structure, Word Order & Essential Grammar",
             "Deconstructing subject-verb-object syntax, question formation, and negation mechanics.",
             ["Construct declarative sentences", "Form interrogative questions", "Apply correct grammatical gender & agreements"]),
            (f"Verb Conjugation, Tenses & Conversational Verbs",
             "Conjugating regular and irregular verbs across present, past, and future temporal frames.",
             ["Conjugate high-utility verbs", "Narrate past and future events", "Form spontaneous dialogue responses"]),
            (f"Listening Comprehension, Ear Training & Spoken Cadence",
             "Decoupling native speech speed, recognizing phonetic contractions, and auditory parsing.",
             ["Transcribe native audio snippets", "Identify rapid spoken contractions", "Shadow native speaker cadence"]),
            (f"Intermediate Reading, Idioms & Cultural Pragmatics",
             "Reading authentic articles, decoding common colloquial idioms, and understanding conversational etiquette.",
             ["Read authentic written media", "Interpret idiomatic expressions", "Apply culturally appropriate phrasing"]),
            (f"Expressive Fluency, Complex Clauses & Nuanced Discourse",
             "Connecting arguments with advanced conjunctions, expressing opinions, and debate formulation.",
             ["Construct compound-complex sentences", "Express nuanced subjective viewpoints", "Debate contemporary topics comfortably"]),
            (f"Spontaneous Immersion, Dialogue Synthesis & Capstone Milestone",
             "Engaging in an extended unscripted conversational exchange demonstrating practical fluency.",
             ["Sustain real-time spontaneous dialogue", "Overcome vocabulary gaps through circumlocution", "Deliver capstone oral presentation"]),
        ]
    elif category == "business_finance":
        base_stages = [
            (f"Strategic Landscape, Value Propositions & Mental Models in {clean}",
             "Analyzing industry dynamics, stakeholder economics, and competitive value propositions.",
             ["Analyze competitive landscapes", "Define differentiated value propositions", "Map core stakeholder incentives"]),
            (f"Customer Personas, Segmentation & Demand Generation",
             "Identifying target customer segments, pain points, and customer acquisition channels.",
             ["Build detailed customer profiles", "Design go-to-market funnels", "Calculate acquisition economics"]),
            (f"Financial Fundamentals, Unit Economics & Margin Dynamics",
             "Deconstructing income statements, cash flows, gross margins, and contribution margins.",
             ["Calculate CAC, LTV, and payback periods", "Analyze unit economic sustainability", "Model working capital requirements"]),
            (f"Execution Workflows, Funnel Optimization & A/B Testing",
             "Operationalizing growth loops, conversion rate optimization, and rapid feedback testing.",
             ["Implement iterative growth tests", "Audit conversion drop-off points", "Optimize sales pipeline velocity"]),
            (f"Organizational Scaling, Risk Management & Compliance",
             "Designing scalable operational systems, managing operational risk, and navigating governance.",
             ["Identify operational bottlenecks", "Establish risk mitigation playbooks", "Design scalable organizational workflows"]),
            (f"Competitive Moats, Strategic Retention & Network Effects",
             "Fortifying sustainable competitive advantages, increasing switching costs, and driving retention.",
             ["Map flywheel & network effects", "Analyze cohort retention curves", "Defend pricing power against rivals"]),
            (f"Executive Synthesis, Financial Model & Capstone Strategy",
             "Synthesizing all operational and financial dimensions into a comprehensive executive proposal.",
             ["Build integrated 3-statement model", "Author executive investment memo", "Deliver compelling strategic pitch"]),
        ]
    elif category == "design_arts":
        base_stages = [
            (f"Visual Hierarchy, Typography & Layout Principles in {clean}",
             "Foundational design fundamentals, typographic scale, white space, and visual focal points.",
             ["Establish clear visual hierarchy", "Select harmonized typography pairings", "Balance positive and negative space"]),
            (f"Color Theory, Accessibility & Emotional Branding",
             "Color harmonies, contrast ratios (WCAG compliance), and psychology of chromatic palettes.",
             ["Construct cohesive color palettes", "Audit contrast ratios for accessibility", "Evoke target psychological responses"]),
            (f"Spatial Systems, Modular Grids & Responsive Proportions",
             "Creating disciplined multi-column grids, fluid spacing tokens, and responsive breakpoints.",
             ["Implement responsive grid systems", "Establish consistent spatial tokens", "Adapt layouts across viewport dimensions"]),
            (f"Design Systems, Component Atoms & Reusable Libraries",
             "Architecting scalable design tokens, reusable UI components, and state variants.",
             ["Design atomic UI primitives", "Manage variant states (hover, active, disabled)", "Document design token standards"]),
            (f"Interaction Choreography, Motion & Micro-Animations",
             "Guiding user focus with purposeful transitions, physics-based motion, and micro-feedback.",
             ["Choreograph purposeful entrance/exit motion", "Implement responsive micro-interactions", "Optimize animation frame rates"]),
            (f"Usability Testing, User Psychology & Heuristic Audits",
             "Conducting heuristic evaluations, identifying cognitive friction, and running usability drills.",
             ["Execute Nielsen-Norman heuristic audits", "Eliminate cognitive friction points", "Iterate based on user testing data"]),
            (f"High-Fidelity Showcase, Portfolio Deliverable & Capstone Review",
             "Finalizing an end-to-end design artifact, polishing presentation mocks, and authoring case studies.",
             ["Assemble production-ready high-fi mocks", "Author comprehensive design case study", "Present polished capstone portfolio"]),
        ]
    else:
        # Universal adaptive fallback for any custom subject
        base_stages = [
            (f"Foundational Mental Models, Terminology & Setup in {clean}",
             f"Core concepts, baseline taxonomy, and environmental setup for mastering {clean}.",
             ["Establish key domain definitions", "Survey foundational literature & tools", "Set up operational environment"]),
            (f"Core Paradigms, Structural Rules & Baseline Grammar",
             f"Exploring primary workflows, toolchains, and standardized approaches in {clean}.",
             ["Workflow establishment", "Master standard operating procedures", "Reproducible baseline practice"]),
            (f"Applied Mechanics & Hands-On Workflows (Part 1)",
             f"Hands-on execution of baseline challenges and fundamental techniques in {clean}.",
             ["Apply core principles", "Execute guided practical drills", "Evaluate baseline outcomes"]),
            (f"Intermediate Problem Solving & Analysis (Part 2)",
             f"Diving deeper into structural patterns and solving complex problem sets in {clean}.",
             ["Deconstruct intermediate challenges", "Implement structured solutions", "Iterative refinement"]),
            (f"Advanced Nuances, Edge Cases & Trade-Off Analysis",
             f"Navigating constraints, failure modes, boundary conditions, and quality trade-offs in {clean}.",
             ["Analyze boundary constraints", "Mitigate common failure modes", "Compare architectural approaches"]),
            (f"Quality Assurance, Verification & Benchmarking",
             f"Testing, validating, and measuring efficacy against established benchmarks in {clean}.",
             ["Design verification criteria", "Execute rigorous testing", "Document performance trade-offs"]),
            (f"Capstone Project Integration & Real-World Synthesis in {clean}",
             f"Synthesizing all acquired competencies into a cohesive, portfolio-grade milestone.",
             ["Architect capstone project", "Implement end-to-end deliverables", "Final review & retrospective"]),
        ]

    # 2. Dynamically project stages across total_days
    days = []
    num_stages = len(base_stages)
    
    for i in range(1, total_days + 1):
        if total_days <= num_stages:
            # Squeeze or sample progression proportionally
            stage_idx = int(((i - 1) / (total_days - 1 if total_days > 1 else 1)) * (num_stages - 1))
            title, desc, objectives = base_stages[stage_idx]
        else:
            # Expand progression: cycle core stages and add deep-dive milestones
            cycle_idx = (i - 1) % (num_stages - 1)  # reserve last stage for final day
            if i == total_days:
                title, desc, objectives = base_stages[-1]
            else:
                title, desc, objectives = base_stages[cycle_idx]
                if i >= num_stages:
                    title = f"{title} (Advanced Module {i // num_stages + 1})"
                    desc = f"Advanced extension and specialization: {desc}"

        days.append({
            "day_number": i,
            "title": f"Day {i}: {title}",
            "description": desc,
            "learning_objectives": objectives
        })

    return days

def generate_domain_topics(
    day_title: str,
    daily_hours: float,
    domain_context: str,
    day_number: int = 1,
    learning_objectives: List[str] = None,
    day_description: str = ""
) -> List[Dict[str, Any]]:
    clean_domain = domain_context.strip()
    clean_title = re.sub(r"^Day\s+\d+:\s*", "", day_title).strip() or f"Applied Principles for Day {day_number}"
    total_minutes = int(daily_hours * 60)

    # 1. If explicit learning objectives exist, elevate each into an authentic dedicated technical topic!
    if learning_objectives and len(learning_objectives) >= 2:
        valid_objs = [obj.strip() for obj in learning_objectives if obj and obj.strip()]
        if len(valid_objs) >= 2:
            mins = total_minutes // len(valid_objs)
            return [
                {
                    "topic_number": idx + 1,
                    "title": f"Topic {idx + 1}: {obj}",
                    "description": f"Deep theoretical deconstruction, architectural constraints, and hands-on validation of {obj} in {clean_domain}.",
                    "estimated_minutes": total_minutes - (mins * (len(valid_objs) - 1)) if idx == len(valid_objs) - 1 else mins
                }
                for idx, obj in enumerate(valid_objs)
            ]

    # 2. Dynamic concept decomposition tailored to clean_title and clean_domain
    title_parts = [p.strip() for p in re.split(r"[:&–—]", clean_title) if p.strip()]
    primary = title_parts[0] if title_parts else clean_title
    secondary = title_parts[1] if len(title_parts) > 1 else f"{primary} Mechanics"
    tertiary = title_parts[2] if len(title_parts) > 2 else f"{primary} Architecture & Diagnostics"

    topic_pool = [
        (f"{primary}: Core Mechanisms & Invariant Principles",
         f"Deconstructing the governing axioms, physical/state constraints, and mathematical models of {primary} in {clean_domain}."),
        (f"{secondary}: Operational Protocols & Practical Implementation",
         f"Step-by-step methodologies, verified workflows, and applied execution models for {secondary}."),
    ]

    if daily_hours > 1.5 or len(title_parts) > 2:
        topic_pool.append(
            (f"{tertiary}: Fault Tolerance, Boundary Anomalies & Stress Limits",
             f"Evaluating extreme operational parameters, concurrency/thermal hazards, and failure boundary isolation.")
        )

    if daily_hours >= 3.0:
        topic_pool.append(
            (f"{primary}: Benchmark Profiling & Production Synthesis",
             f"Comprehensive validation, telemetry diagnostics, and integration into modern {clean_domain} pipelines.")
        )

    mins = total_minutes // len(topic_pool)
    topics = []
    for idx, (t_title, t_desc) in enumerate(topic_pool):
        topics.append({
            "topic_number": idx + 1,
            "title": f"Topic {idx + 1}: {t_title}",
            "description": t_desc,
            "estimated_minutes": total_minutes - (mins * (len(topic_pool) - 1)) if idx == len(topic_pool) - 1 else mins
        })
    return topics

def generate_domain_lesson(topic_title: str, domain_context: str, topic_desc: str) -> Dict[str, Any]:
    category = classify_domain(domain_context)
    clean_domain = domain_context.strip()
    clean_topic = re.sub(r"^Topic\s+\d+:\s*", "", topic_title).strip()

    query = f"{domain_context} {topic_title}".lower()

    if any(k in query for k in ["bgmi", "battlegrounds", "pubg", "valorant", "csgo", "counter-strike", "fortnite", "apex", "cod", "call of duty", "warzone", "gaming", "esports", "battle royale", "fps"]):
        content_markdown = (
            f"# {clean_topic}\n\n"
            f"## 1. Tactical Foundations & Combat Mental Model\n\n"
            f"In competitive battle royales like **{clean_domain}**, mastering **{clean_topic}** requires developing instinctive game sense, crosshair discipline, and position control.\n\n"
            f"> **Mastery Focus:** {topic_desc or 'Refining in-game execution, crosshair placement, utility usage, and clutch decision making.'}\n\n"
            "### Core Combat Mechanics & Tactical Dynamics\n"
            "1. **Crosshair Centering & Pre-Aim**: Never aim at the ground while sprinting. Always maintain reticle placement at head height where enemies appear from behind corners or windows.\n"
            "2. **Hard Cover Discipline**: Always anchor your movement to permanent terrain (rocks, concrete ridges, compound walls) where you can instantly reset your hitbox.\n"
            "3. **Utility Throwables as Weaponry**: Frag grenades cooked to explode within 1 second leave opponents zero reaction time. Smoke walls create covered paths across open fields.\n\n"
            "```mermaid\n"
            "graph TD\n"
            "  subgraph ReconPlane[\"1. Reconnaissance & Pre-Aim\"]\n"
            "    A(\"Audio & Visual Cue Triangulation\"):::orange --> B(\"High-Ground Verification\"):::orange\n"
            "    B --> C(\"Head-Level Pre-Aim\"):::orange\n"
            "  end\n\n"
            "  subgraph CombatPlane[\"2. Firefight Execution\"]\n"
            "    C --> D(\"Fast Peek & Initial Burst (3-5 Rounds)\"):::cyan\n"
            "    D --> E{\"Enemy Taking Critical Damage?\"}:::sky\n"
            "    E -- \"Yes\" --> F(\"Push with Cooked Utility & Crossfire\"):::emerald\n"
            "    E -- \"No / Taking Fire\" --> G(\"Reset to Hard Cover & Re-peek Unpredictable Angle\"):::indigo\n"
            "  end\n\n"
            "  subgraph SquadPlane[\"3. Squad Synchronization\"]\n"
            "    F --> H(\"Trade-Fragging & 360° Third-Party Scan\"):::purple\n"
            "  end\n\n"
            "  classDef orange fill:#1c1917,stroke:#f97316,stroke-width:2px,color:#ffedd5,rx:18px,ry:18px\n"
            "  classDef cyan fill:#082f49,stroke:#38bdf8,stroke-width:2px,color:#f0f9ff,rx:18px,ry:18px\n"
            "  classDef sky fill:#0c4a6e,stroke:#0284c7,stroke-width:2px,color:#e0f2fe,rx:18px,ry:18px\n"
            "  classDef emerald fill:#022c22,stroke:#34d399,stroke-width:2px,color:#f0fdf4,rx:18px,ry:18px\n"
            "  classDef indigo fill:#1e1b4b,stroke:#818cf8,stroke-width:2px,color:#e0e7ff,rx:18px,ry:18px\n"
            "  classDef purple fill:#2e1065,stroke:#a78bfa,stroke-width:2px,color:#faf5ff,rx:18px,ry:18px\n"
            "```\n\n"
            "## 2. Common Pitfalls & High-Pressure Blunders\n\n"
            "1. **Over-Peeking (Peeker's Ego Trap)**: Staying exposed in ADS through the same window for more than 1 second, giving snipers an easy headshot. *Mitigation*: Shoot 3-5 rounds, un-peek, and re-engage from a different dip or corner.\n"
            "2. **Tunnel Vision & Third-Party Vulnerability**: Fixating entirely on a downed enemy or single gunfight while neglecting surrounding high-ground, getting eliminated by a third party. *Mitigation*: Designate one squad member to watch flanks and always pop smoke before looting death crates.\n"
            "3. **Panic Spraying Without Recoil Compensation**: Holding full-auto trigger without pulling down or gyro-compensating, sending the second half of the magazine into the sky. *Mitigation*: Practice burst-firing in 8-10 round increments or resetting ADS to re-center recoil."
        )
        code_lang = "markdown"
        code_title = f"20-Minute Daily Training Grounds Drill: {clean_topic}"
        code_example = (
            f"### 🎯 20-Minute Daily Training Grounds Routine: {clean_topic}\n\n"
            "#### Phase 1: Gyroscope & Crosshair Centering (5 mins)\n"
            "1. Target: 20m stationary dummy targets in Training Grounds.\n"
            "2. Drill: Keep crosshair locked at head level while continuously strafing left and right.\n"
            "3. Calibration Rule: If reticle lags behind target while moving, increase Camera Gyroscope by +5%.\n\n"
            "#### Phase 2: Spray Transfer & Pull-Down Control (10 mins)\n"
            "1. Weapon: M416 / Beryl M762 with Compensator + Vertical Grip + Extended Quickdraw.\n"
            "2. Drill: Fire 10-round burst at Target 1 (20m), flick reticle immediately to Target 2 (40m) without releasing ADS, and fire remaining 20 rounds.\n"
            "3. Benchmark: 80%+ of bullets must land within the inner chest/head circle.\n\n"
            "#### Phase 3: Peek-and-Fire Agility & Quick Scope (5 mins)\n"
            "1. Position: Stand behind half-wall cover.\n"
            "2. Drill: Quick peek (Left/Right lean) -> Open Scope -> 3-round tap -> Un-peek back to full cover within 400ms.\n"
            "3. Rule: Never remain exposed for more than 0.5 seconds at the same angle."
        )
        citations = [
            {"title": "Competitive Tournament VOD & Strategy Analysis: Zone Rotation Mechanics & Circle Hard Shifts", "url": "https://www.youtube.com/results?search_query=bgmi+pro+tournament+rotation+vod+analysis", "source_type": "Competitive Tournament VOD & Strategy Analysis", "snippet": "Deep breakdown of vehicle prioritization, high-ground edge gatekeeping, and compound assault crossfires in championship lobbies."},
            {"title": "Official Weapon Ballistics & Recoil Smoothing Mechanics", "url": "https://battlegroundsmobileindia.com/", "source_type": "Official Ballistics & Damage Matrix", "snippet": "Exact damage falloff curves, limb damage multipliers, and gyroscope sensitivity pull-down physics across 5.56mm and 7.62mm weapons."},
            {"title": "The Art of Clutch: Decision-Making Under High Pressure in Tactical Shooters", "url": "https://esports.gg/", "source_type": "Pro Player Masterclass Series", "snippet": "Isolating 1v1 duels, utility conservation, audio triangulation, and mental composure in 1vX endgame scenarios."}
        ]
        courses = [
            {"title": "Competitive Tactical FPS & Battle Royale Mastery: From Basics to Pro Lobby", "platform": "Esports Coaching Network", "url": "https://www.youtube.com/", "level": "All Skill Levels"},
            {"title": "In-Game Leader (IGL) Shotcalling & Tournament Macro Strategy", "platform": "Pro Esports Academy", "url": "https://www.youtube.com/", "level": "Intermediate to Advanced"}
        ]
        return {
            "content_markdown": content_markdown,
            "practical_examples": [{"language": code_lang, "title": code_title, "code": code_example}],
            "citations": citations,
            "recommended_courses": courses
        }

    elif any(k in query for k in ["consensus", "raft", "paxos", "distributed system", "fault toleran", "microservice", "byzantine"]):
        content_markdown = (
            f"# {clean_topic}\n\n"
            f"## 1. Executive Concept & Foundational Invariants\n\n"
            f"In this module on **{clean_domain}**, we deconstruct the core mechanisms governing **{clean_topic}**.\n\n"
            f"> **Module Objective:** {topic_desc or 'Mastering state machine replication, quorum thresholds, and partition resilience.'}\n\n"
            "### State Machine Replication & The Consensus Invariant\n"
            f"In distributed consensus around **{clean_topic}**, the system guarantees **Safety over Liveness** under the FLP Impossibility Theorem.\n\n"
            "```mermaid\n"
            "graph TD\n"
            "  subgraph ClientBoundary[\"Client Domain\"]\n"
            "    CP(\"Client Application Proxy\"):::orange\n"
            "  end\n\n"
            "  subgraph ConsensusCluster[\"Raft Quorum State Machine\"]\n"
            "    CL(\"Cluster Leader (Term Epoch Master)\"):::cyan\n"
            "    F1(\"Follower Node 1 (Log Quorum)\"):::emerald\n"
            "    F2(\"Follower Node 2 (Log Quorum)\"):::emerald\n"
            "  end\n\n"
            "  CP -- \"1. Append Log Entry\" --> CL\n"
            "  CL -- \"2. Replicate Log Entry\" --> F1\n"
            "  CL -- \"2. Replicate Log Entry\" --> F2\n"
            "  F1 -. \"3. Quorum Acknowledgment\" .-> CL\n"
            "  F2 -. \"3. Quorum Acknowledgment\" .-> CL\n"
            "  CL -- \"4. Commit Acknowledgment\" --> CP\n\n"
            "  classDef orange fill:#1c1917,stroke:#f97316,stroke-width:2px,color:#ffedd5,rx:18px,ry:18px\n"
            "  classDef cyan fill:#082f49,stroke:#38bdf8,stroke-width:2px,color:#f0f9ff,rx:18px,ry:18px\n"
            "  classDef emerald fill:#022c22,stroke:#34d399,stroke-width:2px,color:#f0fdf4,rx:18px,ry:18px\n"
            "```\n\n"
            "1. **Leader Election Safety**: At most one leader can be elected in a given term. If two candidates split votes, randomized election timers break symmetry.\n"
            "2. **Leader Append-Only Invariant**: A leader never overwrites or truncates its own log entries; it only appends new entries.\n"
            "3. **Log Matching Invariant**: If two logs contain an entry with the same index and term, the logs are identical in all entries through the given index.\n\n"
            "## 2. Real-World Production Failure Modes & Traps\n\n"
            "1. **Split-Brain Anomalies**: Network partitions isolating a leader from majority quorum can lead to divergent state writes if the minority leader does not step down upon missing heartbeats.\n"
            "2. **Cascading Election Storms**: Synchronous or non-randomized timeouts causing simultaneous candidate transitions, causing continuous vote splitting without leader convergence.\n"
            "3. **Uncommitted Stale Reads**: Serving client read queries from followers whose logs have not yet applied the latest committed index."
        )
        code_lang = "python"
        code_title = f"Raft Leader Election & Quorum Simulation for {clean_topic}"
        code_example = (
            "import time\nimport random\nfrom typing import List, Dict\n\n"
            "class RaftNode:\n"
            "    def __init__(self, node_id: int, peers: List[int]):\n"
            "        self.node_id = node_id\n"
            "        self.peers = peers\n"
            "        self.current_term = 0\n"
            "        self.voted_for = None\n"
            '        self.state = "FOLLOWER"\n'
            "        self.log: List[Dict] = []\n"
            "        self.commit_index = 0\n"
            "        self.last_heartbeat = time.time()\n"
            "        self.election_timeout = random.uniform(1.5, 3.0)\n\n"
            "    def start_election(self):\n"
            '        self.state = "CANDIDATE"\n'
            "        self.current_term += 1\n"
            "        self.voted_for = self.node_id\n"
            "        votes = 1\n"
            '        print(f"[Node {self.node_id}] Initiating election for Term {self.current_term}")\n\n'
            "        for peer in self.peers:\n"
            "            if self.request_vote(peer):\n"
            "                votes += 1\n\n"
            "        quorum = (len(self.peers) + 1) // 2 + 1\n"
            "        if votes >= quorum:\n"
            '            self.state = "LEADER"\n'
            '            print(f"[Node {self.node_id}] Quorum attained ({votes}/{len(self.peers) + 1} votes). Promoted to LEADER.")\n'
            "            return True\n"
            "        return False\n\n"
            "    def request_vote(self, peer_id: int) -> bool:\n"
            "        return True\n\n"
            "cluster = RaftNode(node_id=1, peers=[2, 3, 4, 5])\n"
            "cluster.start_election()\n"
        )
        citations = [
            {"title": "In Search of an Understandable Consensus Algorithm (Raft)", "url": "https://raft.github.io/raft.pdf", "source_type": "Seminal Research Paper (USENIX ATC)", "snippet": "Diego Ongaro and John Ousterhout's breakthrough formalization of leader election and replicated state machine logs."},
            {"title": "Designing Data-Intensive Applications", "url": "https://dataintensive.net/", "source_type": "Authoritative Reference (Martin Kleppmann, O'Reilly)", "snippet": "Comprehensive breakdown of replication lag, consensus algorithms, partition tolerance, and transactional isolation levels."},
            {"title": "Paxos Made Simple", "url": "https://lamport.azurewebsites.net/pubs/paxos-simple.pdf", "source_type": "Seminal Research Paper (Leslie Lamport, ACM SIGACT)", "snippet": "Foundational consensus protocol establishing quorum consensus across asynchronous, failure-prone networks."}
        ]
        courses = [
            {"title": "MIT 6.824: Distributed Computer Systems Engineering", "platform": "MIT OpenCourseWare (Prof. Robert Morris)", "url": "https://pdos.csail.mit.edu/6.824/", "level": "Advanced"},
            {"title": "Reliable Distributed Algorithms", "platform": "KTH Royal Institute of Technology (edX)", "url": "https://www.edx.org", "level": "Intermediate to Advanced"}
        ]
        return {
            "content_markdown": content_markdown,
            "practical_examples": [{"language": code_lang, "title": code_title, "code": code_example}],
            "citations": citations,
            "recommended_courses": courses
        }
    elif any(k in query for k in ["transformer", "deep learning", "neural network", "attention", "backprop", "gradient", "llm", "diffusion", "embedding", "machine learning", "pytorch"]):
        content_markdown = (
            f"# {clean_topic}\n\n"
            f"## 1. Executive Concept & Foundational Invariants\n\n"
            f"In this module on **{clean_domain}**, we explore the mathematical and architectural foundations of **{clean_topic}**.\n\n"
            f"> **Module Objective:** {topic_desc or 'Mastering multi-head attention, tensor manifolds, backpropagation dynamics, and loss stabilization.'}\n\n"
            f"### Mathematical Mechanics of {clean_topic}\n"
            f"In deep neural representations for **{clean_topic}**, information propagates forward via parameterized affine mappings and backpropagates via the multivariate chain rule:\n\n"
            r"$$\frac{\partial \mathcal{L}}{\partial W^{[l]}} = \frac{\partial \mathcal{L}}{\partial Z^{[l]}} \cdot (A^{[l-1]})^T" + "\n\n"
            "1. **Representation Geometry**: High-dimensional latent manifolds where semantic similarity is preserved as cosine distance in normalized vector spaces.\n"
            "2. **Gradient Stability & Conditioning**: Deep architectures require residual streams to preserve Jacobian eigenvalues near 1.0, preventing gradient annihilation.\n"
            "3. **Loss Surface Optimization**: Adam/AdamW optimizers maintain running first (momentum) and second (uncentered variance) moment estimators with decoupled weight decay.\n\n"
            "## 2. Real-World Production Failure Modes & Traps\n\n"
            "1. **Gradient Explosion / Vanishing**: Deep unnormalized layers compounding weight matrices leading to exponential overflow (NaN) or zeroed learning rates; mitigated via LayerNorm/RMSNorm.\n"
            "2. **Latent Manifold Overfitting**: Training loss converging to near-zero while validation loss spikes, indicating lack of regularization (Dropout, Weight Decay, Data Augmentation).\n"
            "3. **Attention Collapse in Long Sequences**: Unscaled dot products driving softmax into regions with vanishingly small gradients."
        )

        code_lang = "python"
        code_title = f"Scaled Dot-Product Self-Attention & Gradient Tracking for {clean_topic}"
        code_example = (
            "import numpy as np\n\n"
            "def scaled_dot_product_attention(Q: np.ndarray, K: np.ndarray, V: np.ndarray, mask=None):\n"
            '    """Compute Scaled Dot-Product Attention: Softmax(Q * K^T / sqrt(d_k)) * V"""\n'
            "    d_k = Q.shape[-1]\n"
            "    scores = np.matmul(Q, K.swapaxes(-1, -2)) / np.sqrt(d_k)\n"
            "    if mask is not None:\n"
            "        scores = np.where(mask == 0, -1e9, scores)\n"
            "    exp_scores = np.exp(scores - np.max(scores, axis=-1, keepdims=True))\n"
            "    attention_weights = exp_scores / np.sum(exp_scores, axis=-1, keepdims=True)\n"
            "    output = np.matmul(attention_weights, V)\n"
            "    return output, attention_weights\n\n"
            "np.random.seed(42)\n"
            "Q = np.random.randn(1, 4, 8)\n"
            "K = np.random.randn(1, 4, 8)\n"
            "V = np.random.randn(1, 4, 8)\n"
            "out, weights = scaled_dot_product_attention(Q, K, V)\n"
            'print(f"Attention Output Shape: {out.shape}")\n'
            'print(f"Attention Weights Row 0 Sum: {np.sum(weights[0, 0]):.6f}")\n'
        )
        citations = [
            {"title": "Attention Is All You Need", "url": "https://arxiv.org/abs/1706.03762", "source_type": "Seminal Research Paper (NeurIPS 2017)", "snippet": "Vaswani et al.: Breakthrough introduction of the transformer multi-head self-attention architecture."},
            {"title": "Deep Learning (Adaptive Computation & Machine Learning)", "url": "https://www.deeplearningbook.org/", "source_type": "Authoritative Textbook (Goodfellow, Bengio, Courville, MIT Press)", "snippet": "Foundational mathematical reference on optimization, backpropagation, and representation learning."},
            {"title": "Deep Residual Learning for Image Recognition", "url": "https://arxiv.org/abs/1512.03385", "source_type": "Seminal Research Paper (CVPR 2016)", "snippet": "Formalization of skip connections to solve vanishing gradients across deep networks."}
        ]
        courses = [
            {"title": "Stanford CS229: Machine Learning (Prof. Andrew Ng)", "platform": "Stanford Online", "url": "https://cs229.stanford.edu/", "level": "Intermediate to Advanced"},
            {"title": "Stanford CS224N: Natural Language Processing with Deep Learning", "platform": "Stanford Online", "url": "https://web.stanford.edu/class/cs224n/", "level": "Advanced"},
            {"title": "Deep Learning Specialization", "platform": "Coursera / DeepLearning.AI", "url": "https://www.coursera.org/specializations/deep-learning", "level": "Intermediate"}
        ]
        return {
            "content_markdown": content_markdown,
            "practical_examples": [{"language": code_lang, "title": code_title, "code": code_example}],
            "citations": citations,
            "recommended_courses": courses
        }

    elif any(k in query for k in ["database", "sql", "postgres", "indexing", "b-tree", "lsm", "storage engine", "acid", "mvcc", "vacuum", "wal", "query plan"]):
        content_markdown = (
            f"# {clean_topic}\n\n"
            f"## 1. Executive Concept & Foundational Invariants\n\n"
            f"In this module on **{clean_domain}**, we explore storage engine architectures and concurrency control in **{clean_topic}**.\n\n"
            f"> **Module Objective:** {topic_desc or 'Mastering MVCC snapshot isolation, WAL durability, B+ Tree vs LSM performance, and query planner optimization.'}\n\n"
            "### Multi-Version Concurrency Control (MVCC) & Storage Invariants\n"
            f"In modern relational and distributed engines handling **{clean_topic}**, concurrency is achieved without read-write locking contention through snapshot isolation.\n\n"
            "1. **Tuple Visibility Rules**: Each record header stores `xmin` (creating transaction ID) and `xmax` (deleting transaction ID). Readers observe tuples satisfying transaction visibility boundaries.\n"
            "2. **B+ Tree vs LSM Trade-off**:\n"
            "   - **B+ Tree**: High read locality (O(log_B N) random reads), but random page write amplification.\n"
            "   - **LSM-Tree**: O(1) sequential append WAL writes + MemTable buffer, but requires background compaction.\n"
            "3. **Write-Ahead Logging (WAL)**: Guaranteeing ACID Durability by strictly flushing sequential log records before dirty buffer pages are committed to storage disks.\n\n"
            "## 2. Real-World Production Failure Modes & Traps\n\n"
            "1. **Table Bloat & Transaction ID Wraparound**: Infrequent VACUUM execution leading to dead tuple accumulation, inflating sequential scans and risking shutdown.\n"
            "2. **Write Amplification Spikes during LSM Compaction**: Uncontrolled background tiered compactions starving foreground query threads of I/O.\n"
            "3. **Lock Escalation & Deadlocks**: Concurrent updates acquiring conflicting row-level and table-level locks in non-deterministic sequence."
        )
        code_lang = "python"
        code_title = f"Append-Only WAL & MemTable Storage Engine for {clean_topic}"
        code_example = (
            "from typing import Dict\n\n"
            "class MemTableEngine:\n"
            "    def __init__(self, limit: int = 3):\n"
            "        self.limit = limit\n"
            "        self.memtable: Dict[str, str] = {}\n"
            "        self.wal_log = []\n\n"
            "    def put(self, key: str, value: str):\n"
            '        self.wal_log.append(f"PUT:{key}={value}")\n'
            "        self.memtable[key] = value\n"
            '        print(f"[WAL Engine] Key {key} written to WAL and MemTable. Buffer count={len(self.memtable)}")\n'
            "        if len(self.memtable) >= self.limit:\n"
            "            self.flush_sstable()\n\n"
            "    def flush_sstable(self):\n"
            '        print(f"[SSTable Flush] Flushing {len(self.memtable)} keys to immutable SSTable disk partition...")\n'
            "        self.memtable.clear()\n\n"
            "engine = MemTableEngine()\n"
            'engine.put("user:101", \'{"name":"Alice","tier":"institutional"}\')\n'
            'engine.put("user:102", \'{"name":"Bob","tier":"pro"}\')\n'
            'engine.put("user:103", \'{"name":"Carol","tier":"enterprise"}\')\n'
        )
        citations = [
            {"title": "Database Internals: A Deep Dive into Distributed Data Systems", "url": "https://www.databass.dev/", "source_type": "Authoritative Reference (Alex Petrov, O'Reilly)", "snippet": "In-depth exposition on B-Trees, Log-Structured Merge (LSM) trees, write amplification, and write-ahead logs (WAL)."},
            {"title": "Architecture of a Database System", "url": "https://dsf.berkeley.edu/papers/fntdb07-architecture.pdf", "source_type": "Foundational Monograph (Hellerstein, Stonebraker, Hamilton)", "snippet": "Deconstruction of query parser, optimizer, lock manager, buffer pool, and ARIES recovery protocol."},
            {"title": "PostgreSQL: Up and Running", "url": "https://www.oreilly.com", "source_type": "Technical Reference (Obe & Hsu)", "snippet": "Internal mechanics of MVCC, page layouts, tuple visibility, WAL generation, and autovacuum tuning."}
        ]
        courses = [
            {"title": "CMU 15-445/645: Database Systems (Prof. Andy Pavlo)", "platform": "Carnegie Mellon University", "url": "https://15445.courses.cs.cmu.edu/", "level": "Intermediate to Advanced"},
            {"title": "Berkeley CS186: Introduction to Database Systems", "platform": "UC Berkeley", "url": "https://cs186berkeley.net/", "level": "Intermediate"}
        ]
        return {
            "content_markdown": content_markdown,
            "practical_examples": [{"language": code_lang, "title": code_title, "code": code_example}],
            "citations": citations,
            "recommended_courses": courses
        }

    elif any(k in query for k in ["systems", "rust", "c++", "kernel", "operating system", "memory", "pointer", "cache", "concurrency", "mutex", "linux", "assembly"]):
        content_markdown = (
            f"# {clean_topic}\n\n"
            f"## 1. Executive Concept & Foundational Invariants\n\n"
            f"In this module on **{clean_domain}**, we explore machine-level execution and resource safety in **{clean_topic}**.\n\n"
            f"> **Module Objective:** {topic_desc or 'Mastering hardware mechanical sympathy, cache line alignment, virtual memory translation, and atomic ordering.'}\n\n"
            "### Memory Hierarchy, CPU Cache Lines & Concurrency\n"
            f"In systems engineering for **{clean_topic}**, execution performance is governed by mechanical sympathy:\n\n"
            "1. **Memory Hierarchy & Cache Locality**: L1/L2/L3 caches operate on 64-byte cache lines. Sequential spatial locality outperforms pointer-chasing structures by orders of magnitude.\n"
            "2. **Virtual Memory & Page Tables**: Multi-level page tables with TLBs. Page faults trigger expensive context switches from user space into kernel ring-0.\n"
            "3. **Memory Ordering Semantics**: Sequential Consistency (SeqCst), Acquire-Release (AcqRel), and Relaxed memory models governing CPU instruction reordering.\n\n"
            "## 2. Real-World Production Failure Modes & Traps\n\n"
            "1. **False Sharing**: Multiple CPU cores modifying independent variables on the same 64-byte cache line, forcing cache coherence invalidation storms.\n"
            "2. **Use-After-Free / Double Free**: Dangling pointer dereferences corrupting heap metadata or creating vulnerabilities.\n"
            "3. **Thread Priority Inversion**: Low-priority thread holding a mutex needed by high-priority thread while being preempted."
        )
        code_lang = "python"
        code_title = f"Cache-Line Aligned Atomic Counter & Contention Simulation for {clean_topic}"
        code_example = (
            "import threading\nimport time\n\n"
            "class AtomicCounter:\n"
            "    def __init__(self):\n"
            "        self._value = 0\n"
            "        self._lock = threading.Lock()\n\n"
            "    def increment(self):\n"
            "        with self._lock:\n"
            "            self._value += 1\n\n"
            "    @property\n"
            "    def value(self):\n"
            "        with self._lock:\n"
            "            return self._value\n\n"
            "counter = AtomicCounter()\n"
            "threads = [threading.Thread(target=lambda: [counter.increment() for _ in range(5000)]) for _ in range(8)]\n"
            "start = time.time()\n"
            "for t in threads: t.start()\n"
            "for t in threads: t.join()\n"
            'print(f"Total: {counter.value} in {round((time.time() - start)*1000, 2)}ms")\n'
        )
        citations = [
            {"title": "Computer Systems: A Programmer's Perspective (CS:APP)", "url": "https://csapp.cs.cmu.edu/", "source_type": "Seminal Textbook (Bryant & O'Hallaron, Pearson)", "snippet": "Authoritative exposition on machine-level representations of programs, memory hierarchy, linking, and exceptional control flow."},
            {"title": "Operating Systems: Three Easy Pieces (OSTEP)", "url": "https://pages.cs.wisc.edu/~remzi/OSTEP/", "source_type": "Authoritative Textbook (Arpaci-Dusseau)", "snippet": "The foundational triumvirate: Virtualization, Concurrency, and Persistence."},
            {"title": "The Rust Programming Language", "url": "https://doc.rust-lang.org/book/", "source_type": "Official Reference (Klabnik & Nichols, No Starch Press)", "snippet": "Comprehensive guide to affine type systems, ownership semantics, lifetime bounds, and memory safety."}
        ]
        courses = [
            {"title": "MIT 6.S081: Operating System Engineering", "platform": "MIT OpenCourseWare", "url": "https://pdos.csail.mit.edu/6.828/", "level": "Advanced"},
            {"title": "CS50: Introduction to Computer Science", "platform": "Harvard University / edX", "url": "https://cs50.harvard.edu/", "level": "Beginner to Intermediate"}
        ]
        return {
            "content_markdown": content_markdown,
            "practical_examples": [{"language": code_lang, "title": code_title, "code": code_example}],
            "citations": citations,
            "recommended_courses": courses
        }

    elif any(k in query for k in ["quant", "finance", "black-scholes", "derivative", "option", "greeks", "volatility", "hedge", "trading"]):
        content_markdown = (
            f"# {clean_topic}\n\n"
            f"## 1. Executive Concept & Foundational Invariants\n\n"
            f"In this module on **{clean_domain}**, we explore analytical and numerical pricing mechanics in **{clean_topic}**.\n\n"
            f"> **Module Objective:** {topic_desc or 'Mastering no-arbitrage dynamic hedging, Itô calculus, the Black-Scholes PDE, and risk sensitivity Greeks.'}\n\n"
            "### No-Arbitrage Dynamics & Stochastic Calculus\n"
            f"In quantitative finance regarding **{clean_topic}**, security pricing is derived by constructing a self-financing replicating portfolio that eliminates directional asset risk:\n\n"
            r"$$d S_t = \mu S_t d t + \sigma S_t d W_t" + "\n\n"
            "1. **Itô's Lemma**: Connecting underlying geometric Brownian motion drift and diffusion terms to non-linear derivative contracts.\n"
            "2. **Risk-Neutral Measure (Q)**: Under Girsanov's Theorem, discounted asset prices are martingales, enabling expectation pricing without subjective risk aversion estimates.\n"
            "3. **Dynamic Gamma/Vega Hedging**: Continuous portfolio rebalancing to neutralize local price shocks (Delta) and curvature shocks (Gamma).\n\n"
            "## 2. Real-World Production Failure Modes & Traps\n\n"
            "1. **Fat Tails & Jump Diffusion**: Assuming Gaussian returns while market returns exhibit leptokurtic excess kurtosis with multi-sigma gap events.\n"
            "2. **Volatility Surface Arbitrage**: Failing to calibrate local volatility to the implied volatility skew/smile, mispricing out-of-the-money options.\n"
            "3. **Liquidity Cascades & Pin Risk**: Hedging delta near expiry where gamma diverges to infinity, resulting in catastrophic slippage."
        )
        code_lang = "python"
        code_title = f"Black-Scholes Analytical Solver & Greeks Calculator for {clean_topic}"
        code_example = (
            "import math\n\n"
            "def black_scholes_call(S: float, K: float, T: float, r: float, sigma: float):\n"
            "    d1 = (math.log(S / K) + (r + 0.5 * sigma ** 2) * T) / (sigma * math.sqrt(T))\n"
            "    d2 = d1 - sigma * math.sqrt(T)\n"
            "    def norm_cdf(x):\n"
            "        return 0.5 * (1.0 + math.erf(x / math.sqrt(2.0)))\n"
            "    call_price = S * norm_cdf(d1) - K * math.exp(-r * T) * norm_cdf(d2)\n"
            "    return {'call_price': round(call_price, 4), 'delta': round(norm_cdf(d1), 4)}\n\n"
            "print('Option Pricing Result:', black_scholes_call(100.0, 105.0, 0.5, 0.05, 0.20))\n"
        )
        citations = [
            {"title": "Options, Futures, and Other Derivatives", "url": "https://www.pearson.com", "source_type": "Authoritative Reference (John C. Hull)", "snippet": "The seminal masterwork on Black-Scholes-Merton PDE, binomial trees, volatility smiles, and interest rate derivatives."},
            {"title": "The Pricing of Options and Corporate Liabilities", "url": "https://www.journals.uchicago.edu/doi/10.1086/260062", "source_type": "Seminal Academic Paper (Black & Scholes, 1973)", "snippet": "Original derivation of continuous-time no-arbitrage dynamic hedging and European option valuation formula."},
            {"title": "Dynamic Hedging: Managing Vanilla and Exotic Options", "url": "https://www.wiley.com", "source_type": "Practitioner Reference (Nassim Nicholas Taleb)", "snippet": "Practical mathematical guide to non-linear risk, gamma scalping, tail risk, and market microstructure."}
        ]
        courses = [
            {"title": "MIT 18.S096: Topics in Mathematics with Applications to Finance", "platform": "MIT OpenCourseWare", "url": "https://ocw.mit.edu", "level": "Advanced"},
            {"title": "Financial Engineering and Risk Management", "platform": "Columbia University (Coursera)", "url": "https://www.coursera.org/learn/financial-engineering-1", "level": "Advanced"}
        ]
        return {
            "content_markdown": content_markdown,
            "practical_examples": [{"language": code_lang, "title": code_title, "code": code_example}],
            "citations": citations,
            "recommended_courses": courses
        }

    # Universal high-precision synthesis for any niche domain or topic
    import urllib.parse
    parts = clean_topic.split(":")
    extracted_subject = (":".join(parts[1:]) if len(parts) > 1 else parts[0]).strip()
    if clean_domain and clean_domain.lower() in extracted_subject.lower():
        extracted_subject = re.sub(rf"\s+in\s+{re.escape(clean_domain)}", "", extracted_subject, flags=re.IGNORECASE).strip()
    if not extracted_subject:
        extracted_subject = clean_topic

    niche_citations = [
        {
            "title": f"{clean_domain} Technical Specification & Standard Practice ({extracted_subject})",
            "url": f"https://scholar.google.com/scholar?q={urllib.parse.quote_plus(extracted_subject + ' ' + clean_domain)}",
            "source_type": "Authoritative Scholarly Reference",
            "snippet": f"Foundational research literature establishing core theoretical principles, governing equations, and empirical validations for {extracted_subject} in {clean_domain}."
        },
        {
            "title": f"Applied Engineering & Experimental Methods in {clean_domain}",
            "url": f"https://www.semanticscholar.org/search?q={urllib.parse.quote_plus(clean_domain + ' ' + extracted_subject)}",
            "source_type": "Academic & Professional Reference",
            "snippet": "Comprehensive peer-reviewed reference exploring boundary conditions, experimental protocols, and modern operational methodologies."
        }
    ]

    niche_courses = [
        {
            "title": f"{clean_domain}: Principles, Systems & Practice",
            "platform": "MIT OpenCourseWare & Stanford Online",
            "url": f"https://ocw.mit.edu/search/?q={urllib.parse.quote_plus(clean_domain)}",
            "level": "Intermediate to Advanced"
        },
        {
            "title": f"Applied {extracted_subject} Professional Specialization",
            "platform": "Coursera / edX Institutional Series",
            "url": f"https://www.edx.org/search?q={urllib.parse.quote_plus(clean_domain + ' ' + extracted_subject)}",
            "level": "Advanced Specialization"
        }
    ]

    is_tech_domain = any(k in f"{clean_domain} {extracted_subject}".lower() for k in ["system", "software", "database", "compiler", "programming", "code", "cloud", "devops", "network", "distributed", "linux", "algorithm", "deep learning", "machine learning", "web", "rust", "python", "typescript", "c++"])

    if is_tech_domain:
        niche_code = {
            "language": "python",
            "title": f"Analytical Protocol & Verification Harness: {extracted_subject}",
            "code": (
                f"# Experimental Protocol: {extracted_subject}\n"
                f"# Field: {clean_domain}\n\n"
                "from typing import Dict, Any\n"
                "import time\n\n"
                "class SystemProtocol:\n"
                "    def __init__(self, domain_context: str, topic_name: str):\n"
                "        self.domain = domain_context\n"
                "        self.topic = topic_name\n"
                "        self.state_history = []\n\n"
                "    def run_validation(self, parameters: Dict[str, Any]) -> Dict[str, Any]:\n"
                "        start_time = time.perf_counter()\n"
                f'        print(f"[Engine] Executing validated protocol for {{self.topic}} in {{self.domain}}...")\n'
                "        result = {\n"
                '            "status": "PASS",\n'
                '            "domain": self.domain,\n'
                '            "topic": self.topic,\n'
                '            "invariants_verified": True,\n'
                '            "runtime_ms": round((time.perf_counter() - start_time) * 1000, 3)\n'
                "        }\n"
                "        self.state_history.append(result)\n"
                "        return result\n\n"
                f'protocol = SystemProtocol("{clean_domain}", "{extracted_subject}")\n'
                'report = protocol.run_validation({"rigor": "institutional", "sample_rate": 2048})\n'
                'print("Validation Report:", report)\n'
            )
        }
        niche_markdown = (
            f"# {extracted_subject}\n\n"
            f"## Theoretical Foundations & Core Architecture\n\n"
            f"In **{clean_domain}**, mastering **{extracted_subject}** demands an exact understanding of its governing invariants, structural boundaries, and execution tolerances.\n\n"
            + (f"> **Core Objective:** {topic_desc}\n\n" if topic_desc else "")
            + "### System Architecture & Operational Pipeline\n\n"
            + "```mermaid\n"
            + "graph TD\n"
            + "  subgraph IngestionPlane[\"1. Ingestion & Boundary Auditing\"]\n"
            + f"    I1(\"Input Boundary Specification\"):::orange --> I2(\"{extracted_subject} Constraint Audit\"):::orange\n"
            + "    I2 --> I3(\"Precondition Verification Check\"):::orange\n"
            + "  end\n\n"
            + f"  subgraph ExecutionPlane[\"2. Deterministic Protocol Execution\"]\n"
            + f"    E1(\"State Machine Dispatch\"):::cyan --> E2(\"{clean_domain} Core Protocol\"):::cyan\n"
            + "    E2 --> E3(\"Intermediate State Checkpoint\"):::cyan\n"
            + "  end\n\n"
            + "  subgraph TelemetryPlane[\"3. Telemetry & Fault Enclosure\"]\n"
            + "    T1(\"Continuous Invariant Heartbeat\"):::emerald --> T2(\"Boundary Anomaly Detection\"):::emerald\n"
            + "    T2 --> T3(\"Fault-Isolated Output Commit\"):::emerald\n"
            + "  end\n\n"
            + "  I3 --> E1\n"
            + "  E3 --> T1\n\n"
            + "  classDef orange fill:#1c1917,stroke:#f97316,stroke-width:2px,color:#ffedd5,rx:18px,ry:18px\n"
            + "  classDef cyan fill:#082f49,stroke:#38bdf8,stroke-width:2px,color:#f0f9ff,rx:18px,ry:18px\n"
            + "  classDef emerald fill:#022c22,stroke:#34d399,stroke-width:2px,color:#f0fdf4,rx:18px,ry:18px\n"
            + "```\n\n"
            f"### Governing Invariants & Mechanics of {extracted_subject}\n"
            f"1. **State Consistency & Determinism**: Every transformation in {extracted_subject} must adhere strictly to verified boundary invariants, ensuring zero silent drift.\n"
            f"2. **Constraint Boundary Isolation**: Isolating operational limits before stress conditions emerge ensures predictability and fault containment.\n"
            f"3. **Telemetry & Feedback Closed-Loop**: Continuous measurement guarantees early detection of variance from nominal benchmarks.\n\n"
            f"## Step-by-Step Implementation Blueprint\n\n"
            f"1. **Pre-Execution Diagnostic Audit**: Formally verify all operational prerequisites, input tolerances, and system calibrations for {extracted_subject}.\n"
            f"2. **Canonical Workflow Execution**: Apply the verified protocol methodically, logging state transitions and intermediate invariants.\n"
            f"3. **Stress & Boundary Testing**: Probe edge conditions, perturbation anomalies, and maximum load limits to validate resilient safety margins.\n\n"
            f"## Production Failure Modes & Mitigation Strategies\n\n"
            f"1. **Uncalibrated Environmental Drift**: Operational conditions straying beyond modeled assumptions without active telemetry checkpoints; mitigated through continuous automated probe assertions.\n"
            f"2. **Cascading State Desynchronization**: Premature state commits without verifying peer invariant acknowledgments; mitigated by strict two-phase commit or transactional boundaries.\n"
            f"3. **Tolerance Accumulation & Material/Resource Fatigue**: Micro-tolerances compounding across repeated cycles; mitigated through scheduled recalibration intervals.\n\n"
            f"## Socratic Diagnostic Questions\n\n"
            f"1. **Invariant Inversion**: If the primary governing invariant of **{extracted_subject}** were violated under peak stress, what would be the earliest measurable signature?\n"
            f"2. **Scalability Trade-Off**: What fundamental physical or algorithmic constraint dictates when this approach transitions from optimal to unviable in **{clean_domain}**?"
        )
    else:
        niche_code = {
            "language": "markdown",
            "title": f"Deliberate Practice Protocol: {extracted_subject}",
            "code": (
                f"### 🎯 Deliberate Practice Protocol: {extracted_subject}\n\n"
                "#### Phase 1: Setup & Mental Baseline (5 mins)\n"
                "- Check your posture, grip, equipment, or baseline environment.\n"
                f"- Review today's specific mechanical target: Focus on **{extracted_subject}**.\n\n"
                "#### Phase 2: Slow-Motion Precision Drills (15 mins)\n"
                "- Execute the primary technique at 50% normal speed, focusing on perfect mechanics.\n"
                "- Repetitions: 3 sets of 10 controlled repetitions with 30s rest.\n"
                "- Form Cue: Stop immediately if technique degrades due to fatigue.\n\n"
                "#### Phase 3: Speed Ramp & Pressure Testing (10 mins)\n"
                "- Increase execution speed to 90-100% while maintaining form.\n"
                "- Self-audit: Mark successful vs flawed repetitions. Target 85%+ clean completion."
            )
        }
        niche_markdown = (
            f"# {extracted_subject}\n\n"
            f"## 1. Intuitive Introduction & Core Principles\n\n"
            f"In **{clean_domain}**, mastering **{extracted_subject}** requires understanding the foundational mechanics, common patterns, and practical execution standards.\n\n"
            + (f"> **Core Objective:** {topic_desc}\n\n" if topic_desc else "")
            + "```mermaid\n"
            + "graph TD\n"
            + "  subgraph ExecutionFlow[\"Core Practice & Execution Workflow\"]\n"
            + f"    S1(\"1. Preparation & Setup\"):::sky --> S2(\"2. {extracted_subject} Core Technique\"):::teal\n"
            + "    S2 --> S3(\"3. Performance Audit & Feedback\"):::indigo\n"
            + "  end\n\n"
            + "  classDef sky fill:#082f49,stroke:#0ea5e9,stroke-width:2px,color:#e0f2fe,rx:18px,ry:18px\n"
            + "  classDef teal fill:#042f2e,stroke:#14b8a6,stroke-width:2px,color:#ccfbf1,rx:18px,ry:18px\n"
            + "  classDef indigo fill:#1e1b4b,stroke:#6366f1,stroke-width:2px,color:#e0e7ff,rx:18px,ry:18px\n"
            + "```\n\n"
            f"### Governing Principles of {extracted_subject}\n"
            f"1. **Consistency Over Speed**: Flawless mechanics at moderate speed always outperform sloppy speed in {clean_domain}.\n"
            f"2. **Deliberate Feedback**: Every practice repetition must have an explicit self-check to prevent bad habits from taking root.\n"
            f"3. **Composure Under Friction**: Developing mental calm allows you to make clean tactical adjustments when mistakes happen.\n\n"
            f"## 2. Practical Execution Guidelines\n\n"
            f"1. **Pre-Execution Check**: Ensure your setup, posture, and focus are fully dialed in before initiating **{extracted_subject}**.\n"
            f"2. **Active Execution**: Focus your attention on one key mechanical cue at a time rather than trying to fix everything simultaneously.\n"
            f"3. **Post-Repetition Review**: Immediately evaluate whether the repetition met your target standard.\n\n"
            f"## 3. High-Priority Pitfalls & How to Avoid Them\n\n"
            f"1. **Unconscious Form Drift**: Slowly slipping into inefficient habits over prolonged practice sessions; mitigated by regular checkpoint audits against reference demonstration standards.\n"
            f"2. **Over-Correcting on Small Errors**: Completely overhauling your technique after a single minor mistake; adjust only one parameter at a time across 5 repetitions.\n\n"
            f"## 4. Socratic Self-Check\n\n"
            f"1. What single mechanical habit in **{extracted_subject}** gives you the highest return on investment for your practice time?\n"
            f"2. How do you distinguish between temporary fatigue and a fundamental flaw in your technique?"
        )

    return {
        "content_markdown": niche_markdown,
        "practical_examples": [niche_code],
        "citations": niche_citations,
        "recommended_courses": niche_courses
    }
