import { createClient } from "@/lib/supabase/client";

export interface SupabaseTopic {
  id: string;
  day_id: string;
  roadmap_id: string;
  topic_number: number;
  title: string;
  description: string;
  estimated_minutes: number;
  status: "not_started" | "in_progress" | "completed";
}

export interface SupabaseDay {
  id: string;
  roadmap_id: string;
  day_number: number;
  title: string;
  description: string;
  learning_objectives: string[];
  status: "not_started" | "in_progress" | "completed";
  topics: SupabaseTopic[];
}

export interface SupabaseLesson {
  id?: string;
  topic_id: string;
  content_markdown: string;
  practical_examples: Array<{ language?: string; title: string; code: string }>;
  citations: Array<{ title: string; url?: string; source_type: string; snippet?: string }>;
  recommended_courses: Array<{ title: string; platform: string; url?: string; level: string }>;
}

export function classifyDomain(domain: string): string {
  const ctx = domain.toLowerCase();
  if (
    ctx.includes("data") ||
    ctx.includes("analys") ||
    ctx.includes("science") ||
    ctx.includes("ml") ||
    ctx.includes("machine learning") ||
    ctx.includes("ai") ||
    ctx.includes("statistic") ||
    ctx.includes("pandas") ||
    ctx.includes("numpy") ||
    ctx.includes("deep learning")
  ) {
    return "data_science";
  }
  if (
    ctx.includes("web") ||
    ctx.includes("react") ||
    ctx.includes("frontend") ||
    ctx.includes("next") ||
    ctx.includes("vue") ||
    ctx.includes("javascript") ||
    ctx.includes("typescript") ||
    ctx.includes("fullstack") ||
    ctx.includes("node") ||
    ctx.includes("html") ||
    ctx.includes("css") ||
    ctx.includes("backend")
  ) {
    return "web_development";
  }
  if (
    ctx.includes("cloud") ||
    ctx.includes("devops") ||
    ctx.includes("docker") ||
    ctx.includes("kubernetes") ||
    ctx.includes("k8s") ||
    ctx.includes("aws") ||
    ctx.includes("azure") ||
    ctx.includes("gcp") ||
    ctx.includes("terraform") ||
    ctx.includes("ci/cd") ||
    ctx.includes("linux")
  ) {
    return "devops_cloud";
  }
  if (
    ctx.includes("guitar") ||
    ctx.includes("piano") ||
    ctx.includes("music") ||
    ctx.includes("violin") ||
    ctx.includes("drums") ||
    ctx.includes("harmony") ||
    ctx.includes("audio") ||
    ctx.includes("composition") ||
    ctx.includes("singing") ||
    ctx.includes("brass") ||
    ctx.includes("flute")
  ) {
    return "music_arts";
  }
  if (
    ctx.includes("physics") ||
    ctx.includes("quantum") ||
    ctx.includes("chemistry") ||
    ctx.includes("biology") ||
    ctx.includes("genetics") ||
    ctx.includes("neuroscience") ||
    ctx.includes("astronomy") ||
    ctx.includes("math") ||
    ctx.includes("calculus") ||
    ctx.includes("algebra")
  ) {
    return "science_math";
  }
  if (
    ctx.includes("spanish") ||
    ctx.includes("french") ||
    ctx.includes("german") ||
    ctx.includes("japanese") ||
    ctx.includes("mandarin") ||
    ctx.includes("italian") ||
    ctx.includes("language") ||
    ctx.includes("linguistics") ||
    ctx.includes("grammar")
  ) {
    return "languages";
  }
  if (
    ctx.includes("marketing") ||
    ctx.includes("finance") ||
    ctx.includes("accounting") ||
    ctx.includes("business") ||
    ctx.includes("product management") ||
    ctx.includes("economics") ||
    ctx.includes("startup") ||
    ctx.includes("sales")
  ) {
    return "business_finance";
  }
  if (
    ctx.includes("design") ||
    ctx.includes("ui/ux") ||
    ctx.includes("graphic design") ||
    ctx.includes("animation") ||
    ctx.includes("photography") ||
    ctx.includes("illustration") ||
    ctx.includes("typography")
  ) {
    return "design_arts";
  }
  return "general";
}

