// ---------- Config ----------
const API_BASE = "https://api.themoviedb.org/3";
const IMG_BASE = "https://image.tmdb.org/t/p/w342";
const BACKDROP_BASE = "https://image.tmdb.org/t/p/w780";

const MOODS = [
  { label: "Feel-good",      genres: [35, 10751] },   // Comedy, Family
  { label: "Mind-bending",   genres: [878, 9648] },    // Sci-Fi, Mystery
  { label: "Heart-racing",   genres: [28, 53] },        // Action, Thriller
  { label: "Tear-jerker",    genres: [18, 10749] },     // Drama, Romance
  { label: "Spooky",         genres: [27] },            // Horror
  { label: "Epic adventure", genres: [12, 14] },        // Adventure, Fantasy
];

const resultsGrid = document.getElementById("resultsGrid");
const resultsHeading = document.getElementById("resultsHeading");
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const searchResults = document.getElementById("searchResults");
const moodRow = document.getElementById("moodRow");
const modal = document.getElementById("detailModal");
const modalBody = document.getElementById("modalBody");
const modalClose = document.getElementById("modalClose");

let activeMoodIndex = null;

// ---------- API helpers ----------
async function tmdbFetch(path, params = {}) {
  const url = new URL(API_BASE + path);
  url.searchParams.set("api_key", TMDB_API_KEY);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(`TMDB request failed (${res.status})`);
  }
  return res.json();
}

async function fetchTrending() {
  const data = await tmdbFetch("/trending/movie/week");
  return data.results;
}

async function searchMovies(query) {
  const data = await tmdbFetch("/search/movie", { query, include_adult: false });
  return data.results;
}

async function fetchRecommendations(movieId) {
  const data = await tmdbFetch(`/movie/${movieId}/recommendations`);
  return data.results;
}

async function discoverByGenres(genreIds) {
  const data = await tmdbFetch("/discover/movie", {
    with_genres: genreIds.join(","),
    sort_by: "popularity.desc",
  });
  return data.results;
}

async function fetchMovieDetail(movieId) {
  return tmdbFetch(`/movie/${movieId}`, { append_to_response: "credits" });
}

// ---------- Rendering ----------
function posterUrl(path) {
  return path ? IMG_BASE + path : "https://placehold.co/342x513/1a1d29/9a97a8?text=No+Poster";
}

function yearOf(dateStr) {
  return dateStr ? dateStr.slice(0, 4) : "—";
}

function renderCard(movie) {
  const card = document.createElement("div");
  card.className = "poster-card";
  card.tabIndex = 0;
  card.setAttribute("role", "button");
  card.setAttribute("aria-label", `View details for ${movie.title}`);

  card.innerHTML = `
    <img src="${posterUrl(movie.poster_path)}" alt="${escapeHtml(movie.title)} poster" loading="lazy" />
    <div class="poster-meta">
      <p class="poster-title">${escapeHtml(movie.title)}</p>
      <p class="poster-year">${yearOf(movie.release_date)}</p>
      <span class="poster-rating">★ ${movie.vote_average ? movie.vote_average.toFixed(1) : "N/A"}</span>
    </div>
  `;

  const open = () => openMovieModal(movie.id);
  card.addEventListener("click", open);
  card.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); }
  });

  return card;
}

function renderGrid(container, movies) {
  container.innerHTML = "";
  if (!movies || movies.length === 0) {
    container.innerHTML = `<p class="empty-state">Nothing found. Try another title or mood.</p>`;
    return;
  }
  movies.forEach((m) => container.appendChild(renderCard(m)));
}

function renderError(container, message) {
  container.innerHTML = `<p class="error-state">${escapeHtml(message)}</p>`;
}

