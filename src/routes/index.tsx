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
} from "lucide-react";

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
      <Technologies />
      <Roles />
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
      <div className="absolute inset-0 dot-grid opacity-60" />
      <div className="absolute -top-32 left-1/2 h-[480px] w-[900px] -translate-x-1/2 rounded-full bg-gradient-hero opacity-20 blur-3xl" />
      <div className="relative mx-auto max-w-7xl px-6 pt-20 pb-24 md:pt-28 md:pb-32">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground shadow-elegant">
            <span className="flex h-1.5 w-1.5 rounded-full bg-success" />
            Version 1 · Now live for early schools
          </div>
          <h1 className="mt-6 font-display text-5xl font-bold leading-[1.05] tracking-tight md:text-7xl">
            The modern lab where
            <span className="block bg-gradient-hero bg-clip-text text-transparent">
              students learn to code.
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            Ten technologies, one browser. Avartan Skill Lab gives schools a measurable, hands-on
            coding and digital-literacy program — without installing a single thing.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Button variant="hero" size="xl" asChild>
              <Link to="/auth">
                Open the portal <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
            <Button variant="outline" size="xl" asChild>
              <a href="#technologies">Browse technologies</a>
            </Button>
          </div>
          <div className="mt-12 grid grid-cols-3 gap-6 text-left md:gap-12">
            {[
              { k: "10+", v: "Technologies" },
              { k: "5", v: "Role-based dashboards" },
              { k: "0", v: "Software to install" },
            ].map((s) => (
              <div key={s.v} className="text-center">
                <div className="font-display text-3xl font-bold text-foreground md:text-4xl">{s.k}</div>
                <div className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">{s.v}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Technologies() {
  return (
    <section id="technologies" className="border-t border-border bg-gradient-surface py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <div className="text-sm font-semibold uppercase tracking-wider text-primary">Practice</div>
          <h2 className="mt-2 font-display text-4xl font-bold tracking-tight">
            Ten technologies, one ecosystem
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
              className="group relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-elegant transition-all hover:-translate-y-1 hover:shadow-elevated"
            >
              <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${t.color} text-white shadow-md`}>
                <t.icon className="h-5 w-5" />
              </div>
              <div className="font-semibold">{t.name}</div>
              <div className="mt-1 text-xs text-muted-foreground">Interactive practice</div>
            </div>
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
          <div className="text-sm font-semibold uppercase tracking-wider text-primary">Built for everyone</div>
          <h2 className="mt-2 font-display text-4xl font-bold tracking-tight">A role for every stakeholder</h2>
        </div>
        <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {roles.map((r) => (
            <div key={r.title} className="rounded-2xl border border-border bg-card p-6 shadow-elegant">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-primary">
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
      <div className="mx-auto max-w-6xl overflow-hidden rounded-3xl bg-gradient-hero p-12 text-center shadow-glow md:p-16">
        <BarChart3 className="mx-auto h-10 w-10 text-primary-foreground/90" />
        <h2 className="mt-4 font-display text-4xl font-bold tracking-tight text-primary-foreground md:text-5xl">
          Measure what your students actually learn.
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-primary-foreground/80">
          Real-time dashboards for admins, schools, and teachers. Drill into every technology,
          every class, every student.
        </p>
        <div className="mt-8">
          <Button variant="accent" size="xl" asChild>
            <Link to="/auth">Enter the portal <ArrowRight className="h-5 w-5" /></Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border py-10">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-6 text-sm text-muted-foreground md:flex-row">
        <div>© {new Date().getFullYear()} Avartan Skill Lab. All rights reserved.</div>
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span>Crafted for modern classrooms.</span>
        </div>
      </div>
    </footer>
  );
}
