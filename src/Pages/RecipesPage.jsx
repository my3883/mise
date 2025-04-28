import React, { useEffect, useState } from 'react';
import { db, collection, getDocs, query, where } from '../firestore';
import { auth } from '../firebase';
import { doc as docRef, deleteDoc, setDoc } from 'firebase/firestore';

export default function RecipesPage() {
  const [recipes, setRecipes] = useState([]);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editFields, setEditFields] = useState({
    name: '',
    instructions: '',
    link: '',
    ingredients: { Protein: [], Starch: [], Produce: [], Pantry: [] }
  });
  const user = auth.currentUser;

  // Fetch user's recipes
  useEffect(() => {
    if (!user) return;
    (async () => {
      const q = query(collection(db, 'recipes'), where('userId', '==', user.uid));
      const snapshot = await getDocs(q);
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => a.name.localeCompare(b.name));
      setRecipes(list);
    })();
  }, [user]);

  // Sync editFields when a recipe is selected
  useEffect(() => {
    if (selectedRecipe) {
      setEditFields({
        name: selectedRecipe.name || '',
        instructions: selectedRecipe.instructions || '',
        link: selectedRecipe.link || '',
        ingredients: selectedRecipe.ingredients || { Protein: [], Starch: [], Produce: [], Pantry: [] }
      });
      setIsEditing(false);
    }
  }, [selectedRecipe]);

  // Delete recipe
  const handleDelete = async (id) => {
    if (window.confirm('Delete this recipe?')) {
      await deleteDoc(docRef(db, 'recipes', id));
      setRecipes(recipes.filter(r => r.id !== id));
      setSelectedRecipe(null);
    }
  };

  // Save edits to Firestore using setDoc merge
  const handleSave = async () => {
    const ref = docRef(db, 'recipes', selectedRecipe.id);
    await setDoc(ref, {
      name: editFields.name,
      instructions: editFields.instructions,
      link: editFields.link,
      ingredients: editFields.ingredients
    }, { merge: true });
    setRecipes(recipes.map(r => r.id === selectedRecipe.id ? { ...r, ...editFields } : r));
    setSelectedRecipe({ id: selectedRecipe.id, ...editFields });
    setIsEditing(false);
  };

  // Button styles
  const actionBtnStyle = {
    padding: '0.5rem 1rem',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  };
  const deleteBtnStyle = {
    ...actionBtnStyle,
    backgroundColor: '#e74c3c'
  };
  const editBtnStyle = {
    ...actionBtnStyle,
    backgroundColor: '#3498db'
  };

  // Styles
  const listStyle = { listStyle: 'none', padding: 0, margin: '1rem 0' };
  const itemStyle = { marginBottom: '0.5rem', background: '#ecf0f1', padding: '0.5rem', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
  const detailStyle = { backgroundColor: '#ecf0f1', borderRadius: '12px', padding: '1rem', position: 'relative', maxWidth: '600px', margin: '1rem auto' };
  const inputStyle = { width: '100%', padding: '0.5rem', marginBottom: '0.5rem', fontSize: '1rem', border: '1px solid #ccc', borderRadius: '4px' };

  return (
    <div style={{ textAlign: 'left', padding: '1rem' }}>
      {!selectedRecipe ? (
        <ul style={listStyle}>
          {recipes.map(recipe => (
            <li key={recipe.id} style={itemStyle}>
              <strong>{recipe.name}</strong>
              <button onClick={() => setSelectedRecipe(recipe)} style={editBtnStyle}>View</button>
            </li>
          ))}
        </ul>
      ) : (
        <div style={detailStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            {isEditing ? (
              <input
                style={{ ...inputStyle, marginBottom: 0 }}
                value={editFields.name}
                onChange={e => setEditFields(prev => ({ ...prev, name: e.target.value }))}
              />
            ) : (
              <h2 style={{ margin: 0 }}>{selectedRecipe.name}</h2>
            )}
          </div>

          {/* Ingredients */}
          {Object.entries(isEditing ? editFields.ingredients : selectedRecipe.ingredients).map(([cat, items]) => (
            items.length > 0 && (
              <div key={cat} style={{ marginBottom: '0.5rem' }}>
                <strong>{cat}:</strong>
                {isEditing ? (
                  <input
                    style={inputStyle}
                    value={items.join(', ')}
                    onChange={e => {
                      const values = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                      setEditFields(prev => ({ ...prev, ingredients: { ...prev.ingredients, [cat]: values } }));
                    }}
                  />
                ) : (
                  <ul style={{ margin: '0.25rem 0 0 1rem', padding: 0 }}>
                    {items.map((item, idx) => <li key={idx} style={{ listStyle: 'disc' }}>{item}</li>)}
                  </ul>
                )}
              </div>
            )
          ))}

          {/* Instructions */}
          {isEditing ? (
            <textarea
              style={{ ...inputStyle, height: '80px' }}
              value={editFields.instructions}
              onChange={e => setEditFields(prev => ({ ...prev, instructions: e.target.value }))}
            />
          ) : (
            <p style={{ fontStyle: 'italic', margin: '0.5rem 0' }}>{selectedRecipe.instructions || 'No instructions.'}</p>
          )}

          {/* Link */}
          {isEditing ? (
            <input
              style={inputStyle}
              placeholder="Link (optional)"
              value={editFields.link}
              onChange={e => setEditFields(prev => ({ ...prev, link: e.target.value }))}
            />
          ) : (
            selectedRecipe.link && selectedRecipe.link.startsWith('http') && (
              <p style={{ margin: '0.5rem 0' }}><a href={selectedRecipe.link} target="_blank" rel="noopener noreferrer" style={{ color: '#2980b9' }}>View Recipe</a></p>
            )
          )}

          {/* Action Buttons */}
          {isEditing ? (
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
              <button onClick={handleSave} style={editBtnStyle}>Save</button>
              <button onClick={() => setIsEditing(false)} style={deleteBtnStyle}>Cancel</button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
              <button onClick={() => setIsEditing(true)} style={editBtnStyle}>Edit</button>
              <button onClick={() => handleDelete(selectedRecipe.id)} style={deleteBtnStyle}>Delete</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}