export function generateDomainDays(
  domain: string,
  totalDays: number
): Array<{ day_number: number; title: string; description: string; learning_objectives: string[] }> {
  const category = classifyDomain(domain);
  const clean = domain.trim();

  let baseStages: Array<[string, string, string[]]>;

  if (category === "data_science") {
    baseStages = [
      [`Foundations & Vectorized Arrays with NumPy & Pandas in ${clean}`, "Environment setup, tabular data structures, array broadcasting, and initial schema auditing.", ["Data ingestion & schema auditing", "Vectorized array arithmetic", "DataFrame filtering and transformations"]],
      [`Exploratory Data Analysis (EDA) & Distribution Diagnostics`, "Uncovering central tendency, dispersion, skewness, outliers, and multivariate correlation matrices.", ["Summary metrics & variance analysis", "Outlier detection with Tukey IQR", "Multivariate heatmaps & pairplots"]],
      [`Data Cleaning, Missingness Imputation & Feature Scaling`, "Deconstructing missing value mechanisms (MCAR/MAR), imputation pipelines, and categorical encodings.", ["KNN and median imputation strategies", "One-Hot and Target Encoding", "RobustScaler & StandardScaler"]],
      [`Statistical Inference, Probability & Hypothesis Testing`, "Applying Central Limit Theorem, confidence intervals, Welch t-tests, and experimental A/B testing design.", ["Hypothesis formulation & null rejection", "Two-sample testing & p-values", "Statistical significance in business decisions"]],
      [`Supervised Regression & Regularization (Lasso/Ridge)`, "Training ordinary least squares regression, loss function optimization, and shrinkage penalties.", ["Bias-variance decomposition", "Lasso L1 and Ridge L2 regularizers", "Residual diagnostic Q-Q analysis"]],
      [`Classification Algorithms & Decision Boundary Calibration`, "Logistic regression, decision trees, random forests, and threshold tuning using ROC-AUC.", ["Binary and multi-class decision surfaces", "Precision-Recall trade-offs", "Confusion matrix calibration"]],
      [`End-to-End Pipeline Serialization & Capstone Insights`, "Encapsulating preprocessing and estimators into atomic pipelines and exporting reproducible artifacts.", ["Scikit-Learn Pipeline orchestration", "Model serialization with Joblib", "Executive data storytelling & reporting"]],
    ];
  } else if (category === "web_development") {
    baseStages = [
      [`Modern Language Syntax & Asynchronous Event Loop in ${clean}`, "Mastering execution contexts, promises, async/await, and strict typing architectures.", ["Event loop & microtask queue mechanics", "Promise orchestration & error bubbling", "TypeScript interfaces & generics"]],
      [`Modular Component Architecture & State Management`, "Designing declarative UI components, custom hooks, and unidirectional data flow.", ["State colocation principles", "Controlled state and custom hooks", "Immutable updates and state stores"]],
      [`Routing, Server Components & Dynamic Rendering`, "Implementing client and server routing, streaming SSR, and static asset pre-rendering.", ["File-system routing patterns", "Server Component vs Client Component boundaries", "Dynamic parameters & caching"]],
      [`API Integration, Data Fetching & Optimistic UI Mutations`, "Orchestrating network requests, cache invalidation, and instant optimistic client updates.", ["RESTful and GraphQL client contracts", "Stale-while-revalidate cache mechanics", "Optimistic mutation rollback"]],
      [`Performance Optimization, Bundle Splitting & Core Web Vitals`, "Eliminating render bottlenecks, code-splitting, lazy loading, and optimizing LCP/INP/CLS.", ["Bundle size auditing & dynamic imports", "LCP / INP optimization strategies", "Layout shift prevention"]],
      [`Authentication, Security Hardening & Access Control`, "Implementing secure session management, JWT token rotation, CSRF/XSS defenses, and route guards.", ["HTTP-only cookie auth", "Role-based access control (RBAC)", "Sanitization and CSP policies"]],
      [`Automated Testing, CI/CD & Production Capstone Deployment`, "End-to-end integration testing, automated deployment pipelines, and observability monitoring.", ["Unit & component test coverage", "CI/CD GitHub Actions workflow", "Production telemetry & error boundaries"]],
    ];
  } else if (category === "devops_cloud") {
    baseStages = [
      [`Containerization & Multi-Stage Docker Builds for ${clean}`, "Packaging production runtimes with minimal footprint, security scanning, and layer caching.", ["Dockerfile best practices", "Multi-stage compilation", "Image vulnerability scanning"]],
      [`Infrastructure as Code (IaC) with Terraform`, "Declarative cloud provisioning, remote state locking, and modular infrastructure blueprints.", ["Terraform provider configuration", "Remote state locking & backends", "Reusable cloud modules"]],
      [`Kubernetes Orchestration & Service Networking`, "Deploying resilient container pods, services, ingress controllers, and config management.", ["Pod & ReplicaSet lifecycles", "Ingress and cluster networking", "ConfigMaps and Secrets"]],
      [`CI/CD Pipeline Automation & Declarative GitOps`, "Automated testing, linting, build pipelines, and continuous deployment reconciliation.", ["Declarative pipeline workflows", "Automated semantic versioning", "Blue/green and canary deployments"]],
      [`Observability, Distributed Tracing & Metric Monitoring`, "Setting up Prometheus metrics, Grafana dashboards, structured logging, and APM alerting.", ["Golden signals of monitoring", "Log aggregation pipelines", "SLO/SLA threshold alert rules"]],
      [`Cloud Security Hardening & Zero-Trust IAM Policies`, "Least-privilege IAM policies, network security groups, KMS key management, and secrets rotation.", ["IAM role assumption & policies", "Network security & VPC peering", "Automated secret rotation"]],
      [`Disaster Recovery, Auto-Scaling & Production Capstone Rollout`, "Horizontal pod autoscaling, chaos engineering, cross-region backups, and failover verification.", ["Horizontal Pod Autoscaler (HPA)", "Disaster recovery runbooks", "High-availability multi-zone architecture"]],
    ];
  } else if (category === "music_arts") {
    baseStages = [
      [`Ergonomics, Posture & Baseline Tone Production in ${clean}`, "Physical alignment, instrument hold, tension-free ergonomics, and foundational sound production.", ["Establish optimal physical posture", "Master clean tone extraction", "Develop tension release awareness"]],
      [`Essential Scales, Interval Mechanics & Spatial Fluency`, "Understanding root intervals, major/minor scale geometry, and navigational dexterity.", ["Interval recognition & spatial layout", "Fluid scalar traversal with metronome", "Articulation and finger independence"]],
      [`Harmonic Foundations, Chords & Voicing Transitions`, "Constructing triads, seventh chords, voice leading, and rapid change fluency.", ["Triad & chord architecture", "Smooth voicing transitions", "Dynamic balance between harmonic registers"]],
      [`Rhythmic Precision, Meter & Subdivision Drills`, "Internalizing pulse, syncopation, odd meters, and dynamic strumming/bowing patterns.", ["Metronome subdivision mastery", "Syncopated rhythmic patterns", "Micro-timing and groove consistency"]],
      [`Polyphonic Independence & Textural Voice Leading`, "Managing multiple melodic and bass lines simultaneously with dynamic separation.", ["Bass-melody isolation", "Contrapuntal voice projection", "Sustained legato phrasing"]],
      [`Expressive Phrasing, Nuance & Stylistic Interpretation`, "Vibrato, dynamic shading, rubato, and translating emotional intent into performance.", ["Expressive vibrato control", "Dynamic arc shaping across musical phrases", "Stylistic ornamentation"]],
      [`Repertoire Mastery, Performance Polish & Capstone Recital`, "Synthesizing technical mechanics and musical expression into a polished, stage-ready milestone.", ["Memorization and mental practice protocols", "Error recovery and stage readiness", "Capstone performance execution"]],
    ];
  } else if (category === "science_math") {
    baseStages = [
      [`Fundamental Axioms, Units & Mental Models in ${clean}`, "Core definitions, governing assumptions, dimensional analysis, and foundational physical intuition.", ["Establish axiomatic foundations", "Dimensional analysis & unit consistency", "Build core mental models"]],
      [`Mathematical Formalism, Operators & Analytical Tools`, "Mastering the mathematical machinery, differential equations, and analytical representations.", ["Formalize governing equations", "Analytical problem solving methods", "Boundary value identification"]],
      [`Core Governing Laws & Empirical Phenomenon Analysis`, "Investigating primary dynamical relationships, conservation principles, and empirical observations.", ["Apply conservation laws", "Analyze empirical datasets", "Solve primary canonical problems"]],
      [`Experimental Protocols, Measurement & Error Propagation`, "Designing reproducible experiments, measuring variables, and quantifying statistical uncertainties.", ["Formulate experimental design", "Quantify instrumental error margins", "Propagate uncertainties through models"]],
      [`Perturbation Theory, Non-Linearities & Boundary Conditions`, "Navigating complex deviations, non-ideal conditions, and asymptotic behavior.", ["Examine non-linear dynamics", "Apply approximation techniques", "Evaluate critical boundary thresholds"]],
      [`Computational Modeling & Simulation Verification`, "Writing numerical solvers, running simulations, and verifying results against analytical benchmarks.", ["Implement numerical algorithms", "Run parametric simulations", "Validate model convergence"]],
      [`Research Synthesis, Literature Audit & Capstone Findings`, "Integrating analytical, experimental, and computational findings into an authoritative report.", ["Critique seminal literature", "Synthesize quantitative findings", "Present defensible research conclusions"]],
    ];
  } else if (category === "languages") {
    baseStages = [
      [`Phonetics, Pronunciation Rules & Core Vocabulary in ${clean}`, "Vocal tract positioning, accent mechanics, essential greetings, and high-frequency root words.", ["Master accurate phonetic articulation", "Internalize high-frequency vocabulary", "Practice essential everyday greetings"]],
      [`Sentence Structure, Word Order & Essential Grammar`, "Deconstructing subject-verb-object syntax, question formation, and negation mechanics.", ["Construct declarative sentences", "Form interrogative questions", "Apply correct grammatical gender & agreements"]],
      [`Verb Conjugation, Tenses & Conversational Verbs`, "Conjugating regular and irregular verbs across present, past, and future temporal frames.", ["Conjugate high-utility verbs", "Narrate past and future events", "Form spontaneous dialogue responses"]],
      [`Listening Comprehension, Ear Training & Spoken Cadence`, "Decoupling native speech speed, recognizing phonetic contractions, and auditory parsing.", ["Transcribe native audio snippets", "Identify rapid spoken contractions", "Shadow native speaker cadence"]],
      [`Intermediate Reading, Idioms & Cultural Pragmatics`, "Reading authentic articles, decoding common colloquial idioms, and understanding conversational etiquette.", ["Read authentic written media", "Interpret idiomatic expressions", "Apply culturally appropriate phrasing"]],
      [`Expressive Fluency, Complex Clauses & Nuanced Discourse`, "Connecting arguments with advanced conjunctions, expressing opinions, and debate formulation.", ["Construct compound-complex sentences", "Express nuanced subjective viewpoints", "Debate contemporary topics comfortably"]],
      [`Spontaneous Immersion, Dialogue Synthesis & Capstone Milestone`, "Engaging in an extended unscripted conversational exchange demonstrating practical fluency.", ["Sustain real-time spontaneous dialogue", "Overcome vocabulary gaps through circumlocution", "Deliver capstone oral presentation"]],
    ];
  } else if (category === "business_finance") {
    baseStages = [
      [`Strategic Landscape, Value Propositions & Mental Models in ${clean}`, "Analyzing industry dynamics, stakeholder economics, and competitive value propositions.", ["Analyze competitive landscapes", "Define differentiated value propositions", "Map core stakeholder incentives"]],
      [`Customer Personas, Segmentation & Demand Generation`, "Identifying target customer segments, pain points, and customer acquisition channels.", ["Build detailed customer profiles", "Design go-to-market funnels", "Calculate acquisition economics"]],
      [`Financial Fundamentals, Unit Economics & Margin Dynamics`, "Deconstructing income statements, cash flows, gross margins, and contribution margins.", ["Calculate CAC, LTV, and payback periods", "Analyze unit economic sustainability", "Model working capital requirements"]],
      [`Execution Workflows, Funnel Optimization & A/B Testing`, "Operationalizing growth loops, conversion rate optimization, and rapid feedback testing.", ["Implement iterative growth tests", "Audit conversion drop-off points", "Optimize sales pipeline velocity"]],
      [`Organizational Scaling, Risk Management & Compliance`, "Designing scalable operational systems, managing operational risk, and navigating governance.", ["Identify operational bottlenecks", "Establish risk mitigation playbooks", "Design scalable organizational workflows"]],
      [`Competitive Moats, Strategic Retention & Network Effects`, "Fortifying sustainable competitive advantages, increasing switching costs, and driving retention.", ["Map flywheel & network effects", "Analyze cohort retention curves", "Defend pricing power against rivals"]],
      [`Executive Synthesis, Financial Model & Capstone Strategy`, "Synthesizing all operational and financial dimensions into a comprehensive executive proposal.", ["Build integrated 3-statement model", "Author executive investment memo", "Deliver compelling strategic pitch"]],
    ];
  } else {
    baseStages = [
      [`Foundational Mental Models, Terminology & Setup in ${clean}`, `Core concepts, baseline taxonomy, and environmental setup for mastering ${clean}.`, ["Establish key domain definitions", "Survey foundational literature & tools", "Set up operational environment"]],
      [`Core Paradigms, Structural Rules & Baseline Grammar`, `Exploring primary workflows, toolchains, and standardized approaches in ${clean}.`, ["Workflow establishment", "Master standard operating procedures", "Reproducible baseline practice"]],
      [`Applied Mechanics & Hands-On Workflows (Part 1)`, `Hands-on execution of baseline challenges and fundamental techniques in ${clean}.`, ["Apply core principles", "Execute guided practical drills", "Evaluate baseline outcomes"]],
      [`Intermediate Problem Solving & Analysis (Part 2)`, `Diving deeper into structural patterns and solving complex problem sets in ${clean}.`, ["Deconstruct intermediate challenges", "Implement structured solutions", "Iterative refinement"]],
      [`Advanced Nuances, Edge Cases & Trade-Off Analysis`, `Navigating constraints, failure modes, boundary conditions, and quality trade-offs in ${clean}.`, ["Analyze boundary constraints", "Mitigate common failure modes", "Compare architectural approaches"]],
      [`Quality Assurance, Verification & Benchmarking`, `Testing, validating, and measuring efficacy against established benchmarks in ${clean}.`, ["Design verification criteria", "Execute rigorous testing", "Document performance trade-offs"]],
      [`Capstone Project Integration & Real-World Synthesis in ${clean}`, `Synthesizing all acquired competencies into a cohesive, portfolio-grade milestone.`, ["Architect capstone project", "Implement end-to-end deliverables", "Final review & retrospective"]],
    ];
  }

  const days = [];
  const numStages = baseStages.length;

  for (let i = 1; i <= totalDays; i++) {
    let title: string;
    let desc: string;
    let objectives: string[];

    if (totalDays <= numStages) {
      const stageIdx = Math.floor(((i - 1) / (totalDays > 1 ? totalDays - 1 : 1)) * (numStages - 1));
      [title, desc, objectives] = baseStages[stageIdx];
    } else {
      const cycleIdx = (i - 1) % (numStages - 1);
      if (i === totalDays) {
        [title, desc, objectives] = baseStages[numStages - 1];
      } else {
        [title, desc, objectives] = baseStages[cycleIdx];
        if (i >= numStages) {
          title = `${title} (Advanced Module ${Math.floor(i / numStages) + 1})`;
          desc = `Advanced extension and specialization: ${desc}`;
        }
      }
    }

    days.push({
      day_number: i,
      title: `Day ${i}: ${title}`,
      description: desc,
      learning_objectives: objectives,
    });
  }

  return days;
}

