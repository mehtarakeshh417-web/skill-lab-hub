import { questionSchema, type QuestionInput } from "@/lib/objective-assignments.schema";

export type GenerateSpec = {
  technology: string;
  count: number;
  assignmentType: "mcq" | "true_false" | "fill_blank" | "mixed";
  difficulty: string;
  topic?: string;
};

type RawQuestion = {
  question_text?: string;
  question_type?: string;
  options?: string[] | null;
  correct_answer?: string;
  marks?: number;
};

function buildPrompt(spec: GenerateSpec) {
  const typeRule =
    spec.assignmentType === "mixed"
      ? "Spread the questions roughly evenly across the three types: mcq, true_false and fill_blank."
      : `Every question MUST use question_type "${spec.assignmentType}".`;

  return `You are creating a school assignment for the technology subject "${spec.technology}".
Generate exactly ${spec.count} objective questions at "${spec.difficulty}" difficulty${
    spec.topic ? ` focused on: ${spec.topic}` : ""
  }.
${typeRule}

Return STRICT JSON only (no markdown, no commentary) matching:
{"questions":[{"question_text":string,"question_type":"mcq"|"true_false"|"fill_blank","options":string[]|null,"correct_answer":string,"marks":number}]}

Rules:
- mcq: exactly 4 distinct plausible options; correct_answer must match one option verbatim.
- true_false: options ["True","False"]; correct_answer is "True" or "False"; the statement must be unambiguous.
- fill_blank: options null; the sentence must contain a blank written as "_____"; correct_answer is the single expected word or short phrase.
- Age-appropriate, factually correct, classroom safe, no duplicates.
- marks must be 1 for every question.`;
}

async function callGateway(prompt: string): Promise<string> {
  const lovableKey = process.env.LOVABLE_API_KEY;
  if (!lovableKey) throw new Error("AI is not configured for this portal.");

  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { "content-type": "application/json", "Lovable-API-Key": lovableKey },
    body: JSON.stringify({
      model: "google/gemini-3.6-flash",
      messages: [
        { role: "system", content: "You are an expert curriculum designer who outputs only valid JSON." },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (!resp.ok) {
    const body = await resp.text();
    if (resp.status === 429) throw new Error("AI is busy right now. Please try again in a moment.");
    if (resp.status === 402) throw new Error("AI credits are exhausted. Add credits in workspace settings.");
    throw new Error(`AI request failed [${resp.status}]: ${body.slice(0, 400)}`);
  }

  const json = (await resp.json()) as { choices?: Array<{ message?: { content?: string } }> };
  return json.choices?.[0]?.message?.content ?? "{}";
}

function normalize(raw: RawQuestion, forcedType: GenerateSpec["assignmentType"]): QuestionInput | null {
  const text = (raw.question_text ?? "").trim();
  const answer = (raw.correct_answer ?? "").trim();
  if (!text || !answer) return null;

  let type = (raw.question_type ?? "").trim() as QuestionInput["questionType"];
  if (!["mcq", "true_false", "fill_blank"].includes(type)) type = "mcq";
  if (forcedType !== "mixed") type = forcedType;

  let options: string[] = [];
  let correct = answer;

  if (type === "true_false") {
    options = ["True", "False"];
    correct = /^t(rue)?$/i.test(answer) ? "True" : "False";
  } else if (type === "mcq") {
    const cleaned = (Array.isArray(raw.options) ? raw.options : [])
      .map((o) => String(o ?? "").trim())
      .filter(Boolean);
    const unique = Array.from(new Set(cleaned));
    if (!unique.some((o) => o.toLowerCase() === correct.toLowerCase())) unique.unshift(correct);
    options = unique.slice(0, 6);
    if (options.length < 2) return null;
    correct = options.find((o) => o.toLowerCase() === correct.toLowerCase()) ?? options[0];
  } else {
    options = [];
  }

  const candidate = {
    questionText: text.slice(0, 4000),
    questionType: type,
    options,
    correctAnswers: [correct.slice(0, 600)],
    marks: typeof raw.marks === "number" && raw.marks > 0 ? Math.min(raw.marks, 100) : 1,
  };

  const parsed = questionSchema.safeParse(candidate);
  return parsed.success ? parsed.data : null;
}

export async function generateQuestions(spec: GenerateSpec): Promise<QuestionInput[]> {
  const content = await callGateway(buildPrompt(spec));

  let parsed: { questions?: RawQuestion[] };
  try {
    parsed = JSON.parse(content) as { questions?: RawQuestion[] };
  } catch {
    const match = content.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("AI returned unreadable output. Please try again.");
    try {
      parsed = JSON.parse(match[0]) as { questions?: RawQuestion[] };
    } catch {
      throw new Error("AI returned unreadable output. Please try again.");
    }
  }

  const questions = (parsed.questions ?? [])
    .map((q) => normalize(q, spec.assignmentType))
    .filter((q): q is QuestionInput => q !== null)
    .slice(0, spec.count);

  if (questions.length === 0) throw new Error("AI could not generate usable questions. Try a different topic or count.");
  return questions;
}
