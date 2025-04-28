import React, { useEffect, useState } from 'react';
import { auth } from '../firebase';
import { db, collection, getDocs, query, where } from '../firestore';
import { doc as docRef } from 'firebase/firestore';
import { getDoc, setDoc } from 'firebase/firestore';
import { useMealPlan } from '../context/MealPlanContext';

export default function MealPlannerPage() {
  const { mealPlan, setMealPlan } = useMealPlan();
  const [recipes, setRecipes] = useState([]);
  const [showWeekends, setShowWeekends] = useState(false);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const user = auth.currentUser;

  // Fetch saved settings (mealPlan & showWeekends) from Firestore once
  useEffect(() => {
    if (!user) return;
    const settingsRef = docRef(db, 'userSettings', user.uid);
    (async () => {
      const snap = await getDoc(settingsRef);
      if (snap.exists()) {
        const data = snap.data();
        if (data.showWeekends !== undefined) setShowWeekends(data.showWeekends);
        if (data.mealPlan) setMealPlan(data.mealPlan);
      }
      setSettingsLoaded(true);
    })();
  }, [user, setMealPlan]);

  // Persist showWeekends to Firestore on change
  useEffect(() => {
    if (!user || !settingsLoaded) return;
    const settingsRef = docRef(db, 'userSettings', user.uid);
    setDoc(settingsRef, { showWeekends }, { merge: true });
  }, [showWeekends, user, settingsLoaded]);

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

  // Handle selection and persist mealPlan
  const handleSelect = (weekKey, day, value) => {
    const updatedPlan = {
      ...mealPlan,
      [weekKey]: {
        ...mealPlan[weekKey],
        [day]: value
      }
    };
    setMealPlan(updatedPlan);
    if (user && settingsLoaded) {
      const settingsRef = docRef(db, 'userSettings', user.uid);
      setDoc(settingsRef, { mealPlan: updatedPlan }, { merge: true });
    }
  };

  // Render each week
  const renderWeek = (weekLabel, planKey) => {
    const plan = mealPlan[planKey] || {};
    const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
    return (
      <div style={{ marginBottom: '2rem' }}>
        <h3>{weekLabel}</h3>
        {days.map((day, idx) => {
          if (!showWeekends && (day === 'Sat' || day === 'Sun')) return null;
          const today = new Date();
          const base = today.getDate() - today.getDay() + 1;
          const offset = idx + (weekLabel === 'Next Week' ? 7 : 0);
          const dateObj = new Date();
          dateObj.setDate(base + offset);
          const formatted = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          return (
            <div key={day} style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
              <div style={{ width: '6rem', fontSize: '0.85rem' }}>{day} {formatted}</div>
              <select
                value={plan[day] || ''}
                onChange={e => handleSelect(planKey, day, e.target.value)}
                style={{ flex: 1, fontSize: '0.85rem', padding: '0.25rem' }}
              >
                <option value="">-- Select a recipe --</option>
                {recipes.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
              </select>
            </div>
          );
        })}
      </div>
    );
  };

  if (!settingsLoaded) {
    return <div style={{ padding: '1rem' }}>Loading meal plan...</div>;
  }

  return (
    <div style={{ padding: '1rem' }}>
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
      {renderWeek('This Week', 'current')}
      {renderWeek('Next Week', 'next')}
    </div>
  );
}