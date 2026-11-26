---
name: editorial-ui
description: Design, UX, copy and front-end rules for building web interfaces that look designed, not generated. Covers the visual direction (editorial layouts, type, colour, motion), plain-language copy, interaction patterns, light and dark themes, responsive checks, and how to verify work with screenshots. Use whenever creating, redesigning, restyling or reviewing any page, component, layout, animation, form, dialog or landing page, including quick "vibe coding" requests like "make this look better" or "redesign the home page".
---

# Editorial UI: design, UX and front-end rules

These are the rules for any interface built with this skill. They came from real feedback on a shipped
product (Daari, a learning-path app). Where a rule exists because something went wrong, the reason is
given, so you can judge edge cases instead of following blindly.

The short version:

1. **Look at references before designing.** Screenshot them and name what they share.
2. **Editorial, not "AI app".** Big type, thin rules, small bracketed labels, asymmetric grids, room to breathe, one accent colour.
3. **Plain words.** Write like a person explaining it to a friend. No jargon, no hype, no fake features.
4. **Both themes, every size.** Nothing is done until it has been checked in light and dark, at 1920, 1440, 1366, 1024 and 390 wide.
5. **Prove it with screenshots.** Don't report "done" from code alone.

---

## 1. How to work

### 1.1 Before writing code

1. **Read the existing code.** Find the theme tokens (`globals.css`, the Tailwind config), the fonts, the shared components and the navbar. Reuse them. Do not invent a second design system next to the first.
2. **Look at references.** If the user gives URLs, screenshot them at 1440×900 while scrolling (see `scripts/shoot.mjs`) and write down 4–6 things they have in common. Design from those traits; never copy a site's layout, text, logo or images.
3. **Decide the scope out loud.** "Opening page" can mean the first screen or the whole home page. Pick the more likely reading, say which one you picked, and keep everything else (navbar, footer, other pages) untouched unless asked.
4. **Keep behaviour, change the look.** In a redesign, every working feature survives (data loading, forms, auth state, links, anchors). Only the presentation changes.
5. **Work on a branch for redesigns.** Stash or branch the old version first so it can come back. Commit only when the user asks.

### 1.2 While building

- Make one coherent pass, then screenshot, then fix. Do not tweak blind.
- Keep new pieces in small components (`components/<page>/<piece>.tsx`) with a one-line comment saying what each is for.
- Put page-specific CSS in one clearly labelled block in `globals.css` (`/* ===== Home page ===== */`).

### 1.3 Before saying it is done

Run the checklist in section 12. Report what changed, what you verified and how, and anything you could not
check, in plain words. Mention anything you changed outside the requested area.

---

## 2. Visual direction

### 2.1 What "good" looks like here

Editorial and quiet, like a design studio or a well-made magazine site. The direction that worked was
taken from studio and boutique sites (fume-studio.com, iwonderu.se, noth.in). What they share:

- **Full-bleed hero moments**, then calm sections with lots of empty space.
- **Huge, tight display type** for statements (often 8–11vw), with one word set in a serif or the accent colour.
- **Small labels in brackets**, in mono uppercase with wide tracking: `( How it works )`, `( 01 )`.
- **Hairline rules** (`border-t` at about 15–20% foreground) to separate rows instead of cards and shadows.
- **Asymmetric 12-column grids.** Label in columns 1–3, statement in 4–12; text on the left five columns, the working piece on the right six.
- **Numbered chapters** (01, 02, 03…) for "how it works" style content.
- **Few words per section.** One statement, one or two short paragraphs, one action.
- **Dark bands** that interrupt a light page for emphasis, with soft edges (section 5.4).

### 2.2 What to avoid

These were all tried and rejected, or are tell-tale signs of generated UI:

- Purple, pink or neon gradient blobs, glowing orbs, "aurora" backgrounds.
- Grids of identical rounded cards with an icon, a title and two lines of text.
- Glassmorphism everywhere, heavy drop shadows, and badges on everything.
- Spotlight or hover-glow cards with fake metrics ("Topology: Strict DAG").
- A whole stock UI kit swapped in, which the user rejected and reverted. Restyle what exists instead.
- Scenes built on a photo that need pixel-exact overlays (text placed onto a photographed monitor). It is fragile across aspect ratios, and the user called it "very very bad".
- Default browser controls: number spinners, unstyled `<select>` arrows, default focus glow.
- Translucent shapes overlapping each other, which shows seams and muddy colours. Use opaque colours.

### 2.3 When there are no photos

