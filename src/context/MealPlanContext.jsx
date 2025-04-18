import React, { createContext, useContext, useState } from 'react';

const MealPlanContext = createContext();

export function MealPlanProvider({ children }) {
  const [mealPlan, setMealPlan] = useState({ current: {}, next: {} });

  return (
    <MealPlanContext.Provider value={{ mealPlan, setMealPlan }}>
      {children}
    </MealPlanContext.Provider>
  );
}

export function useMealPlan() {
  return useContext(MealPlanContext);
}
