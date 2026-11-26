import { createClient } from "@/lib/supabase/client";
import { synthesizeResearchedLesson } from "@/lib/knowledge-engine";
import { NO_USAGE, addUsage, parseUsage, totalTokens, type TokenUsage } from "@/lib/usage";

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
  if (
    ctx.includes("bgmi") ||
    ctx.includes("battlegrounds") ||
    ctx.includes("pubg") ||
    ctx.includes("valorant") ||
    ctx.includes("csgo") ||
    ctx.includes("cs:go") ||
    ctx.includes("counter-strike") ||
    ctx.includes("fortnite") ||
    ctx.includes("apex") ||
    ctx.includes("cod") ||
    ctx.includes("call of duty") ||
    ctx.includes("warzone") ||
    ctx.includes("league of legends") ||
    ctx.includes("lol") ||
    ctx.includes("dota") ||
    ctx.includes("overwatch") ||
    ctx.includes("rocket league") ||
    ctx.includes("rainbow six") ||
    ctx.includes("r6") ||
    ctx.includes("free fire") ||
    ctx.includes("gaming") ||
    ctx.includes("esports") ||
    ctx.includes("gameplay") ||
    ctx.includes("battle royale") ||
    ctx.includes("fps") ||
    ctx.includes("moba") ||
    ctx.includes("chess") ||
    ctx.includes("speedrun")
  ) {
    return "gaming_esports";
  }
  if (
    ctx.includes("football") ||
    ctx.includes("soccer") ||
    ctx.includes("basketball") ||
    ctx.includes("tennis") ||
    ctx.includes("badminton") ||
    ctx.includes("cricket") ||
    ctx.includes("boxing") ||
    ctx.includes("mma") ||
    ctx.includes("martial arts") ||
    ctx.includes("wrestling") ||
    ctx.includes("swimming") ||
    ctx.includes("running") ||
    ctx.includes("marathon") ||
    ctx.includes("gym") ||
    ctx.includes("workout") ||
    ctx.includes("fitness") ||
    ctx.includes("bodybuilding") ||
    ctx.includes("weightlifting") ||
    ctx.includes("powerlifting") ||
    ctx.includes("calisthenics") ||
    ctx.includes("crossfit") ||
    ctx.includes("yoga") ||
    ctx.includes("pilates")
  ) {
    return "athletics_sports";
  }
  if (
    ctx.includes("cooking") ||
    ctx.includes("culinary") ||
    ctx.includes("baking") ||
    ctx.includes("pastry") ||
    ctx.includes("chef") ||
    ctx.includes("food") ||
    ctx.includes("knife skills") ||
    ctx.includes("barista") ||
    ctx.includes("coffee") ||
    ctx.includes("espresso") ||
    ctx.includes("cocktail") ||
    ctx.includes("mixology")
  ) {
    return "culinary_craft";
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

  if (category === "gaming_esports") {
    baseStages = [
      [`Controls, Device Calibration, HUD Layout & Ergonomics in ${clean}`, "Custom HUD button mapping, gyroscope vs finger sensitivity calibration, crosshair placement baseline, and display refresh optimization.", ["Custom HUD mapping & 4-finger claw layout", "Gyroscope & ADS sensitivity tuning", "Crosshair placement & centering drills"]],
      [`Mechanical Execution & Recoil Control Fundamentals`, "Mastering spray pull-down muscle memory, burst firing, hip-fire accuracy, and quick peek-and-fire agility.", ["Vertical & horizontal recoil compensation", "Jiggle peeking & pre-aim angles", "Hip-fire tracking at close range"]],
      [`Weapon Arsenal, Ballistics & Utility Mastery`, "Damage falloff curves, optimal attachment synergies, grenade cooking trajectories, and smoke wall tactical cover.", ["Weapon tier list & TTK comparisons", "Frag grenade cooking & ricochet angles", "Defensive & offensive smoke deployment"]],
      [`Drop Strategy, Early Game Looting & Initial Positioning`, "Hot-drop vs cold-drop landing routes, fast looting routes, vehicle securing priority, and compound clearing.", ["Parachute trajectory & early drop routes", "Fast loot priority & armor optimization", "Compound breach & room clearing mechanics"]],
      [`Map Navigation, Zone Rotations & Circle Prediction`, "Decoupling circle shifts, predicting late-game zones, navigating open terrain, and vehicle-assisted edge control.", ["Circle shift reading & timing windows", "High-ground & terrain dip exploitation", "Gatekeeping rotations along the blue zone"]],
      [`Squad Roles, Comms & Tactical Teamfighting`, "Entry fragger execution, IGL shotcalling, crossfire angles, trade-frag discipline, and compound siege protocols.", ["Effective callouts & information sharing", "Crossfire setups & bait-and-switch angles", "Trade-fragging & revives under pressure"]],
      [`Endgame Clutch Decision Making, High-Pressure Play & Capstone Mastery in ${clean}`, "Final circle positioning, 1vX clutch composure, heal-battle awareness, utility conservation, and tournament VOD review.", ["1vX isolation & clutch decision trees", "Final circle utility barrage & smoke paths", "Post-match VOD review & tilt management"]],
    ];
  } else if (category === "athletics_sports") {
    baseStages = [
      [`Biomechanical Foundations, Posture & Baseline Mobility in ${clean}`, "Kinetic chain alignment, joint mobility, core stability, and baseline movement screening.", ["Movement screening & posture alignment", "Dynamic mobility & joint prep", "Core bracing & kinetic stability"]],
      [`Fundamental Movement Patterns & Motor Recruitment`, "Mastering primary movement mechanics, weight distribution, and neuromuscular coordination.", ["Primary movement execution mechanics", "Force generation & weight transfer", "Neuromuscular motor recruitment"]],
      [`Progressive Intensity, Cadence & Technique Drills`, "Ramping movement velocity, refining cadence, and maintaining technical form under moderate cardiovascular load.", ["Cadence regulation & rhythm consistency", "Form maintenance under elevated heart rate", "Progressive overload & interval pacing"]],
      [`Energy System Conditioning, Pacing & Endurance`, "Aerobic base building, anaerobic threshold management, and strategic pacing throughout exertion.", ["Lactate threshold & pacing discipline", "Breathing mechanics & recovery cadence", "Energy expenditure conservation"]],
      [`Complex Sequencing, Agility & Explosive Power Transfer`, "Multi-planar agility, reactive footwork, rapid deceleration, and explosive kinetic output.", ["Deceleration mechanics & eccentric control", "Multi-directional change-of-direction", "Explosive triple extension & power transfer"]],
      [`Tactical Execution, Situational Adaptability & Injury Prevention`, "Reading opponents/conditions, tactical positioning, active recovery protocols, and joint longevity.", ["Situational decision-making under pressure", "Common movement breakdown mitigations", "Active recovery & soft tissue care"]],
      [`Competition Readiness, Tapering & Capstone Performance in ${clean}`, "Synthesizing technique, mental readiness, peak performance pacing, and capstone athletic testing.", ["Peak performance testing & metric benchmarks", "Pre-event mental preparation & arousal regulation", "Capstone performance execution"]],
    ];
  } else if (category === "culinary_craft") {
    baseStages = [
      [`Knife Skills, Mise en Place & Workstation Ergonomics in ${clean}`, "Proper knife grips, classic vegetable cuts, workstation efficiency, and food hygiene fundamentals.", ["Chefs knife grip & guiding hand technique", "Precision cuts (julienne, brunoise, chiffonade)", "Workstation organization & cross-contamination safety"]],
      [`Heat Transfer Mechanisms & Temperature Management`, "Conduction, convection, radiant heat, pan selection, oil smoke points, and heat control.", ["Pan conductivity (cast iron, stainless, non-stick)", "Oil smoke points & thermal regulation", "Surface moisture management & sizzling acoustics"]],
      [`The Flavor Matrix: Salt, Acid, Fat, Heat & Seasoning Timing`, "Understanding palatability balance, early vs late salting, acid brightening, and flavor layering.", ["The physiological impact of salt on food", "Balancing richness with acid (vinegar, citrus)", "Layering aromatics and herbs across cooking phases"]],
      [`Stocks, Emulsions, Mother Sauces & Pan Deglazing`, "Creating foundational stocks, stable emulsions (mayo, vinaigrette, hollandaise), and fond reduction sauces.", ["Stock extraction & gelatin development", "Emulsification principles & recovery from broken sauces", "Deglazing fond & pan sauce finishing"]],
      [`Protein Cookery, Maillard Reaction & Resting Science`, "Searing, internal temperature staging, collagen breakdown, carryover cooking, and muscle resting.", ["Maillard reaction optimization & crust formation", "Internal temperature targeting with thermometers", "Protein fiber relaxation & juice retention during resting"]],
      [`Vegetable Cookery, Starch Chemistry & Texture Contrasts`, "Blanching, caramelization, roasting, starch gelatinization, and pairing textural elements.", ["Chlorophyll preservation & shock cooling", "Caramelizing root vegetables & alliums", "Balancing crunchy, creamy, and tender elements"]],
      [`Multi-Element Timing, Plating Composition & Capstone Dinner in ${clean}`, "Executing multi-component recipes simultaneously, temperature staging, elegant plating, and taste auditing.", ["Simultaneous multi-dish time management", "Visual plating aesthetics (height, color, negative space)", "Capstone signature dish execution & sensory critique"]],
    ];
  } else if (category === "data_science") {
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
      [`Foundations, Core Concepts & Essential Setup in ${clean}`, `Core principles, mental models, and initial setup for ${clean}.`, ["Core taxonomy & terminology", "Foundational mental models & orientation", "Initial practice environment setup"]],
      [`Fundamental Techniques & Baseline Workflows`, `Exploring standard techniques, baseline execution, and core routines.`, ["Primary technique execution", "Standard operating workflows", "Essential baseline practice"]],
      [`Applied Execution & Progressive Practice Drills (Part 1)`, `Hands-on execution of canonical challenges, practical procedures, and active drills.`, ["Hands-on drill execution", "Form and execution accuracy", "Feedback loop calibration"]],
      [`Intermediate Strategy, Nuance & Pattern Recognition (Part 2)`, `Navigating complex scenarios, deeper patterns, and non-trivial situations.`, ["Complex scenario breakdown", "Intermediate pattern recognition", "Adaptive execution drills"]],
      [`High-Pressure Scenarios, Common Pitfalls & Error Correction`, `Analyzing high-pressure situations, amateur blunders, and mistake recovery.`, ["Common blunder identification", "Error recovery protocols", "Composure under pressure"]],
      [`Empirical Benchmarking & Performance Diagnostics`, `Systematic evaluation, skill benchmarking, and diagnostic self-assessment.`, ["Self-assessment benchmarks", "Quality metrics & performance review", "Targeted refinement drills"]],
      [`Capstone Project Synthesis & Mastery Milestone in ${clean}`, `Integrating all domain competencies into a cohesive, portfolio-grade capstone achievement.`, ["End-to-end skill synthesis", "Capstone execution & demonstration", "Retrospective & continuous mastery path"]],
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
  dayTitle: string = "",
  learningObjectives: string[] = [],
  dayDescription: string = "",
  skillLevel: string = "intermediate"
): Array<{ topic_number: number; title: string; description: string; estimated_minutes: number }> {
  const category = classifyDomain(domain);
  const cleanDomain = domain.trim();
  const cleanTitle = dayTitle.replace(/^Day\s+\d+:\s*/i, "").trim() || `Applied Principles for Day ${dayNumber}`;
  const totalMinutes = Math.round((Number(dailyHours) || 2.0) * 60);
  const level = skillLevel.toLowerCase();

  // 1. If explicit learning objectives exist, order them into a clear pedagogical progression (Intro -> Intermediate -> Advanced)
  if (learningObjectives && learningObjectives.length > 0) {
    const validObjectives = learningObjectives.filter((obj) => obj && obj.trim().length > 0);
    if (validObjectives.length >= 2) {
      // Determine topic count based on daily hours commitment
      const targetCount = dailyHours <= 1.0 ? 2 : dailyHours <= 2.5 ? Math.min(3, validObjectives.length) : Math.min(4, validObjectives.length);
      const selected = validObjectives.slice(0, targetCount);
      const mins = Math.floor(totalMinutes / selected.length);
      
      return selected.map((obj, idx) => {
        const cleanObj = obj.trim();
        let rolePrefix = "";
        let desc = "";
        if (idx === 0) {
          rolePrefix = category === "gaming_esports"
            ? "Setup & Fundamentals: "
            : category === "athletics_sports" || category === "music_arts" || category === "culinary_craft"
            ? "Ergonomics & Mechanics: "
            : level.includes("beg")
            ? "Intuitive Foundations: "
            : "Core Principles: ";
          desc = `Foundational mental models, terminology, and core intuition for ${cleanObj} in ${cleanDomain}.`;
        } else if (idx === selected.length - 1) {
          rolePrefix = category === "gaming_esports"
            ? "Clutch Play & Pitfall Prevention: "
            : category === "athletics_sports" || category === "music_arts" || category === "culinary_craft"
            ? "Nuance & Error Recovery: "
            : "Practical Mastery & Pitfall Prevention: ";
          desc = `Testing boundaries, identifying common pitfalls, and validating mastery of ${cleanObj}.`;
        } else {
          rolePrefix = category === "gaming_esports"
            ? "Tactical Drills & Execution: "
            : category === "athletics_sports" || category === "music_arts" || category === "culinary_craft"
            ? "Technique Drills & Execution: "
            : "Applied Execution & Drills: ";
          desc = `Concrete practical execution, step-by-step techniques, and applied practice for ${cleanObj}.`;
        }

        return {
          topic_number: idx + 1,
          title: cleanObj.includes(":") ? cleanObj : `${rolePrefix}${cleanObj}`,
          description: desc,
          estimated_minutes: idx === selected.length - 1 ? totalMinutes - (mins * (selected.length - 1)) : mins,
        };
      });
    }
  }

  // 2. Synthesize substantive, domain-specific subtopics with a natural learning progression
  const topicPool: Array<{ title: string; desc: string }> = [];

  const titleParts = cleanTitle.split(/[:&–—]/).map((s) => s.trim()).filter(Boolean);
  const primaryConcept = titleParts[0] || cleanTitle;
  const secondaryConcept = titleParts[1] || `${primaryConcept} Applied Execution`;
  const tertiaryConcept = titleParts[2] || `${primaryConcept} Nuance & Pitfalls`;

  // Stage 1: Introduction & Intuitive Mental Model
  topicPool.push({
    title: `${primaryConcept}: Foundations, Mental Models & Setup`,
    desc: `Establishing the core intuition, mental models, and prerequisite principles for ${primaryConcept} in ${cleanDomain}.`,
  });

  // Stage 2: Intermediate Applied Mechanics & Workflows
  topicPool.push({
    title: `${secondaryConcept}: Practical Execution & Drills`,
    desc: `Step-by-step methodology, verified techniques, and hands-on practice for ${secondaryConcept}.`,
  });

  // Stage 3: Advanced Nuances & Pitfalls (if commitment > 1.0 hr/day)
  if (dailyHours > 1.2 || titleParts.length > 2) {
    topicPool.push({
      title: `${tertiaryConcept}: Common Pitfalls, Edge Cases & Mastery`,
      desc: `Evaluating high-pressure scenarios, common blunders, and mistake correction protocols.`,
    });
  }

  // Stage 4: Intensive Synthesis & Benchmarking (if commitment >= 3.0 hrs/day)
  if (dailyHours >= 3.0) {
    topicPool.push({
      title: `${primaryConcept}: Advanced Benchmarks & Synthesis Capstone`,
      desc: `Comprehensive end-to-end integration, performance benchmarking, and mastery verification in ${cleanDomain}.`,
    });
  }

  const mins = Math.floor(totalMinutes / topicPool.length);
  return topicPool.map((t, idx) => ({
    topic_number: idx + 1,
    title: t.title,
    description: t.desc,
    estimated_minutes: idx === topicPool.length - 1 ? totalMinutes - (mins * (topicPool.length - 1)) : mins,
  }));
}

/**
 * Invokes Agent 2 (Daily Structure Agent) to dynamically decompose days with full LLM flexibility
 */
export async function fetchDayTopicsWithAgent2(
  domain: string,
  dailyHours: number,
  dayNumber: number,
  dayTitle: string = "",
  learningObjectives: string[] = [],
  dayDescription: string = "",
  skillLevel: string = "intermediate",
  onUsage?: (usage: TokenUsage) => void
): Promise<Array<{ topic_number: number; title: string; description: string; estimated_minutes: number }>> {
  if (typeof window !== "undefined") {
    try {
      const res = await fetch("/api/structure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          domain,
          dailyHours,
          dayNumber,
          dayTitle,
          learningObjectives,
          dayDescription,
          skillLevel,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.topics) && data.topics.length > 0) {
          onUsage?.(parseUsage(data.usage));
          return data.topics;
        }
      }
    } catch (err) {
      console.debug("Agent 2 structure fetch notice (using organic deconstruction):", err);
    }
  }

  return getDomainTopicsForDay(domain, dailyHours, dayNumber, dayTitle, learningObjectives, dayDescription, skillLevel);
}

