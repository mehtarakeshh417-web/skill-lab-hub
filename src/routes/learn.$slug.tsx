import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { ArrowLeft, Play, RotateCcw, Save } from "lucide-react";
import { toast } from "sonner";
import { LiveEditor, isLiveEditor, EDITOR_REGISTRY } from "@/components/coding-lab/editors";

export const Route = createFileRoute("/learn/$slug")({
  head: () => ({ meta: [{ title: "Practice · Avartan Skill Lab" }] }),
  component: LearnPage,
});

const TECH_INFO: Record<string, { name: string; desc: string; sample: string; lang: "html" | "python" | "sql" | "java" | "other" }> = {
  html: {
    name: "HTML",
    desc: "Write HTML and see it render live in the preview pane.",
    sample: `<!DOCTYPE html>
<html>
  <head>
    <title>My first page</title>
    <style>
      body { font-family: system-ui; padding: 2rem; background: linear-gradient(135deg, #6366f1, #ec4899); color: white; }
      h1 { font-size: 2.5rem; }
    </style>
  </head>
  <body>
    <h1>Hello, Avartan! 👋</h1>
    <p>Edit this code on the left and watch it update here.</p>
  </body>
</html>`,
    lang: "html",
  },
  python: {
    name: "Python",
    desc: "Write Python code. Run it to see output in the console.",
    sample: `# Welcome to Python!\nname = "Avartan"\nfor i in range(3):\n    print(f"Hello {name} {i+1}")`,
    lang: "python",
  },
  java: {
    name: "Java",
    desc: "Write Java code. Compile and view output.",
    sample: `public class Main {\n  public static void main(String[] args) {\n    System.out.println("Hello, Avartan!");\n  }\n}`,
    lang: "java",
  },
  mysql: {
    name: "MySQL",
    desc: "Practice SQL queries and design schemas.",
    sample: `SELECT name, score\nFROM students\nWHERE score > 80\nORDER BY score DESC;`,
    lang: "sql",
  },
  "scratch-jr": { name: "Scratch Junior", desc: "Block-based coding for early learners.", sample: "", lang: "other" },
  scratch: { name: "Scratch", desc: "Drag-and-drop block programming.", sample: "", lang: "other" },
  paint: { name: "Paint", desc: "Digital drawing canvas.", sample: "", lang: "other" },
  editor: { name: "Word Editor", desc: "Word-processor practice.", sample: "", lang: "other" },
  spreadsheet: { name: "Spreadsheet", desc: "Tables, formulas, and charts.", sample: "", lang: "other" },
  presentation: { name: "Presentation", desc: "Build slide decks.", sample: "", lang: "other" },
};

function LearnPage() {
  const { slug } = useParams({ from: "/learn/$slug" });
  const live = isLiveEditor(slug);
  const liveTitle = live ? EDITOR_REGISTRY[slug].title : null;
  const info = TECH_INFO[slug] ?? { name: slug, desc: "Practice workspace", sample: "", lang: "other" as const };
  const [code, setCode] = useState(info.sample);
  const [output, setOutput] = useState("");
  const [preview, setPreview] = useState(info.sample);

  function run() {
    if (info.lang === "html") {
      setPreview(code);
      toast.success("Preview updated");
    } else {
      setOutput(`▶ Ran ${info.name}\n--------------------\n(Simulated runtime — full ${info.name} execution lands soon)\n\nYour code:\n${code}`);
      toast.success(`${info.name} executed`);
    }
  }

  function reset() {
    setCode(info.sample);
    setPreview(info.sample);
    setOutput("");
  }

  return (
    <AppShell requireRole="student" title={`Practice · ${liveTitle ?? info.name}`}>
      <div className="mb-4 flex items-center justify-between">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/student"><ArrowLeft className="h-4 w-4" /> Back to lab</Link>
        </Button>
        <div className="flex items-center gap-2">
          {!live && (
            <>
          <Button variant="outline" size="sm" onClick={reset}><RotateCcw className="h-4 w-4" /> Reset</Button>
          <Button variant="soft" size="sm" onClick={() => toast.success("Snippet saved")}><Save className="h-4 w-4" /> Save</Button>
          {info.lang !== "other" && (
            <Button variant="hero" size="sm" onClick={run}><Play className="h-4 w-4" /> Run</Button>
          )}
            </>
          )}
        </div>
      </div>

      {live ? (
        <LiveEditor slug={slug} />
      ) : info.lang === "other" ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-16 text-center">
          <div className="font-display text-2xl font-semibold">{info.name} workspace</div>
          <p className="mt-2 text-sm text-muted-foreground">{info.desc}</p>
          <p className="mt-6 text-sm text-muted-foreground">Interactive {info.name} module launches in the next release.</p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-elegant">
            <div className="flex items-center justify-between border-b border-border bg-secondary/40 px-4 py-2">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-destructive/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-warning/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-success/70" />
              </div>
              <div className="text-xs font-medium text-muted-foreground">editor · {info.lang}</div>
            </div>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              spellCheck={false}
              className="block h-[60vh] w-full resize-none bg-transparent p-4 font-mono text-sm leading-relaxed outline-none"
            />
          </div>
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-elegant">
            <div className="flex items-center justify-between border-b border-border bg-secondary/40 px-4 py-2">
              <div className="text-xs font-medium text-muted-foreground">
                {info.lang === "html" ? "live preview" : "output"}
              </div>
            </div>
            {info.lang === "html" ? (
              <iframe
                title="preview"
                srcDoc={preview}
                sandbox="allow-scripts"
                className="h-[60vh] w-full bg-white"
              />
            ) : (
              <pre className="h-[60vh] overflow-auto p-4 font-mono text-sm leading-relaxed">{output || `Press Run to execute your ${info.name} code.`}</pre>
            )}
          </div>
        </div>
      )}
    </AppShell>
  );
}