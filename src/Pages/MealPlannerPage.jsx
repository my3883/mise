// src/Pages/MealPlannerPage.jsx
import React, { useEffect, useState } from 'react';
import { auth } from '../firebase';
import { db, collection, getDocs, query, where } from '../firestore';
import { useMealPlan } from '../context/MealPlanContext';

export default function MealPlannerPage() {
  const { mealPlan, setMealPlan } = useMealPlan();
  const [recipes, setRecipes] = useState([]);
  const [showWeekends, setShowWeekends] = useState(true);
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

  const handleSelect = (week, day, value) => {
    setMealPlan(prev => ({
      ...prev,
      [week]: {
        ...prev[week],
        [day]: value
      }
    }));
  };

  const renderWeek = (weekLabel, plan) => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return (
      <div style={{ marginBottom: '2rem' }}>
        <h3>{weekLabel}</h3>
        {days.map(day => {
          if (!showWeekends && (day === 'Sat' || day === 'Sun')) return null;
          const today = new Date();
          const offset = days.indexOf(day) + (weekLabel === 'Next Week' ? 7 : 0);
          const date = new Date(today.setDate(today.getDate() - today.getDay() + offset + 1));
          const formattedDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          return (
            <div key={day} style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center' }}>
              <div style={{ width: '6rem', fontSize: '0.85rem' }}>{day} {formattedDate}</div>
              <select
                value={plan[day] || ''}
                onChange={e => handleSelect(weekLabel === 'This Week' ? 'current' : 'next', day, e.target.value)}
                style={{ fontSize: '0.85rem', padding: '0.25rem', flex: '1' }}
              >
                <option value="">-- Select a recipe --</option>
                {recipes.map(r => (
                  <option key={r.id} value={r.name}>{r.name}</option>
                ))}
              </select>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
        <label style={{ display: 'flex', alignItems: 'center' }}>
          <span style={{ marginRight: '0.5rem' }}>Show weekends</span>
          <input
            type="checkbox"
            checked={showWeekends}
            onChange={() => setShowWeekends(prev => !prev)}
            style={{ transform: 'scale(1.2)' }}
          />
        </label>
      </div>
      {renderWeek('This Week', mealPlan.current)}
      {renderWeek('Next Week', mealPlan.next)}
    </div>
  );
}