Don't fake it with stock-looking AI art. Prefer **drawn graphics that mean something**:

- **Generated SVG** that matches the product idea. For a "path" product, a topographic contour map with a route drawing up to a summit (`scripts/topo.py`).
- **Type as image.** A huge outlined word (`-webkit-text-stroke`, transparent fill), for example the product name in its original script.
- **Colour blocks.** Earthy solid tiles with a tiny diagram inside.

If you do generate images:
- **Style:** "35mm film, natural light, soft grain, muted warm palette, editorial photography, no text, no logos".
- **Quota:** check first. The Gemini image models have a free-tier quota of 0, so they need a billed key. If the key is refused, say so and build without images. Don't stall.
- **Credentials:** never read or test API keys the user hasn't pointed you to.

---

## 3. Typography

Use three families plus mono, each with one job:

| Role | Example | Use |
| --- | --- | --- |
| Display grotesk | Clash Display (Fontshare) | Headlines and statements. Weight 500 for editorial, 700+ only for small brand marks. |
| Serif accent | Sprat or any characterful serif | One word or phrase inside a headline, big numbers (01, 02), pull quotes, role names. |
| Readable sans | Atkinson Hyperlegible | All body copy, buttons, forms. |
| Mono | `ui-monospace` | Bracketed labels, small meta (days, times), map labels. |

The scale:

- **Hero:** `text-[clamp(3.1rem,8.4vw,8.75rem)] leading-[0.9] tracking-[-0.045em] font-medium`.
- **Section statement:** `text-[clamp(2.1rem,4.6vw,4.5rem)] leading-[1.02] tracking-[-0.03em]`.
- **Chapter title:** `text-3xl sm:text-[2.75rem] leading-[1.05]`.
- **Body:** `text-base sm:text-lg leading-relaxed text-muted-foreground`, max width about `max-w-md` to `max-w-2xl`.
- **Label:** `font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground`.
- **Accent word:** `<span className="font-serif font-normal text-saffron">anything.</span>`. Use it once per heading at most.

Other rules:

- **`text-balance` on headings.** Make sure no long single word can overflow a small box. Size it with `clamp()` and test the longest real word ("Photosynthesis" broke tiles twice). Don't rely on `hyphens-auto`, because headless and some browsers don't hyphenate.
- **Non-Latin scripts** need a font that has them. Load just the glyphs you use: `fonts.googleapis.com/css2?family=Noto+Serif+Kannada&text=<url-encoded chars>`.

---

## 4. Colour and theming

### 4.1 Tokens

- **Semantic tokens only:** `--background`, `--foreground`, `--card`, `--muted`, `--muted-foreground`, `--border`, plus named accents, exposed through Tailwind v4 `@theme inline`. Components never hard-code light or dark colours, except inside a deliberately fixed-dark band.
- **One main accent** (saffron orange `#f97316` light / `#fb923c` dark) for the main action, the active state and the "you are here" marker.
- **Colours carry meaning, consistently.** Orange is the main path or current item, cyan is a branch or secondary, green is done. Use the same meaning everywhere: graphs, lists, dots, progress.
- **Accents are lighter in dark mode.** Redefine them under `.dark`.

### 4.2 Both themes, always

- Every element, dialog, toast and empty state must be readable in both themes. Two real bugs came from this: a delete dialog and a quota modal were unreadable in light mode because they used fixed dark colours. Build dialogs from tokens (`bg-card text-card-foreground border-border`).
- **Fixed-dark bands** (hero, a feature band) use one warm black, such as `#0d0b09` with cream text `#f6efe6`, in both themes. Mark them `data-nav-dark` so a floating navbar can switch to its dark style while over them (section 7.3).
- Avoid a flash of the wrong theme: set the theme class in a blocking script in `<head>`, and put `suppressHydrationWarning` on `<html>`.
- **Colour mixing:** use `color-mix(in oklab, A x%, B)` rather than rgba stacks.
- **Earthy tiles that work in both themes:** `#9a4a2a` terracotta, `#2e3550` indigo, `#5b6436` olive, `#2f5a55` teal, `#a0742a` ochre, `#5e3047` plum, each with cream text.

---

## 5. Layout and spacing

### 5.1 The grid

- Container: `mx-auto w-full max-w-7xl px-6 sm:px-10`.
- Grid: `grid grid-cols-1 gap-x-10 gap-y-10 lg:grid-cols-12`.
- Section rhythm: `py-24 sm:py-32` (`sm:py-36` for the first statement section). Rows inside a section: `py-14 sm:py-20` with `border-t border-foreground/15`.
- A small label sits in the left 3 columns and lines up with the top of the statement (`lg:pt-3` or `lg:pt-4`).