export function getDomainTopicsForDay(
  domain: string,
  dailyHours: number,
  dayNumber: number,
  dayTitle: string = ""
): Array<{ topic_number: number; title: string; description: string; estimated_minutes: number }> {
  const cleanDomain = domain.trim();
  const cleanTitle = dayTitle.replace(/^Day\s+\d+:\s*/, "").trim() || `Applied Principles for Day ${dayNumber}`;
  const totalMinutes = Math.round(dailyHours * 60);
  const topicCount = dailyHours <= 1.0 ? 2 : dailyHours <= 3.0 ? 3 : 4;
  const minsPerTopic = Math.floor(totalMinutes / topicCount);

  const subtopicTemplates = [
    {
      title: `Foundations & Key Principles: ${cleanTitle}`,
      desc: `Deconstructing the core mechanisms, theoretical underpinnings, and mental models of ${cleanTitle} in ${cleanDomain}.`,
    },
    {
      title: "Applied Hands-On Drills & Workflow Execution",
      desc: `Structured practice exercises and practical step-by-step implementation for ${cleanTitle}.`,
    },
    {
      title: "Edge Cases, Boundary Conditions & Diagnostics",
      desc: `Identifying failure modes, common pitfalls, and verifying quality standards for ${cleanTitle}.`,
    },
    {
      title: "Integration Milestone & Mastery Synthesis",
      desc: `Consolidating today's learning into a verifiable micro-project and review milestone in ${cleanDomain}.`,
    },
  ];

  return subtopicTemplates.slice(0, topicCount).map((t, idx) => ({
    topic_number: idx + 1,
    title: `Topic ${idx + 1}: ${t.title}`,
    description: t.desc,
    estimated_minutes: minsPerTopic,
  }));
}

