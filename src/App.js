import React, { useState, useEffect } from "react";
import "./App.css";

const EX_INFO_BASE  = "https://wger.de/api/v2/exerciseinfo/";
const IMG_ENDPOINT  = "https://wger.de/api/v2/exerciseimage/";
const CAT_ENDPOINT  = "https://wger.de/api/v2/exercisecategory/?limit=100";
const LANG_ENDPOINT = "https://wger.de/api/v2/language/?limit=100";

/* fetch ONE main image for a given exercise id */
async function getMainImage(exId) {
  const url  = `${IMG_ENDPOINT}?exercise=${exId}&is_main=True&limit=1`;
  const res  = await fetch(url);
  const data = await res.json();
  return data.results[0]?.image || null;   // null if none
}

export default function App() {
  /* ---------- state ---------- */
  const [categories, setCategories]         = useState([]);
  const [languages,  setLanguages]          = useState([]);
  const [selectedCategory, setSelectedCat]  = useState("");
  const [selectedLanguage, setSelectedLang] = useState("");
  const [workouts, setWorkouts]             = useState([]);
  const [favorites, setFavorites]           = useState(() => {
    const saved = localStorage.getItem("favorites");
    return saved ? JSON.parse(saved) : [];
  });

  /* ---------- dropdown data ---------- */
  useEffect(() => {
    (async () => {
      const [catRes, langRes] = await Promise.all([
        fetch(CAT_ENDPOINT).then(r => r.json()),
        fetch(LANG_ENDPOINT).then(r => r.json())
      ]);
      setCategories(catRes.results);
      setLanguages(langRes.results);
    })();
  }, []);

  /* ---------- exercises (refetch on filter change) ---------- */
  useEffect(() => {
    const fetchExercises = async () => {
      /* build URL with server filters */
      let url = EX_INFO_BASE + "?limit=200";
      if (selectedLanguage) url += `&language=${selectedLanguage}`;
      if (selectedCategory) url += `&category=${selectedCategory}`;

      const res  = await fetch(url);
      const data = await res.json();

      /* OPTIONAL client-side language filter (guaranteed) */
      const langId = selectedLanguage ? parseInt(selectedLanguage) : null;
      let list     = data.results;
      if (langId) {
        list = list.filter(ex =>
          ex.translations?.some(t => t.language === langId)
        );
      }

      /* enrich with image */
      const enriched = await Promise.all(
        list.map(async ex => {
          const apiImg = await getMainImage(ex.id);
          const img    = apiImg || ex.images[0]?.image ||
                         "https://via.placeholder.com/150";
          return { ...ex, image: img };
        })
      );

      setWorkouts(enriched);
    };

    fetchExercises();
  }, [selectedLanguage, selectedCategory]);

  /* ---------- helpers ---------- */
  const toggleFavorite = ex => {
    const isFav   = favorites.some(f => f.id === ex.id);
    const updated = isFav
      ? favorites.filter(f => f.id !== ex.id)
      : [...favorites, ex];
    setFavorites(updated);
    localStorage.setItem("favorites", JSON.stringify(updated));
  };

  /* pick the right translation text for a card */
  const getDescription = (ex) => {
    const langId = selectedLanguage ? parseInt(selectedLanguage) : null;
    const t      = langId
      ? ex.translations?.find(tr => tr.language === langId)
      : ex.translations?.[0];
    return t?.description || "No description";
  };

  /* ---------- reusable card ---------- */
  const ExerciseCard = ({ ex, isFavList = false }) => (
    <div className="workout-card">
      <h3>{ex.name}</h3>
      {ex.image && <img src={ex.image} alt={"Image"} />}
      <p dangerouslySetInnerHTML={{ __html: getDescription(ex) }} />
      <button onClick={() => toggleFavorite(ex)}>
        {isFavList
          ? "Remove"
          : favorites.some(f => f.id === ex.id)
            ? "★ Remove"
            : "☆ Add"}
      </button>
    </div>
  );

  /* ---------- render ---------- */
  return (
    <div className="App">
      <h1>Workout Explorer</h1>

      {/* filters */}
      <div className="filters">
        {/* language */}
        <label htmlFor="lang">Language&nbsp;</label>
        <select id="lang" value={selectedLanguage}
                onChange={e => setSelectedLang(e.target.value)}>
          <option value="">All</option>
          {languages.map(l => (
            <option key={l.id} value={l.id}>{l.full_name_en}</option>
          ))}
        </select>

        {/* category */}
        <label htmlFor="cat" style={{ marginLeft: "1rem" }}>Category&nbsp;</label>
        <select id="cat" value={selectedCategory}
                onChange={e => setSelectedCat(e.target.value)}>
          <option value="">All</option>
          {categories.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* main list */}
      <div className="workout-list">
        {workouts.map(ex => (
          <ExerciseCard key={ex.id} ex={ex} />
        ))}
      </div>

      {/* favorites */}
      <h2>Favorites</h2>
      <div className="workout-list">
        {favorites.map(ex => (
          <ExerciseCard key={ex.id} ex={ex} isFavList />
        ))}
      </div>
    </div>
  );
}
