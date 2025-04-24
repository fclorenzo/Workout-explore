import React, { useState, useEffect } from "react";
import './App.css';

const App = () => {
  const [workouts, setWorkouts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filteredWorkouts, setFilteredWorkouts] = useState([]);
  const [favorites, setFavorites] = useState(() => {
    const savedFavorites = localStorage.getItem("favorites");
    return savedFavorites ? JSON.parse(savedFavorites) : [];
  });
  const [selectedCategory, setSelectedCategory] = useState("");

  // Fetch categories and workouts from the Wger API
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch categories
        const categoryResponse = await fetch("https://wger.de/api/v2/exercisecategory/");
        const categoryData = await categoryResponse.json();
        setCategories(categoryData.results);

        // Fetch exercises (with exercise info)
        const workoutResponse = await fetch("https://wger.de/api/v2/exerciseinfo/");
        const workoutData = await workoutResponse.json();
        
        // Enrich exercises with category info
        const enrichedWorkouts = workoutData.results.map(workout => ({
          ...workout,
          category: workout.category // Directly pulling category object from exerciseinfo
        }));

        setWorkouts(enrichedWorkouts);
        setFilteredWorkouts(enrichedWorkouts);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  // Handle category filtering
  const handleCategoryChange = (event) => {
    const selectedCategoryId = event.target.value;
    setSelectedCategory(selectedCategoryId);

    if (selectedCategoryId) {
      setFilteredWorkouts(
        workouts.filter(workout => workout.category.id === parseInt(selectedCategoryId))
      );
    } else {
      setFilteredWorkouts(workouts); // If no category is selected, show all workouts
    }
  };

  // Add or remove workout from favorites
  const handleFavoriteToggle = (workout) => {
    const isFavorite = favorites.some(fav => fav.id === workout.id);
    const updatedFavorites = isFavorite
      ? favorites.filter(fav => fav.id !== workout.id)
      : [...favorites, workout];

    setFavorites(updatedFavorites);
    localStorage.setItem("favorites", JSON.stringify(updatedFavorites));
  };

  return (
    <div className="App">
      <h1>Workout Explorer</h1>

      <div className="filters">
        <label htmlFor="category">Filter by Category: </label>
        <select id="category" value={selectedCategory} onChange={handleCategoryChange}>
          <option value="">All</option>
          {categories.map(category => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      <div className="workout-list">
        {filteredWorkouts.map(workout => (
          <div key={workout.id} className="workout-card" role="region" aria-labelledby={`workout-${workout.id}`}>
            <h3 id={`workout-${workout.id}`}>{workout.name}</h3>
            <p>{workout.translations ? workout.translations[0].description : "No description available"}</p>
            {workout.images.length > 0 && <img src={workout.images[0].image} alt={workout.name} />}
            <button 
              onClick={() => handleFavoriteToggle(workout)}
              aria-label={favorites.some(fav => fav.id === workout.id) ? "Remove from favorites" : "Add to favorites"}
            >
              {favorites.some(fav => fav.id === workout.id) ? "Remove from Favorites" : "Add to Favorites"}
            </button>
          </div>
        ))}
      </div>

      <h2>Favorite Workouts</h2>
      <div className="workout-list">
        {favorites.map(fav => (
          <div key={fav.id} className="workout-card" role="region" aria-labelledby={`favorite-${fav.id}`}>
            <h3 id={`favorite-${fav.id}`}>{fav.name}</h3>
            <p>{fav.translations ? fav.translations[0].description : "No description available"}</p>
            {fav.images.length > 0 && <img src={fav.images[0].image} alt={fav.name} />}
            <button 
              onClick={() => handleFavoriteToggle(fav)}
              aria-label="Remove from favorites"
            >
              Remove from Favorites
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default App;
