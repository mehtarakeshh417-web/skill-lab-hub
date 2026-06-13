import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { StatCard } from "@/components/stat-card";
import {
  BookOpen,
  Trophy,
  Flame,
  ClipboardList,
  Blocks,
  FileCode,
  Code2,
  Database,
  Palette,
  FileText,
  Table2,
  Presentation,
  ArrowRight,
} from "lucide-react";

export const Route = createFileRoute("/student")({
  head: () => ({ meta: [{ title: "Student Lab · Avartan Skill Lab" }] }),
  component: StudentDashboard,
});

const TECHS = [
  { slug: "scratch-jr", name: "Scratch Junior", desc: "Visual coding for early learners", icon: Blocks, gradient: "from-pink-500 to-rose-500" },
  { slug: "scratch", name: "Scratch", desc: "Drag-and-drop programming", icon: Blocks, gradient: "from-amber-500 to-orange-500" },
  { slug: "html", name: "HTML", desc: "Build webpages with live preview", icon: FileCode, gradient: "from-orange-500 to-red-500" },
  { slug: "python", name: "Python", desc: "Modern programming language", icon: Code2, gradient: "from-sky-500 to-indigo-500" },
  { slug: "java", name: "Java", desc: "Object-oriented programming", icon: Code2, gradient: "from-rose-500 to-pink-500" },
  { slug: "mysql", name: "MySQL", desc: "Query and design databases", icon: Database, gradient: "from-teal-500 to-emerald-500" },
  { slug: "paint", name: "Paint", desc: "Digital drawing canvas", icon: Palette, gradient: "from-fuchsia-500 to-purple-500" },
  { slug: "editor", name: "Word Editor", desc: "Word-processor practice", icon: FileText, gradient: "from-blue-500 to-indigo-500" },
  { slug: "spreadsheet", name: "Spreadsheet", desc: "Tables and formulas", icon: Table2, gradient: "from-green-500 to-emerald-500" },
  { slug: "presentation", name: "Presentation", desc: "Build slide decks", icon: Presentation, gradient: "from-yellow-500 to-amber-500" },
];

function StudentDashboard() {
  return (
    <AppShell requireRole="student" title="My Skill Lab">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Technologies started" value={0} icon={BookOpen} />
        <StatCard label="Lessons completed" value={0} icon={Trophy} />
        <StatCard label="Day streak" value={0} icon={Flame} />
        <StatCard label="Pending assignments" value={0} icon={ClipboardList} />
      </div>

      <div className="mt-10">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold tracking-tight">Practice technologies</h2>
            <p className="mt-1 text-sm text-muted-foreground">Pick a technology and start building. Your progress is saved.</p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {TECHS.map((t) => (
            <Link
              key={t.slug}
              to="/learn/$slug"
              params={{ slug: t.slug }}
              className="group relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-elegant transition-all hover:-translate-y-1 hover:shadow-elevated"
            >
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${t.gradient} text-white shadow-md`}>
                <t.icon className="h-6 w-6" />
              </div>
              <div className="mt-4 flex items-center justify-between">
                <div className="font-display text-lg font-semibold">{t.name}</div>
                <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
              </div>
              <div className="mt-1 text-sm text-muted-foreground">{t.desc}</div>
              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-secondary">
                <div className="h-full w-0 bg-gradient-brand transition-all" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </AppShell>
  );
}