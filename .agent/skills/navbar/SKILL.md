---
name: roadmap-navbar-ui
description: Comprehensive UI architecture, styling tokens, component structure, and interaction specifications for the Daari Tri-Wing Floating HUD Navigation Bar. Activate this skill whenever creating, modifying, debugging, refactoring, or styling the navbar component or related navigation chrome.
---

# Daari — Navbar UI & Structure Architecture

This skill defines the definitive design system, spatial layout, DOM hierarchy, styling tokens, state synchronization, and interaction models for the **Daari Navigation Bar** (`components/navbar.tsx` and `components/koto-navbar.tsx`).

---

## 1. Architectural Philosophy: The Tri-Wing Floating HUD

Unlike traditional SaaS web applications that feature a rigid, full-width horizontal header bar with a bottom border dividing line, Daari implements an **Aerial Tri-Wing Floating Heads-Up Display (HUD)**:

```
┌────────────────────────────────────────────────────────────────────────┐
│ [LEFT WING]                     [CENTER CREST]            [RIGHT WING] │
│ ┌───────────────┐                  ┌───────┐             ┌───────────┐ │
│ │ DAARI.        │                  │  LOGO │             │ ↗ STUDIO  │ │
│ └───────────────┘                  └───────┘             └───────────┘ │
│  · Curricula                                              · Logout/In  │
│  · Quota                                                  · Theme Pill │
│  · + Deploy                                                            │
│                                                                        │
│                          (NO HORIZONTAL DIVIDER)                       │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

### Core Principles
1. **Zero Full-Width Enclosure / No Dividing Line:**
   - There is strictly **no horizontal background strip** and **no `border-b` boundary**.
   - The viewport behind the navbar remains fully visible and unobstructed, maintaining an expansive, modern aesthetic.
2. **Three-Point Spatial Balance:**
   - **Left Wing (Primary Navigation):** Top-left anchor holding the brand pill and vertical sub-navigation items.
   - **Center Crest (Focal Identity):** Horizontally centered floating icon mark that acts as a return anchor.
   - **Right Wing (Action Hub):** Top-right anchor holding the high-conviction workspace pill (`STUDIO`), authentication state action, and theme toggle.
3. **Vertical Formation Stacking:**
   - Sub-navigation items do not extend horizontally across the screen; they stack vertically beneath the primary pill of their respective wing. This keeps horizontal sightlines clean and prevents collision across responsive screen widths.
4. **Z-Index Layering:**
   - Layered at `z-50`, floating above page content, smooth-scroll containers, and canvas backdrops.

---

## 2. Component Hierarchy & DOM Architecture

```
<Fragment>
  │
  ├── 1. Left Wing: Primary Navigation (<nav aria-label="Primary Navigation">)
  │    │
  │    ├── Brandmark Badge (<Link href="/" onClick={handleBrandClick}>)
  │    │    └── Typography: "ROADMAP" + <span className="text-orange-500...">.AI</span>
  │    │
  │    └── Vertical Sub-Nav Stack (<div className="flex flex-col items-start gap-1 font-body">)
  │         ├── Curricula Anchor Link (<Link href="/#portfolio" onClick={handleCurriculaClick}>)
  │         ├── Quota Route Link (<Link href="/billing" onClick={handleQuotaClick}>)
  │         └── Deploy Action Button (<button onClick={handleDeployClick}>)
  │              ├── Icon: <Plus className="size-3 stroke-[2.5]" />
  │              └── Label: "Deploy"
  │
  ├── 2. Center Crest: Brand Glyph Container (<div className="fixed top-5 sm:top-6 left-1/2 -translate-x-1/2 z-50...">)
  │    └── Home Anchor (<Link href="/" onClick={handleBrandClick} aria-label="Home">)
  │         ├── Light Glyph: <Image src="/images/logo-light.png" className="block dark:hidden" />
  │         └── Dark Glyph: <Image src="/images/logo-dark.png" className="hidden dark:block" />
  │
  └── 3. Right Wing: User Actions (<nav aria-label="User Actions">)
       │
       ├── Studio Action Pill (<Link href="/studio" onClick={handleStudioClick}>)
       │    ├── Icon: <ArrowUpRight className="size-3.5 text-orange-500..." />
       │    └── Typography: "STUDIO"
       │
       └── Vertical Sub-Actions Stack (<div className="flex flex-col items-end gap-1 font-body">)
            ├── Conditional Auth Element:
            │    ├── [Authenticated]: Logout Button (<button onClick={handleSignOut}>)
            │    └── [Unauthenticated]: Sign In Link (<Link href="/login">)
            └── Theme Switcher: <ThemeToggle variant="pill" />
