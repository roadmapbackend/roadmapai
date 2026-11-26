import type { Metadata } from "next";
import "lenis/dist/lenis.css";
import "./globals.css";
import { Navbar } from "@/components/navbar";
import { PageTransition } from "@/components/page-transition";
import { SmoothScroll } from "@/components/smooth-scroll";
import { ScrollTelemetry } from "@/components/scroll-telemetry";
import { TelemetryToastContainer } from "@/components/ui/telemetry-toast";
import { CreateRoadmapDialog } from "@/components/create-roadmap-dialog";
import { QuotaExhaustedModal } from "@/components/quota-exhausted-modal";
import { AgentationAgent } from "@/components/agentation-agent";

export const metadata: Metadata = {
  title: "Daari | Find your way into anything",
  description: "Pick a subject and the time you have. Daari lays out the way, one day at a time, and checks that you understood.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased dark" suppressHydrationWarning>
      <head>
        {/* Modern Typography System: 1. Clash Display | 2. Atkinson Hyperlegible (Hyperlegible Sans) | 3. Sprat */}
        <link rel="preconnect" href="https://api.fontshare.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://fonts.googleapis.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />

        <link rel="stylesheet" href="https://api.fontshare.com/v2/css?f[]=clash-display@200,300,400,500,600,700&display=swap" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:ital,wght@0,400;0,700;1,400;1,700&display=swap" />

        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css" crossOrigin="anonymous" />
        <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js" crossOrigin="anonymous"></script>
        <script defer src="https://cdn.jsdelivr.net/npm/mermaid@10.9.1/dist/mermaid.min.js" crossOrigin="anonymous"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if ('scrollRestoration' in history) {
                  history.scrollRestoration = 'manual';
                }
                window.scrollTo(0, 0);
              } catch (e) {}
              try {
                const storedTheme = localStorage.getItem('theme');
                if (storedTheme === 'light') {
                  document.documentElement.classList.remove('dark');
                } else {
                  document.documentElement.classList.add('dark');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground selection:bg-[#d4f934] selection:text-[#08090b] transition-colors duration-200">
        <SmoothScroll>
          <ScrollTelemetry />
          <PageTransition
            chrome={
              <>
                <Navbar />
                <CreateRoadmapDialog />
              </>
            }
          >
            {children}
            <QuotaExhaustedModal />
          </PageTransition>
          <TelemetryToastContainer />
        </SmoothScroll>
        <AgentationAgent />
      </body>
    </html>
  );
}
