import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import RecipesPage from './Pages/RecipesPage';
import MealPlannerPage from './Pages/MealPlannerPage';
import ShoppingListPage from './Pages/ShoppingListPage';
import { MealPlanProvider } from './context/MealPlanContext';
import './App.css';

function Navigation() {
  const location = useLocation();
  return (
    <nav style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginBottom: '1.5rem', whiteSpace: 'nowrap', overflowX: 'auto' }}>
      <Link
        to="/"
        style={{
          padding: '0.3rem 0.75rem',
          borderRadius: '9999px',
          backgroundColor: location.pathname === '/' ? '#577590' : 'transparent',
          border: '2px solid #577590',
          color: location.pathname === '/' ? 'white' : '#577590',
          fontWeight: 'bold',
          textDecoration: 'none',
          fontSize: '0.9rem',
          lineHeight: '1.2',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        Recipes
      </Link>
      <Link
        to="/meal-planner"
        style={{
          padding: '0.3rem 0.75rem',
          borderRadius: '9999px',
          backgroundColor: location.pathname === '/meal-planner' ? '#90be6d' : 'transparent',
          border: '2px solid #90be6d',
          color: location.pathname === '/meal-planner' ? 'white' : '#90be6d',
          fontWeight: 'bold',
          textDecoration: 'none',
          fontSize: '0.9rem',
          lineHeight: '1.2',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        Meal Planner
      </Link>
      <Link
        to="/shopping-list"
        style={{
          padding: '0.3rem 0.75rem',
          borderRadius: '9999px',
          backgroundColor: location.pathname === '/shopping-list' ? '#f3722c' : 'transparent',
          border: '2px solid #f3722c',
          color: location.pathname === '/shopping-list' ? 'white' : '#f3722c',
          fontWeight: 'bold',
          textDecoration: 'none',
          fontSize: '0.9rem',
          lineHeight: '1.2',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        Shopping List
      </Link>
    </nav>
  );
}

function App() {
  return (
    <MealPlanProvider>
      <Router>
        <div
          className="App"
          style={{
            paddingTop: '5.5rem',
            maxWidth: '600px',
            margin: '0 auto',
            fontFamily: 'Arial, sans-serif',
            backgroundColor: '#fdfdfd',
            color: '#333',
            position: 'relative'
          }}>
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, backgroundColor: '#fdfdfd', zIndex: 1000, paddingTop: '0.75rem', paddingBottom: '0.25rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
  <img src="/logo.png" alt="Mise logo" style={{ height: '48px', display: 'block', marginLeft: 'auto', marginRight: 'auto', marginBottom: '0.75rem' }} />
          <Navigation />
</div>
          <Routes>
            <Route path="/" element={<RecipesPage />} />
            <Route path="/meal-planner" element={<MealPlannerPage />} />
            <Route path="/shopping-list" element={<ShoppingListPage />} />
          </Routes>
        </div>
      </Router>
    </MealPlanProvider>
  );
}

export default App;