```

---

## 3. Element-by-Element UI & Styling Specifications

### 3.1 Left Wing (Primary Navigation)

| Element | Class String | Description & Behavior |
| :--- | :--- | :--- |
| **Container `<nav>`** | `fixed top-5 left-5 sm:top-6 sm:left-8 z-50 flex flex-col items-start gap-1.5 font-mono text-xs select-none transition-opacity duration-700 ease-out` | Anchored top-left with responsive insets (`20px` mobile, `24px/32px` desktop). Controlled by `navVisible` state. |
| **Brandmark Pill** | `inline-flex items-center justify-center h-8.5 px-3.5 rounded-lg bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 border border-zinc-950 dark:border-white shadow-sm hover:opacity-90 transition-all mb-0.5 select-none cursor-pointer` | Inverted contrast pill (black in light mode, white in dark mode). Fixed height `h-8.5` (34px). |
| **Brandmark Text** | `text-sm font-black tracking-[-0.03em] font-display uppercase leading-none text-center` | Heavy brand weight. Displays `ROADMAP` with `.AI` highlighted in `text-orange-500 dark:text-orange-600 font-extrabold`. |
| **Sub-Nav Stack** | `flex flex-col items-start gap-1 font-body` | Vertical column aligning sub-items directly below the left edge of the brand pill. |
| **Curricula Link** | `px-2.5 py-1 rounded-md bg-transparent hover:bg-foreground hover:text-background text-muted-foreground hover:text-background text-xs uppercase tracking-wider font-medium leading-tight transition-all cursor-pointer` | Low-profile navigation item. Inverse hover pill state. Smooth scrolls to `#portfolio` with offset. |
| **Quota Link** | `px-2.5 py-1 rounded-md bg-transparent hover:bg-foreground hover:text-background text-muted-foreground hover:text-background text-xs uppercase tracking-wider font-medium leading-tight transition-all cursor-pointer` | Navigates to `/billing` or smooth-scrolls to top if already active. |
| **Deploy Button** | `px-2.5 py-1 rounded-md bg-orange-500/15 hover:bg-orange-500 text-orange-600 dark:text-orange-400 hover:text-black text-xs uppercase tracking-wider font-bold leading-tight transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer font-body` | Accent call-to-action button with a semi-transparent orange tint. Triggers the deploy modal or navigates to `#cockpit`. |

---

### 3.2 Center Crest (Brand Glyph)

| Element | Class String | Description & Behavior |
| :--- | :--- | :--- |
| **Wrapper `<div>`** | `fixed top-5 sm:top-6 left-1/2 -translate-x-1/2 z-50 flex items-center justify-center select-none pointer-events-auto transition-opacity duration-300` | Absolutely centered at the top of the viewport (`left-1/2 -translate-x-1/2`). |
| **Anchor `<Link>`** | `flex items-center justify-center size-8 sm:size-9 rounded-xl hover:opacity-80 active:scale-95 transition-all cursor-pointer group` | Micro-interaction target with subtle scaling feedback on click/hover. |
| **Light Logo `<Image>`** | `size-7 sm:size-8 object-contain block dark:hidden transition-transform duration-200 group-hover:scale-105` | Inverted dark logo rendered against light backdrops. |
| **Dark Logo `<Image>`** | `size-7 sm:size-8 object-contain hidden dark:block transition-transform duration-200 group-hover:scale-105` | Crisp white logo rendered against dark obsidian backdrops. |

---

### 3.3 Right Wing (User Actions)

| Element | Class String | Description & Behavior |
| :--- | :--- | :--- |
| **Container `<nav>`** | `fixed top-5 right-5 sm:top-6 sm:right-8 z-50 flex flex-col items-end gap-1.5 font-mono text-xs select-none transition-opacity duration-700 ease-out` | Anchored top-right with matching responsive insets. Right-aligned (`items-end`). |
| **Studio Pill** | `inline-flex items-center justify-center gap-1.5 h-8.5 pl-2.5 pr-3 rounded-lg bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 border border-zinc-950 dark:border-white shadow-sm hover:opacity-90 transition-all mb-0.5 group select-none cursor-pointer` | Primary high-conviction workspace action. Mirrors brandmark dimensions (`h-8.5`). |
| **Studio Icon** | `size-3.5 text-orange-500 dark:text-orange-600 shrink-0 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform` | `ArrowUpRight` icon with directional kinetic hover translate. |
| **Studio Text** | `text-sm font-black tracking-[-0.03em] font-display uppercase leading-none text-center` | Bold uppercase `STUDIO` label. |
| **Sub-Actions Stack** | `flex flex-col items-end gap-1 font-body` | Vertical stack aligning sub-actions flush against the right edge. |
| **Sign In Link** | `px-2.5 py-1 rounded-md bg-transparent hover:bg-foreground hover:text-background text-muted-foreground text-xs uppercase tracking-wider font-medium leading-tight transition-all flex items-center` | Visible when unauthenticated (`currentUser == null`). Direct route to `/login`. |
| **Logout Button** | `px-2.5 py-1 rounded-md bg-transparent hover:bg-red-600 hover:text-white text-muted-foreground text-xs uppercase tracking-wider font-medium leading-tight transition-all cursor-pointer` | Visible when authenticated. Hover changes to high-visibility destructive red. |
| **ThemeToggle** | `<ThemeToggle variant="pill" />` | Minimalist button triggering instant theme toggle (`dark` ↔ `light`) with `pill` geometry matching the sub-nav tags. |