### 5.2 The chapter pattern

```tsx
<section className="border-t border-foreground/15 py-14 sm:py-20">
  <div className="grid grid-cols-1 gap-x-10 gap-y-10 lg:grid-cols-12">
    <div className="lg:col-span-5">
      <div className="flex items-baseline gap-4">
        <span className="font-serif text-5xl leading-none text-saffron sm:text-6xl">01</span>
        <Label>Say where</Label>
      </div>
      <h3 className="mt-8 font-display text-3xl font-medium leading-[1.05] tracking-[-0.02em] sm:text-[2.75rem]">
        Tell us where you want to get to.
      </h3>
      <div className="mt-5 max-w-md space-y-3 text-base leading-relaxed text-muted-foreground sm:text-lg">…</div>
    </div>
    <div className="lg:col-span-6 lg:col-start-7">{/* the working demo, not a picture of it */}</div>
  </div>
</section>
```

Show **working pieces** (a real form, a clickable sample plan) instead of screenshots of the product.

### 5.3 Hero composition

- `h-[100svh] min-h-[620px]`, content pinned to the bottom: a label, a huge headline, then a hairline row with `( Scroll ) ↓` | one-sentence description | primary button and a text link.
- Keep graphics off the text. If a graphic would cross the headline, move it or give phones their own composition. On a phone the text fills the lower half, so draw a shorter version of the graphic in the top half.
- Shade only under the text, with a radial gradient behind the graphic layer, never over it, so the graphic stays crisp.
- **Overlays on an image** must use the same coordinate system as the image. Give an SVG the same `viewBox` as the art, with `preserveAspectRatio="xMidYMid slice"` matching `object-fit: cover`. Change the alignment on phones (`xMaxYMid` plus `object-right`).

### 5.4 Soft edges between dark and light

Never end a dark band on a hard line. Use two things together:

1. **The band's graphics fade out near the edge.** A sharp copy masked out near the edge, plus a `blur-[3px]` copy masked to show only in the edge zone, so the lines go soft and then disappear:
   ```ts
   const sharp   = "linear-gradient(to bottom, transparent 0%, black 30%, black 70%, transparent 100%)";
   const blurred = "linear-gradient(to bottom, transparent 0%, black 14%, transparent 34%, transparent 66%, black 86%, transparent 100%)";
   ```
2. **An eased colour hand-over** about a quarter of the screen tall, placed between the band and the page (`h-[26vh] min-h-32`):
   ```css
   .band-fade-out { background: linear-gradient(to bottom,
     var(--band-dark) 0%,
     color-mix(in oklab, var(--band-dark) 92%, var(--background)) 14%,
     color-mix(in oklab, var(--band-dark) 75%, var(--background)) 30%,
     color-mix(in oklab, var(--band-dark) 50%, var(--background)) 50%,
     color-mix(in oklab, var(--band-dark) 25%, var(--background)) 70%,
     color-mix(in oklab, var(--band-dark) 8%,  var(--background)) 86%,
     var(--background) 100%); margin-top: -1px; }
   ```
   Use the same gradient with `to top` above the band. A plain two-stop gradient shows visible start and end lines; the eased stops hide them.

### 5.5 Lists on overview pages

Show a **maximum of 3–4 items** with a "See all N in Studio →" link when there are more. Overview pages
summarise; they are not the full list.

---

## 6. Motion

Motion should explain something (a path being walked, a page coming into focus), never decorate. Every
animation needs a `prefers-reduced-motion: reduce` fallback that shows the end state.

| Pattern | How | Timing |
| --- | --- | --- |
| Page intro | Content starts `opacity:0; filter:blur(28px); scale(1.04)` and goes to clear | opacity 900ms ease-out, blur 1100ms `cubic-bezier(.33,1,.68,1)` |
| Hero text rise | `opacity 0 → 1`, `translateY(24px) → 0`, second row delayed 250ms | 1s `cubic-bezier(.2,.7,.2,1)` |
| Scroll reveal | IntersectionObserver, `rootMargin: "0px 0px -12% 0px"`, reveal once then disconnect | 0.9s, stagger 90–120ms |
| Line drawing | SVG `pathLength={1}`, `stroke-dasharray:1; stroke-dashoffset:1 → 0` | 2.6s `cubic-bezier(.65,0,.35,1)` |
| Stops along a line | fade in one by one, delays matched to where the line reaches them | 380ms apart |
| Goal marker | a ring scaling `1 → 1.9` while fading, repeating | 2.8s, starts after the draw |
| Hover | lift `-translate-y-1`, an arrow nudging `translate-x-1`, a line filling its width | 300–700ms ease-out |