export interface RoadmapSummary {
  id: string;
  user_id: string;
  title: string;
  domain_context: string;
  domain_archetype?: string;
  total_days: number;
  daily_hours_commitment: number;
  skill_level: string;
  status: string;
  is_pinned?: boolean;
  progress_percentage?: number;
  last_accessed_at?: string;
  created_at: string;
  days_count?: number;
  completed_topics_count?: number;
  total_topics_count?: number;
}

export async function getUserRoadmaps(userId: string): Promise<RoadmapSummary[]> {
  if (!userId || userId === "guest" || userId.startsWith("guest-")) {
    return getFeaturedDemoRoadmaps();
  }

  try {
    const supabase = createClient();
    const { data: roadmaps, error } = await supabase
      .from("roadmaps")
      .select("*, roadmap_days(id, status, roadmap_topics(id, status))")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error || !roadmaps) {
      console.warn("getUserRoadmaps fallback notice:", error);
      return getFeaturedDemoRoadmaps();
    }

    if (roadmaps.length === 0) {
      return getFeaturedDemoRoadmaps();
    }

    return roadmaps.map((r: any) => {
      let totalTopics = 0;
      let completedTopics = 0;
      const days = r.roadmap_days || [];
      days.forEach((d: any) => {
        const topics = d.roadmap_topics || [];
        totalTopics += topics.length;
        completedTopics += topics.filter((t: any) => t.status === "completed").length;
      });

      const calcProgress = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;
      const meta = r.metadata || {};

      return {
        id: r.id,
        user_id: r.user_id,
        title: r.title,
        domain_context: r.domain_context,
        domain_archetype: r.domain_archetype || meta.domain_archetype || classifyDomain(r.domain_context),
        total_days: r.total_days,
        daily_hours_commitment: r.daily_hours_commitment,
        skill_level: r.skill_level || "intermediate",
        status: r.status || "active",
        is_pinned: r.is_pinned !== undefined ? !!r.is_pinned : !!meta.is_pinned,
        progress_percentage: r.progress_percentage !== undefined ? r.progress_percentage : (meta.progress_percentage || calcProgress),
        last_accessed_at: r.last_accessed_at || meta.last_accessed_at || r.created_at,
        created_at: r.created_at,
        days_count: days.length || r.total_days,
        completed_topics_count: completedTopics,
        total_topics_count: totalTopics,
      };
    });
  } catch (err) {
    console.warn("getUserRoadmaps exception (using empty):", err);
    return [];
  }
}

