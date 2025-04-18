import React, { useEffect, useState } from 'react';
import { recipes } from '../recipes';
import { useMealPlan } from '../context/MealPlanContext';

export default function ShoppingListPage() {
  const { mealPlan } = useMealPlan();
  const [shoppingList, setShoppingList] = useState({ current: {}, next: {} });
  const [checkedItems, setCheckedItems] = useState(new Set());

  const generateShoppingListByCategory = (weekPlan) => {
    const selectedRecipes = Object.values(weekPlan)
      .map(name => recipes.find(r => r.name === name))
      .filter(Boolean);

    const categories = { Protein: {}, Starch: {}, Veggies: {}, Pantry: {} };

    selectedRecipes.forEach(recipe => {
      Object.entries(recipe.ingredients).forEach(([category, items]) => {
        items.forEach(item => {
          if (!categories[category][item]) {
            categories[category][item] = new Set();
          }
          categories[category][item].add(recipe.name);
        });
      });
    });

    return categories;
  };

  useEffect(() => {
    setShoppingList({
      current: generateShoppingListByCategory(mealPlan.current),
      next: generateShoppingListByCategory(mealPlan.next)
    });
  }, [mealPlan]);

  const toggleItem = (item) => {
    setCheckedItems(prev => {
      const updated = new Set(prev);
      updated.has(item) ? updated.delete(item) : updated.add(item);
      return updated;
    });
  };

  const renderCategory = (itemsMap, title) => (
    <div style={{ marginBottom: '1rem' }}>
      <ul style={{ listStyle: 'none', paddingLeft: 0, margin: 0, textAlign: 'left' }}>
        <li style={{ listStyle: 'none', fontWeight: 'bold', paddingLeft: '0.25rem' }}>{title}</li>
        {Object.entries(itemsMap).map(([item, recipeSet], idx) => (
          <li key={idx}>
            <label style={{ textDecoration: checkedItems.has(item) ? 'line-through' : 'none' }}>
              <input
                type="checkbox"
                checked={checkedItems.has(item)}
                onChange={() => toggleItem(item)}
                style={{ marginRight: '0.5rem' }}
              />
              {item} <span style={{ color: '#888' }}>({Array.from(recipeSet).join(', ')})</span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <div style={{ marginTop: '0', textAlign: 'left', minHeight: '50vh' }}>
      <h3 style={{ marginTop: '0.25rem' }}>This Week</h3>
      {Object.entries(shoppingList.current).map(([category, itemsMap]) =>
        renderCategory(itemsMap, category)
      )}

      <h3 style={{ marginTop: '0.75rem' }}>Next Week</h3>
      {Object.entries(shoppingList.next).map(([category, itemsMap]) =>
        renderCategory(itemsMap, category)
      )}
    </div>
  );
}