Other rules:

- Start hero animations when the intro hands over, not on mount. Pass a `drawn` or `revealed` prop down.
- If an intro gets longer, say by how much. Intros longer than about 4s get annoying, so offer "Press Esc to skip".
- Smooth scrolling (Lenis) is fine. Anchor jumps should use it, with an offset for floating chrome.

---

## 7. UX patterns that worked

### 7.1 Forms

- **Fill-in sentence** instead of a form: "I want to learn [classical guitar] in [− 14 +] days, with [− 2 +] hours a day." Underlined inputs (`border-b-2 border-saffron/50`, focus at full saffron), and the placeholder is a real example.
- **Custom number stepper**, never `<input type=number>` spinners. Minus and plus buttons (`size-7`, round, with an `after:-inset-1.5` hit area), typing allowed, arrow keys work, clamped to min, max and step, the buttons `tabIndex={-1}` because the arrow keys cover them, `aria-label="More: Hours a day"`, disabled at the limits.
- **Presets open the real dialog already filled in.** A global `startPath(preset)` dispatches a `CustomEvent` that one dialog listens for. Use one dialog app-wide, never copies.
- **Keep unfinished intent across sign-in.** Save the pending form in `sessionStorage` before redirecting to login, and restore it after.
- **Auth:** login, sign-up, forgot password and reset password all share one form shell. Translate errors into plain sentences ("That email and password don't match"). Only redirect to same-site paths: reject `//`, `/\` and absolute URLs.

### 7.2 Feedback and states

- **Loading:** a small spinner plus words ("Loading paths"), and a safety timeout (about 2.5s) so a spinner can never hang forever.
- **Empty and error states:** one plain sentence saying what happened and what to do ("Your paths could not be loaded. Refresh the page to try again.").
- **Greet with real data or nothing.** Don't show "Hey Architect" and then swap to the name. Wait for the user, or render a neutral greeting that doesn't change.
- **Show real numbers.** Usage pages show actual counts. Never show a fake "Upgrade to Pro, free" button or invented metrics.
- **AI features** carry a quiet honesty line: "Daari can make mistakes, so check anything important."

### 7.3 Navigation chrome

- A floating navbar has no full-width bar and no bottom border. It sits in the corners with a centred mark.
- Over dark bands it inverts. Check every `[data-nav-dark]` element on scroll and resize, and switch while one covers the bar (`top <= 40 && bottom > 60`).
- Link text over icons for secondary items. The user asked for "About" as a word, not an icon.

### 7.4 Making an AI feature feel unique

Don't build a plain Q&A box. Give the agent a visible method: for example, write down what the learner
believes, find the weakest part, try to break it, and show "Contradicted" or "Holds" verdicts. Every
judged answer must produce a verdict; "Not graded" on a good answer is a bug.

---

## 8. Copy and voice

The user's repeated feedback was "make it human" and "too complicated".

- Write at a friendly, plain level: short sentences, everyday words, active voice.
- Prefer **naming what it does**: "The planner splits your subject into days" beats "Chronological Day Decomposer".
- No hype words: revolutionary, unlock, supercharge, seamless, next-gen, cutting-edge, "redefining limits".
- Headlines are a promise in under eight words: "Find your way into anything." / "The first step is small."
- Use the same name for one thing everywhere: Paths, Usage, Start. When renaming, rename everywhere, including page titles, emails, metadata, alt text, error messages and README.
- A product name with personal meaning deserves a sentence that explains it, e.g. "The name is Kannada for *path*."
- Use real-sounding examples (Classical guitar, Chess openings, Photosynthesis), never "Lorem" or "Topic 1".

---

## 9. Accessibility (non-negotiable)

- Use real `<button>` and `<a>` elements, with `cursor-pointer` and `focus-visible:outline-2 focus-visible:outline-offset-2`, and an outline colour that shows on the background behind it.
- Decorative graphics get `aria-hidden="true"` and `alt=""`. Meaningful images get real alt text.
- Icon-only buttons need an `aria-label`. Keep hit areas at least 32px; extend them with `after:absolute after:-inset-1.5`.
- Body text must meet contrast in both themes. Muted text on dark bands should be at least about 60% cream.
- Respect `prefers-reduced-motion` everywhere (section 6).
- Hidden UI must also be `pointer-events-none` and out of the tab order.

---

## 10. Responsive

- Check at **1920×1080, 1440×900, 1366×768, 1024×768 and 390×844** (mobile emulation).
- No horizontal scroll: `document.documentElement.scrollWidth - innerWidth` must be 0.
- Phones get their own composition when needed, not just a shrunk desktop: a separate SVG route, `object-right`, hidden meta words (`<span className="hidden xl:inline"> a day</span>`).
- Tiles: 2 columns on phones, 3 on desktop, `aspect-[4/5]` or `aspect-[5/6]`, with the longest real label tested at each width.
- For overlays sized to a picture, container queries (`container-type: size` plus `cqw`) keep proportions. Avoid relying on photo-exact overlays at all (section 2.2).

---

## 11. Verification with screenshots

Use `scripts/shoot.mjs` (headless Chrome over the DevTools protocol, no npm install needed; needs Node 20+ and `google-chrome`):

```bash
# Full scroll-through, both themes, all five sizes, into ./shots
node --experimental-websocket .agent/skills/ui/scripts/shoot.mjs http://localhost:3000/ ./shots
# Reference sites: one size, dark only, longer wait
node --experimental-websocket .agent/skills/ui/scripts/shoot.mjs https://example.com ./refs --sizes 1440x900 --themes none --wait 9000
```

The script:
- sets the theme through `localStorage` (`--theme-key`, default `theme`) before load;
- waits out any intro (`--wait`, default 10000ms);
- scrolls the page taking one screenshot per screen;
- prints console errors and horizontal overflow for each size.

Then **look at the images**. Check that:
- text isn't crossing graphics;
- nothing is clipped at the edges;
- labels don't overflow;
- dialogs are readable in both themes;
- the navbar style is right over each band;
- edges between bands are soft.

Also capture mid-animation frames (for example 700ms and 1300ms after load) when changing an intro.

Things headless can't do: it isn't signed in (so it can't check user-only data) and it can't receive email.
Say so in the report rather than claiming it was verified.

---

## 12. Done checklist

- [ ] Existing tokens, fonts and components reused; no parallel design system.
- [ ] All behaviour from before still works (forms, auth, data, anchors, links).
- [ ] Copy is plain, short and human; no jargon, hype or fake features; names consistent.
- [ ] Light and dark both checked, including dialogs and empty or error states.
- [ ] 1920, 1440, 1366, 1024 and 390 checked; no horizontal overflow; longest labels fit.
- [ ] Graphics never cross text; phones have their own composition where needed.
- [ ] Dark bands have soft edges and set `data-nav-dark`.
- [ ] Animations have reduced-motion fallbacks and start at the right moment.
- [ ] Focus outlines visible, aria labels present, decorative art hidden from screen readers.
- [ ] Zero console errors; type check passes; no new lint errors in touched files (say which errors already existed).
- [ ] Report: what changed, how it was verified, what wasn't verified, anything touched outside scope.

---

## 13. Framework gotchas (Next.js 16, React 19, Tailwind v4)

- **Read the bundled docs.** Next 16 differs from older versions; read `node_modules/next/dist/docs/` before using an unfamiliar API.
- **Stale styles.** If Turbopack stops generating new Tailwind classes, stop the dev server, run `rm -rf .next/dev`, and restart. A stale `.next/types` that points at a deleted route needs `rm -rf .next/types`.
- **Hydration.** Never read `localStorage`, `window`, `Date.now()` or the user's time during render. Render a stable placeholder, then fill it in after mount, aligned to the next minute for clocks. Keep "was this an internal navigation" flags in memory, not in storage that differs between server and client.
- **Effects.** Don't call `setState` synchronously at the top of an effect for values you could compute up front. Derive them, or use a lazy `useState(() => …)`.
- **Tailwind v4.** Use `@theme inline` for tokens, `@custom-variant dark (&:where(.dark, .dark *))` for class-based dark mode, arbitrary values like `text-[clamp(...)]` and `[mask-image:...]`, and the `has-*` and `group-*` variants.
- **Images.** Plain `<img>` is fine for decorative SVG; add `{/* eslint-disable-next-line @next/next/no-img-element */}`.
- **Long AI calls on the server.** Don't block an async request handler with a synchronous call. Use sync handlers in a thread pool or real async, always with timeouts, or one slow call freezes the whole backend.
