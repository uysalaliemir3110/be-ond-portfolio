# BE/OND

> **English** · [Français](#français)

A static editorial site for BE/OND, a ready-to-wear label, with a custom content-management admin panel, built from scratch with Next.js, TypeScript, Tailwind CSS, and a PHP backend for shared hosting.

**Live demo:** https://be-ond-portfolio.vercel.app

### Admin panel access (for reviewers)

The site includes a private admin panel for managing collections, banners, and the about page. You are welcome to explore it:

- **URL:** https://be-ond-portfolio.vercel.app/admin
- **Password:** `beond-portfolio-2026`

> This is a **demo deployment** hosted on a free `vercel.app` domain, created specifically for portfolio review. It uses its own demo-only password, completely separate from the real production site's credentials — nothing you do here can affect the live store. Because this demo has no backend behind it, logging in and editing content in the UI works, but Save/Upload won't persist (those calls target PHP endpoints that only exist on the real production host).

---

### About this project

I designed and developed this website and its admin panel end-to-end, as the sole developer — front-end, admin UI, and the PHP backend it talks to in production.

BE/OND is a family-run label; the designs and photography are theirs, used here with permission, while the codebase and application architecture are my own work. This repository and its Vercel deployment are published by me as a portfolio piece for university applications.

### Tech stack

| Layer | Technology |
|-------|-----------|
| Framework | [Next.js 16](https://nextjs.org) (App Router, static export) |
| Language | TypeScript 5 |
| UI | React 19, Tailwind CSS v4 |
| Backend (production) | PHP (auth, save, upload, delete endpoints) |
| Image tooling | [sharp](https://sharp.pixelplumbing.com) (placeholder generation) |
| Hosting | Shared cPanel hosting (production), [Vercel](https://vercel.com) (this demo) |

### Features

- **Bilingual public site** — Turkish/English copy throughout, switchable at runtime.
- **Custom admin CMS** — password-protected dashboard to edit collections, homepage banners (separate desktop/mobile ordering), and the about section. No third-party CMS.
- **Direct image uploads** — editors upload straight into collections and banners from the admin UI.
- **Static export** — ships as plain HTML/CSS/JS, so it runs on shared hosting with no Node process on the server.
- **Zero-downtime content edits** — text and image changes to existing collections go live immediately; only brand-new collections need a rebuild.

### Architecture

```
src/app/          routes: /, /collections, /work/[id], /admin, /api/*
src/components/   sections and the admin editors
src/locales/      tr.js / en.js — all UI copy
src/data/         generated defaults; do not edit by hand
public/data/      the live data the panel writes
public/api/       the PHP backend used in production
```

### Running locally

```bash
npm install
npm run dev        # http://localhost:3000
```

On `localhost` the PHP endpoints do not exist, so `/admin` checks the demo password client-side instead (see `src/lib/api.ts`).

### Publishing to production

```bash
npm run sync-data  # fold public/data/*.json into the bundled defaults
npm run build      # writes out/
```

Upload the contents of `out/` to `public_html/`. Two things to do once, on the server:

1. Copy `api/config.example.php` to `api/config.php` and set a real password. `config.php` is gitignored — the one in this repo is a placeholder.
2. Leave `.htaccess` and `.user.ini` in place; they wire up the 404 page and raise PHP's upload limits.

---
---

## Français

> [English](#beond) · **Français**

Un site éditorial statique pour BE/OND, une marque de prêt-à-porter, doté d'un panneau d'administration sur mesure pour la gestion de contenu, développé entièrement avec Next.js, TypeScript, Tailwind CSS et un backend PHP pour hébergement partagé.

**Démo en ligne :** https://be-ond-portfolio.vercel.app

### Accès au panneau d'administration (pour les évaluateurs)

Le site comprend un panneau d'administration privé permettant de gérer les collections, les bannières et la page à propos. Vous êtes invité·e à l'explorer :

- **URL :** https://be-ond-portfolio.vercel.app/admin
- **Mot de passe :** `beond-portfolio-2026`

> Il s'agit d'un **déploiement de démonstration** hébergé sur un domaine gratuit `vercel.app`, créé spécifiquement pour l'évaluation de mon portfolio. Il utilise son propre mot de passe de démonstration, totalement distinct des identifiants du site de production réel — rien de ce que vous faites ici ne peut affecter la boutique en ligne. Comme cette démo ne dispose d'aucun backend, la connexion et l'édition de contenu dans l'interface fonctionnent, mais les boutons Enregistrer/Téléverser ne persistent pas (ces appels visent des points d'accès PHP qui n'existent que sur l'hébergement de production réel).

---

### À propos du projet

J'ai conçu et développé ce site ainsi que son panneau d'administration de bout en bout, en tant que seul développeur — l'interface, le panneau d'administration et le backend PHP avec lequel il communique en production.

BE/OND est une marque familiale ; les créations et les photographies lui appartiennent et sont utilisées ici avec son autorisation, tandis que le code et l'architecture de l'application sont mon propre travail. Ce dépôt et son déploiement sur Vercel sont publiés par moi-même dans le cadre de candidatures universitaires.

### Technologies

| Couche | Technologie |
|--------|-------------|
| Framework | [Next.js 16](https://nextjs.org) (App Router, export statique) |
| Langage | TypeScript 5 |
| Interface | React 19, Tailwind CSS v4 |
| Backend (production) | PHP (authentification, enregistrement, téléversement, suppression) |
| Outils image | [sharp](https://sharp.pixelplumbing.com) (génération des visuels de remplacement) |
| Hébergement | Hébergement cPanel partagé (production), [Vercel](https://vercel.com) (cette démo) |

### Fonctionnalités

- **Site public bilingue** — contenu en turc et en anglais, interchangeable à la volée.
- **CMS d'administration sur mesure** — tableau de bord protégé par mot de passe pour éditer les collections, les bannières de la page d'accueil (ordres distincts bureau/mobile) et la section à propos. Aucun CMS tiers.
- **Téléversement d'images direct** — les éditeurs téléversent directement dans les collections et les bannières depuis l'interface d'administration.
- **Export statique** — livré en HTML/CSS/JS pur, fonctionne donc sur un hébergement partagé sans processus Node sur le serveur.
- **Modifications de contenu sans interruption** — les changements de texte et d'image sur les collections existantes sont publiés immédiatement ; seules les nouvelles collections nécessitent une reconstruction.

### Architecture

```
src/app/          routes : /, /collections, /work/[id], /admin, /api/*
src/components/   sections et éditeurs d'administration
src/locales/      tr.js / en.js — tous les textes de l'interface
src/data/         valeurs par défaut générées ; à ne pas modifier à la main
public/data/      les données en ligne écrites par le panneau
public/api/       le backend PHP utilisé en production
```

### Exécution en local

```bash
npm install
npm run dev        # http://localhost:3000
```

En local, les points d'accès PHP n'existent pas, donc `/admin` vérifie le mot de passe de démonstration côté client (voir `src/lib/api.ts`).

### Publication en production

```bash
npm run sync-data  # fusionne public/data/*.json dans les valeurs par défaut
npm run build      # génère out/
```

Téléversez le contenu de `out/` vers `public_html/`. Deux choses à faire une seule fois, sur le serveur :

1. Copiez `api/config.example.php` vers `api/config.php` et définissez un vrai mot de passe. `config.php` est ignoré par git — celui de ce dépôt n'est qu'un exemple.
2. Laissez `.htaccess` et `.user.ini` en place ; ils configurent la page 404 et augmentent les limites de téléversement PHP.
