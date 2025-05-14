import React, { useState } from 'react';
import { db, collection, addDoc } from '../firestore';
import { auth } from '../firebase';
import axios from 'axios';

const arrow = (expanded) => expanded ? '▼' : '▶';

const options = {
  mainIngredient: ['chicken','beef','pork','fish','shellfish','tofu','mushrooms','beans','veggies'],
  style: [
    'Carbone',
    'Chez Panisse',
    'Joes Shanghai',
    'Ottolenghi',
    'Nobu',
    'Noma',
    'Pok Pok',
    'Taco Bell',
    'Uchi',
    'Zahav',
    'Zuni Cafe'
  ],
  difficulty: ['under 30 minutes','1-2 hours','all day']
};

export default function SousChefPage() {
  const [rouletteRecipe, setRouletteRecipe] = useState(null);
  const [rouletteStatus, setRouletteStatus] = useState('');
  const [expandedSection, setExpandedSection] = useState('roulette');
  const [pickerValues, setPickerValues] = useState({ mainIngredient:'', style:'', difficulty:'', scale: 4 });

  const safeParse = (text) => {
    try {
      return JSON.parse(text);
    } catch (e) {
      throw new Error(`Invalid JSON response from ChatGPT: ${text}`);
    }
  };

  const callChatGPT = async (prompt) => {
    const { data } = await axios.post('/.netlify/functions/chatgptProxy', { prompt });
    const reply = data.reply?.trim() || '';
    return safeParse(reply);
  };

  const handleRoulette = async () => {
    const user = auth.currentUser;
    const { style, mainIngredient, difficulty, scale } = pickerValues;
    if (!user) return setRouletteStatus('Please sign in.');
    if (!style || !mainIngredient || !difficulty || !scale)
      return setRouletteStatus('Please complete all fields.');

    setRouletteStatus('Generating recipe...');

    const prompt = `
Create a recipe for ${scale} people that I can cook in ${difficulty} using ${mainIngredient} in the style of ${style}.
Only return a valid JSON object with this exact structure:

{
  "name": "string",
  "ingredients": {
    "Protein": ["..."],
    "Starch": ["..."],
    "Produce": ["..."],
    "Pantry": ["..."]
  },
  "instructions": "string"
}

Do not include any extra text, comments, or markdown. Return ONLY the JSON object, with all required fields.
`;

    try {
      const raw = await callChatGPT(prompt);
      const jsonMatch = JSON.stringify(raw).match(/\{[\s\S]*?\}/);
      const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : raw;
      setRouletteRecipe(parsed);
      setRouletteStatus('Recipe generated.');
    } catch (err) {
      console.error('Roulette error:', err);
      setRouletteStatus(err.message);
    }
  };

  const addRouletteRecipe = async () => {
    const user = auth.currentUser;
    if (!user) return setRouletteStatus('Please sign in.');
    try {
      await addDoc(collection(db, 'recipes'), { ...rouletteRecipe, userId: user.uid });
      setRouletteStatus('Recipe added!');
    } catch (err) {
      console.error('Add recipe error:', err);
      setRouletteStatus(`Error adding: ${err.message}`);
    }
  };

  const dropdownStyle = { padding: '0.25rem', fontSize: '1rem', border: '1px solid #ccc', borderRadius: '4px' };
  const headingStyle = { padding:'0.3rem 0', textAlign:'left', fontWeight:'normal', fontSize:'1.1rem', background:'none', border:'none', width:'100%' };
  const buttonStyle = { padding:'0.5rem 1rem', backgroundColor:'#3498db', color:'white', border:'none', borderRadius:'4px', cursor:'pointer', marginTop:'0.5rem' };

  return (
    <div style={{ padding: '1rem', textAlign: 'left', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'stretch', minHeight: '100vh' }}>
      <div style={{ marginBottom:'1rem' }}>
        <button onClick={() => setExpandedSection('roulette')} style={headingStyle}>{arrow(expandedSection==='roulette')} Recipe Roulette</button>
        {expandedSection === 'roulette' && (
          <div style={{ marginTop: '0.5rem' }}>
            <p style={{ lineHeight: '2rem' }}>
              Create a recipe for&nbsp;
              <input
                type="number"
                min="1"
                value={pickerValues.scale}
                onChange={e => setPickerValues(prev => ({ ...prev, scale: parseInt(e.target.value) }))}
                style={{ ...dropdownStyle, width: '60px', textAlign: 'center' }}
              />&nbsp;people that I can cook in&nbsp;
              <select value={pickerValues.difficulty} onChange={e => setPickerValues(prev => ({ ...prev, difficulty: e.target.value }))} style={dropdownStyle}>
                <option value="">-- difficulty --</option>
                {options.difficulty.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              &nbsp;using&nbsp;
              <select value={pickerValues.mainIngredient} onChange={e => setPickerValues(prev => ({ ...prev, mainIngredient: e.target.value }))} style={dropdownStyle}>
                <option value="">-- main ingredient --</option>
                {options.mainIngredient.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              &nbsp;in the style of&nbsp;
              <select value={pickerValues.style} onChange={e => setPickerValues(prev => ({ ...prev, style: e.target.value }))} style={dropdownStyle}>
                <option value="">-- style --</option>
                {options.style.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              .
            </p>
            <button onClick={handleRoulette} style={buttonStyle}>Generate Recipe</button>
            {rouletteStatus && <p>{rouletteStatus}</p>}
            {rouletteRecipe && (
              <div style={{ border:'1px solid #ccc', borderRadius:'4px', padding:'1rem', marginTop:'0.5rem', textAlign:'left' }}>
                <h4>{rouletteRecipe.name}</h4>
                <ul style={{ paddingLeft: '1rem', margin:'0.5rem 0' }}>
                  {Object.entries(rouletteRecipe.ingredients).map(([cat, items]) => (
                    items.length > 0 && <li key={cat}><strong>{cat}:</strong> {items.join(', ')}</li>
                  ))}
                </ul>
                <p style={{ fontStyle:'italic' }}>{rouletteRecipe.instructions}</p>
                <button onClick={addRouletteRecipe} style={{ ...buttonStyle, backgroundColor:'#179497' }}>Add to Recipes</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
