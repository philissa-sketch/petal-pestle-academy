import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// ---------------------------------------------------------------------------
// `strictPort: true` IS THE MOST IMPORTANT LINE IN THIS FILE.
//
// It was missing, and its absence caused a whole afternoon of "why do you keep
// starting it over on my end — stop deleting her info."
//
// Nothing was ever deleted. Here is what actually happened.
//
// Vite's default behaviour when its port is busy is to SILENTLY move to the
// next free one: 5180 taken, so 5181, then 5182. It prints the new number in
// the black window and opens the browser there, and everything looks normal.
//
// But the app's saved work does not live in the folder. It lives in the
// browser, and the browser files it under the exact address it was opened at.
// localhost:5180 and localhost:5181 are two different addresses, so they get
// two completely separate databases.
//
// So: leave one server running, start another — which is exactly what happens
// when someone is asked to restart the app several times in an afternoon — and
// the second one opens on a different port, with an empty database, and every
// bit of saved work appears to have vanished. It has not. It is sitting safely
// at the old address, invisible.
//
// With strictPort the server REFUSES to start on a different port. It stops and
// says the port is in use, which is a five-second fix, instead of silently
// handing back a blank app that looks like data loss.
//
// `open: true` so the double-click launcher brings the browser up on its own —
// she should never have to copy a localhost URL.
// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// HER EXPORT IS SERVED IN DEVELOPMENT ONLY, AND THAT IS THE WHOLE POINT.
//
// `local/her-latest-export.json` is Azianna's real data — her learner name, all
// nine measured strand levels, 74 answers and her journal entries in her own
// words.
//
// It used to live in `public/`. EVERYTHING IN public/ IS COPIED INTO THE BUILT
// SITE, so the moment this app is published anywhere — Netlify, a school
// server, anything — that file would sit at a public web address for anyone
// with the link. A nine-year-old's reading level and journal.
//
// Nobody had done anything wrong: while the app only ever ran on localhost,
// public/ and "on my own computer" were the same place. Publishing it is what
// makes them different.
//
// So the file moved to `local/`, which Vite does not know about, and this
// plugin hands it to the dev server at the same address the Grown-Up Corner
// already asks for. `apply: 'serve'` is the guarantee: this middleware cannot
// run during a build, so the file has no route into `dist/`.
//
// check-publish-safety.mjs asserts the rest — that nothing carrying her data
// is sitting in public/ or in a built dist/ waiting to be uploaded.
// ---------------------------------------------------------------------------
function serveLocalExportInDevOnly() {
  const FILE = resolve(dirname(fileURLToPath(import.meta.url)), 'local/her-latest-export.json');
  return {
    name: 'petal-pestle-local-export',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const path = (req.url || '').split('?')[0];
        if (path !== '/her-latest-export.json') return next();
        if (!existsSync(FILE)) {
          res.statusCode = 404;
          res.end('{}');
          return;
        }
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Cache-Control', 'no-store');
        res.end(readFileSync(FILE));
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), serveLocalExportInDevOnly()],
  server: {
    // Deliberately NOT 5173 — Mission Control uses that. Both apps can be open
    // at once without fighting.
    port: 5180,
    // Fail loudly rather than opening a different app with a different
    // database. See the note above; this line is not optional.
    strictPort: true,
    open: true
  },
  build: {
    outDir: 'dist'
  }
});