export async function getRoadmapById(roadmapId: string) {
  if (!roadmapId || roadmapId.startsWith("guest-") || roadmapId.startsWith("local-") || roadmapId === "demo-1" || roadmapId === "demo-2" || roadmapId === "demo-3") {
    return null;
  }

  try {
    const supabase = createClient();

    // 1. Fetch roadmap
    const { data: roadmap, error: rError } = await supabase
      .from("roadmaps")
      .select("*")
      .eq("id", roadmapId)
      .maybeSingle();

    if (rError || !roadmap) return null;

    // Bump last_accessed_at in background inside metadata
    try {
      const existingMeta = roadmap.metadata || {};
      await supabase
        .from("roadmaps")
        .update({
          metadata: {
            ...existingMeta,
            last_accessed_at: new Date().toISOString(),
          },
        })
        .eq("id", roadmapId);
    } catch {
      // non-blocking
    }

    // 2. Fetch days
    const { data: days, error: dError } = await supabase
      .from("roadmap_days")
      .select("*")
      .eq("roadmap_id", roadmapId)
      .order("day_number", { ascending: true });

    if (dError || !days) {
      return { roadmap, days: [] };
    }

    // 3. Fetch topics
    const { data: topics } = await supabase
      .from("roadmap_topics")
      .select("*")
      .eq("roadmap_id", roadmapId)
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
  } catch (err) {
    console.warn("getRoadmapById exception:", err);
    return null;
  }
}

