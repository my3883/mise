import React, { useState } from 'react';
import { recipes } from '../recipes';

export default function RecipesPage() {
  const [selectedRecipe, setSelectedRecipe] = useState(null);

  // Sort recipes alphabetically by name
  const sortedRecipes = [...recipes].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div style={{ textAlign: 'left' }}>
      {!selectedRecipe ? (
        <>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {sortedRecipes.map((recipe) => (
              <li key={recipe.id} style={{ marginBottom: '0.5rem', background: '#ecf0f1', padding: '0.5rem', borderRadius: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong>{recipe.name}</strong>
                  <button
                    style={{ backgroundColor: '#3498db', color: 'white', border: 'none', padding: '0.3rem 0.6rem', borderRadius: '4px' }}
                    onClick={() => setSelectedRecipe(recipe)}
                  >
                    View
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </>
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
          {selectedRecipe.link !== "Not available" && (
            <p>
              <a href={selectedRecipe.link} target="_blank" rel="noopener noreferrer" style={{ color: '#2980b9' }}>View Recipe</a>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
