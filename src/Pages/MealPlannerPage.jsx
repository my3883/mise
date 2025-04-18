import React from 'react';
import { recipes } from '../recipes';
import { useMealPlan } from '../context/MealPlanContext';

export default function MealPlannerPage() {
  const { mealPlan, setMealPlan } = useMealPlan();

  const assignToDay = (week, day, recipe) => {
    setMealPlan((prev) => ({
      ...prev,
      [week]: {
        ...prev[week],
        [day]: recipe.name
      }
    }));
  };

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  const getDateLabel = (offset) => {
    const date = new Date();
    date.setDate(date.getDate() + offset);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const sortedRecipes = [...recipes].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div>
      <h3 style={{ marginTop: '1rem' }}>This Week</h3>
      {days.map((day, index) => (
        <div key={`current-${day}`} style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ minWidth: '100px', fontSize: '1rem' }}>{day}, {getDateLabel(index)}</span>
          <select
            value={recipes.find(r => r.name === mealPlan.current[day])?.id || ''}
            onChange={(e) => assignToDay('current', day, recipes.find(r => r.id === e.target.value))}
            style={{ flexGrow: 1, padding: '0.5rem', borderRadius: '6px', borderColor: '#ccc' }}
          >
            <option value="">No meal planned</option>
            {sortedRecipes.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </div>
      ))}

      <h3 style={{ marginTop: '2rem' }}>Next Week</h3>
      {days.map((day, index) => (
        <div key={`next-${day}`} style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ minWidth: '100px', fontSize: '1rem' }}>{day}, {getDateLabel(index + 7)}</span>
          <select
            value={recipes.find(r => r.name === mealPlan.next[day])?.id || ''}
            onChange={(e) => assignToDay('next', day, recipes.find(r => r.id === e.target.value))}
            style={{ flexGrow: 1, padding: '0.5rem', borderRadius: '6px', borderColor: '#ccc' }}
          >
            <option value="">No meal planned</option>
            {sortedRecipes.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </div>
      ))}
    </div>
  );
}