export async function deleteRoadmap(roadmapId: string) {
  if (!roadmapId || roadmapId.startsWith("guest-") || roadmapId.startsWith("local-") || roadmapId.startsWith("demo-")) {
    return true;
  }
  try {
    const supabase = createClient();
    const { error } = await supabase.from("roadmaps").delete().eq("id", roadmapId);
    if (error) {
      console.error("deleteRoadmap error:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("deleteRoadmap exception:", err);
    return false;
  }
}

export function getFeaturedDemoRoadmaps(): RoadmapSummary[] {
  return [
    {
      id: "demo-1",
      user_id: "guest",
      title: "14-Day Intensive: Distributed Systems & Consensus Engines",
      domain_context: "Distributed Systems & Consensus Engines",
      domain_archetype: "devops_cloud",
      total_days: 14,
      daily_hours_commitment: 2.5,
      skill_level: "advanced",
      status: "active",
      is_pinned: true,
      progress_percentage: 35,
      last_accessed_at: new Date(Date.now() - 3600000 * 2).toISOString(),
      created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
      days_count: 14,
      completed_topics_count: 5,
      total_topics_count: 42,
    },
    {
      id: "demo-2",
      user_id: "guest",
      title: "7-Day Foundation: Classical Guitar Biomechanics & Bach Polyphony",
      domain_context: "Classical Guitar & Bach Polyphony",
      domain_archetype: "music_arts",
      total_days: 7,
      daily_hours_commitment: 2.0,
      skill_level: "intermediate",
      status: "active",
      is_pinned: false,
      progress_percentage: 15,
      last_accessed_at: new Date(Date.now() - 86400000).toISOString(),
      created_at: new Date(Date.now() - 86400000 * 6).toISOString(),
      days_count: 7,
      completed_topics_count: 3,
      total_topics_count: 21,
    },
    {
      id: "demo-3",
      user_id: "guest",
      title: "21-Day Mastery: Quantum Mechanics & Analytical Solvers",
      domain_context: "Quantum Mechanics & Analytical Solvers",
      domain_archetype: "science_math",
      total_days: 21,
      daily_hours_commitment: 3.0,
      skill_level: "expert",
      status: "active",
      is_pinned: false,
      progress_percentage: 60,
      last_accessed_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      created_at: new Date(Date.now() - 86400000 * 12).toISOString(),
      days_count: 21,
      completed_topics_count: 38,
      total_topics_count: 63,
    },
  ];
}

/** Days and topics for a built-in sample roadmap */
export function buildSampleDays(roadmap: RoadmapSummary): SupabaseDay[] {
  return generateDomainDays(roadmap.domain_context, roadmap.total_days).map((d, idx) => {
    const dayId = `${roadmap.id}-day-${d.day_number}`;
    return {
      id: dayId,
      roadmap_id: roadmap.id,
      day_number: d.day_number,
      title: d.title,
      description: d.description,
      learning_objectives: d.learning_objectives,
      status: idx === 0 ? "in_progress" : "not_started",
      topics: getDomainTopicsForDay(
        roadmap.domain_context,
        roadmap.daily_hours_commitment,
        d.day_number,
        d.title,
        d.learning_objectives,
        d.description,
        roadmap.skill_level
      ).map((t) => ({
        id: `${dayId}-topic-${t.topic_number}`,
        day_id: dayId,
        roadmap_id: roadmap.id,
        topic_number: t.topic_number,
        title: t.title,
        description: t.description,
        estimated_minutes: t.estimated_minutes,
        status: idx === 0 && t.topic_number === 1 ? "in_progress" : "not_started",
      })),
    };
  });
}

/** Rough size of planning one day, only to check there is room for it */
const PLAN_TOKENS_PER_DAY = 1500;

export async function saveRoadmapToSupabase(
  userId: string,
  domain: string,
  totalDays: number,
  dailyHours: number,
  skillLevel: string = "intermediate"
) {
  // Check there is room before starting; what it really used is recorded at the end
  await assertUserTokenBudget(userId, totalDays * PLAN_TOKENS_PER_DAY);
  let planUsage = NO_USAGE;

  const supabase = createClient();
  const archetype = classifyDomain(domain);

  // 1. Insert into roadmaps table using canonical columns and storing extended attributes in metadata
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
      metadata: {
        domain_archetype: archetype,
        is_pinned: false,
        progress_percentage: 0.0,
        last_accessed_at: new Date().toISOString(),
      },
    })
    .select()
    .single();

  if (rErr || !roadmap) {
    throw new Error(rErr?.message || "Failed to create roadmap in Supabase");
  }

  // 2. Generate structured days universally using schema-safe columns
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
    const topicsForThisDay = await fetchDayTopicsWithAgent2(
      domain,
      dailyHours,
      day.day_number,
      day.title,
      day.learning_objectives,
      day.description,
      skillLevel,
      (usage) => {
        planUsage = addUsage(planUsage, usage);
      }
    );
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
    await getOrSaveLessonFromSupabase(firstDayTopics[0].id, firstDayTopics[0].title, domain, {
      topicDesc: firstDayTopics[0].description,
      estimatedMinutes: firstDayTopics[0].estimated_minutes || 45,
      dailyHours: roadmap.daily_hours_commitment || 2.0,
      skillLevel: roadmap.skill_level || "intermediate",
      dayNumber: 1,
      totalDays: insertedDays.length,
    });
  }

  await consumeTokensInDb(userId, planUsage, "Agent 2: Daily Structure");

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
  const dayTopics = await fetchDayTopicsWithAgent2(domain, dailyHours, dayNumber, dayTitle);
  const fallbackTopics: SupabaseTopic[] = dayTopics.map((t) => ({
    id: `${dayId}-top-${t.topic_number}`,
    day_id: dayId,
    roadmap_id: roadmapId,
    topic_number: t.topic_number,
    title: t.title,
    description: t.description,
    estimated_minutes: t.estimated_minutes,
    status: (t.topic_number === 1 ? "in_progress" : "not_started") as "in_progress" | "not_started",
  }));

  // If in guest mode or mock ID, do not query Supabase
  if (!dayId || !roadmapId || dayId.startsWith("guest-") || dayId.startsWith("local-") || roadmapId.startsWith("guest-") || roadmapId.startsWith("local-")) {
    return fallbackTopics;
  }

  try {
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
      console.warn("Notice inserting topics to Supabase (using local):", error);
      return fallbackTopics;
    }

    return inserted as SupabaseTopic[];
  } catch (err) {
    console.warn("saveDayTopicsToSupabase network notice:", err);
    return fallbackTopics;
  }
}

