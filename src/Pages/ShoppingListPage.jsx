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

  const getWeekStartKey = (offset = 0) => {
    const now = new Date();
    const day = now.getDay();
    const mondayOffset = (day === 0 ? -6 : 1) - day + offset * 7;
    const monday = new Date(now);
    monday.setDate(now.getDate() + mondayOffset);
    return monday.toISOString().split('T')[0];
  };

  const thisWeekKey = getWeekStartKey(0);
  const nextWeekKey = getWeekStartKey(1);

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
      const selected = Object.entries(plan || {})
        .filter(([, name]) => name) // only include days with selected recipes
        .map(([, name]) => recipes.find(r => r.name === name))
        .filter(Boolean);

      const categories = { Produce: [], Protein: [], Starch: [], Pantry: [] };

      selected.forEach(recipe => {
        Object.entries(recipe.ingredients || {}).forEach(([category, items]) => {
          const key = category.toLowerCase() === 'veggies' ? 'Produce' : category;
          if (!categories[key]) categories[key] = [];
          items.forEach(item => {
            const fullItem = `${item} (${recipe.name})`;
            if (!categories[key].includes(fullItem)) {
              categories[key].push(fullItem);
            }
          });
        });
      });

      return categories;
    };

    setShoppingList({
      current: generateList(mealPlan[thisWeekKey]),
      next: generateList(mealPlan[nextWeekKey]),
    });
  }, [mealPlan, recipes, thisWeekKey, nextWeekKey]);

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
        <ul style={{ paddingLeft: '0.5rem', listStyle: 'none', textAlign: 'left' }}>
          {items.map(item => (
            <li key={item}>
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

  const hasCurrent = Object.values(shoppingList.current).some(arr => arr.length > 0);
  const hasNext = Object.values(shoppingList.next).some(arr => arr.length > 0);

  return (
    <div style={{
      padding: '1rem',
      textAlign: 'left',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-start',
      alignItems: 'stretch',
      minHeight: '100vh'
    }}>
      {hasCurrent && (
        <>
          <h3>This Week</h3>
          {Object.entries(shoppingList.current).map(([category, items]) =>
            renderCategory(items, category)
          )}
        </>
      )}

      {hasNext && (
        <>
          <h3 style={{ marginTop: '2rem' }}>Next Week</h3>
          {Object.entries(shoppingList.next).map(([category, items]) =>
            renderCategory(items, category)
          )}
        </>
      )}
    </div>
  );
}
