/**
 * Navigation state tracker to distinguish between:
 * 1. Initial visits and browser reloads (full page loads) -> Play intro animation
 * 2. Internal client-side SPA route transitions between pages -> Skip intro animation
 */

let inMemorySkipIntro = false;

export function markSkipIntroAnimation() {
  inMemorySkipIntro = true;
  if (typeof window !== "undefined") {
    try {
      sessionStorage.setItem("roadmap_skip_intro_animation", "true");
    } catch {}
  }
}

export const markInternalNavigation = markSkipIntroAnimation;

export function shouldSkipIntroAnimation(): boolean {
  // Module state survives client-side navigation and resets on a full load. Reading
  // sessionStorage here would make the first client render differ from the server's.
  return inMemorySkipIntro;
}

export const isInternalNavigation = shouldSkipIntroAnimation;

export function clearSkipIntroAnimation() {
  inMemorySkipIntro = false;
  if (typeof window !== "undefined") {
    try {
      sessionStorage.removeItem("roadmap_skip_intro_animation");
      sessionStorage.removeItem("roadmap_internal_route_hop");
      sessionStorage.removeItem("roadmap_navigated_from_internal");
    } catch {}
  }
}

export const clearInternalNavigationFlag = clearSkipIntroAnimation;