export interface LessonFetchOptions {
  topicDesc?: string;
  dailyHours?: number;
  skillLevel?: string;
  estimatedMinutes?: number;
  dayNumber?: number;
  totalDays?: number;
}

export function generateDomainLesson(
  topicId: string,
  topicTitle: string,
  domain: string,
  topicDescOrOptions: string | LessonFetchOptions = ""
): SupabaseLesson {
  const options = typeof topicDescOrOptions === "object" ? topicDescOrOptions : { topicDesc: topicDescOrOptions };
  return synthesizeResearchedLesson(topicTitle, domain, options.topicDesc || "", topicId, options);
}

export async function getOrSaveLessonFromSupabase(
  topicId: string,
  topicTitle: string,
  domain: string,
  topicDescOrOptions: string | LessonFetchOptions = ""
): Promise<SupabaseLesson> {
  const options = typeof topicDescOrOptions === "object" ? topicDescOrOptions : { topicDesc: topicDescOrOptions };
  const fallbackLesson = synthesizeResearchedLesson(topicTitle, domain, options.topicDesc || "", topicId, options);

  // 1. If in guest mode, mock, or custom local ID: STILL call /api/teach to provide live LLM output!
  const isGuestOrLocal =
    !topicId ||
    topicId === "mock" ||
    topicId.startsWith("guest-") ||
    topicId.startsWith("local-") ||
    topicId.startsWith("custom-");

  if (isGuestOrLocal) {
    try {
      if (typeof window !== "undefined") {
        const res = await fetch("/api/teach", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            topicId,
            topicTitle,
            domain,
            topicDesc: options.topicDesc || "",
            dailyHours: options.dailyHours,
            estimatedMinutes: options.estimatedMinutes,
            skillLevel: options.skillLevel,
            dayNumber: options.dayNumber,
            totalDays: options.totalDays,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (
            data &&
            data.content_markdown &&
            !data.content_markdown.includes("In this institutional module on")
          ) {
            return {
              topic_id: topicId,
              content_markdown: data.content_markdown,
              practical_examples: data.practical_examples || fallbackLesson.practical_examples,
              citations: data.citations || fallbackLesson.citations,
              recommended_courses: data.recommended_courses || fallbackLesson.recommended_courses,
            };
          }
        }
      }
    } catch (apiErr) {
      console.debug("Guest /api/teach client notice:", apiErr);
    }
    return fallbackLesson;
  }

  try {
    const supabase = createClient();

    // 2. Check if lesson already exists in Supabase
    const { data: existing } = await supabase
      .from("topic_lessons")
      .select("*")
      .eq("topic_id", topicId)
      .maybeSingle();

    // If existing lesson has authentic researched content, return it
    if (existing && existing.content_markdown) {
      const isOldGeneric =
        !existing.content_markdown ||
        existing.content_markdown.length < 250 ||
        (options.estimatedMinutes && options.estimatedMinutes >= 45 && existing.content_markdown.length < 800) ||
        existing.content_markdown.includes("Pre-Flight Input Audit") ||
        existing.content_markdown.includes("Superficial Pattern Transfer") ||
        existing.content_markdown.includes("In this institutional module on") ||
        existing.content_markdown.includes("Foundational Invariants: Rather than treating") ||
        existing.content_markdown.includes("Deterministic Operational Flows: Eliminate ambiguous") ||
        existing.content_markdown.includes("Isolating Failure Boundaries: Complex errors emerge") ||
        existing.content_markdown.includes("Pre-Execution Audit: Enumerate all initial assumptions") ||
        existing.content_markdown.includes("Canonical Execution Pathway: Apply the verified") ||
        existing.content_markdown.includes("Adversarial Stress-Testing: Probe edge cases") ||
        existing.content_markdown.includes("Superficial Pattern Matching: Applying solutions") ||
        existing.content_markdown.includes("Absence of Diagnostic Feedback: Failing to establish") ||
        existing.content_markdown.includes("Invariant Inversion: If the primary governing invariant") ||
        existing.citations?.some((c: any) =>
          c.title?.includes("Seminal Foundations & Standard Specification") ||
          c.title?.includes("Advanced Technical Monograph & Field Manual")
        ) ||
        existing.recommended_courses?.some((rc: any) =>
          rc.title?.includes("Advanced Curriculum & Lecture Series") ||
          rc.title?.includes("Professional Specialization: Applied")
        ) ||
        (existing.content_markdown.includes("In this masterclass module on **") &&
          !existing.content_markdown.includes("Implementation Checklist") &&
          !existing.content_markdown.includes("State Machine Replication"));

      // If existing content is genuine/up-to-date, use it directly
      if (!isOldGeneric) {
        return existing as SupabaseLesson;
      }
      // If it contains the old generic boilerplate, proceed to upgrade it with researched content!
    }

    // 3. Attempt live research & teaching via Next.js /api/teach endpoint
    let liveLesson: SupabaseLesson | null = null;
    let lessonUsage = NO_USAGE;
    try {
      if (typeof window !== "undefined") {
        const res = await fetch("/api/teach", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            topicId,
            topicTitle,
            domain,
            topicDesc: options.topicDesc || "",
            dailyHours: options.dailyHours,
            estimatedMinutes: options.estimatedMinutes,
            skillLevel: options.skillLevel,
            dayNumber: options.dayNumber,
            totalDays: options.totalDays,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (
            data &&
            data.content_markdown &&
            !data.content_markdown.includes("In this institutional module on")
          ) {
            lessonUsage = parseUsage(data.usage);
            liveLesson = {
              topic_id: topicId,
              content_markdown: data.content_markdown,
              practical_examples: data.practical_examples || fallbackLesson.practical_examples,
              citations: data.citations || fallbackLesson.citations,
              recommended_courses: data.recommended_courses || fallbackLesson.recommended_courses,
            };
          }
        }
      }
    } catch (apiErr) {
      console.debug("/api/teach client notice (using synthesized knowledge engine):", apiErr);
    }

    const lessonToPersist: SupabaseLesson = liveLesson || fallbackLesson;

    // The AI call was made whether or not the lesson can be saved
    if (totalTokens(lessonUsage) > 0) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) await consumeTokensInDb(user.id, lessonUsage, "Agent 3: Daily Teacher");
      } catch {
        // non-fatal
      }
    }

    // 4. Upsert into topic_lessons in Supabase to permanently persist for all users
    const { data: inserted, error } = await supabase
      .from("topic_lessons")
      .upsert(lessonToPersist, { onConflict: "topic_id" })
      .select()
      .maybeSingle();

    if (inserted && !error) {
      return inserted as SupabaseLesson;
    }

    return lessonToPersist;
  } catch (err) {
    console.warn("getOrSaveLessonFromSupabase notice (offline/fallback):", err);
    return fallbackLesson;
  }
}

