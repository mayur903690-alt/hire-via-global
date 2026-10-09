# Hire Via Global website

A multipage website for HR consulting, recruitment and staffing, with a job board where employers post jobs and job seekers search, save and apply.

## What is in this folder

| File | Purpose |
|---|---|
| `index.html`, `about.html`, `solutions.html`, `recruitment.html`, `staffing.html`, `jobs.html`, `contact.html` | The pages |
| `style.css` | All styling (light and dark theme, responsive) |
| `app.js` | Header, footer, KPI calculator, recruitment pipeline, forms |
| `board.js` | Job board data layer (talks to the server, or to browser storage) |
| `jobs.js`, `home.js`, `swipe.js`, `world.js` | Jobs page, home page live numbers, swipe cards and tracker, country list |
| `seed.js`, `seed.json` | Eight clearly labeled sample jobs (browser and server copies) |
| `server.js`, `package.json` | Optional Node server (no packages to install) |

## Option 1: run with the included Node server (recommended)

This gives you a real shared job board: jobs, applications and saved jobs are stored in `data/db.json` and shared by everyone who opens the site.

1. Install Node 18 or newer (https://nodejs.org).
2. In this folder run:

   ```
   node server.js
   ```

3. Open http://localhost:8080

Settings are environment variables:

| Variable | Default | Meaning |
|---|---|---|
| `PORT` | `8080` | Port to listen on |
| `HOST` | `127.0.0.1` | Use `0.0.0.0` to let other computers on your network connect |
| `ADMIN_KEY` | `change-me` | Staff access key. **Set your own before sharing.** |
| `DATA_DIR` | `./data` | Where `db.json` is stored |

Example (macOS or Linux):

```
ADMIN_KEY="a-long-secret" PORT=3000 HOST=0.0.0.0 node server.js
```

Example (Windows PowerShell):

```
$env:ADMIN_KEY="a-long-secret"; $env:PORT=3000; node server.js
```

### Staff access

On the Jobs page, open **Hire talent**, then **Staff sign-in** and enter `ADMIN_KEY`. Staff can read all applications and manage every posting. Everyone else can only manage their own postings and see their own saved jobs. Staff access lasts for the browser session.

## Option 2: any static web server (no Node)

Copy the whole folder to any web server (Apache, Nginx, XAMPP, IIS, `python -m http.server`, VS Code Live Server) and open `index.html`.

Everything works except sharing: the job board then runs in **local demo mode**. Jobs, applications and saved jobs are saved in the visitor's own browser only, and a banner on the Jobs page says so. Use this to preview the site. Use Option 1 for real use.

## Internet access the pages use

- Google Fonts (headings and body text). Without internet the site falls back to system fonts.
- cdnjs (only on the Jobs page, for the full country list). Without internet the page uses a built-in list of about 35 countries.

## What is and is not included

Included:
- All seven pages, working navigation, dark and light theme, mobile layout
- KPI calculator, recruitment pipeline explorer, staffing brief builder
- Job board: post, close, reopen and delete jobs; search by keyword, country and type; save jobs; apply; staff view of applications
- Server-side checks: visitors cannot read other people's applications or change other people's jobs

Not included (add before a public launch):
- **Real accounts.** Visitors are identified by a random id stored in their browser, not by a login. Anyone can clear it and start fresh.
- **Spam protection and email.** There is only simple rate limiting. No emails are sent for applications; staff read them on the Jobs page.
- **File upload for CVs.** Applicants can paste a link to their CV.
- **HTTPS.** Put the server behind a reverse proxy (Nginx, Caddy) that provides HTTPS before exposing it to the internet.
- **Backups.** Copy `data/db.json` regularly. It is the whole database.
- **Company details.** The address, phone, email, privacy policy and terms are placeholders marked `[Add ...]` or "to be added". Search the HTML files for `[Add` and `to be added`.
- **Contact and staffing forms** check input and let the visitor copy the details, but do not send anything. Connect them to your email service or backend when ready.
- **The HR system itself** (employee records, attendance, payroll, login) is not built. The site describes these services only.

## Changing the brand

The name "Hire Via Global" appears in `app.js` (header and footer), the page `<title>` tags and a few headings. Colors are the variables at the top of `style.css`.
