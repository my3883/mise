// src/Pages/ShoppingListPage.jsx
import React, { useEffect, useState } from 'react';
import { useMealPlan } from '../context/MealPlanContext';
import { auth } from '../firebase';
import { db, collection, getDocs, query, where } from '../firestore';

export default function ShoppingListPage() {
  const { mealPlan } = useMealPlan();
  const [recipes, setRecipes] = useState([]);
  const [shoppingList, setShoppingList] = useState({ current: {}, next: {} });
  const [checkedItems, setCheckedItems] = useState(new Set());
  const user = auth.currentUser;

  useEffect(() => {
    const fetchRecipes = async () => {
      if (!user) return;
      const q = query(collection(db, 'recipes'), where('userId', '==', user.uid));
      const snapshot = await getDocs(q);
      const recipeList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRecipes(recipeList);
    };
    fetchRecipes();
  }, [user]);

  useEffect(() => {
    const generateList = (plan) => {
      const selected = Object.values(plan)
        .map(name => recipes.find(r => r.name === name))
        .filter(Boolean);

      const categories = { Produce: [], Protein: [], Starch: [], Pantry: [] };

      selected.forEach(recipe => {
        Object.entries(recipe.ingredients || {}).forEach(([category, items]) => {
          if (!categories[category]) categories[category] = [];
          items.forEach(item => {
            const fullItem = `${item} (${recipe.name})`;
            if (!categories[category].includes(fullItem)) {
              categories[category].push(fullItem);
            }
          });
        });
      });

      return categories;
    };

    setShoppingList({
      current: generateList(mealPlan.current),
      next: generateList(mealPlan.next),
    });
  }, [mealPlan, recipes]);

  const toggleItem = (item) => {
    setCheckedItems(prev => {
      const updated = new Set(prev);
      updated.has(item) ? updated.delete(item) : updated.add(item);
      return updated;
    });
  };

  const renderCategory = (items, title) => (
    items.length === 0 ? null : (
      <div style={{ marginBottom: '1rem' }} key={title}>
        <strong>{title}</strong>
        <ul style={{ paddingLeft: '0.5rem', listStyle: 'none' }}>
          {items.map((item) => (
            <li key={item} style={{ textAlign: 'left' }}>
              <label style={{ textDecoration: checkedItems.has(item) ? 'line-through' : 'none' }}>
                <input
                  type="checkbox"
                  checked={checkedItems.has(item)}
                  onChange={() => toggleItem(item)}
                  style={{ marginRight: '0.5rem' }}
                />
                {item}
              </label>
            </li>
          ))}
        </ul>
      </div>
    )
  );

  return (
    <div style={{ paddingTop: '3rem' }}>
      <h3>This Week</h3>
      {Object.entries(shoppingList.current).map(([category, items]) =>
        renderCategory(items, category)
      )}

      <h3 style={{ marginTop: '2rem' }}>Next Week</h3>
      {Object.entries(shoppingList.next).map(([category, items]) =>
        renderCategory(items, category)
      )}
    </div>
  );
}