export class TokenQuotaExceededError extends Error {
  currentUsed: number;
  maxLimit: number;
  resetDate: string;
  tier: string;

  constructor(
    message: string,
    currentUsed: number,
    maxLimit: number,
    resetDate: string = "Next Billing Cycle",
    tier: string = "Free"
  ) {
    super(message);
    this.name = "TokenQuotaExceededError";
    this.currentUsed = currentUsed;
    this.maxLimit = maxLimit;
    this.resetDate = resetDate;
    this.tier = tier;
  }
}

/**
 * Validates that user has sufficient reasoning tokens remaining in their cycle.
 * Also automatically checks and executes monthly billing cycle reset if cycle_resets_at has expired.
 * Throws TokenQuotaExceededError and dispatches 'roadmap-token-quota-exceeded' if exhausted.
 */
export async function assertUserTokenBudget(
  userId: string | undefined,
  tokensNeeded: number = 1000
): Promise<{
  allowed: boolean;
  currentUsed: number;
  maxLimit: number;
  remaining: number;
  resetDate: string;
  tier: string;
}> {
  // 1. Guest / Local Mode Check
  if (!userId || userId === "guest" || userId.startsWith("guest-") || userId.startsWith("local-")) {
    let guestUsed = 0;
    const guestLimit = 250000;
    const now = new Date();
    const fallbackResetDate = new Date(now.getFullYear(), now.getMonth() + 1, 1).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });

    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("roadmap_guest_tokens_used");
      if (stored) {
        guestUsed = parseInt(stored, 10);
      }
    }

    if (guestUsed + tokensNeeded > guestLimit) {
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("roadmap-token-quota-exceeded", {
            detail: {
              currentUsed: guestUsed,
              maxLimit: guestLimit,
              resetDate: fallbackResetDate,
              tier: "Guest Preview",
            },
          })
        );
      }
      throw new TokenQuotaExceededError(
        `This month's AI usage is used up (${guestUsed.toLocaleString()} / ${guestLimit.toLocaleString()} tokens). It starts again next month.`,
        guestUsed,
        guestLimit,
        fallbackResetDate,
        "Guest Preview"
      );
    }

    return {
      allowed: true,
      currentUsed: guestUsed,
      maxLimit: guestLimit,
      remaining: Math.max(0, guestLimit - guestUsed),
      resetDate: fallbackResetDate,
      tier: "Guest Preview",
    };
  }

  // 2. Authenticated User Check in Supabase DB
  try {
    const supabase = createClient();
    const { data: budget, error: budgetError } = await supabase
      .from("token_budgets")
      .select("tokens_used_current_cycle, max_tokens_monthly, cycle_resets_at")
      .eq("user_id", userId)
      .maybeSingle();

    if (budgetError) {
      console.warn("[assertUserTokenBudget] token_budgets query notice:", budgetError);
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("subscription_tier")
      .eq("id", userId)
      .maybeSingle();

    const isPro = profile?.subscription_tier === "pro" || budget?.max_tokens_monthly === 2500000;
    const userTier = isPro ? "Pro" : "Free";
    let currentUsed = budget?.tokens_used_current_cycle ?? 0;
    let maxLimit = budget?.max_tokens_monthly ?? (isPro ? 2500000 : 250000);
    const now = new Date();

    let resetDate = budget?.cycle_resets_at
      ? new Date(budget.cycle_resets_at).toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        })
      : new Date(now.getFullYear(), now.getMonth() + 1, 1).toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        });

    // Check if cycle has expired (automatic monthly rollover)
    if (budget?.cycle_resets_at) {
      const resetTime = new Date(budget.cycle_resets_at).getTime();
      if (now.getTime() >= resetTime) {
        // Roll over billing cycle to 0
        const newResetDateIso = new Date(now.getTime() + 30 * 86400000).toISOString();
        currentUsed = 0;
        resetDate = new Date(newResetDateIso).toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        });

        await supabase
          .from("token_budgets")
          .update({
            tokens_used_current_cycle: 0,
            cycle_resets_at: newResetDateIso,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", userId);
      }
    }

    // Strict quota enforcement
    if (currentUsed + tokensNeeded > maxLimit) {
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("roadmap-token-quota-exceeded", {
            detail: {
              currentUsed,
              maxLimit,
              resetDate,
              tier: userTier,
            },
          })
        );
      }

      throw new TokenQuotaExceededError(
        `This month's AI usage is used up (${currentUsed.toLocaleString()} / ${maxLimit.toLocaleString()} tokens). It starts again next month.`,
        currentUsed,
        maxLimit,
        resetDate,
        userTier
      );
    }

    return {
      allowed: true,
      currentUsed,
      maxLimit,
      remaining: Math.max(0, maxLimit - currentUsed),
      resetDate,
      tier: userTier,
    };
  } catch (err: any) {
    if (err instanceof TokenQuotaExceededError) {
      throw err;
    }
    console.warn("[assertUserTokenBudget] non-fatal query fallback:", err);
    return {
      allowed: true,
      currentUsed: 0,
      maxLimit: 250000,
      remaining: 250000,
      resetDate: "Next Billing Cycle",
      tier: "Free",
    };
  }
}

