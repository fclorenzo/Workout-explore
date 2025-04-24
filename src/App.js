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

        // Fetch exercises
        const workoutResponse = await fetch("https://wger.de/api/v2/exercise/");
        const workoutData = await workoutResponse.json();
        // Filter out workouts that are missing category information
        const workoutsWithImages = workoutData.results.map(workout => ({
          ...workout,
          image: workout.image || "default_image_url_here", // Ensure you have a fallback image if none exists
        }));
        setWorkouts(workoutsWithImages);
        setFilteredWorkouts(workoutsWithImages);
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
        workouts.filter(workout =>
          workout.category === parseInt(selectedCategoryId) // Compare workout's category ID with the selected category ID
        )
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
            <p>{workout.description || "No description available"}</p>
            {workout.image && <img src={workout.image} alt={workout.name} />}
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
            <p>{fav.description || "No description available"}</p>
            {fav.image && <img src={fav.image} alt={fav.name} />}
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
