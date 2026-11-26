import type { Metadata } from "next";
import Link from "next/link";
import { DaariWordmark } from "@/components/daari-wordmark";
import { PathStop } from "@/components/path";
import { SiteFooter } from "@/components/site-footer";
import { ArrowRight } from "@/components/ui/icons";

export const metadata: Metadata = {
  title: "About | Daari",
  description: "Daari is the Kannada word for path. The story behind the name.",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans overflow-x-clip transition-colors duration-200">
      <main className="mx-auto max-w-4xl px-6 sm:px-10 pt-44 sm:pt-48 pb-12">
        <header className="mb-20 sm:mb-28">
          <h1>
            <span className="sr-only">Daari</span>
            <DaariWordmark className="h-28 w-auto overflow-visible sm:h-36" />
          </h1>
          <p className="mt-6 text-xl sm:text-2xl text-muted-foreground">
            <span lang="kn" className="text-foreground">ದಾರಿ</span>, a path.
          </p>
        </header>

        <PathStop title="The name">
          <p>
            Daari is the Kannada word for path. It is an everyday word, the one you use when you ask a stranger for the
            way. Telugu speakers will recognise it too.
          </p>
          <p>
            That is what this is for. You say where you want to get to, and Daari lays out the way there, one day at a
            time.
          </p>
        </PathStop>

        <PathStop
          kind="branch"
          title={
            <>
              The other word, saadi <span lang="tcy" className="font-normal text-muted-foreground">ಸಾದಿ</span>
            </>
          }
        >
          <p>
            Kannada and Tulu are both my mother tongues. Kannada is what I mostly speak out in the world. Tulu is what my
            family and I speak with each other. The place I come from is full of Tulu speakers, though I no longer live
            there.
          </p>
          <p>
            In Tulu, the word for path is saadi. I had to choose one of the two for the name. Daari is the one more people
            will know, so it went on the door. Saadi stays here, where the story is.
          </p>
        </PathStop>

        <PathStop title="One road, many ways of walking it">
          <blockquote className="font-serif text-2xl sm:text-3xl italic leading-snug text-foreground">
            Daari is the road we share. A saadi is the one you walk yourself.
          </blockquote>
          <p>
            Two people can learn the same subject and never take the same route. Where you start, how many hours you have
            and which ideas trip you up all change the way.
          </p>
        </PathStop>

        <PathStop title="How it works" last>
          <p>
            Pick any subject, how many days you have and how long you can study. Daari breaks it into days and topics and
            writes a lesson for each one.
          </p>
          <p>
            Then the Socratic AI checks whether you understood. It keeps track of what you believe, looks for the weakest
            part, and tries to break it. If your reasoning holds, you move on.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-4">
            <Link
              href="/studio"
              className="inline-flex h-11 items-center gap-2 rounded-full bg-foreground px-6 text-sm font-semibold text-background transition-opacity hover:opacity-90"
            >
              Open Studio
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/#portfolio"
              className="inline-flex h-11 items-center rounded-full border border-border px-6 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
            >
              See the paths
            </Link>
          </div>
        </PathStop>
      </main>
      <SiteFooter />
    </div>
  );
}