/** Adds what an AI call used to the person's monthly total */
export async function consumeTokensInDb(
  userId: string | undefined,
  usage: TokenUsage,
  agentName: string
): Promise<void> {
  const tokens = totalTokens(usage);
  if (tokens <= 0 || !userId || userId === "guest" || userId.startsWith("guest-") || userId.startsWith("local-")) return;

  try {
    const supabase = createClient();

    const { error } = await supabase.rpc("increment_token_budget", { p_user_id: userId, p_tokens: tokens });
    if (error) console.warn("Usage could not be recorded:", error.message);

    const { error: logError } = await supabase.from("agent_execution_logs").insert({
      user_id: userId,
      agent_name: agentName,
      prompt_tokens: usage.promptTokens,
      completion_tokens: usage.completionTokens,
      latency_ms: 0,
      status: "success",
    });
    if (logError) console.debug("agent_execution_logs insert notice (non-fatal):", logError.message);

    if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("roadmap-tokens-updated"));
  } catch (err) {
    console.debug("consumeTokensInDb notice:", err);
  }
}

export async function updateTopicStatusInSupabase(
  topicId: string,
  status: "completed" | "in_progress" | "not_started"
) {
  if (!topicId || topicId.startsWith("topic-")) return;
  try {
    const supabase = createClient();
    await supabase
      .from("roadmap_topics")
      .update({ status })
      .eq("id", topicId);
  } catch (err) {
    console.debug("updateTopicStatusInSupabase notice:", err);
  }
}