function escapeHtml(str = "") {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// ---------- Modal ----------
async function openMovieModal(movieId) {
  modal.hidden = false;
  modalBody.innerHTML = `<p class="empty-state">Loading…</p>`;

  try {
    const movie = await fetchMovieDetail(movieId);
    const genres = (movie.genres || []).map((g) => `<span>${escapeHtml(g.name)}</span>`).join("");
    const director = (movie.credits?.crew || []).find((c) => c.job === "Director");

    modalBody.innerHTML = `
      <h3 class="modal-header-title">${escapeHtml(movie.title)} <small style="color:var(--muted); font-size:1.1rem;">(${yearOf(movie.release_date)})</small></h3>
      ${movie.tagline ? `<p class="modal-tagline">${escapeHtml(movie.tagline)}</p>` : ""}
      <p class="modal-overview">${escapeHtml(movie.overview || "No overview available.")}</p>
      <div class="modal-genres">${genres}</div>
      <p style="color:var(--muted); font-size:0.85rem; margin-top:1rem;">
        ★ ${movie.vote_average?.toFixed(1) ?? "N/A"} · ${movie.runtime ? movie.runtime + " min" : "Runtime unknown"}
        ${director ? " · Directed by " + escapeHtml(director.name) : ""}
      </p>
      <button id="similarBtn" class="mood-chip" style="margin-top:1rem;">Show me movies like this</button>
    `;

    document.getElementById("similarBtn").addEventListener("click", async () => {
      closeModal();
      resultsHeading.textContent = `Because you liked "${movie.title}"`;
      renderGrid(resultsGrid, []);
      try {
        const recs = await fetchRecommendations(movie.id);
        renderGrid(resultsGrid, recs);
      } catch (err) {
        renderError(resultsGrid, "Couldn't load recommendations right now.");
      }
      resultsGrid.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  } catch (err) {
    modalBody.innerHTML = `<p class="error-state">Couldn't load details for this title.</p>`;
  }
}

function closeModal() {
  modal.hidden = true;
  modalBody.innerHTML = "";
}

modalClose.addEventListener("click", closeModal);
modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });

// ---------- Search flow ----------
async function handleSearch() {
  const query = searchInput.value.trim();
  if (!query) return;

  searchResults.hidden = false;
  renderGrid(searchResults, []);
  searchResults.innerHTML = `<p class="empty-state">Searching…</p>`;

  try {
    const results = await searchMovies(query);
    if (results.length === 0) {
      searchResults.innerHTML = `<p class="empty-state">No matches for "${escapeHtml(query)}". Try a different title.</p>`;
      return;
    }
    // Take the closest match, show its recommendations directly
    const match = results[0];
    resultsHeading.textContent = `Because you liked "${match.title}"`;
    renderGrid(resultsGrid, []);
    resultsGrid.innerHTML = `<p class="empty-state">Finding similar movies…</p>`;

    const recs = await fetchRecommendations(match.id);
    renderGrid(resultsGrid, recs.length ? recs : results.slice(1));
    searchResults.hidden = true;
    resultsGrid.scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (err) {
    renderError(searchResults, "Search failed. Check your API key in config.js and try again.");
  }
}

searchBtn.addEventListener("click", handleSearch);
searchInput.addEventListener("keydown", (e) => { if (e.key === "Enter") handleSearch(); });

// ---------- Mood flow ----------
function renderMoodChips() {
  moodRow.innerHTML = "";
  MOODS.forEach((mood, idx) => {
    const chip = document.createElement("button");
    chip.className = "mood-chip";
    chip.textContent = mood.label;
    chip.addEventListener("click", () => selectMood(idx));
    moodRow.appendChild(chip);
  });
}

async function selectMood(idx) {
  activeMoodIndex = idx;
  [...moodRow.children].forEach((chip, i) => chip.classList.toggle("active", i === idx));

  const mood = MOODS[idx];
  resultsHeading.textContent = `${mood.label} picks`;
  renderGrid(resultsGrid, []);
  resultsGrid.innerHTML = `<p class="empty-state">Curating…</p>`;

  try {
    const movies = await discoverByGenres(mood.genres);
    renderGrid(resultsGrid, movies);
  } catch (err) {
    renderError(resultsGrid, "Couldn't load picks for this mood right now.");
  }
  resultsGrid.scrollIntoView({ behavior: "smooth", block: "start" });
}

// ---------- Init ----------
async function init() {
  renderMoodChips();

  if (!TMDB_API_KEY || TMDB_API_KEY === "YOUR_TMDB_API_KEY_HERE") {
    renderError(
      resultsGrid,
      "Add your TMDB API key to config.js to start seeing movies (see README for steps)."
    );
    return;
  }

  try {
    const trending = await fetchTrending();
    renderGrid(resultsGrid, trending);
  } catch (err) {
    renderError(resultsGrid, "Couldn't load trending movies. Check your API key in config.js.");
  }
}

init();
