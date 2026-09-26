# porfoliooo Project Rules & Guidelines

## Environment & Tooling
- Framework: Astro v7 + React 19 + Tailwind CSS + DaisyUI
- Hosting: Firebase Hosting (https://porfoliooo.web.app/)

## Node Version Management (fnm)
- This project uses Astro v7, requiring Node.js >= 22.12.0.
- Node version manager on this Mac is `fnm` located at `/usr/local/bin/fnm`.
- If building or running scripts fails due to Node version mismatch, switch to Node 22 or 24:
  `fnm use 22` or `fnm use 24`
  or run commands with:
  `fnm exec --using=22 <command>`
- Do not stop to prompt the user to change Node versions manually; switch automatically via fnm.