export async function getTopicByIdFromSupabase(topicId: string) {
  if (!topicId) return null;
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("roadmap_topics")
      .select("*, roadmap_days(id, day_number, title, roadmaps(id, title, domain_context, skill_level, total_days, daily_hours_commitment))")
      .eq("id", topicId)
      .maybeSingle();

    if (data && !error) {
      return data;
    }
  } catch (err) {
    console.debug("getTopicByIdFromSupabase notice:", err);
  }
  return null;
}

export interface UsageSummary {
  used: number;
  limit: number;
  /** Null when the date on record has already passed */
  resetsAt: Date | null;
  paths: number;
  topicsDone: number;
}

/** Everything on the Usage page, straight from the database. Throws when it cannot be read. */
export async function getUsageSummary(userId: string): Promise<UsageSummary> {
  const supabase = createClient();
  const [budget, roadmaps] = await Promise.all([
    supabase
      .from("token_budgets")
      .select("tokens_used_current_cycle, max_tokens_monthly, cycle_resets_at")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase.from("roadmaps").select("id, roadmap_days(roadmap_topics(status))").eq("user_id", userId),
  ]);
  if (budget.error) throw budget.error;
  if (roadmaps.error) throw roadmaps.error;

  const resetsAt = budget.data?.cycle_resets_at ? new Date(budget.data.cycle_resets_at) : null;
  type Row = { roadmap_days?: Array<{ roadmap_topics?: Array<{ status: string }> }> };
  const rows = (roadmaps.data ?? []) as Row[];

  return {
    used: budget.data?.tokens_used_current_cycle ?? 0,
    limit: budget.data?.max_tokens_monthly ?? 250000,
    resetsAt: resetsAt && resetsAt.getTime() > Date.now() ? resetsAt : null,
    paths: rows.length,
    topicsDone: rows
      .flatMap((r) => r.roadmap_days ?? [])
      .flatMap((d) => d.roadmap_topics ?? [])
      .filter((t) => t.status === "completed").length,
  };
}
