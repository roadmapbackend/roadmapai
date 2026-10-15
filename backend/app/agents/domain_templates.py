"""
Domain Templates & Universal Adaptive Generators for Roadmap.ai
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
    return "general"

def generate_domain_days(domain_context: str, total_days: int) -> List[Dict[str, Any]]:
    category = classify_domain(domain_context)
    clean = domain_context.strip()
    
    # 1. Base syllabus templates by category
    if category == "data_science":
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

def generate_domain_topics(day_title: str, daily_hours: float, domain_context: str, day_number: int = 1) -> List[Dict[str, Any]]:
    clean_domain = domain_context.strip()
    # Strip leading "Day X: " from day_title if present
    clean_title = re.sub(r"^Day\s+\d+:\s*", "", day_title).strip()
    
    total_minutes = int(daily_hours * 60)
    topic_count = 2 if daily_hours <= 1.0 else 3 if daily_hours <= 3.0 else 4
    mins_per_topic = total_minutes // topic_count

    # Template themes derived dynamically from the day title and domain
    subtopic_templates = [
        (f"Foundations & Key Principles: {clean_title}",
         f"Deconstructing the core mechanisms, theoretical underpinnings, and mental models of {clean_title} in {clean_domain}."),
        (f"Applied Hands-On Drills & Workflow Execution",
         f"Structured practice exercises and practical step-by-step implementation for {clean_title}."),
        (f"Edge Cases, Boundary Conditions & Diagnostics",
         f"Identifying failure modes, common pitfalls, and verifying quality standards for {clean_title}."),
        (f"Integration Milestone & Mastery Synthesis",
         f"Consolidating today's learning into a verifiable micro-project and review milestone in {clean_domain}.")
    ]

    topics = []
    for idx in range(topic_count):
        suffix, desc = subtopic_templates[idx]
        topics.append({
            "topic_number": idx + 1,
            "title": f"Topic {idx + 1}: {suffix}",
            "description": desc,
            "estimated_minutes": mins_per_topic
        })
    return topics

def generate_domain_lesson(topic_title: str, domain_context: str, topic_desc: str) -> Dict[str, Any]:
    category = classify_domain(domain_context)
    clean_domain = domain_context.strip()
    clean_topic = re.sub(r"^Topic\s+\d+:\s*", "", topic_title).strip()

    # Determine programming vs non-programming representation
    is_code = category in ["data_science", "web_development", "devops_cloud"]

    content_markdown = (
        f"# {topic_title}\n\n"
        f"## 1. Conceptual Framework & Mental Models\n\n"
        f"In this masterclass module on **{clean_domain}**, we explore the foundational mechanics and critical mental models governing **{clean_topic}**.\n\n"
        f"### Core Architectural Pillars\n"
        f"- **First-Principles Rigor**: Ground intermediate techniques directly in the foundational invariants of {clean_domain}.\n"
        f"- **Deterministic State Transitions**: Ensure your workflow produces verifiable, reproducible outcomes across varying conditions.\n"
        f"- **Systematic Feedback Loops**: Isolate edge cases early through structured verification and rapid diagnostics.\n\n"
        f"## 2. In-Depth Technical & Theoretical Breakdown\n\n"
        f"Mastery in **{clean_domain}** demands deconstructing complex workflows into modular, verifiable components. "
        f"When approaching **{clean_topic}**, pay close attention to boundary constraints, operational trade-offs, and failure boundaries. "
        f"Avoid superficial memorization—focus instead on how state, signals, and materials flow through each stage of execution.\n\n"
        f"## 3. Step-by-Step Practical Methodology\n\n"
        f"1. **Audit Environment & Inputs**: Verify all preconditions, configurations, and baseline parameters before initiating work.\n"
        f"2. **Implement Primary Pathway**: Execute the canonical workflow cleanly, avoiding speculative abstractions or premature optimizations.\n"
        f"3. **Stress-Test Boundary Scenarios**: Introduce adversarial inputs, unexpected conditions, and measure how gracefully the system recovers.\n\n"
        f"## 4. Best Practices & Pitfalls to Avoid\n\n"
        f"1. **Never Bypass Baseline Auditing**: Unverified assumptions at the start compound into silent errors downstream.\n"
        f"2. **Maintain Strict Observability**: Instrument metrics, logs, or diagnostic checkpoints at every critical state transition.\n"
        f"3. **Refactor Iteratively**: Validate each milestone against objective performance criteria before progressing."
    )

    if is_code:
        if category == "data_science":
            code_lang = "python"
            code_title = f"Data Analytics Pipeline for {clean_topic}"
            code_example = (
                f"# Practical Implementation Pipeline for {clean_topic}\n"
                f"# Domain: {clean_domain}\n\n"
                "import numpy as np\n"
                "import pandas as pd\n\n"
                "# 1. Synthesize structured domain data matrix\n"
                "np.random.seed(42)\n"
                "data = pd.DataFrame({\n"
                "    'sample_id': [f'SMPL-{i:04d}' for i in range(1, 101)],\n"
                "    'feature_alpha': np.random.normal(loc=50, scale=12, size=100),\n"
                "    'feature_beta': np.random.exponential(scale=25, size=100),\n"
                "    'status_flag': np.random.choice(['optimal', 'review', 'escalate'], size=100, p=[0.7, 0.2, 0.1])\n"
                "})\n\n"
                "# 2. Vectorized cleaning and transformation\n"
                "valid_mask = data['feature_alpha'] > 30\n"
                "filtered_df = data.loc[valid_mask].copy()\n"
                "filtered_df['normalized_beta'] = (filtered_df['feature_beta'] - filtered_df['feature_beta'].mean()) / filtered_df['feature_beta'].std()\n\n"
                "# 3. Grouped summary diagnostics\n"
                "summary = filtered_df.groupby('status_flag')['normalized_beta'].agg(['count', 'mean', 'std'])\n"
                "print('=== SUMMARY METRICS ===')\n"
                "print(summary)\n"
            )
        elif category == "web_development":
            code_lang = "typescript"
            code_title = f"Modular Component Pipeline for {clean_topic}"
            code_example = (
                f"// Practical Component & State Pipeline for {clean_topic}\n"
                f"// Domain: {clean_domain}\n\n"
                "import { useState, useCallback, useEffect } from 'react';\n\n"
                "interface PipelineState<T> {\n"
                "  data: T | null;\n"
                "  isLoading: boolean;\n"
                "  error: string | null;\n"
                "}\n\n"
                "export function useDomainWorkflow<T>(endpoint: string) {\n"
                "  const [state, setState] = useState<PipelineState<T>>({\n"
                "    data: null,\n"
                "    isLoading: true,\n"
                "    error: null,\n"
                "  });\n\n"
                "  const executeStep = useCallback(async () => {\n"
                "    setState((prev) => ({ ...prev, isLoading: true, error: null }));\n"
                "    try {\n"
                "      const res = await fetch(endpoint);\n"
                "      if (!res.ok) throw new Error(`HTTP Error ${res.status}`);\n"
                "      const payload = (await res.json()) as T;\n"
                "      setState({ data: payload, isLoading: false, error: null });\n"
                "    } catch (err: any) {\n"
                "      setState({ data: null, isLoading: false, error: err.message || 'Operation failed' });\n"
                "    }\n"
                "  }, [endpoint]);\n\n"
                "  useEffect(() => {\n"
                "    executeStep();\n"
                "  }, [executeStep]);\n\n"
                "  return { ...state, retry: executeStep };\n"
                "}\n"
            )
        else:
            code_lang = "bash"
            code_title = f"Automated Infrastructure Script for {clean_topic}"
            code_example = (
                f"#!/usr/bin/env bash\n"
                f"# Practical Operational Automation for {clean_topic}\n"
                f"# Domain: {clean_domain}\n\n"
                "set -euo pipefail\n\n"
                "echo \"[+] Initializing environment check for ${clean_domain}...\"\n"
                "CONTAINER_TAG=\"v1.0.0\"\n"
                "LOG_FILE=\"/tmp/operation.log\"\n\n"
                "# Execute operational health verification\n"
                "if command -v docker >/dev/null 2>&1; then\n"
                "  echo \"[+] Container runtime detected. Auditing configuration...\"\n"
                "else\n"
                "  echo \"[-] Runtime missing. Bootstrapping dependencies...\"\n"
                "fi\n\n"
                "echo \"[+] Operational stage completed successfully at $(date)\" | tee -a \"$LOG_FILE\"\n"
            )
    elif category == "music_arts":
        code_lang = "text"
        code_title = f"Practical Applied Drill & Etude: {clean_topic}"
        code_example = (
            f"=== APPLIED PRACTICE PROTOCOL: {clean_topic} ===\n"
            f"Domain: {clean_domain}\n"
            f"Tempo: Start at 60 BPM, increase by 4 BPM upon 3 consecutive clean cycles.\n\n"
            "1. TECHNICAL WARM-UP (10 mins):\n"
            "   - Measure 1-4: Metronome-synchronized scalar articulation.\n"
            "   - Exercise: Alternate picking / fingerstroke alternation across adjacent strings/registers.\n"
            "   - Focus: Zero sympathetic tension in shoulders, wrist, and fretting hand.\n\n"
            "2. APPLIED ETUDE / HARMONIC EXERCISE (25 mins):\n"
            "   - Pattern: Root -> 3rd -> 5th -> 7th arpeggiation with voice leading.\n"
            "   - Fretboard/Keyboard: Position shifting with silent, frictionless lateral movement.\n"
            "   - Tone production: Keep dynamic level strictly uniform across string transitions.\n\n"
            "3. MUSICAL PHRASING & EVALUATION (15 mins):\n"
            "   - Add expressive vibrato on terminal sustained notes.\n"
            "   - Record a 60-second video/audio snippet and critique timing consistency.\n"
        )
    elif category == "science_math":
        code_lang = "python"
        code_title = f"Numerical Simulation & Analytical Solver for {clean_topic}"
        code_example = (
            f"# Analytical & Computational Protocol: {clean_topic}\n"
            f"# Domain: {clean_domain}\n\n"
            "import numpy as np\n\n"
            "# 1. Define governing physical constants & parameters\n"
            "time_steps = np.linspace(0, 10, 500)\n"
            "decay_constant = 0.35\n"
            "initial_amplitude = 100.0\n\n"
            "# 2. Solve governing differential relationship analytically\n"
            "amplitude_t = initial_amplitude * np.exp(-decay_constant * time_steps)\n\n"
            "# 3. Compute rate of change and critical thresholds\n"
            "rate_of_change = -decay_constant * amplitude_t\n"
            "half_life = np.log(2) / decay_constant\n\n"
            "print(f'Half-life threshold: {half_life:.4f} seconds')\n"
            "print(f'Final amplitude at t=10s: {amplitude_t[-1]:.4f}')\n"
        )
    elif category == "languages":
        code_lang = "text"
        code_title = f"Conversational Immersion & Linguistic Drills: {clean_topic}"
        code_example = (
            f"=== IMMERSION & SPEECH DRILL PROTOCOL: {clean_topic} ===\n"
            f"Language / Domain: {clean_domain}\n\n"
            "1. PHONETIC ARTICULATION DRILL (10 mins):\n"
            "   - Listen to 5 target vocabulary sentences read at native speed.\n"
            "   - Shadowing: Repeat each sentence concurrently, matching intonation and syllable stress.\n\n"
            "2. GRAMMAR & SUBSTITUTION DRILL (20 mins):\n"
            "   - Pattern: [Subject] + [Conjugated Verb] + [Temporal Adverb] + [Direct Object]\n"
            "   - Practice 10 variations altering person (1st, 2nd, 3rd) and tense (Present -> Past -> Future).\n\n"
            "3. SPONTANEOUS CIRCUMACTION EXERCISE (15 mins):\n"
            "   - Describe a target object or scenario without using the 3 most common keywords.\n"
            "   - Record your speech and verify natural connective transition words.\n"
        )
    elif category == "business_finance":
        code_lang = "python"
        code_title = f"Financial & Unit Economics Model: {clean_topic}"
        code_example = (
            f"# Strategic Financial & Unit Economics Model: {clean_topic}\n"
            f"# Domain: {clean_domain}\n\n"
            "def evaluate_unit_economics(cac: float, ltv: float, payback_months: float):\n"
            "    ltv_to_cac = ltv / cac if cac > 0 else 0\n"
            "    is_sustainable = ltv_to_cac >= 3.0 and payback_months <= 12.0\n"
            "    return {\n"
            "        'LTV_CAC_Ratio': round(ltv_to_cac, 2),\n"
            "        'Payback_Months': payback_months,\n"
            "        'Status': 'Healthy / Scalable' if is_sustainable else 'Review Acquisition Efficiency'\n"
            "    }\n\n"
            "# Run baseline cohort evaluation\n"
            "cohort_result = evaluate_unit_economics(cac=250.0, ltv=890.0, payback_months=8.5)\n"
            "print('Cohort Economics Analysis:', cohort_result)\n"
        )
    else:
        code_lang = "python"
        code_title = f"Standard Operating Workflow for {clean_topic}"
        code_example = (
            f"# Standard Operating Workflow: {clean_topic}\n"
            f"# Domain: {clean_domain}\n\n"
            "class DomainWorkflow:\n"
            "    def __init__(self, domain_name: str):\n"
            "        self.domain = domain_name\n"
            "        self.state = 'initialized'\n\n"
            "    def execute_stage(self, stage_name: str) -> dict:\n"
            "        # Execute verified pipeline stage\n"
            "        self.state = f'completed_{stage_name}'\n"
            "        return {'stage': stage_name, 'status': 'success', 'domain': self.domain}\n\n"
            f"workflow = DomainWorkflow('{clean_domain}')\n"
            f"result = workflow.execute_stage('{clean_topic[:20]}')\n"
            "print(result)\n"
        )

    # Citations curated by archetype
    if category == "data_science":
        citations = [
            {"title": "Python for Data Analysis (Wes McKinney)", "url": "https://wesmckinney.com/book/", "source_type": "Seminal Textbook", "snippet": "Authoritative guide on NumPy arrays, pandas DataFrames, and vectorized data wrangling."},
            {"title": "An Introduction to Statistical Learning (ISLR - James et al.)", "url": "https://www.statlearning.com/", "source_type": "Academic Reference", "snippet": "Foundational text covering regression, classification, cross-validation, and shrinkage methods."}
        ]
        courses = [
            {"title": "Applied Data Science with Python (University of Michigan)", "platform": "Coursera", "url": "https://www.coursera.org/specializations/data-science-python", "level": "Intermediate"},
            {"title": "Statistical Thinking for Data Science (Columbia University)", "platform": "edX", "url": "https://www.edx.org", "level": "Intermediate to Advanced"}
        ]
    elif category == "web_development":
        citations = [
            {"title": "React Official Documentation & Architecture Guide", "url": "https://react.dev", "source_type": "Official Specification", "snippet": "Authoritative reference on declarative state, component lifecycles, and reactive boundaries."},
            {"title": "MDN Web Docs: Web Performance & Standards", "url": "https://developer.mozilla.org/en-US/docs/Web/Performance", "source_type": "Standard Documentation", "snippet": "Comprehensive reference on browser render lifecycles, DOM performance, and network caching."}
        ]
        courses = [
            {"title": "Full Stack Open (University of Helsinki)", "platform": "University of Helsinki", "url": "https://fullstackopen.com/en/", "level": "Intermediate to Advanced"},
            {"title": "Frontend Masters: Professional Web Architecture", "platform": "Frontend Masters", "url": "https://frontendmasters.com", "level": "Advanced"}
        ]
    elif category == "devops_cloud":
        citations = [
            {"title": "Site Reliability Engineering (Beyer, Jones, Petoff, Murphy - Google)", "url": "https://sre.google/sre-book/table-of-contents/", "source_type": "Seminal Industry Book", "snippet": "Authoritative principles on distributed systems operations, SLAs, and automated failure recovery."},
            {"title": "The Phoenix Project: A Novel about IT & DevOps (Gene Kim et al.)", "url": "https://itrevolution.com", "source_type": "Seminal Industry Guide", "snippet": "Foundational management text establishing modern CI/CD flow and blameless post-mortem culture."}
        ]
        courses = [
            {"title": "Architecting with Google Cloud Platform / AWS", "platform": "Coursera", "url": "https://www.coursera.org", "level": "Intermediate"},
            {"title": "Introduction to Kubernetes (Linux Foundation)", "platform": "edX", "url": "https://www.edx.org", "level": "Intermediate"}
        ]
    elif category == "music_arts":
        citations = [
            {"title": "Pumping Nylon: Classical Guitarist's Technique Handbook (Scott Tennant)", "url": "https://alfred.com", "source_type": "Seminal Technical Manual", "snippet": "The definitive technique guide for fingerboard mechanics, nail shaping, and tone production."},
            {"title": "The Musician's Way: A Guide to Practice, Performance, and Wellness (Gerald Klickstein)", "url": "https://musiciansway.com", "source_type": "Academic Reference", "snippet": "Authoritative guide on deliberate practice, memorization, and performance anxiety management."}
        ]
        courses = [
            {"title": "Berklee College of Music: Guitar & Harmonic Fundamentals", "platform": "Coursera / Berklee", "url": "https://www.coursera.org/berklee", "level": "Beginner to Intermediate"},
            {"title": "Juilliard Open Learning Series", "platform": "Juilliard", "url": "https://www.juilliard.edu", "level": "Intermediate to Advanced"}
        ]
    elif category == "science_math":
        citations = [
            {"title": "The Feynman Lectures on Physics (Richard Feynman et al.)", "url": "https://www.feynmanlectures.caltech.edu/", "source_type": "Seminal Academic Work", "snippet": "Classic masterwork conveying deep physical intuition, mathematical formalism, and mental models."},
            {"title": "Principles of Mathematical Analysis (Walter Rudin)", "url": "https://mheducation.com", "source_type": "Standard Academic Reference", "snippet": "Rigorous foundational text establishing real analysis, topology, and calculus foundations."}
        ]
        courses = [
            {"title": "MIT OpenCourseWare: Classical & Modern Scientific Foundations", "platform": "MIT OCW", "url": "https://ocw.mit.edu", "level": "Advanced"},
            {"title": "Harvard Online: Quantitative Methods & Modeling", "platform": "edX / Harvard", "url": "https://www.edx.org/school/harvardx", "level": "Intermediate"}
        ]
    elif category == "languages":
        citations = [
            {"title": "Fluent Forever: How to Learn Any Language Fast (Gabriel Wyner)", "url": "https://fluent-forever.com", "source_type": "Seminal Linguistic Guide", "snippet": "Authoritative methodology on spaced repetition, phonetic ear training, and immersion."},
            {"title": "Common European Framework of Reference for Languages (CEFR Companion)", "url": "https://www.coe.int/en/web/common-european-framework-reference-languages", "source_type": "Official Standard", "snippet": "International standard defining language proficiency levels from A1 to C2."}
        ]
        courses = [
            {"title": "Language Immersion & Phonetic Masterclass", "platform": "Coursera", "url": "https://www.coursera.org", "level": "Beginner to Intermediate"},
            {"title": "Applied Linguistics & Foreign Language Pedagogy", "platform": "edX", "url": "https://www.edx.org", "level": "Intermediate"}
        ]
    elif category == "business_finance":
        citations = [
            {"title": "The Lean Startup (Eric Ries)", "url": "https://theleanstartup.com", "source_type": "Seminal Business Work", "snippet": "Authoritative methodology on validated learning, rapid experimentation, and iterative development."},
            {"title": "Corporate Finance (Berk & DeMarzo)", "url": "https://pearson.com", "source_type": "Standard Academic Reference", "snippet": "Comprehensive reference covering valuation, cash flow modeling, and cost of capital."}
        ]
        courses = [
            {"title": "Wharton Business Foundations Specialization", "platform": "Coursera / Wharton", "url": "https://www.coursera.org", "level": "Intermediate"},
            {"title": "Financial Accounting & Managerial Economics (Harvard Online)", "platform": "Harvard Business School Online", "url": "https://online.hbs.edu", "level": "Intermediate to Advanced"}
        ]
    else:
        citations = [
            {"title": f"The Authoritative Handbook & Guide to {clean_domain}", "url": "https://scholar.google.com", "source_type": "Seminal Reference", "snippet": f"Foundational literature defining core methodology, standard operating procedures, and best practices in {clean_domain}."},
            {"title": "Harvard / edX Professional Masterclass Series", "url": "https://www.edx.org", "source_type": "Academic Reference", "snippet": "Curated academic curriculum on systematic learning, critical analysis, and applied problem solving."}
        ]
        courses = [
            {"title": f"Mastering {clean_domain}: From Fundamentals to Production", "platform": "Coursera / edX", "url": "https://www.coursera.org", "level": "Intermediate"},
            {"title": "MIT OpenCourseWare Learning Library", "platform": "MIT OpenCourseWare", "url": "https://ocw.mit.edu", "level": "Advanced"}
        ]

    return {
        "content_markdown": content_markdown,
        "practical_examples": [
            {
                "language": code_lang,
                "title": code_title,
                "code": code_example
            }
        ],
        "citations": citations,
        "recommended_courses": courses
    }
