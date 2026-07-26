export const PROJECT_TECHNOLOGIES = [
  "Scratch Junior",
  "Scratch",
  "HTML",
  "Python",
  "Java",
  "MySQL",
  "Paint",
  "Editor",
  "Spreadsheet",
  "Presentation",
] as const;

export type ProjectTechnology = (typeof PROJECT_TECHNOLOGIES)[number];

export const SUBMISSION_TYPES = [
  { value: "text", label: "Text answer" },
  { value: "screenshot", label: "Screenshot upload" },
  { value: "file", label: "Single file upload" },
  { value: "source_code", label: "Source code" },
  { value: "multi_file", label: "Multiple files" },
] as const;

export type SubmissionType = (typeof SUBMISSION_TYPES)[number]["value"];

export const PROJECT_STATUSES = [
  "assigned",
  "in_progress",
  "submitted",
  "under_review",
  "evaluated",
  "resubmit_requested",
] as const;

export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const STATUS_META: Record<
  ProjectStatus,
  { label: string; className: string }
> = {
  assigned: {
    label: "Assigned",
    className: "bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30",
  },
  in_progress: {
    label: "In Progress",
    className: "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30",
  },
  submitted: {
    label: "Submitted",
    className: "bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30",
  },
  under_review: {
    label: "Under Review",
    className: "bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-500/30",
  },
  evaluated: {
    label: "Evaluated",
    className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  },
  resubmit_requested: {
    label: "Resubmission Requested",
    className: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
  },
};

export type ProjectTemplate = {
  key: string;
  technology: ProjectTechnology;
  title: string;
  description: string;
  instructions: string;
  submissionType: SubmissionType;
  maxMarks: number;
};