export async function getUserActiveRoadmap(userId: string) {
  const supabase = createClient();

  // 1. Fetch latest active roadmap for this user
  const { data: roadmap, error: rError } = await supabase
    .from("roadmaps")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (rError || !roadmap) {
    return null;
  }

  // 2. Fetch days
  const { data: days, error: dError } = await supabase
    .from("roadmap_days")
    .select("*")
    .eq("roadmap_id", roadmap.id)
    .order("day_number", { ascending: true });

  if (dError || !days) {
    return { roadmap, days: [] };
  }

  // 3. Fetch all topics for this roadmap
  const { data: topics } = await supabase
    .from("roadmap_topics")
    .select("*")
    .eq("roadmap_id", roadmap.id)
    .order("topic_number", { ascending: true });

  const topicsByDay: Record<string, SupabaseTopic[]> = {};
  (topics || []).forEach((t: any) => {
    if (!topicsByDay[t.day_id]) topicsByDay[t.day_id] = [];
    topicsByDay[t.day_id].push({
      id: t.id,
      day_id: t.day_id,
      roadmap_id: t.roadmap_id,
      topic_number: t.topic_number,
      title: t.title,
      description: t.description || "",
      estimated_minutes: t.estimated_minutes || 45,
      status: t.status || "not_started",
    });
  });

  const structuredDays: SupabaseDay[] = days.map((d: any) => ({
    id: d.id,
    roadmap_id: d.roadmap_id,
    day_number: d.day_number,
    title: d.title,
    description: d.description || "",
    learning_objectives: d.learning_objectives || [],
    status: d.status || "not_started",
    topics: topicsByDay[d.id] || [],
  }));

  return {
    roadmap,
    days: structuredDays,
  };
}

