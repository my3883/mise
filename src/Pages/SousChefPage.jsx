import React, { useState } from 'react';
import { db, collection, addDoc } from '../firestore';
import { auth } from '../firebase';
import axios from 'axios';

const arrow = (expanded) => expanded ? '▼' : '▶';

const options = {
  mainIngredient: ['chicken','beef','pork','salmon','white fish','shrimp','tofu','mushrooms','beans','veggies'],
  cuisine:        ['American','Chinese','Indian','Italian','Japanese','Mexican','Middle Eastern','Southeast Asian'],
  style:          ['light','rich','spicy','bold','zesty','funky','umami-forward'],
  chef:           ['Alice Waters','Judy Rogers','Julia Child','Kenji Alt-Lopez','Mario Batali','Michael Solomonov','Morimoto','Ottolenghi','Rick Bayless','Thomas Keller']
};

export default function SousChefPage() {
  const [link, setLink] = useState('');
  const [parsedImport, setParsedImport] = useState(null);
  const [rouletteRecipe, setRouletteRecipe] = useState(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const [customRecipeObj, setCustomRecipeObj] = useState(null);
  const [status, setStatus] = useState('');
  const [rouletteStatus, setRouletteStatus] = useState('');
  const [customStatus, setCustomStatus] = useState('');
  const [expandedSection, setExpandedSection] = useState(null);
  const [pickerValues, setPickerValues] = useState({ mainIngredient:'', cuisine:'', style:'', chef:'' });

  const toggleSection = (section) => {
    setExpandedSection(prev => prev === section ? null : section);
    setStatus(''); setRouletteStatus(''); setCustomStatus('');
  };

  const callChatGPT = async (prompt) => {
    const { data } = await axios.post('/.netlify/functions/chatgptProxy', { prompt });
    const raw = typeof data.reply === 'string' ? data.reply.trim() : JSON.stringify(data.reply);
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error(`Invalid JSON response from ChatGPT:\n\n${raw}`);
    return JSON.parse(jsonMatch[0]);
  };

  const renderRecipeCard = (recipe, onAdd, showLink=false) => (
    <div style={{ border:'1px solid #ccc', borderRadius:'4px', padding:'1rem', marginTop:'0.5rem', textAlign:'left' }}>
      <h4 style={{ margin:'0 0 0.5rem' }}>{recipe.name}</h4>
      <ul style={{ paddingLeft:'1rem', margin:'0.5rem 0' }}>
        {Object.entries(recipe.ingredients).map(([cat, items]) => (
          items.length > 0 && <li key={cat}><strong>{cat}:</strong> {items.join(', ')}</li>
        ))}
      </ul>
      {recipe.instructions && <p style={{ fontStyle:'italic', margin:'0.5rem 0' }}>{recipe.instructions}</p>}
      {showLink && recipe.link?.startsWith('http') && (
        <div style={{ margin:'0.5rem 0' }}><a href={recipe.link} target="_blank" rel="noopener noreferrer">View Source</a></div>
      )}
      <button onClick={onAdd} style={{ padding:'0.5rem 1rem', backgroundColor:'#179497', color:'white', border:'none', borderRadius:'4px', marginTop:'0.5rem' }}>
        Add to Recipes
      </button>
    </div>
  );

  const handleImportLink = async () => {
    if (!link) return;
    const user = auth.currentUser;
    if (!user) return setStatus('Please sign in.');
    setStatus('Parsing recipe...');

    const prompt = `
Extract a recipe from this URL: ${link}.
Return only a valid JSON object with the following format:
{
  "name": "Recipe name",
  "ingredients": {
    "Protein": [],
    "Starch": [],
    "Produce": [],
    "Pantry": []
  },
  "instructions": "Short step-by-step instructions.",
  "link": "${link}"
}
No extra text, no explanation.
`;

    try {
      const parsed = await callChatGPT(prompt);
      setParsedImport(parsed);
      setStatus('Recipe parsed.');
    } catch (err) {
      console.error('Import error:', err);
      setStatus(err.message);
    }
  };

  const addImportRecipe = async () => {
    const user = auth.currentUser;
    if (!user) return setStatus('Please sign in.');
    try {
      await addDoc(collection(db, 'recipes'), { ...parsedImport, userId: user.uid });
      setStatus('Recipe added!'); setParsedImport(null); setLink('');
    } catch (err) {
      console.error('Add import error:', err);
      setStatus(`Error adding: ${err.message}`);
    }
  };

  // ... rest of the code remains unchanged
} 
