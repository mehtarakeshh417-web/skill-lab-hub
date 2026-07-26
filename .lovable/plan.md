## Goal

Swap the generic Lucide placeholder icons used for technologies (Scratch, HTML, Python, Java, MySQL, Paint, Editor, Spreadsheet, Presentation, Scratch Jr) with the real, official brand logos, and reuse them consistently everywhere technologies appear.

## Logo sources (verified reachable)

Official brand marks come from the Simple Icons project (the maintained, official-source SVG set, CC0 licensed). Confirmed available: `python`, `html5`, `openjdk` (the official OpenJDK/Java mark), `mysql`, `scratch`, `libreofficewriter`, `libreofficecalc`, `libreofficeimpress`, `gimp`.

Mapping:

| Technology | Logo |
|---|---|
| Scratch / Scratch Junior | official Scratch cat mark |
| HTML | HTML5 shield |
| Python | Python two-snake mark |
| Java | OpenJDK / Duke mark |
| MySQL | MySQL dolphin |
| Paint | GIMP (open-source paint mark) |
| Editor | LibreOffice Writer |
| Spreadsheet | LibreOffice Calc |
| Presentation | LibreOffice Impress |
| General CS / Other | keep current Lucide fallback |

Microsoft Paint/Word/Excel/PowerPoint marks are deliberately avoided — those are trademarked product logos we cannot ship; the open-source equivalents are the correct, legally safe stand-ins for generic "Editor / Spreadsheet / Presentation / Paint" tools.

## Implementation

1. **Download the SVGs into the repo** at `src/assets/tech/*.svg` so nothing depends on a third-party CDN at runtime.
2. **New file `src/lib/tech-logos.tsx`** — a single registry mapping every technology name (including all `ASSIGNMENT_TECHNOLOGIES` values and the homepage `techs` names) to its logo, official brand colour, and gradient. Exports a `<TechLogo name="Python" className="..." />` component with a Lucide fallback for unmapped names.
3. **Homepage `src/routes/index.tsx`** — replace `t.icon` in the Technologies grid and the `LogoMarquee` sparkle placeholders with `<TechLogo>`, keeping the existing card layout, hover lift, and gradient glow.
4. **In-app surfaces** — use the same `<TechLogo>` in the technology chips/selects on teacher assignments, teacher/student projects, and the learning track cards, so the whole portal shows one consistent set of marks.
5. Logos render on the existing gradient tile with correct contrast in both light and dark themes.

## Constraints

Purely visual: no change to `ASSIGNMENT_TECHNOLOGIES` values, schemas, queries, state, or routing. Technology names stay exactly as stored today, so existing assignments/projects keep matching.