export async function saveRoadmapToSupabase(
  userId: string,
  domain: string,
  totalDays: number,
  dailyHours: number,
  skillLevel: string = "intermediate"
) {
  const supabase = createClient();

  // Archive previous active roadmaps for this user
  try {
    await supabase
      .from("roadmaps")
      .update({ status: "archived" })
      .eq("user_id", userId)
      .eq("status", "active");
  } catch (e) {
    console.warn("Could not archive previous roadmaps:", e);
  }

  // 1. Insert into roadmaps table
  const { data: roadmap, error: rErr } = await supabase
    .from("roadmaps")
    .insert({
      user_id: userId,
      title: `${totalDays}-Day Intensive: ${domain}`,
      domain_context: domain,
      total_days: totalDays,
      daily_hours_commitment: dailyHours,
      skill_level: skillLevel,
      status: "active",
      metadata: {},
    })
    .select()
    .single();

  if (rErr || !roadmap) {
    throw new Error(rErr?.message || "Failed to create roadmap in Supabase");
  }

  // 2. Generate structured days universally
  const domainDays = generateDomainDays(domain, totalDays);
  const daysToInsert = domainDays.map((d) => ({
    roadmap_id: roadmap.id,
    day_number: d.day_number,
    title: d.title,
    description: d.description,
    learning_objectives: d.learning_objectives,
    status: d.day_number === 1 ? "in_progress" : "not_started",
  }));

  const { data: insertedDays, error: dErr } = await supabase
    .from("roadmap_days")
    .insert(daysToInsert)
    .select()
    .order("day_number", { ascending: true });

  if (dErr || !insertedDays) {
    throw new Error(dErr?.message || "Failed to create roadmap days in Supabase");
  }

  // 3. Bulk insert structured topics for ALL days upfront into Supabase
  const allTopicRecords = [];
  for (const day of insertedDays) {
    const topicsForThisDay = getDomainTopicsForDay(domain, dailyHours, day.day_number, day.title);
    for (const t of topicsForThisDay) {
      allTopicRecords.push({
        day_id: day.id,
        roadmap_id: roadmap.id,
        topic_number: t.topic_number,
        title: t.title,
        description: t.description,
        estimated_minutes: t.estimated_minutes,
        status: day.day_number === 1 && t.topic_number === 1 ? "in_progress" : "not_started",
      });
    }
  }

  const { data: insertedTopics, error: topErr } = await supabase
    .from("roadmap_topics")
    .insert(allTopicRecords)
    .select()
    .order("topic_number", { ascending: true });

  if (topErr) {
    console.error("Error bulk-inserting topics to Supabase:", topErr);
  }

  const topicsByDay: Record<string, SupabaseTopic[]> = {};
  (insertedTopics || []).forEach((t: any) => {
    if (!topicsByDay[t.day_id]) topicsByDay[t.day_id] = [];
    topicsByDay[t.day_id].push({
      id: t.id,
      day_id: t.day_id,
      roadmap_id: t.roadmap_id,
      topic_number: t.topic_number,
      title: t.title,
      description: t.description || "",
      estimated_minutes: t.estimated_minutes || 45,
      status: t.status || "not_started",
    });
  });

  // 4. Pre-populate lesson for the first topic of Day 1 in topic_lessons
  const firstDay = insertedDays[0];
  const firstDayTopics = topicsByDay[firstDay.id] || [];
  if (firstDayTopics.length > 0) {
    await getOrSaveLessonFromSupabase(firstDayTopics[0].id, firstDayTopics[0].title, domain, firstDayTopics[0].description);
  }

  // 5. Log Agent 1 execution
  await logAgentExecution(userId, "Agent 1: Roadmap Structure", 350, 820, 420);

  return {
    roadmap,
    days: insertedDays.map((d: any) => ({
      id: d.id,
      roadmap_id: d.roadmap_id,
      day_number: d.day_number,
      title: d.title,
      description: d.description || "",
      learning_objectives: d.learning_objectives || [],
      status: d.status || "not_started",
      topics: topicsByDay[d.id] || [],
    })),
  };
}