---

## 4. Typography & Font Stacking

The navbar utilizes a deliberate multi-font hierarchy:

1. **`font-display` (Clash Display):**
   - Applied to the primary pills: `DAARI` and `STUDIO`.
   - Characteristics: `font-black`, `uppercase`, `tracking-[-0.03em]`, `leading-none`.
2. **`font-mono`:**
   - Applied to the outer wing containers to maintain numerical precision and tight structural bounds.
3. **`font-body` (Atkinson Hyperlegible):**
   - Applied to the sub-navigation stacks (`Curricula`, `Quota`, `Deploy`, `Sign In`/`Logout`).
   - Characteristics: `text-xs`, `uppercase`, `tracking-wider`, `font-medium` or `font-bold` for action items.

---

## 5. Interaction, Navigation & Animation Orchestration

### 5.1 Route Suppression
- **Classroom Route Exclusion:**
  ```typescript
  if (pathname?.startsWith("/classroom")) {
    return null;
  }
  ```
  The interactive classroom interface provides its own isolated heads-up controls; the global navbar is strictly suppressed.

### 5.2 Intro Animation & Reveal Synchronization
The navbar coordinates with the hero intro sequence on the root path (`/`):
- **On Inner Pages (`pathname !== "/"`):**
  - Always immediately visible (`navVisible = true`).
- **On Root (`pathname === "/"`):**
  - If navigated to internally (`isInternalNavigation() === true`), visible immediately.
  - If a cold initial load, `navVisible` defaults to `false`.
  - Listens for window event `roadmap-reveal-start`: Triggers smooth opacity reveal (`duration-700 ease-out`).
  - Listens for window event `roadmap-replay-site-intro`: Smoothly hides the navbar (`duration-700`).

### 5.3 Smooth Scrolling & Anchor Navigation
- **Lenis Integration:**
  - Injects `useLenis()` hook for buttery smooth, physics-based viewport movement.
  - **Brandmark Click on Home:** Scrolls to top:
    ```typescript
    lenis.scrollTo(0, { duration: 1.2 });
    ```
  - **Curricula Click on Home:** Scrolls directly to `#portfolio` with header offset:
    ```typescript
    lenis.scrollTo(portfolio, { offset: -60, duration: 1.0 });
    ```
  - **Curricula Click from Another Page:** Stores target in `sessionStorage` and delegates transition:
    ```typescript
    sessionStorage.setItem("roadmap_target_anchor", "portfolio");
    transitionTo("/#portfolio");
    ```

### 5.4 Page Transitions
- Uses `usePageTransition().transitionTo(path)` instead of direct uncoordinated route pushes, ensuring seamless canvas wipe/fade across views.
- Tags internal route state via `markInternalNavigation()` before transitioning to preserve reveal states.

---

## 6. Authentication State Reactivity

The navbar supports both **controlled** and **uncontrolled** authentication paradigms:

1. **Controlled Mode:**
   - Accepts `currentUser`, `onOpenDeployModal`, and `onSignOut` via `NavbarProps`.
2. **Uncontrolled (Self-Contained Supabase) Mode:**
   - Initializes `supabase = createClient()`.
   - Fetches active user via `supabase.auth.getUser()`.
   - Listens to `supabase.auth.onAuthStateChange((event, session) => ...)` to re-render in real-time on login, token refresh, or logout.
   - Dispatches a global CustomEvent `roadmap-auth-state-changed` for child subscribers.

---

## 7. Accessibility (a11y) & UX Standards

1. **Semantic Landmark Roles:**
   - Left wing: `<nav aria-label="Primary Navigation">`
   - Right wing: `<nav aria-label="User Actions">`
2. **Click Target Padding:**
   - All links and buttons carry minimum `px-2.5 py-1` padding with `cursor-pointer`.
3. **Pointer-Events Toggling:**
   - When `navVisible === false`, classes dynamically switch to `opacity-0 pointer-events-none` so hidden elements cannot capture clicks or tab focus.
4. **Accessible Labels:**
   - Center crest anchor provides explicit `aria-label="Home"` and `title="Return to Home"`.
   - Logout button provides `title="Sign out of account"`.

---

## 8. Anti-Patterns & Engineering Constraints

When editing or extending the navbar, **DO NOT**:
- ❌ **Add a horizontal dividing line or full-width background:** Do not introduce `w-full border-b bg-background/80 backdrop-blur`. The tri-wing floating formation is a core brand signature.
- ❌ **Flatten sub-items into a horizontal row:** Sub-items must remain vertically stacked beneath their primary pill to maintain negative space.
- ❌ **Use un-semantic hex colors:** Use Tailwind semantic tokens (`bg-zinc-950 text-white dark:bg-white dark:text-zinc-950`, `text-muted-foreground`, `text-orange-500`).
- ❌ **Bypass page transitions:** When navigating between internal routes, always call `transitionTo(path)` instead of raw `router.push`.
- ❌ **Remove `className="select-none"`:** Navbar chrome elements must remain unselectable during click-and-drag interactions.

