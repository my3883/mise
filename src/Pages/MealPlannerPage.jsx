import React, { useEffect, useState } from 'react';
import { auth } from '../firebase';
import { db, collection, getDocs, query, where } from '../firestore';
import { doc as docRef, getDoc, setDoc } from 'firebase/firestore';
import { useMealPlan } from '../context/MealPlanContext';

export default function MealPlannerPage() {
  const { mealPlan, setMealPlan } = useMealPlan();
  const [recipes, setRecipes] = useState([]);
  const [showWeekends, setShowWeekends] = useState(false);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
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

  useEffect(() => {
    if (!user || !settingsLoaded) return;
    const settingsRef = docRef(db, 'userSettings', user.uid);
    setDoc(settingsRef, { showWeekends }, { merge: true });
  }, [showWeekends, user, settingsLoaded]);

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

  const renderWeek = (weekLabel, weekKey) => {
    const plan = mealPlan[weekKey] || {};
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
            <div key={day} style={{ display: 'flex', alignItems: 'left', marginBottom: '0.5rem' }}>
              <div style={{ width: '6rem', fontSize: '0.85rem' }}>{day} {formatted}</div>
              <select
                value={plan[day] || ''}
                onChange={e => handleSelect(weekKey, day, e.target.value)}
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
    <div style={{ padding: '1rem', textAlign: 'left' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
        <label style={{ display: 'flex', alignItems: 'left' }}>
          <span style={{ marginRight: '0.5rem' }}>Show weekends</span>
          <input
            type="checkbox"
            checked={showWeekends}
            onChange={() => setShowWeekends(prev => !prev)}
            style={{ transform: 'scale(1.2)' }}
          />
        </label>
      </div>
      {renderWeek('This Week', thisWeekKey)}
      {renderWeek('Next Week', nextWeekKey)}
    </div>
  );
}