export const PROJECT_TEMPLATES: ProjectTemplate[] = [
  {
    key: "scratchjr-my-story",
    technology: "Scratch Junior",
    title: "My Animated Story",
    description: "Build a three-scene animated story with characters that talk and move.",
    instructions:
      "1. Choose two characters and a background for each of three scenes.\n2. Make each character move and speak at least once.\n3. Use the page-change block to move between scenes.\n4. Take a screenshot of every scene and upload it.",
    submissionType: "screenshot",
    maxMarks: 50,
  },
  {
    key: "scratchjr-shapes-dance",
    technology: "Scratch Junior",
    title: "Shapes Dance Party",
    description: "Animate characters that dance in a repeating loop with sound.",
    instructions:
      "1. Add three characters on the stage.\n2. Use the repeat block so each one dances continuously.\n3. Add a recorded sound and start everything with the green flag.\n4. Upload a screenshot of your finished script.",
    submissionType: "screenshot",
    maxMarks: 40,
  },
  {
    key: "scratch-maze-game",
    technology: "Scratch",
    title: "Maze Escape Game",
    description: "Create a maze game where arrow keys guide a sprite to the goal.",
    instructions:
      "1. Draw a maze backdrop with clear walls.\n2. Move the sprite with the four arrow keys.\n3. Detect wall colour and send the sprite back to the start.\n4. Show a 'You win!' message at the goal.\n5. Share the project and paste your project link plus a screenshot.",
    submissionType: "multi_file",
    maxMarks: 100,
  },
  {
    key: "scratch-quiz-bot",
    technology: "Scratch",
    title: "Quiz Bot",
    description: "Build a sprite that asks five questions and keeps score.",
    instructions:
      "1. Create a list of five questions.\n2. Use ask and wait to collect answers.\n3. Keep a score variable and add one for each correct answer.\n4. Announce the final score at the end.",
    submissionType: "file",
    maxMarks: 60,
  },
  {
    key: "html-portfolio",
    technology: "HTML",
    title: "My Personal Portfolio Page",
    description: "A single responsive page introducing yourself with sections and styling.",
    instructions:
      "1. Use semantic tags: header, nav, main, section and footer.\n2. Add a photo with descriptive alt text.\n3. Style the page with CSS — colours, spacing and a readable font.\n4. Make it look correct on a phone screen.\n5. Submit your complete HTML and CSS code.",
    submissionType: "source_code",
    maxMarks: 100,
  },
  {
    key: "html-recipe-page",
    technology: "HTML",
    title: "Recipe Card Page",
    description: "Present a favourite recipe using lists, tables and images.",
    instructions:
      "1. Add a heading with the recipe name and an image.\n2. List the ingredients with an unordered list.\n3. Number the steps with an ordered list.\n4. Add a table with cooking time and servings.",
    submissionType: "source_code",
    maxMarks: 50,
  },
  {
    key: "python-calculator",
    technology: "Python",
    title: "Smart Calculator",
    description: "A menu-driven calculator with functions and input validation.",
    instructions:
      "1. Write a separate function for add, subtract, multiply and divide.\n2. Show a menu and repeat until the user chooses to exit.\n3. Handle divide-by-zero and non-numeric input gracefully.\n4. Submit your .py source code.",
    submissionType: "source_code",
    maxMarks: 100,
  },
  {
    key: "python-turtle-art",
    technology: "Python",
    title: "Turtle Graphics Art",
    description: "Draw a colourful geometric pattern with the turtle module.",
    instructions:
      "1. Import turtle and set up a screen.\n2. Use at least one loop to repeat the pattern.\n3. Change colours while drawing.\n4. Submit the code and a screenshot of the drawing.",
    submissionType: "multi_file",
    maxMarks: 60,
  },
  {
    key: "java-bank-account",
    technology: "Java",
    title: "Bank Account Simulator",
    description: "Model a bank account using a class with deposit and withdraw methods.",
    instructions:
      "1. Create a BankAccount class with private balance.\n2. Add deposit, withdraw and getBalance methods.\n3. Prevent overdrawing the account.\n4. Demonstrate it from a main method.",
    submissionType: "source_code",
    maxMarks: 100,
  },
  {
    key: "java-student-report",
    technology: "Java",
    title: "Student Report Generator",
    description: "Read marks for a class and print grades using arrays and loops.",
    instructions:
      "1. Store names and marks in arrays.\n2. Compute average, highest and lowest marks.\n3. Convert each mark into a letter grade.\n4. Print a neatly formatted report.",
    submissionType: "source_code",
    maxMarks: 80,
  },
  {
    key: "mysql-library-db",
    technology: "MySQL",
    title: "Library Database",
    description: "Design and query a small library database.",
    instructions:
      "1. Create books, members and loans tables with primary and foreign keys.\n2. Insert at least five rows in each table.\n3. Write queries for books on loan, overdue loans and most-borrowed titles.\n4. Submit your full SQL script.",
    submissionType: "source_code",
    maxMarks: 100,
  },
  {
    key: "mysql-school-queries",
    technology: "MySQL",
    title: "School Records Queries",
    description: "Practise joins and aggregate functions on school data.",
    instructions:
      "1. Create students and marks tables.\n2. Write a join listing every student with their subject marks.\n3. Use GROUP BY to find the class average per subject.\n4. Use ORDER BY and LIMIT to find the top three students.",
    submissionType: "source_code",
    maxMarks: 60,
  },
  {
    key: "paint-poster",
    technology: "Paint",
    title: "Environment Awareness Poster",
    description: "Design a poster using shapes, fills and text tools.",
    instructions:
      "1. Use at least four different tools.\n2. Include a slogan using the text tool.\n3. Fill areas with colour thoughtfully.\n4. Save as PNG and upload it.",
    submissionType: "file",
    maxMarks: 40,
  },
  {
    key: "editor-essay",
    technology: "Editor",
    title: "Formatted Essay",
    description: "Write and format a one-page essay in the word editor.",
    instructions:
      "1. Add a styled title and subheadings.\n2. Use bold, italic and bullet lists where useful.\n3. Justify paragraphs and set line spacing.\n4. Submit the document file.",
    submissionType: "file",
    maxMarks: 50,
  },
  {
    key: "spreadsheet-budget",
    technology: "Spreadsheet",
    title: "Monthly Budget Tracker",
    description: "Build a budget sheet with formulas and a chart.",
    instructions:
      "1. List income and expense categories.\n2. Use SUM and simple formulas to compute totals and savings.\n3. Apply currency formatting.\n4. Add a pie chart of expenses and upload the file.",
    submissionType: "file",
    maxMarks: 60,
  },
  {
    key: "spreadsheet-marks-analysis",
    technology: "Spreadsheet",
    title: "Marks Analysis Sheet",
    description: "Analyse class marks with functions and conditional formatting.",
    instructions:
      "1. Enter marks for at least ten students.\n2. Use AVERAGE, MAX, MIN and IF for pass or fail.\n3. Highlight failures with conditional formatting.\n4. Add a bar chart comparing subjects.",
    submissionType: "file",
    maxMarks: 60,
  },
  {
    key: "presentation-my-city",
    technology: "Presentation",
    title: "My City Presentation",
    description: "A five-slide deck with images, transitions and speaker notes.",
    instructions:
      "1. Slide 1: title and your name.\n2. Slides 2-4: history, places and food, each with an image.\n3. Slide 5: conclusion.\n4. Add transitions and speaker notes, then upload the deck.",
    submissionType: "file",
    maxMarks: 50,
  },
  {
    key: "presentation-tech-talk",
    technology: "Presentation",
    title: "Technology Talk",
    description: "Explain a technology you learnt this term in a short deck.",
    instructions:
      "1. Choose one technology from your syllabus.\n2. Cover what it is, why it matters and one example.\n3. Use consistent fonts and colours.\n4. Keep it to six slides.",
    submissionType: "file",
    maxMarks: 50,
  },
];

export function templatesFor(tech: string) {
  return PROJECT_TEMPLATES.filter((t) => t.technology === tech);
}

export function gradeFor(marks: number, maxMarks: number): string {
  if (maxMarks <= 0) return "-";
  const pct = (marks / maxMarks) * 100;
  if (pct >= 90) return "A+";
  if (pct >= 80) return "A";
  if (pct >= 70) return "B";
  if (pct >= 60) return "C";
  if (pct >= 50) return "D";
  if (pct >= 40) return "E";
  return "F";
}