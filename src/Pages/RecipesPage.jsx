import React, { useEffect, useState } from 'react';
import { db, collection, getDocs, query, where, deleteDoc, doc } from '../firestore';
import { auth } from '../firebase';

export default function RecipesPage() {
  const [recipes, setRecipes] = useState([]);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const user = auth.currentUser;

  useEffect(() => {
    const fetchRecipes = async () => {
      if (!user) return;
      const q = query(collection(db, 'recipes'), where('userId', '==', user.uid));
      const snapshot = await getDocs(q);
      const recipeList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      recipeList.sort((a, b) => a.name.localeCompare(b.name));
      setRecipes(recipeList);
    };
    fetchRecipes();
  }, [user]);

  const handleDelete = async (id) => {
    if (window.confirm('Delete this recipe?')) {
      await deleteDoc(doc(db, 'recipes', id));
      setRecipes(recipes.filter(r => r.id !== id));
      setSelectedRecipe(null);
    }
  };

  return (
    <div style={{ textAlign: 'left' }}>
      {!selectedRecipe ? (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {recipes.map((recipe) => (
            <li
              key={recipe.id}
              style={{ marginBottom: '0.5rem', background: '#ecf0f1', padding: '0.5rem', borderRadius: '6px', cursor: 'pointer' }}
              onClick={() => setSelectedRecipe(recipe)}
            >
              <strong style={{ fontSize: '1rem', color: '#2c3e50' }}>{recipe.name}</strong>
            </li>
          ))}
        </ul>
      ) : (
        <div style={{ backgroundColor: '#ecf0f1', borderRadius: '12px', padding: '1rem', position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ color: '#2c3e50', margin: 0 }}>{selectedRecipe.name}</h2>
            <button
              onClick={() => setSelectedRecipe(null)}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '1.8rem',
                fontWeight: 'bold',
                color: '#7f8c8d',
                cursor: 'pointer',
                lineHeight: 1
              }}
              aria-label="Close"
            >
              ×
            </button>
          </div>
          {Object.entries(selectedRecipe.ingredients).map(([category, items]) => (
            <div key={category} style={{ marginBottom: '0.5rem' }}>
              <ul style={{ textAlign: 'left', paddingLeft: '1rem', marginTop: 0 }}>
                <li style={{ listStyle: 'none', fontWeight: 'bold', paddingLeft: '0.25rem' }}>{category}:</li>
                {items.map((item, idx) => <li key={idx}>{item}</li>)}
              </ul>
            </div>
          ))}
          {selectedRecipe.instructions && (
            <p style={{ fontStyle: 'italic', marginBottom: '0.5rem' }}>{selectedRecipe.instructions}</p>
          )}
          {selectedRecipe.link && selectedRecipe.link !== 'Not available' && (
            <p>
              <a href={selectedRecipe.link} target="_blank" rel="noopener noreferrer" style={{ color: '#2980b9' }}>View Recipe</a>
            </p>
          )}
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
            <button
              onClick={() => handleDelete(selectedRecipe.id)}
              style={{ backgroundColor: '#e74c3c', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px' }}
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
