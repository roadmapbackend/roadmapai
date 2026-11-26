"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { getUserRoadmaps, RoadmapSummary } from "@/lib/supabase-roadmap";
import { ArrowRight, Loader2, Plus } from "@/components/ui/icons";
import { startPath } from "@/components/create-roadmap-dialog";
import { HeroMap } from "@/components/home/hero-map";
import { Chapter, Label, Reveal } from "@/components/home/chapter";
import { Agents } from "@/components/home/agents";
import { SubjectTiles } from "@/components/home/subject-tiles";
import { BandFade } from "@/components/home/topo";
import { StartSentence } from "@/components/home/start-sentence";
import { SamplePlan } from "@/components/home/sample-plan";
import { BeliefDemo } from "@/components/home/belief-demo";
import { PathList } from "@/components/home/path-list";
import { SiteOpeningAnimation } from "@/components/site-opening-animation";
import { SiteFooter } from "@/components/site-footer";
import { useLenis } from "@/components/smooth-scroll";
import { isInternalNavigation, clearInternalNavigationFlag } from "@/lib/navigation-tracker";

export default function LandingPage() {
  const lenis = useLenis();
  const supabase = createClient();
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Animation states - only play on initial visit or refresh, NEVER on internal route hop back to home
  const [animationActive, setAnimationActive] = useState(() => !isInternalNavigation());
  const [pageRevealed, setPageRevealed] = useState(() => isInternalNavigation());
  const [animationDone, setAnimationDone] = useState(() => isInternalNavigation());

  // Roadmaps state
  const [roadmaps, setRoadmaps] = useState<RoadmapSummary[]>([]);
  const [isLoadingRoadmaps, setIsLoadingRoadmaps] = useState(true);

  // 1. Initial user & roadmaps load with live auth listener
  useEffect(() => {
    let isMounted = true;

    // Safety timeout: Guarantee that after 2.5 seconds, the loading spinner is dismissed no matter what
    const safetyTimer = setTimeout(() => {
      if (isMounted) {
        setIsLoadingRoadmaps(false);
      }
    }, 2500);

    async function loadData(targetUser?: any) {
      setIsLoadingRoadmaps(true);
      try {
        let user = targetUser;
        if (user === undefined) {
          const { data: authData } = await supabase.auth.getUser();
          user = authData?.user ?? null;
        }
        if (!isMounted) return;
        setCurrentUser(user);

        const loaded = await getUserRoadmaps(user ? user.id : "guest");
        if (!isMounted) return;
        setRoadmaps(loaded);
      } catch (err) {
        console.warn("Notice loading user roadmaps:", err);
      } finally {
        clearTimeout(safetyTimer);
        setIsLoadingRoadmaps(false);
      }
    }

    loadData();

    // Listen to Supabase auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;
      if (event === "SIGNED_OUT" || !session?.user) {
        setCurrentUser(null);
        setIsLoadingRoadmaps(true);
        try {
          const guestRoadmaps = await getUserRoadmaps("guest");
          if (isMounted) {
            setRoadmaps(guestRoadmaps);
          }
        } finally {
          setIsLoadingRoadmaps(false);
        }
      } else if (event === "SIGNED_IN" || event === "USER_UPDATED") {
        loadData(session?.user);
      }
    });

    // Listen to custom global auth events (dispatched from navbar logout immediately)
    const handleCustomAuthChange = async (e: Event) => {
      const customEvent = e as CustomEvent;
      if (!isMounted) return;
      if (customEvent.detail?.event === "SIGNED_OUT") {
        setCurrentUser(null);
        setIsLoadingRoadmaps(true);
        try {
          const guestRoadmaps = await getUserRoadmaps("guest");
          if (isMounted) {
            setRoadmaps(guestRoadmaps);
          }
        } finally {
          setIsLoadingRoadmaps(false);
        }
      } else if (customEvent.detail?.session?.user) {
        loadData(customEvent.detail.session.user);
      } else {
        loadData();
      }
    };

    window.addEventListener("roadmap-auth-state-changed", handleCustomAuthChange);

    return () => {
      isMounted = false;
      clearTimeout(safetyTimer);
      subscription?.unsubscribe();
      window.removeEventListener("roadmap-auth-state-changed", handleCustomAuthChange);
    };
  }, []);

  // 2. Lock scroll to top & prevent browser jump on refresh
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Disable browser native scroll restoration on refresh
      if ("scrollRestoration" in history) {
        history.scrollRestoration = "manual";
      }

      // If it's a fresh load or browser refresh (not internal route hop), enforce top scroll
      if (!isInternalNavigation()) {
        window.scrollTo(0, 0);
        if (lenis) {
          lenis.scrollTo(0, { immediate: true });
        }

        // If page has a hash anchor on reload (e.g. user refreshed on /#portfolio),
        // clear it immediately so it doesn't jump down past the hero!
        if (window.location.hash) {
          window.history.replaceState(null, "", window.location.pathname);
        }
      }

      // If returning via internal navigation, guarantee intro animation is skipped
      if (isInternalNavigation()) {
        setAnimationActive(false);
        setPageRevealed(true);
        setAnimationDone(true);
        const timer = setTimeout(() => {
          clearInternalNavigationFlag();
        }, 600);
        return () => clearTimeout(timer);
      }
    }

    const handleReplay = () => {
      setAnimationActive(true);
      setPageRevealed(false);
      setAnimationDone(false);
      window.scrollTo(0, 0);
      if (lenis) {
        lenis.scrollTo(0, { immediate: true });
      }
    };

    window.addEventListener("roadmap-replay-site-intro", handleReplay);
    return () => window.removeEventListener("roadmap-replay-site-intro", handleReplay);
  }, [lenis]);

  // 3. Handle direct hash navigation e.g. clicking Curricula in the navbar AFTER animation is complete
  useEffect(() => {
    if (animationActive) return;

    const handleHashScroll = (smooth = true) => {
      if (typeof window === "undefined") return;
      const currentHash = window.location.hash.replace("#", "");

      if (currentHash === "portfolio") {
        const el = document.getElementById("portfolio");
        if (el) {
          if (lenis) {
            lenis.scrollTo(el, { offset: -60, duration: smooth ? 1.0 : 0 });
          } else {
            el.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
          }
        }
      }
    };

    const onHashChange = () => handleHashScroll(true);
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, [animationActive, lenis]);

  const scrollToStart = () => {
    const el = document.getElementById("architecture");
    if (!el) return;
    if (lenis) lenis.scrollTo(el, { offset: 0, duration: 1.2 });
    else el.scrollIntoView({ behavior: "smooth" });
  };

  const hasOwnPaths = roadmaps.some((r) => !r.id.startsWith("demo-"));
  // Show at most four: your own paths if you have any, otherwise the samples
  const listedPaths = hasOwnPaths ? roadmaps.filter((r) => !r.id.startsWith("demo-")) : roadmaps;
  const shownPaths = listedPaths.slice(0, 4);

  return (
    <main className="relative min-h-screen w-full bg-background text-foreground font-sans overflow-x-hidden">
      {/* Opening intro: the logo blurs in, glides to the top, then the page blurs into focus */}
      {animationActive && (
        <SiteOpeningAnimation
          onRevealStart={() => {
            setPageRevealed(true);
            if (typeof window !== "undefined") {
              window.dispatchEvent(new CustomEvent("roadmap-reveal-start"));
            }
          }}
          onComplete={() => {
            setPageRevealed(true);
            setAnimationDone(true);
          }}
        />
      )}

      <div
        key="hero-content-wrapper"
        className={`w-full flex flex-col ${animationDone ? "" : `intro-reveal ${pageRevealed ? "is-revealed" : ""}`}`}
      >
        {/* ================= Opening screen: a trail map up to the summit ================= */}
        <section
          id="cockpit"
          data-nav-dark
          aria-label="Daari"
          className="relative h-[100svh] min-h-[620px] w-full shrink-0 overflow-hidden bg-[#0d0b09] text-[#f6efe6] select-none"
        >
          <HeroMap drawn={pageRevealed} />

          <div className="relative z-10 mx-auto flex h-full w-full max-w-7xl flex-col justify-end px-6 pb-6 sm:px-10 sm:pb-8">
            <div className="home-hero-in max-w-[62rem]">
              <Label className="text-[#e9dfd2]/65">
                ( <span className="font-kn normal-case tracking-normal text-[13px]">ದಾರಿ</span> &nbsp;daari, Kannada for
                the path )
              </Label>
              <h1 className="mt-6 font-display text-[clamp(3.1rem,8.4vw,8.75rem)] font-medium leading-[0.9] tracking-[-0.045em] text-[#f6efe6]">
                Find your way
                <br />
                into <span className="font-serif font-normal tracking-[-0.03em] text-saffron">anything.</span>
              </h1>
            </div>

            <div className="home-hero-in home-hero-in-late mt-10 grid grid-cols-1 items-end gap-6 border-t border-[#e9dfd2]/20 pt-5 sm:mt-14 md:grid-cols-12">
              <a
                href="#architecture"
                onClick={(e) => {
                  e.preventDefault();
                  scrollToStart();
                }}
                className="hidden font-mono text-[11px] uppercase tracking-[0.18em] text-[#e9dfd2]/60 transition-colors hover:text-[#f6efe6] md:col-span-3 md:block"
              >
                ( Scroll ) <span className="inline-block animate-bounce">↓</span>
              </a>
              <p className="max-w-md text-base leading-relaxed text-[#e9dfd2]/80 sm:text-lg md:col-span-5">
                Pick a subject and the time you have. Daari lays out the way, one day at a time, and checks that you
                understood before you move on.
              </p>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-3 md:col-span-4 md:justify-end">
                <button
                  type="button"
                  onClick={() => startPath()}
                  className="inline-flex h-12 cursor-pointer items-center gap-2 rounded-full bg-saffron px-6 text-base font-semibold text-black transition-colors hover:bg-orange-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f6efe6]"
                >
                  <Plus className="size-4 stroke-[2.5]" />
                  Start a path
                </button>
                <a
                  href="#architecture"
                  onClick={(e) => {
                    e.preventDefault();
                    scrollToStart();
                  }}
                  className="text-base font-semibold text-[#f6efe6] underline decoration-[#f6efe6]/30 underline-offset-[6px] transition-colors hover:decoration-saffron"
                >
                  See how it works
                </a>
              </div>
            </div>
          </div>
        </section>
        <BandFade to="page" />

        {/* ================= Why: one plain statement ================= */}
        <section id="architecture" className="scroll-mt-0 mx-auto w-full max-w-7xl px-6 pb-24 pt-10 sm:px-10 sm:pb-36 sm:pt-16">
          <Reveal className="grid grid-cols-1 gap-8 lg:grid-cols-12">
            <Label className="lg:col-span-3 lg:pt-4">( Why Daari )</Label>
            <p className="font-display text-[clamp(2.1rem,4.6vw,4.5rem)] font-medium leading-[1.02] tracking-[-0.03em] text-balance lg:col-span-9">
              Learning something new is hard enough.{" "}
              <span className="font-serif font-normal text-muted-foreground">Finding the way shouldn’t be.</span>
            </p>
          </Reveal>

          <div className="mt-16 grid grid-cols-1 items-end gap-10 sm:mt-24 lg:grid-cols-12">
            <Reveal className="lg:col-span-5">
              <p aria-hidden="true" className="home-outline font-kn text-[7rem] leading-none sm:text-[11rem]">
                ದಾರಿ
              </p>
            </Reveal>
            <Reveal delay={120} className="space-y-4 text-base leading-relaxed text-muted-foreground sm:text-lg lg:col-span-6 lg:col-start-7">
              <p>
                Most courses hand everyone the same outline. Daari works out what fits your time, puts the steps in
                order, and checks that you really understood each one.
              </p>
              <p>
                The name is Kannada for <em className="font-serif not-italic text-foreground">path</em>. That is the
                whole idea: you say where you want to get to, and Daari shows you the way there.
              </p>
            </Reveal>
          </div>
        </section>

        {/* ================= How it works: four numbered steps ================= */}
        <div className="mx-auto w-full max-w-7xl px-6 pb-24 sm:px-10 sm:pb-32">
          <Reveal className="mb-12 grid grid-cols-1 gap-6 sm:mb-16 lg:grid-cols-12">
            <Label className="lg:col-span-3 lg:pt-3">( How it works )</Label>
            <h2 className="font-display text-4xl font-medium leading-[1.02] tracking-[-0.03em] text-balance sm:text-6xl lg:col-span-9">
              Four steps from not knowing to knowing.
            </h2>
          </Reveal>

          <Chapter number="01" label="Say where" title="Tell Daari where you want to get to." aside={<StartSentence />}>
            <p>Any subject, at any pace. Daari works out the steps in between.</p>
          </Chapter>

          <Chapter number="02" label="See the way" title="See the whole way before you start." aside={<SamplePlan />}>
            <p>Your subject becomes days, and each day becomes a few topics that fit the hours you have.</p>
            <p>Nothing is hidden. Look ahead, skip what you know, or start in the middle.</p>
          </Chapter>

          <Chapter
            number="03"
            label="Learn"
            title="Take one topic at a time."
            aside={
              <figure className="border-l-2 border-saffron pl-6 sm:pl-10">
                <blockquote className="font-serif text-2xl leading-snug text-foreground sm:text-[2.1rem]">
                  “To the uninitiated, holding a classical guitar might seem as simple as picking up an object and
                  resting it across one&rsquo;s lap. However, in the classical guitar tradition, posture is not a
                  static pose.”
                </blockquote>
                <figcaption className="mt-6">
                  <Label>From a lesson Daari wrote on classical guitar posture</Label>
                </figcaption>
              </figure>
            }
          >
            <p>
              Each topic opens into a full lesson, written for your level and the minutes you set aside, with practice
              to do and places to read further.
            </p>
            <p>Daari can make mistakes, so check anything important.</p>
          </Chapter>

          <div className="border-b border-foreground/15">
            <Chapter number="04" label="Prove it" title="Prove it to yourself." aside={<BeliefDemo />}>
              <p>
                Reading is not the same as knowing. The Socratic AI writes down what you believe, finds the weakest
                part, and tries to break it.
              </p>
              <p>If your reasoning holds, the topic is done.</p>
            </Chapter>
          </div>
        </div>

        {/* ================= The three agents ================= */}
        <Agents />

        {/* ================= Somewhere to start ================= */}
        <section className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-12 px-6 py-24 sm:px-10 sm:py-32 lg:grid-cols-12">
          <Reveal className="lg:col-span-4">
            <Label>( Somewhere to start )</Label>
            <h2 className="mt-6 font-display text-4xl font-medium leading-[1.02] tracking-[-0.03em] sm:text-5xl">
              Or pick one of these.
            </h2>
            <p className="mt-5 max-w-sm text-base leading-relaxed text-muted-foreground sm:text-lg">
              Each one opens the start form already filled in. Change anything you like.
            </p>
          </Reveal>
          <div className="lg:col-span-8">
            <SubjectTiles />
          </div>
        </section>

        {/* ================= Paths ================= */}
        <section
          id="portfolio"
          className="mx-auto grid w-full max-w-7xl scroll-mt-24 grid-cols-1 gap-12 border-t border-foreground/15 px-6 py-24 sm:px-10 sm:py-32 lg:grid-cols-12"
        >
          <Reveal className="lg:col-span-4">
            <Label>( {hasOwnPaths ? "Yours" : "Samples"} )</Label>
            <h2 className="mt-6 font-display text-4xl font-medium leading-[1.02] tracking-[-0.03em] sm:text-5xl">
              {hasOwnPaths ? "Your paths" : "Paths you could walk"}
            </h2>
            <p className="mt-5 max-w-sm text-base leading-relaxed text-muted-foreground sm:text-lg">
              {hasOwnPaths
                ? "Pick up where you stopped. The line shows how far you have come."
                : "These are samples. Open one to look around, or start your own."}
            </p>
          </Reveal>
          <Reveal delay={120} className="lg:col-span-7 lg:col-start-6">
            {isLoadingRoadmaps ? (
              <p className="flex items-center gap-2.5 py-6 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin text-saffron" />
                Loading paths
              </p>
            ) : roadmaps.length > 0 ? (
              <>
                <PathList roadmaps={shownPaths} signedIn={Boolean(currentUser)} />
                {listedPaths.length > shownPaths.length && (
                  <Link
                    href="/studio"
                    className="mt-6 inline-flex items-center gap-2 border-b border-foreground/30 pb-1 text-base font-semibold text-foreground transition-colors hover:border-saffron"
                  >
                    See all {listedPaths.length} paths in Studio
                    <ArrowRight className="size-4" />
                  </Link>
                )}
              </>
            ) : (
              <p className="py-6 text-base text-muted-foreground">
                Your paths could not be loaded. Refresh the page to try again.
              </p>
            )}
          </Reveal>
        </section>

        {/* ================= Closing ================= */}
        <section className="mx-auto w-full max-w-7xl px-6 pb-24 pt-8 sm:px-10 sm:pb-32">
          <Reveal>
            <p className="font-display text-[clamp(3.25rem,11vw,11rem)] font-medium leading-[0.88] tracking-[-0.05em]">
              The first step
              <br />
              <span className="font-serif font-normal tracking-[-0.03em] text-saffron">is small.</span>
            </p>
          </Reveal>
          <Reveal
            delay={120}
            className="mt-12 flex flex-col gap-6 border-t border-foreground/15 pt-6 sm:flex-row sm:items-center sm:justify-between"
          >
            <p className="text-lg text-muted-foreground">One subject, one day, one topic.</p>
            <button
              type="button"
              onClick={() => startPath()}
              className="inline-flex h-12 w-fit cursor-pointer items-center gap-2 rounded-full bg-saffron px-7 text-base font-semibold text-black transition-colors hover:bg-orange-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-saffron"
            >
              Start a path
              <ArrowRight className="size-4" />
            </button>
          </Reveal>
        </section>

        <SiteFooter />
      </div>
    </main>
  );
}