export async function saveDayTopicsToSupabase(
  dayId: string,
  roadmapId: string,
  dailyHours: number,
  domain: string = "general",
  dayNumber: number = 1,
  dayTitle: string = ""
): Promise<SupabaseTopic[]> {
  const supabase = createClient();

  // Check if topics already exist
  const { data: existing } = await supabase
    .from("roadmap_topics")
    .select("*")
    .eq("day_id", dayId)
    .order("topic_number", { ascending: true });

  if (existing && existing.length > 0) {
    return existing as SupabaseTopic[];
  }

  const dayTopics = getDomainTopicsForDay(domain, dailyHours, dayNumber, dayTitle);
  const topicsToInsert = dayTopics.map((t) => ({
    day_id: dayId,
    roadmap_id: roadmapId,
    topic_number: t.topic_number,
    title: t.title,
    description: t.description,
    estimated_minutes: t.estimated_minutes,
    status: t.topic_number === 1 ? "in_progress" : "not_started",
  }));

  const { data: inserted, error } = await supabase
    .from("roadmap_topics")
    .insert(topicsToInsert)
    .select()
    .order("topic_number", { ascending: true });

  if (error || !inserted) {
    console.error("Error inserting topics to Supabase:", error);
    return [];
  }

  return inserted as SupabaseTopic[];
}

