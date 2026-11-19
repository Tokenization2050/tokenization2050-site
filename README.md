# Tokenization 2050 — website

The source for **www.tokenization2050.com**. The site is built from plain content files
(JSON) into a static website, which GitHub Pages hosts for free. No database, no cookies,
no trackers, no paid services.

You never edit HTML to publish news. You add **one JSON file** and the site rebuilds
itself in about a minute.

---

## Contents

1. [How the site works (in one minute)](#1-how-the-site-works-in-one-minute)
2. [Preview the site on your computer](#2-preview-the-site-on-your-computer)
3. [Add a news article](#3-add-a-news-article)
4. [Update the key figures (ticker and data)](#4-update-the-key-figures-ticker-and-data)
5. [Automate daily news with Make.com](#5-automate-daily-news-with-makecom)
6. [Publish on GitHub Pages with your domain](#6-publish-on-github-pages-with-your-domain)
7. [Change menus, sections and pages](#7-change-menus-sections-and-pages)
8. [Before going live: checklist](#8-before-going-live-checklist)
9. [Where things are](#9-where-things-are)

---

## 1. How the site works (in one minute)

```
content/  (you edit these)  ──►  build.js  ──►  site/  (finished website)
templates/ + static/ (design)                     │
                                                  ▼
                                  GitHub Pages publishes it
```

- **`content/`** holds everything that changes: articles, key figures, glossary, pages.
- **`templates/`** and **`static/css/`** hold the design. You rarely touch these.
- **`build.js`** combines the two and writes the finished site into **`site/`**.
- Every time you (or Make.com) save a change to GitHub, GitHub runs the build and
  publishes the new version automatically.

Never edit files inside `site/` — they are deleted and recreated on every build.

---

## 2. Preview the site on your computer

You need **Node.js** (version 20 or newer) installed: https://nodejs.org

Open a terminal in this folder and run:

```bash
npm install        # first time only — downloads the two small tools the build uses
npm run serve      # builds the site and starts a preview
```

Then open **http://localhost:8050** in your browser. Press `Ctrl + C` in the terminal to
stop the preview.

After changing a content file, stop the preview and run `npm run serve` again to see it.

**Preview with demo numbers:** `npm run preview` shows the site as it will look once
figures and articles exist: the moving ticker, the "Latest" headline strip, counters and
charts. It fills them with invented numbers from `dev/preview-data.json`, includes draft
articles, and shows a yellow **PREVIEW ONLY** bar on every page. It runs only on your
computer; the live site never uses it.

Other commands:

| Command         | What it does                                  |
|-----------------|-----------------------------------------------|
| `npm run build` | Builds the site into `site/` without preview  |
| `npm run clean` | Empties the `site/` folder                    |

---

## 3. Add a news article

### Step 1 — Create the file

Create a new file in **`content/articles/`**. Name it with the date and a short slug:

```
content/articles/2026-11-18-ubs-tokenized-fund-launch.json
```

### Step 2 — Fill it in

Copy this template and replace the values:

```json
{
  "id": "ubs-tokenized-fund-launch",
  "title": "UBS Launches Tokenized Money Market Fund on Ethereum",
  "section": "tokenized-funds",
  "summary": "One or two sentences that say what happened and why it matters.",
  "body": "First paragraph of the story.\n\nSecond paragraph.\n\n## A subheading\n\nMore text, with **bold** and [a link](https://example.com).",
  "sources": [
    { "label": "UBS press release", "url": "https://www.ubs.com/...", "date": "2026-11-18" }
  ],
  "publishedAt": "2026-11-18T09:30:00Z",
  "tags": ["ubs", "money-market-fund", "ethereum"]
}
```

What each field means:

| Field         | Required | What to put                                                                          |
|---------------|----------|--------------------------------------------------------------------------------------|
| `id`          | yes      | Short name for the web address. Lowercase, words joined with `-`. Must be unique.    |
| `title`       | yes      | The headline.                                                                         |
| `section`     | yes      | One of the section codes in the table below.                                          |
| `summary`     | yes      | 1–2 sentences. Shown on the home page, in search results and when shared.             |
| `body`        | yes      | The full text in Markdown. Use `\n\n` between paragraphs, `## ` for subheadings.     |
| `sources`     | yes      | List of sources (label, link, date). Every story must have at least one.              |
| `publishedAt` | yes      | Date and time **in UTC**, format `YYYY-MM-DDTHH:MM:00Z`.                              |
| `tags`        | no       | Keywords, lowercase.                                                                  |
| `updatedAt`   | no       | Add this (same format) when you correct or update a story.                            |
| `isSample`    | no       | `true` shows a yellow "SAMPLE" banner. Only for demo content.                         |

Section codes:

| Section code      | Shown as                        |
|-------------------|---------------------------------|
| `markets`         | Markets                         |
| `tokenized-funds` | Tokenized Funds & Treasuries    |
| `bonds-credit`    | Bonds & Credit                  |
| `stablecoins`     | Stablecoins & Payments          |
| `real-estate`     | Real Estate & Private Markets   |
| `regulation`      | Regulation                      |
| `infrastructure`  | Infrastructure & DLT            |
| `companies`       | Companies & People              |
| `analysis`        | Analysis                        |

The article will appear at `www.tokenization2050.com/<section>/<id>/` — for the example
above: `/tokenized-funds/ubs-tokenized-fund-launch/`.

### Step 3 — Publish

Upload the file to GitHub (see the next options). The newest article automatically
becomes the lead story on the home page, and is added to the RSS feed, JSON feed and
sitemap.

- **On github.com:** open the repository → `content/articles` → **Add file** →
  **Create new file** → paste → **Commit changes**.
- **Automatically:** see [section 5](#5-automate-daily-news-with-makecom).

### Common mistakes

- **The build fails / article missing:** the JSON is invalid. Usually a missing comma
  or a `"` inside the text. Write `\"` for quotation marks inside text, or use ’ “ ” .
  Paste the file into https://jsonlint.com to find the problem.
- **Wrong time:** `publishedAt` must end in `Z` (UTC). 10:30 in Rome in winter is
  `09:30:00Z`.
- **Two articles with the same `id`:** one overwrites the other. Keep ids unique.

---

## 4. Update the key figures (ticker and data)

The dark strip at the top of every page and the "Key RWA figures" cards come from
**`content/data.json`**.

```json
{
  "updatedAt": "2026-11-18T14:00:00Z",
  "source": "RWA.xyz, DefiLlama — compiled by Tokenization 2050",
  "ticker": [
    { "label": "Total RWA", "value": "$18.9B", "change": "+1.1%", "direction": "up" }
  ],
  "keyFigures": [
    {
      "label": "Total Tokenized RWA", "value": "$18.9B", "change": "+1.1%",
      "direction": "up", "period": "30d", "note": "Excludes stablecoins"
    }
  ]
}
```

- `direction` is `"up"` (green arrow) or `"down"` (red arrow).
- Always update `updatedAt` and name your `source` — readers see both.

> The home page currently says "Sample data for demonstration" under the figures.
> Remove that wording in `templates/home.njk` when you publish real numbers.

---

## 5. Automate daily news with Make.com

Make.com can publish an article by creating one file in the repository through the
GitHub API. GitHub then rebuilds and publishes the site on its own.

### One-time setup

1. **Create a GitHub token** for Make.com:
   github.com → your profile picture → **Settings** → **Developer settings** →
   **Personal access tokens** → **Fine-grained tokens** → **Generate new token**.
   - Repository access: **Only select repositories** → this repository.
   - Permissions → Repository permissions → **Contents: Read and write**.
   - Copy the token. Store it only in Make.com; never put it in a file in this repository.
2. In Make.com, add an **HTTP → Make a request** module at the end of your scenario.

### The request Make.com sends

| Setting   | Value                                                                                       |
|-----------|---------------------------------------------------------------------------------------------|
| URL       | `https://api.github.com/repos/OWNER/REPO/contents/content/articles/FILENAME.json`           |
| Method    | `PUT`                                                                                       |
| Headers   | `Authorization: Bearer YOUR_TOKEN`<br>`Accept: application/vnd.github+json`<br>`X-GitHub-Api-Version: 2022-11-28` |
| Body type | Raw → JSON                                                                                  |

Body:

```json
{
  "message": "Add article: UBS launches tokenized money market fund",
  "content": "{{base64(article JSON text)}}",
  "branch": "main"
}
```

- Replace `OWNER/REPO` with your GitHub account and repository name.
- `FILENAME` = date + id, e.g. `2026-11-18-ubs-tokenized-fund-launch`.
- `content` must be the **whole article JSON (from section 3) encoded in Base64**.
  In Make.com use the `base64()` function on the text you built.
- **Updating an existing file** (e.g. `content/data.json`): first send a `GET` to the same
  URL, take the `sha` value from the answer, and add `"sha": "..."` to the `PUT` body.
  Without it, GitHub refuses to overwrite the file.

About one to two minutes after Make.com runs, the article is live. You can watch progress
in the repository's **Actions** tab.

> Make.com must produce valid JSON. A broken file stops the build and nothing new is
> published until it is fixed (the previous version of the site stays online).
> Check the **Actions** tab if an article does not appear.

---

## 6. Publish on GitHub Pages with your domain

Publishing is already configured in `.github/workflows/deploy.yml`: every change pushed
to the `main` branch builds and publishes the site.

### One-time setup

1. **Create a repository** on github.com and upload this folder
   (everything except `node_modules/` and `site/`).
   Make sure **`package-lock.json` is included** — the build needs it.
2. In the repository: **Settings** → **Pages** → **Source:** select **GitHub Actions**.
3. Same page, **Custom domain:** enter `www.tokenization2050.com` → **Save**.
4. At your domain provider, add these DNS records:

   | Type  | Name  | Value                    |
   |-------|-------|--------------------------|
   | CNAME | `www` | `OWNER.github.io`        |
   | A     | `@`   | `185.199.108.153`        |
   | A     | `@`   | `185.199.109.153`        |
   | A     | `@`   | `185.199.110.153`        |
   | A     | `@`   | `185.199.111.153`        |

   (The four `A` records make `tokenization2050.com` without `www` redirect too.)
5. After DNS updates (minutes to a few hours), tick **Enforce HTTPS** on the Pages settings.

> The site must run on its own domain (or at the root of `OWNER.github.io`).
> Links start with `/`, so it will **not** display correctly at an address like
> `OWNER.github.io/tokenization2050/`.

---

## 7. Change menus, sections and pages

All in **`content/config.json`**:

- **`site`** — site name, address, byline, copyright and the footer disclaimer.
- **`sections`** — the list of sections (name, code, description). Adding a section here
  creates its page automatically.
- **`nav.primary`** — sections shown in the main menu row, in this order.
- **`nav.secondary`** — sections shown under **More** in the menu.

On phones, all sections appear in the "Menu" button.

Fixed pages (About, Editorial standards, Corrections, Contact, Legal notice, Privacy) are
in **`content/pages/`** — one JSON file each, with the text in Markdown in `body`.
The glossary is **`content/glossary.json`**.

---

## 8. Before going live: checklist

- [ ] Delete the three sample articles in `content/articles/` (they show a SAMPLE banner).
- [ ] Replace the sample numbers in `content/data.json` with real, sourced figures and
      remove "Sample data for demonstration" from `templates/home.njk`.
- [ ] Complete `content/pages/legal.json` (imprint: legal name, address, VAT/registration)
      and `content/pages/contact.json` with real details.
- [ ] Check `content/pages/privacy.json` matches what you actually do.
- [ ] The newsletter form on the home page is a placeholder — connect it to a newsletter
      service or remove it before launch.
- [ ] Optional: add a favicon and a default sharing image.

---

## 9. Where things are

```
content/
  articles/         one JSON file per article         ← daily news goes here
  pages/            About, Contact, Legal, Privacy…
  config.json       site settings, sections, menu
  data.json         ticker strip and key figures
  glossary.json     glossary terms
templates/          page layouts (Nunjucks)
static/
  css/style.css     all styling
  css/fonts.css     font declarations
  fonts/            self-hosted fonts (Inter, DM Serif Display — free, OFL licence)
  img/              logo, favicon and share image used by the site
  robots.txt, llms.txt, site.webmanifest
LOGHI/              OFFICIAL logo files (PNG + SVG) — see LOGHI/LEGGIMI.md
docs/
  DESIGN_SYSTEM.md  colours, fonts, components (reuse for social, video, newsletter)
build.js            the build script
.github/workflows/  automatic build and publish
site/               generated website — do not edit
```

Generated automatically on each build: `sitemap.xml`, `feed.xml` (RSS), `feed.json`,
`robots.txt`, `llms.txt`, `404.html`, and schema.org NewsArticle data on every article.
