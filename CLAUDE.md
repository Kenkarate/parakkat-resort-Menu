# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A single static HTML page (no build tools, no package manager, no JS framework) for Parakkat Nature Resort. It shows the resort logo, download links for two PDF menus, and a scrolling strip of resort photos. There is no test suite and no lint config.

## Deployment

The site is deployed via GitHub Pages using `.github/workflows/static.yml`: on every push to `master`, the entire repository root is uploaded as the Pages artifact and deployed as-is (`path: '.'`). There is no build step — whatever is committed at the repo root is what goes live. Because of this:
- File and folder names with spaces (e.g. `NEW MENU PARAKKAT NATURE RESORT COMPRESSED.pdf`) must stay exactly in sync between the filesystem and the `href`/`src` references in `index.html`.
- Large binaries (menu PDFs, resort photos) are committed directly to the repo since there is no asset pipeline or CDN.

`.github/workflows/test` is a leftover default Actions template (job named `CI`, just echoes text) — it is not part of the actual deployment and can be ignored/removed if it becomes an obstacle.

## Structure

- `index.html` — the live page. Loads Bootstrap 4 and jQuery/Popper from CDN (no local dependencies). Structure: header with logo → two download buttons (Restaurant Menu, Room Service Menu, pointing at the PDFs in the repo root) → a full-width vertical strip of images from `resort/`.
- `index copy.html` — an older/backup variant of the page (a plain `<img>` menu gallery using the root-level numbered JPGs `1.jpg`…`16.jpg` instead of PDF download buttons). Not linked from anywhere and not deployed as an entry point; treat as reference/backup, not live code.
- `style.css` — empty; all styling in `index.html` is inline or via Bootstrap classes.
- `resort/` — photos shown in the image strip on the live page.
- `untitled folder/` — a duplicate/unused set of numbered JPGs, not referenced by `index.html`. Leave alone unless asked to clean it up.
- Root-level numbered JPGs (`1.jpg`–`16.jpg`) — only referenced by the commented-out gallery block in `index.html` and by `index copy.html`; not part of the current live page.
- PDFs at repo root (`NEW MENU PARAKKAT NATURE RESORT COMPRESSED.pdf`, `NEW MENU PARAKKAT NATURE RESORT COMPRESSED1.pdf`, `ROOM SERVICE MENU PARAKKAT.pdf`) — the actual menu documents linked from the page. Note the `1` suffix variant exists alongside the original; confirm with the user which one `index.html` should point to before replacing either.

## Working in this repo

- There's no local dev server or tooling required — open `index.html` directly in a browser, or serve the directory with any static file server, to preview changes.
- When adding/renaming any file referenced by `index.html` (PDFs, images, logo), update the corresponding `href`/`src` in the same change — nothing else will catch a broken link.
- `.DS_Store` files are tracked in git in this repo; don't assume they're ignored.
