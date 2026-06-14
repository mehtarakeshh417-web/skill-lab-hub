import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
  Code2,
  Sparkles,
  GraduationCap,
  ShieldCheck,
  BarChart3,
  Layers,
  ArrowRight,
  Blocks,
  FileCode,
  Database,
  Palette,
  FileText,
  Table2,
  Presentation,
  Star,
  Zap,
  CheckCircle2,
  Trophy,
  Globe,
  Users,
  Cpu,
  Play,
} from "lucide-react";
import heroImg from "@/assets/hero-3d.jpg";
import classroomImg from "@/assets/classroom.jpg";
import studentImg from "@/assets/student-portrait.jpg";
import auroraImg from "@/assets/aurora.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Avartan Skill Lab — Learn. Code. Create." },
      { name: "description", content: "Modern coding & digital-skills platform for schools, teachers, and students. Practice 10+ technologies in your browser." },
      { property: "og:title", content: "Avartan Skill Lab" },
      { property: "og:description", content: "Interactive learning portal for schools, teachers, and students." },
    ],
  }),
  component: Landing,
});

const techs = [
  { name: "Scratch Jr", icon: Blocks, color: "from-pink-500 to-rose-500" },
  { name: "Scratch", icon: Blocks, color: "from-amber-500 to-orange-500" },
  { name: "HTML", icon: FileCode, color: "from-orange-500 to-red-500" },
  { name: "Python", icon: Code2, color: "from-sky-500 to-indigo-500" },
  { name: "Java", icon: Code2, color: "from-rose-500 to-pink-500" },
  { name: "MySQL", icon: Database, color: "from-teal-500 to-emerald-500" },
  { name: "Paint", icon: Palette, color: "from-fuchsia-500 to-purple-500" },
  { name: "Editor", icon: FileText, color: "from-blue-500 to-indigo-500" },
  { name: "Spreadsheet", icon: Table2, color: "from-green-500 to-emerald-500" },
  { name: "Presentation", icon: Presentation, color: "from-yellow-500 to-amber-500" },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Hero />
      <LogoMarquee />
      <Technologies />
      <FeatureBento />
      <Roles />
      <Testimonials />
      <CTA />
      <Footer />
    </div>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-brand shadow-glow">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="font-display text-lg font-bold tracking-tight">
            Avartan<span className="text-primary"> Skill Lab</span>
          </div>
        </Link>
        <nav className="hidden items-center gap-8 text-sm font-medium text-muted-foreground md:flex">
          <a href="#technologies" className="hover:text-foreground">Technologies</a>
          <a href="#roles" className="hover:text-foreground">For You</a>
          <a href="#about" className="hover:text-foreground">About</a>
        </nav>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/auth">Sign in</Link>
          </Button>
          <Button variant="hero" size="sm" asChild>
            <Link to="/auth">Get started <ArrowRight className="h-4 w-4" /></Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Decorative background */}
      <div className="pointer-events-none absolute inset-0 grid-lines opacity-50 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" />
      <div className="pointer-events-none absolute -top-40 -left-32 h-[520px] w-[520px] rounded-full bg-primary/30 opacity-50 blur-3xl animate-blob" />
      <div className="pointer-events-none absolute -top-20 right-0 h-[420px] w-[420px] rounded-full bg-accent/40 opacity-40 blur-3xl animate-blob" style={{ animationDelay: "-6s" }} />
      <div className="pointer-events-none absolute bottom-0 left-1/3 h-[420px] w-[520px] rounded-full bg-primary-glow/30 opacity-40 blur-3xl animate-blob" style={{ animationDelay: "-12s" }} />

      <div className="relative mx-auto max-w-7xl px-6 pt-16 pb-24 md:pt-24 md:pb-32">
        <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_1fr]">
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-3 py-1 text-xs font-medium text-muted-foreground shadow-elegant backdrop-blur">
              <span className="relative flex h-2 w-2">
                <span className="absolute inset-0 animate-ping rounded-full bg-success/70" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
              </span>
              Version 1 · Now live for early schools
            </div>
            <h1 className="mt-6 font-display text-5xl font-bold leading-[1.02] tracking-tight md:text-7xl">
              The modern lab where
              <span className="block text-gradient">students learn to code.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground lg:mx-0">
              Ten technologies, one browser. Avartan Skill Lab gives schools a measurable,
              hands-on coding and digital-literacy program — without installing a single thing.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
              <Button variant="hero" size="xl" asChild className="animate-pulse-glow">
                <Link to="/auth">
                  Open the portal <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
              <Button variant="outline" size="xl" asChild className="group">
                <a href="#technologies">
                  <Play className="h-4 w-4 transition-transform group-hover:scale-110" /> Watch demo
                </a>
              </Button>
            </div>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-muted-foreground lg:justify-start">
              <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-success" /> Zero install</div>
              <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-success" /> Live preview</div>
              <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-success" /> Progress tracking</div>
            </div>
          </div>

          {/* Visual */}
          <div className="relative mx-auto w-full max-w-xl lg:max-w-none">
            <div className="absolute -inset-6 rounded-[2rem] bg-gradient-hero opacity-30 blur-2xl" />
            <div className="relative overflow-hidden rounded-[1.75rem] border border-border/60 bg-card shadow-elevated">
              <img
                src={heroImg}
                alt="Glassmorphic floating coding panels"
                width={1536}
                height={1024}
                className="h-auto w-full"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-primary/20 via-transparent to-accent/20 mix-blend-overlay" />
            </div>

            {/* Floating cards */}
            <div className="absolute -left-4 top-10 hidden animate-float rounded-2xl border border-border bg-card/95 p-3 shadow-elegant backdrop-blur md:flex md:items-center md:gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-brand text-primary-foreground">
                <Trophy className="h-5 w-5" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Lessons completed</div>
                <div className="font-display text-lg font-bold">1,284</div>
              </div>
            </div>
            <div className="absolute -right-4 bottom-10 hidden animate-float rounded-2xl border border-border bg-card/95 p-3 shadow-elegant backdrop-blur md:flex md:items-center md:gap-3" style={{ animationDelay: "-3s" }}>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-accent text-accent-foreground">
                <Zap className="h-5 w-5" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Live preview</div>
                <div className="font-display text-sm font-semibold">HTML · CSS · JS</div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-20 grid grid-cols-2 gap-6 rounded-3xl border border-border/60 bg-card/60 p-8 shadow-elegant backdrop-blur md:grid-cols-4">
          {[
            { k: "10+", v: "Technologies", icon: Cpu },
            { k: "5", v: "Role dashboards", icon: Users },
            { k: "0", v: "Software to install", icon: Globe },
            { k: "24/7", v: "Cloud workspace", icon: Sparkles },
          ].map((s) => (
            <div key={s.v} className="flex items-center gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-brand text-primary-foreground shadow-glow">
                <s.icon className="h-5 w-5" />
              </div>
              <div>
                <div className="font-display text-2xl font-bold leading-none md:text-3xl">{s.k}</div>
                <div className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">{s.v}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function LogoMarquee() {
  const items = ["Scratch Jr", "Scratch", "HTML", "Python", "Java", "MySQL", "Paint", "Editor", "Spreadsheet", "Presentation"];
  return (
    <section className="border-y border-border bg-card/40">
      <div className="mx-auto max-w-7xl px-6 py-6">
        <div className="flex items-center gap-6">
          <div className="hidden shrink-0 text-xs font-semibold uppercase tracking-widest text-muted-foreground md:block">
            Covers
          </div>
          <div className="relative flex-1 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
            <div className="flex w-max animate-marquee gap-12 whitespace-nowrap py-2">
              {[...items, ...items].map((it, i) => (
                <div key={i} className="flex items-center gap-2 font-display text-lg font-semibold text-muted-foreground/70">
                  <Sparkles className="h-4 w-4 text-primary/70" /> {it}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Technologies() {
  return (
    <section id="technologies" className="relative overflow-hidden border-t border-border bg-gradient-surface py-24">
      <div className="pointer-events-none absolute inset-0 dot-grid opacity-40 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
            <Sparkles className="h-3.5 w-3.5" /> Practice
          </div>
          <h2 className="mt-4 font-display text-4xl font-bold tracking-tight md:text-5xl">
            Ten technologies, <span className="text-gradient">one ecosystem</span>
          </h2>
          <p className="mt-4 text-muted-foreground">
            From Scratch Jr to MySQL — students practice inside the portal, save their work, and
            move at their own pace.
          </p>
        </div>
        <div className="mt-14 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {techs.map((t) => (
            <div
              key={t.name}
              className="group relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-elegant transition-all hover:-translate-y-1.5 hover:border-primary/40 hover:shadow-elevated"
            >
              <div className={`pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br ${t.color} opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-40`} />
              <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${t.color} text-white shadow-md`}>
                <t.icon className="h-5 w-5" />
              </div>
              <div className="font-semibold">{t.name}</div>
              <div className="mt-1 text-xs text-muted-foreground">Interactive practice</div>
              <ArrowRight className="absolute right-4 top-4 h-4 w-4 -translate-x-2 text-muted-foreground opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100 group-hover:text-primary" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeatureBento() {
  return (
    <section className="relative py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
            <Star className="h-3.5 w-3.5" /> Why Avartan
          </div>
          <h2 className="mt-4 font-display text-4xl font-bold tracking-tight md:text-5xl">
            Designed for <span className="text-gradient">real classrooms</span>
          </h2>
        </div>

        <div className="mt-14 grid gap-5 md:grid-cols-3 md:grid-rows-2">
          {/* Big card */}
          <div className="group relative col-span-2 row-span-2 overflow-hidden rounded-3xl border border-border bg-card p-8 shadow-elegant">
            <img src={classroomImg} alt="Students learning to code" loading="lazy" width={1024} height={1024} className="absolute inset-0 h-full w-full object-cover opacity-30 transition-transform duration-700 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-tr from-background via-background/80 to-transparent" />
            <div className="relative flex h-full flex-col justify-end">
              <div className="inline-flex w-fit items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                <Users className="h-3.5 w-3.5" /> Built for schools
              </div>
              <h3 className="mt-4 font-display text-3xl font-bold leading-tight md:text-4xl">
                A complete lab — without the lab.
              </h3>
              <p className="mt-3 max-w-md text-muted-foreground">
                Run a full digital-literacy program from a browser. Onboard classes, assign
                projects, evaluate work — all in one place.
              </p>
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-gradient-brand p-6 text-primary-foreground shadow-glow">
            <Zap className="h-7 w-7" />
            <div className="mt-6 font-display text-2xl font-bold leading-tight">Instant live preview</div>
            <p className="mt-2 text-sm text-primary-foreground/80">HTML & CSS render in real time as students type.</p>
          </div>

          <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-elegant">
            <div className="absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-accent/40 blur-3xl" />
            <BarChart3 className="h-7 w-7 text-primary" />
            <div className="mt-6 font-display text-2xl font-bold leading-tight">Measurable progress</div>
            <p className="mt-2 text-sm text-muted-foreground">Dashboards for admins, schools, teachers and students.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function Testimonials() {
  const items = [
    { quote: "Our teachers finally have one place to assign, grade and track everything.", name: "Priya Menon", role: "Coordinator, Greenwood Intl.", img: studentImg },
    { quote: "The live preview hooked my class on HTML in a single period.", name: "Arjun Rao", role: "CS Teacher, Vidya Public", img: studentImg },
    { quote: "Setup took an afternoon. Students were practicing the same day.", name: "Sara Khan", role: "Principal, Northstar Academy", img: studentImg },
  ];
  return (
    <section className="relative overflow-hidden border-t border-border bg-gradient-surface py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
            <Star className="h-3.5 w-3.5" /> Loved by educators
          </div>
          <h2 className="mt-4 font-display text-4xl font-bold tracking-tight md:text-5xl">
            Trusted by <span className="text-gradient">forward-thinking schools</span>
          </h2>
        </div>
        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {items.map((t) => (
            <figure key={t.name} className="group relative rounded-3xl border border-border bg-card p-7 shadow-elegant transition-all hover:-translate-y-1 hover:shadow-elevated">
              <div className="flex gap-0.5 text-accent">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-current" />
                ))}
              </div>
              <blockquote className="mt-4 font-display text-lg font-semibold leading-snug">
                "{t.quote}"
              </blockquote>
              <figcaption className="mt-6 flex items-center gap-3">
                <img src={t.img} alt={t.name} loading="lazy" width={48} height={48} className="h-12 w-12 rounded-full object-cover ring-2 ring-primary/30" />
                <div>
                  <div className="text-sm font-semibold">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.role}</div>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

function Roles() {
  const roles = [
    { icon: ShieldCheck, title: "Admin", desc: "Full platform visibility, analytics across schools, areas, and technologies." },
    { icon: Layers, title: "Portal Manager", desc: "Onboard schools, manage users, approve registrations, run operations." },
    { icon: GraduationCap, title: "School & Teacher", desc: "Organize classes & sections, assign projects, evaluate submissions." },
    { icon: Code2, title: "Student", desc: "Practice every technology in-browser, submit assignments, track progress." },
  ];
  return (
    <section id="roles" className="py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
            <Users className="h-3.5 w-3.5" /> Roles
          </div>
          <h2 className="mt-4 font-display text-4xl font-bold tracking-tight md:text-5xl">
            A role for <span className="text-gradient">every stakeholder</span>
          </h2>
        </div>
        <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {roles.map((r) => (
            <div key={r.title} className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-elegant transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-elevated">
              <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-brand opacity-0 blur-2xl transition-opacity group-hover:opacity-40" />
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-brand text-primary-foreground shadow-glow">
                <r.icon className="h-5 w-5" />
              </div>
              <div className="mt-4 font-display text-lg font-semibold">{r.title}</div>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{r.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section id="about" className="px-6 pb-24">
      <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[2rem] bg-gradient-hero p-12 text-center shadow-glow md:p-20">
        <img src={auroraImg} alt="" aria-hidden loading="lazy" className="absolute inset-0 h-full w-full object-cover opacity-50 mix-blend-screen" />
        <div className="absolute inset-0 dot-grid opacity-20" />
        <div className="absolute -top-20 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-accent/40 blur-3xl" />
        <div className="relative">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
            <BarChart3 className="h-7 w-7 text-primary-foreground" />
          </div>
          <h2 className="mt-6 font-display text-4xl font-bold tracking-tight text-primary-foreground md:text-6xl">
            Measure what your students <span className="block">actually learn.</span>
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-primary-foreground/85">
            Real-time dashboards for admins, schools, and teachers. Drill into every technology,
            every class, every student.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Button variant="accent" size="xl" asChild>
              <Link to="/auth">Enter the portal <ArrowRight className="h-5 w-5" /></Link>
            </Button>
            <Button variant="outline" size="xl" asChild className="border-white/30 bg-white/10 text-primary-foreground hover:bg-white/20 hover:text-primary-foreground">
              <a href="#technologies">Explore features</a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border bg-card/40">
      <div className="mx-auto max-w-7xl px-6 py-14">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-brand shadow-glow">
                <Sparkles className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="font-display text-lg font-bold tracking-tight">
                Avartan<span className="text-primary"> Skill Lab</span>
              </div>
            </div>
            <p className="mt-4 max-w-sm text-sm text-muted-foreground">
              The modern coding & digital-skills portal built for schools, teachers and students.
            </p>
          </div>
          <div>
            <div className="font-display text-sm font-semibold">Platform</div>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li><a href="#technologies" className="hover:text-foreground">Technologies</a></li>
              <li><a href="#roles" className="hover:text-foreground">Roles</a></li>
              <li><Link to="/auth" className="hover:text-foreground">Sign in</Link></li>
            </ul>
          </div>
          <div>
            <div className="font-display text-sm font-semibold">Company</div>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li><a href="#about" className="hover:text-foreground">About</a></li>
              <li><a href="#" className="hover:text-foreground">Privacy</a></li>
              <li><a href="#" className="hover:text-foreground">Terms</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-border pt-6 text-xs text-muted-foreground md:flex-row">
          <div>© {new Date().getFullYear()} Avartan Skill Lab. All rights reserved.</div>
          <div>Crafted for modern classrooms.</div>
        </div>
      </div>
    </footer>
  );
}
