# Kavindu Dilshan — 3D Portfolio

A single-page, animated 3D portfolio built with **vanilla HTML/CSS/JS + Three.js**.
No build step, no framework, no `npm install` — just static files you can host anywhere.

```
portfolio-3d/
├── index.html            ← main page (edit your details here)
├── project.html          ← project detail page (reads ?id=<slug>)
├── game.html             ← "Bug Hunt" 3D mini-game
├── resume.html           ← source for the CV  →  resume.pdf (the downloadable CV)
├── resume.pdf            ← generated CV (linked by the "Download CV" button)
├── css/style.css         ← theme & layout (colors = CSS variables at top; light + dark)
├── js/scene.js           ← Three.js 3D background (particles + floating solids)
├── js/main.js            ← nav, scroll reveal, typing effect, tilt cards, theme toggle
├── js/projects-data.js   ← project content (shared by index cards + detail page)
├── js/project.js         ← renders the detail page from projects-data.js
├── js/game.js            ← the Bug Hunt game logic
├── serve.js              ← tiny local preview server (node serve.js)
└── README.md
```

## ✨ Features

- **3D animated background** (Three.js): particle field + floating wireframe solids with mouse parallax
- **Light / dark theme toggle** in the nav — remembered via `localStorage`; the 3D scene recolors too
- **Project detail pages** — every card links to `project.html?id=<slug>`; edit content in `js/projects-data.js`
- **"Bug Hunt" 3D mini-game** (`game.html`) — click the red bugs, spare the green passing tests; 30-second round with a QA-themed rank at the end
- **Downloadable CV** — the hero "Download CV" button serves `resume.pdf`
- **Contact form** — wired for Netlify Forms (see deploy notes below)
- Responsive, accessible (`prefers-reduced-motion`), graceful WebGL fallback

### Regenerating the CV PDF
Edit `resume.html`, then re-print it to PDF (Windows, using Edge):
```powershell
& "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --headless --disable-gpu --no-pdf-header-footer --print-to-pdf="resume.pdf" "file:///FULL/PATH/TO/resume.html"
```
…or just open `resume.html` in any browser and **Print → Save as PDF**.

### Contact form (Netlify)
The form on the contact section uses **Netlify Forms** — it only collects submissions
once the site is deployed to Netlify (they appear in your Netlify dashboard under *Forms*).
On other hosts the form won't capture submissions; the email/LinkedIn/GitHub buttons below it
always work. No backend or config file needed — Netlify auto-detects the static form.

## ▶ Run it locally

Because it uses ES modules, **don't** double-click `index.html` (the `file://`
protocol blocks module imports). Serve it from a tiny local server instead:

**Option A — VS Code (easiest):** install the *Live Server* extension → right-click
`index.html` → **Open with Live Server**.

**Option B — Python:**
```bash
cd portfolio-3d
python -m http.server 5500
# open http://localhost:5500
```

**Option C — Node:**
```bash
cd portfolio-3d
npx serve .
```

## 🚀 Deploy (free hosting)

| Host | How |
|------|-----|
| **GitHub Pages** | Push this folder to a repo → Settings → Pages → deploy from `main` / root. Your site: `https://<user>.github.io/<repo>/` |
| **Netlify** | Drag the `portfolio-3d` folder onto [app.netlify.com/drop](https://app.netlify.com/drop) — instant URL. |
| **Vercel** | `vercel` in the folder, or import the repo at vercel.com. |
| **Cloudflare Pages** | Connect repo, build command: *(none)*, output dir: `/`. |

> Tip: to use a custom domain (e.g. `kavindu.dev`), all four hosts let you add one for free in their dashboard.

## ✏️ Customize

- **Text / projects:** edit `index.html` directly — each section is clearly commented.
- **Colors:** change the CSS variables in `:root` at the top of `css/style.css`
  (`--accent`, `--accent-2`, `--bg`, …).
- **3D look:** in `js/scene.js`, tweak `count` (particle density), the `defs` array
  (which wireframe solids appear), or `camera.position.z` (zoom).
- **Typing phrases:** edit the `phrases` array in `js/main.js`.

## ♿ Notes

- Respects `prefers-reduced-motion` (animations pause, one static 3D frame renders).
- Falls back gracefully if WebGL is unavailable — the gradient backdrop still shows.
- Fully responsive with a mobile slide-in menu.

---
Built with Three.js. © Kavindu Dilshan.