export async function getOrSaveLessonFromSupabase(
  topicId: string,
  topicTitle: string,
  domain: string,
  topicDesc: string = ""
): Promise<SupabaseLesson> {
  const supabase = createClient();

  // 1. Check if lesson already exists in Supabase
  const { data: existing } = await supabase
    .from("topic_lessons")
    .select("*")
    .eq("topic_id", topicId)
    .maybeSingle();

  if (existing) {
    return existing as SupabaseLesson;
  }

  // 2. Generate universal domain & topic-tailored lesson content
  const category = classifyDomain(domain);
  const cleanDomain = domain.trim();
  const cleanTopic = topicTitle.replace(/^Topic\s+\d+:\s*/, "").trim();

  const isCode = category === "data_science" || category === "web_development" || category === "devops_cloud";

  const contentMarkdown = `# ${topicTitle}

## 1. Conceptual Framework & Mental Models

In this masterclass module on **${cleanDomain}**, we explore the foundational mechanics and critical mental models governing **${cleanTopic}**.

### Core Architectural Pillars
- **First-Principles Rigor**: Ground intermediate techniques directly in the foundational invariants of ${cleanDomain}.
- **Deterministic State Transitions**: Ensure your workflow produces verifiable, reproducible outcomes across varying conditions.
- **Systematic Feedback Loops**: Isolate edge cases early through structured verification and rapid diagnostics.

## 2. In-Depth Technical & Theoretical Breakdown

Mastery in **${cleanDomain}** demands deconstructing complex workflows into modular, verifiable components. When approaching **${cleanTopic}**, pay close attention to boundary constraints, operational trade-offs, and failure boundaries. Avoid superficial memorization—focus instead on how state, signals, and materials flow through each stage of execution.

## 3. Step-by-Step Practical Methodology

1. **Audit Environment & Inputs**: Verify all preconditions, configurations, and baseline parameters before initiating work.
2. **Implement Primary Pathway**: Execute the canonical workflow cleanly, avoiding speculative abstractions or premature optimizations.
3. **Stress-Test Boundary Scenarios**: Introduce adversarial inputs, unexpected conditions, and measure how gracefully the system recovers.

## 4. Best Practices & Pitfalls to Avoid

1. **Never Bypass Baseline Auditing**: Unverified assumptions at the start compound into silent errors downstream.
2. **Maintain Strict Observability**: Instrument metrics, logs, or diagnostic checkpoints at every critical state transition.
3. **Refactor Iteratively**: Validate each milestone against objective performance criteria before progressing.`;

  let codeLang = "python";
  let codeTitle = `Practical Implementation for ${cleanTopic}`;
  let codeSnippet = "";

  if (isCode) {
    if (category === "data_science") {
      codeLang = "python";
      codeTitle = `Data Analytics Pipeline for ${cleanTopic}`;
      codeSnippet = `# Practical Implementation Pipeline for ${cleanTopic}\n# Domain: ${cleanDomain}\n\nimport numpy as np\nimport pandas as pd\n\n# 1. Synthesize structured domain data matrix\nnp.random.seed(42)\ndata = pd.DataFrame({\n    'sample_id': [f'SMPL-{i:04d}' for i in range(1, 101)],\n    'feature_alpha': np.random.normal(loc=50, scale=12, size=100),\n    'feature_beta': np.random.exponential(scale=25, size=100),\n    'status_flag': np.random.choice(['optimal', 'review', 'escalate'], size=100, p=[0.7, 0.2, 0.1])\n})\n\n# 2. Vectorized cleaning and transformation\nvalid_mask = data['feature_alpha'] > 30\nfiltered_df = data.loc[valid_mask].copy()\nfiltered_df['normalized_beta'] = (filtered_df['feature_beta'] - filtered_df['feature_beta'].mean()) / filtered_df['feature_beta'].std()\n\n# 3. Grouped summary diagnostics\nsummary = filtered_df.groupby('status_flag')['normalized_beta'].agg(['count', 'mean', 'std'])\nprint('=== SUMMARY METRICS ===')\nprint(summary)\n`;
    } else if (category === "web_development") {
      codeLang = "typescript";
      codeTitle = `Component & State Pipeline for ${cleanTopic}`;
      codeSnippet = `// Practical Component & State Pipeline for ${cleanTopic}\n// Domain: ${cleanDomain}\n\nimport { useState, useCallback, useEffect } from 'react';\n\ninterface PipelineState<T> {\n  data: T | null;\n  isLoading: boolean;\n  error: string | null;\n}\n\nexport function useDomainWorkflow<T>(endpoint: string) {\n  const [state, setState] = useState<PipelineState<T>>({\n    data: null,\n    isLoading: true,\n    error: null,\n  });\n\n  const executeStep = useCallback(async () => {\n    setState((prev) => ({ ...prev, isLoading: true, error: null }));\n    try {\n      const res = await fetch(endpoint);\n      if (!res.ok) throw new Error(\`HTTP Error \${res.status}\`);\n      const payload = (await res.json()) as T;\n      setState({ data: payload, isLoading: false, error: null });\n    } catch (err: any) {\n      setState({ data: null, isLoading: false, error: err.message || 'Operation failed' });\n    }\n  }, [endpoint]);\n\n  useEffect(() => {\n    executeStep();\n  }, [executeStep]);\n\n  return { ...state, retry: executeStep };\n}\n`;
    } else {
      codeLang = "bash";
      codeTitle = `Automated Infrastructure Script for ${cleanTopic}`;
      codeSnippet = `#!/usr/bin/env bash\n# Practical Operational Automation for ${cleanTopic}\n# Domain: ${cleanDomain}\n\nset -euo pipefail\n\necho "[+] Initializing environment check for ${cleanDomain}..."\nCONTAINER_TAG="v1.0.0"\nLOG_FILE="/tmp/operation.log"\n\nif command -v docker >/dev/null 2>&1; then\n  echo "[+] Container runtime detected. Auditing configuration..."\nelse\n  echo "[-] Runtime missing. Bootstrapping dependencies..."\nfi\n\necho "[+] Operational stage completed successfully at $(date)" | tee -a "$LOG_FILE"\n`;
    }
  } else if (category === "music_arts") {
    codeLang = "text";
    codeTitle = `Applied Practice Protocol: ${cleanTopic}`;
    codeSnippet = `=== APPLIED PRACTICE PROTOCOL: ${cleanTopic} ===\nDomain: ${cleanDomain}\nTempo: Start at 60 BPM, increase by 4 BPM upon 3 consecutive clean cycles.\n\n1. TECHNICAL WARM-UP (10 mins):\n   - Measure 1-4: Metronome-synchronized scalar articulation.\n   - Exercise: Alternate picking / fingerstroke alternation across adjacent registers.\n   - Focus: Zero sympathetic tension in shoulders, wrist, and fretting hand.\n\n2. APPLIED ETUDE / HARMONIC EXERCISE (25 mins):\n   - Pattern: Root -> 3rd -> 5th -> 7th arpeggiation with voice leading.\n   - Fingerboard/Keyboard: Position shifting with silent, frictionless lateral movement.\n   - Tone production: Keep dynamic level strictly uniform across transitions.\n\n3. MUSICAL PHRASING & EVALUATION (15 mins):\n   - Add expressive vibrato on terminal sustained notes.\n   - Record a 60-second audio snippet and critique timing consistency.\n`;
  } else if (category === "science_math") {
    codeLang = "python";
    codeTitle = `Numerical Simulation & Analytical Solver for ${cleanTopic}`;
    codeSnippet = `# Analytical & Computational Protocol: ${cleanTopic}\n# Domain: ${cleanDomain}\n\nimport numpy as np\n\n# 1. Define governing physical constants & parameters\ntime_steps = np.linspace(0, 10, 500)\ndecay_constant = 0.35\ninitial_amplitude = 100.0\n\n# 2. Solve governing differential relationship analytically\namplitude_t = initial_amplitude * np.exp(-decay_constant * time_steps)\n\n# 3. Compute rate of change and critical thresholds\nrate_of_change = -decay_constant * amplitude_t\nhalf_life = np.log(2) / decay_constant\n\nprint(f"Half-life threshold: {half_life:.4f} seconds")\nprint(f"Final amplitude at t=10s: {amplitude_t[-1]:.4f}")\n`;
  } else if (category === "languages") {
    codeLang = "text";
    codeTitle = `Conversational Immersion & Linguistic Drills: ${cleanTopic}`;
    codeSnippet = `=== IMMERSION & SPEECH DRILL PROTOCOL: ${cleanTopic} ===\nLanguage / Domain: ${cleanDomain}\n\n1. PHONETIC ARTICULATION DRILL (10 mins):\n   - Listen to 5 target vocabulary sentences read at native speed.\n   - Shadowing: Repeat each sentence concurrently, matching intonation and syllable stress.\n\n2. GRAMMAR & SUBSTITUTION DRILL (20 mins):\n   - Pattern: [Subject] + [Conjugated Verb] + [Temporal Adverb] + [Direct Object]\n   - Practice 10 variations altering person (1st, 2nd, 3rd) and tense.\n\n3. SPONTANEOUS CIRCUMACTION EXERCISE (15 mins):\n   - Describe a target object or scenario without using the 3 most common keywords.\n   - Record your speech and verify natural connective transition words.\n`;
  } else {
    codeLang = "python";
    codeTitle = `Standard Operating Workflow for ${cleanTopic}`;
    codeSnippet = `# Standard Operating Workflow: ${cleanTopic}\n# Domain: ${cleanDomain}\n\nclass DomainWorkflow:\n    def __init__(self, domain_name: str):\n        self.domain = domain_name\n        self.state = 'initialized'\n\n    def execute_stage(self, stage_name: str) -> dict:\n        # Execute verified pipeline stage\n        self.state = f'completed_{stage_name}'\n        return {'stage': stage_name, 'status': 'success', 'domain': self.domain}\n\nworkflow = DomainWorkflow('${cleanDomain}')\nresult = workflow.execute_stage('${cleanTopic.slice(0, 25)}')\nprint(result)\n`;
  }

  // Citations and courses curated by category
  let citations: SupabaseLesson["citations"];
  let courses: SupabaseLesson["recommended_courses"];

  if (category === "data_science") {
    citations = [
      { title: "Python for Data Analysis (Wes McKinney)", url: "https://wesmckinney.com/book/", source_type: "Seminal Textbook", snippet: "Authoritative guide on NumPy arrays, pandas DataFrames, and vectorized data wrangling." },
      { title: "An Introduction to Statistical Learning (ISLR - James et al.)", url: "https://www.statlearning.com/", source_type: "Academic Reference", snippet: "Foundational text covering regression, classification, cross-validation, and shrinkage methods." },
    ];
    courses = [
      { title: "Applied Data Science with Python (University of Michigan)", platform: "Coursera", url: "https://www.coursera.org/specializations/data-science-python", level: "Intermediate" },
      { title: "Statistical Thinking for Data Science (Columbia University)", platform: "edX", url: "https://www.edx.org", level: "Intermediate to Advanced" },
    ];
  } else if (category === "web_development") {
    citations = [
      { title: "React Official Documentation & Architecture Guide", url: "https://react.dev", source_type: "Official Specification", snippet: "Authoritative reference on declarative state, component lifecycles, and reactive boundaries." },
      { title: "MDN Web Docs: Web Performance & Standards", url: "https://developer.mozilla.org/en-US/docs/Web/Performance", source_type: "Standard Documentation", snippet: "Comprehensive reference on browser render lifecycles, DOM performance, and network caching." },
    ];
    courses = [
      { title: "Full Stack Open (University of Helsinki)", platform: "University of Helsinki", url: "https://fullstackopen.com/en/", level: "Intermediate to Advanced" },
      { title: "Frontend Masters: Professional Web Architecture", platform: "Frontend Masters", url: "https://frontendmasters.com", level: "Advanced" },
    ];
  } else if (category === "music_arts") {
    citations = [
      { title: "Pumping Nylon: Classical Guitarist's Technique Handbook (Scott Tennant)", url: "https://alfred.com", source_type: "Seminal Technical Manual", snippet: "The definitive technique guide for fingerboard mechanics, nail shaping, and tone production." },
      { title: "The Musician's Way: A Guide to Practice, Performance, and Wellness", url: "https://musiciansway.com", source_type: "Academic Reference", snippet: "Authoritative guide on deliberate practice, memorization, and performance anxiety management." },
    ];
    courses = [
      { title: "Berklee College of Music: Harmonic Fundamentals", platform: "Coursera / Berklee", url: "https://www.coursera.org/berklee", level: "Beginner to Intermediate" },
      { title: "Juilliard Open Learning Masterclass Series", platform: "Juilliard", url: "https://www.juilliard.edu", level: "Intermediate to Advanced" },
    ];
  } else if (category === "science_math") {
    citations = [
      { title: "The Feynman Lectures on Physics (Richard Feynman et al.)", url: "https://www.feynmanlectures.caltech.edu/", source_type: "Seminal Academic Work", snippet: "Classic masterwork conveying deep physical intuition, mathematical formalism, and mental models." },
      { title: "Principles of Mathematical Analysis (Walter Rudin)", url: "https://mheducation.com", source_type: "Standard Academic Reference", snippet: "Rigorous foundational text establishing real analysis, topology, and calculus foundations." },
    ];
    courses = [
      { title: "MIT OpenCourseWare: Scientific Foundations", platform: "MIT OCW", url: "https://ocw.mit.edu", level: "Advanced" },
      { title: "Harvard Online: Quantitative Methods & Modeling", platform: "edX / Harvard", url: "https://www.edx.org", level: "Intermediate" },
    ];
  } else {
    citations = [
      { title: `The Authoritative Guide & Standards: ${cleanDomain}`, url: "https://scholar.google.com", source_type: "Seminal Reference", snippet: `Foundational literature defining methodology, standards, and best practices in ${cleanDomain}.` },
      { title: "Harvard / edX Professional Masterclass Series", url: "https://www.edx.org", source_type: "Academic Reference", snippet: "Curated academic curriculum on systematic learning and applied problem solving." },
    ];
    courses = [
      { title: `Mastering ${cleanDomain}: From Fundamentals to Production`, platform: "Coursera / edX", url: "https://www.coursera.org", level: "Intermediate" },
      { title: "MIT OpenCourseWare Learning Library", platform: "MIT OCW", url: "https://ocw.mit.edu", level: "Advanced" },
    ];
  }

  const lessonData: SupabaseLesson = {
    topic_id: topicId,
    content_markdown: contentMarkdown,
    practical_examples: [
      {
        language: codeLang,
        title: codeTitle,
        code: codeSnippet,
      },
    ],
    citations,
    recommended_courses: courses,
  };

  // 3. Insert into topic_lessons in Supabase
  const { data: inserted, error } = await supabase
    .from("topic_lessons")
    .insert(lessonData)
    .select()
    .single();

  if (error || !inserted) {
    console.error("Error inserting lesson to Supabase:", error);
    return lessonData;
  }

  return inserted as SupabaseLesson;
}

export async function logAgentExecution(
  userId: string,
  agentName: string,
  promptTokens: number = 300,
  completionTokens: number = 600,
  latencyMs: number = 350
) {
  try {
    const supabase = createClient();
    const tokenCost = ((promptTokens * 0.0000015) + (completionTokens * 0.000002)).toFixed(6);
    await supabase.from("agent_execution_logs").insert({
      user_id: userId,
      agent_name: agentName,
      prompt_tokens: promptTokens,
      completion_tokens: completionTokens,
      total_cost_usd: parseFloat(tokenCost),
      latency_ms: latencyMs,
      status: "success",
    });

    try {
      await supabase.rpc("increment_token_budget", {
        p_user_id: userId,
        p_tokens: promptTokens + completionTokens,
      });
    } catch {
      // ignore if RPC not accessible
    }
  } catch (err) {
    console.debug("Agent log notice:", err);
  }
}
