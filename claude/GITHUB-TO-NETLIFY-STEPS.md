# GitHub → Netlify — your steps

**Written Aug 24 2026, v3.77. Everything on this page is a thing only you can do.**
I cannot run git, sign in to GitHub, or touch your Netlify account. The files are ready; these are the commands.

---

## ⚠️ Read these three first

**1 · Do NOT let Netlify create a new site.**
Azianna's work lives in her Chromebook's browser, filed under **the exact web address**. A new site means a new address, and her app opens **empty** — nothing is lost, but it is sitting somewhere nobody visits. In Step 4 you connect the repo to the site you **already have**.

**2 · A public commit cannot be taken back.**
Git keeps history. If her data goes up once, deleting it later does **not** remove it — it stays in the repository and in every copy anyone has made. That is why Step 1 exists and why it comes before anything else.

**3 · Your first push is the dangerous one.** After that the rules are on disk and a check enforces them.

---

## Step 1 — Move the old copies out. Do this first.

`_to_delete/` holds **eleven copies of her full record**. It is excluded from git, but the safest copy is the one that is not in the folder at all.

Open **Command Prompt** and paste:

```
move "C:\Users\pknot\Downloads\petal-pestle-academy\petal-pestle-academy\_to_delete" "C:\Users\pknot\Downloads\petal-pestle-academy\_to_delete-OLD"
```

**Two empty folders I created and could not remove.** Delete them yourself, or leave them — they are excluded either way:

- `C:\Users\pknot\Downloads\petal-pestle-academy\_to_delete-from-app`
- `C:\Users\pknot\Downloads\petal-pestle-academy\petal-pestle-academy\_archive-test`

---

## Step 2 — Check, then start the repository

```
cd C:\Users\pknot\Downloads\petal-pestle-academy\petal-pestle-academy
npm run check
```

**All 31 must pass before you go on.** One of them, `check-publish-safety`, is now the thing standing between her record and a public website. If it is red, stop and read what it says.

Then:

```
git init
git add .
git status
```

### ⚠️ Now READ what `git status` printed, before you commit.

This is the one manual check on this page and it is worth the minute. You are looking for anything that should not be public.

**If you see any of these, STOP** — something is wrong with the ignore rules:

- `local/` or anything with **her-latest-export** or **her-backup** in the name
- the `claude/` folder
- `node_modules` or `dist`
- `_to_delete`

**What you SHOULD see:** `src/`, `scripts/`, `public/`, `package.json`, `package-lock.json`, `index.html`, `vite.config.js`, `tailwind.config.js`, `postcss.config.js`, `netlify.toml`, `.gitignore`, the `.bat` file and the two README files.

If it looks right:

```
git commit -m "Petal & Pestle Academy v3.77"
```

---

## Step 3 — Put it on GitHub

Create the repository at **github.com/new**.

| Setting | Use |
|---|---|
| Name | `petal-pestle-academy` |
| Visibility | **Public** — your choice, Aug 24 |
| Add a README | **No** — leave every box unticked |
| .gitignore / licence | **No** — you already have one |

Ticking any of those boxes creates a commit on GitHub, which then clashes with yours and produces a confusing error on the first push. Leave the repository completely empty.

Then paste the two lines GitHub shows you under **"…or push an existing repository"**. They look like this:

```
git remote add origin https://github.com/YOUR-NAME/petal-pestle-academy.git
git branch -M main
git push -u origin main
```

**After the push, open the repository in your browser and look.** Search it for `Azianna`. You should find her name only in code comments — never in a `.json` file and never in a `claude/` document, because that folder is not there.

---

## Step 4 — Point your EXISTING Netlify site at it

**This is the step that can strand her data. Read it twice.**

1. Netlify → open **the site that is already live** (`unrivaled-caramel-e28469`). Do **not** press "Add new site".
2. **Site configuration → Build & deploy → Continuous deployment**
3. Under **Repository**, press **Link repository** and choose your new GitHub repo.
4. Netlify reads `netlify.toml` for the rest. It should show:
   - **Build command:** `npm run check && npm run build`
   - **Publish directory:** `dist`
   Leave both alone. They come from the file.
5. **Deploy.**

If Netlify only offers to make a **new** site, back out and look again for the linking option inside the existing one. Getting a new address is the one mistake here that costs something.

---

## Step 5 — Prove it worked

1. Watch the deploy log. **It should run all 31 checks before it builds.** That is the point of the whole exercise — a red check now fails the deploy and the old site stays up, so Azianna never opens a broken app.
2. Open the site at **the same address as before**.
3. The version in the nav bar should read **v3.77**.
4. On the Chromebook, open it and confirm her Petals, her levels and her journal are all still there. They will be — her data never lived on Netlify — but check anyway.

---

## From now on

```
cd C:\Users\pknot\Downloads\petal-pestle-academy\petal-pestle-academy
npm run check
git add .
git commit -m "what changed"
git push
```

Netlify does the rest. **No more building and dragging.**

Run `npm run check` yourself first anyway. Netlify is Linux; your machine is Windows, and v3.73 is the version where eighteen of thirty checks turned out never to have run on Windows at all. **Netlify is the second pair of eyes, not the first.**

---

## If you ever want the `claude/` documents public

The master plan and the build log are the best writing in this project and it is a genuine loss to leave them out. They are excluded because that same folder holds `azianna-diagnostic-results.md` — a full educational assessment of a named nine-year-old.

To publish them you must remove the rule in **two** places, on purpose:

1. the `claude/` line in `.gitignore`
2. the matching entry in `scripts/check-publish-safety.mjs`

The check fails if you do only one. That is deliberate — publishing a child's assessment should be a decision somebody makes, not a line that got tidied away.

**A middle path, if you want the writing without the record:** move the build log and master plan into a new folder — say `docs/` — leave `claude/` ignored, and add the two files. Tell me and I will do it and add the check.
