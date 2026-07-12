# Now Showing 🎬

A movie recommender built on the [TMDB API](https://www.themoviedb.org/documentation/api). Search a movie you like to get similar recommendations, or pick a mood to discover something new. No frameworks, no build step — just HTML, CSS, and JS.

## Features
- **"Movies like this"** — search any title, see TMDB's recommendation results for it
- **Mood-based discovery** — Feel-good, Mind-bending, Heart-racing, Tear-jerker, Spooky, Epic adventure
- **Trending this week** on load
- Click any poster for an overview, genres, rating, runtime, and director

## Run it locally

1. **Get a free TMDB API key**
   Sign up at [themoviedb.org](https://www.themoviedb.org/signup), then generate a key at
   `Settings → API` → https://www.themoviedb.org/settings/api

2. **Add your key**
   Copy `config.example.js` to `config.js` and paste your key in:
   ```js
   const TMDB_API_KEY = "your-real-key-here";
   ```
   `config.js` is already in `.gitignore`, so it won't be committed.

3. **Open it**
   Just open `index.html` in a browser, or serve it locally:
   ```bash
   python3 -m http.server 8000
   # then visit http://localhost:8000
   ```

## Push this to GitHub

If you haven't already:

```bash
# from inside this project folder
git init
git add .
git commit -m "Initial commit: movie recommender app"

# create a new empty repo on github.com first, then:
git branch -M main
git remote add origin https://github.com/<your-username>/<repo-name>.git
git push -u origin main
```

Sanity-check before your first commit that `config.js` isn't staged:
```bash
git status
```
You should NOT see `config.js` listed. If it shows up, double check `.gitignore` is present and named exactly `.gitignore`.

## Deploy for free (optional)

Since this is a static site, GitHub Pages works out of the box:
1. Repo → **Settings → Pages**
2. Source: `Deploy from a branch` → branch `main`, folder `/ (root)`
3. Your app will be live at `https://<your-username>.github.io/<repo-name>/`

⚠️ Note: because there's no backend, your TMDB key is visible in the browser's network requests on any static deployment. TMDB's free API key is meant for exactly this kind of client-side/demo use, but don't reuse a key you use for higher-privilege apps.

## Project structure
```
├── index.html
├── style.css
├── app.js
├── config.example.js   # committed template
├── config.js            # your real key — gitignored
└── .gitignore
```
