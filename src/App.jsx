import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import RecipesPage from './Pages/RecipesPage';
import MealPlannerPage from './Pages/MealPlannerPage';
import ShoppingListPage from './Pages/ShoppingListPage';
import SousChefPage from './Pages/SousChefPage';
import './App.css';
import logo from './assets/mise-logo.png';
import { auth, provider } from './firebase';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { MealPlanProvider } from './context/MealPlanContext';

export default function App() {
  const [user, setUser] = useState(null);
  const [showSignOut, setShowSignOut] = useState(false);

  useEffect(() => {
    onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
  }, []);

  const handleSignIn = () => {
    signInWithPopup(auth, provider)
      .then((result) => setUser(result.user))
      .catch((error) => console.error(error));
  };

  const handleSignOut = () => {
    signOut(auth);
    setShowSignOut(false);
  };

  const navItems = [
    { path: '/', label: 'Recipes', color: '#ff7b11' },
    { path: '/meal-planner', label: 'Plan', color: '#ee562a' },
    { path: '/shopping-list', label: 'Shopping', color: '#369a4f' },
    { path: '/sous-chef', label: 'Sous Chef', color: '#179497' }
  ];

  return (
    <MealPlanProvider>
      <Router>
        <div style={{ maxWidth: '600px', margin: '0 auto', padding: '1rem 0.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '1rem' }}>
            <img src={logo} alt="Mise logo" style={{ height: '40px' }} />
            <div>
              {user ? (
                <div style={{ position: 'relative' }}>
                  <span
                    onClick={() => setShowSignOut((prev) => !prev)}
                    style={{ cursor: 'pointer', marginRight: '1rem' }}
                  >
                    👨‍🍳 {user.displayName}
                  </span>
                  {showSignOut && (
                    <div
                      style={{
                        position: 'absolute',
                        right: 0,
                        top: '1.5rem',
                        backgroundColor: 'white',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        padding: '0.5rem',
                        zIndex: 1000
                      }}
                    >
                      <button onClick={handleSignOut}>Sign Out</button>
                    </div>
                  )}
                </div>
              ) : (
                <button onClick={handleSignIn}>Sign in with Google</button>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
            {navItems.map(({ path, label, color }) => (
              <NavLink
                key={path}
                to={path}
                style={(navData) => {
                  const isActive = navData.isActive;
                  return {
                    border: `2px solid ${color}`,
                    backgroundColor: isActive ? color : 'white',
                    color: isActive ? 'white' : color,
                    padding: '0.4rem 0.75rem',
                    borderRadius: '20px',
                    fontWeight: '500',
                    textDecoration: 'none',
                    fontSize: '0.95rem',
                    textAlign: 'center'
                  };
                }}
              >
                {label}
              </NavLink>
            ))}
          </div>

          <Routes>
            <Route path="/" element={<RecipesPage />} />
            <Route path="/meal-planner" element={<MealPlannerPage />} />
            <Route path="/shopping-list" element={<ShoppingListPage />} />
            <Route path="/sous-chef" element={<SousChefPage />} />
          </Routes>
        </div>
      </Router>
    </MealPlanProvider>
  );
}


