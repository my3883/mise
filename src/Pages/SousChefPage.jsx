import React, { useState } from 'react';
import { db, collection, addDoc } from '../firestore';
import { auth } from '../firebase';
import axios from 'axios';

const arrow = (expanded) => expanded ? '▼' : '▶';

const options = {
  mainIngredient: ['chicken', 'beef', 'pork', 'salmon', 'white fish', 'shrimp', 'tofu', 'mushroom', 'beans', 'veggies'],
  cuisine:         ['American', 'Chinese', 'Indian', 'Italian', 'Japanese', 'Mexican', 'Middle Eastern', 'Southeast Asian'],
  style:           ['light', 'rich', 'spicy', 'bold', 'zesty', 'funky', 'umami-forward'],
  chef:            ['Alice Waters', 'Judy Rogers', 'Julia Child', 'Kenji Alt-Lopez', 'Mario Batali', 'Michael Solomonov', 'Morimoto', 'Ottolenghi', 'Rick Bayless', 'Thomas Keller']
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
  const [pickerValues, setPickerValues] = useState({
    mainIngredient: '',
    cuisine:         '',
    style:           '',
    chef:            ''
  });

  const toggleSection = (section) => {
    setExpandedSection(prev => (prev === section ? null : section));
    setStatus(''); setRouletteStatus(''); setCustomStatus('');
  };

  const renderRecipeCard = (recipe, onAdd, showLink = false) => (
    <div style={{ border: '1px solid #ccc', borderRadius: '4px', padding: '1rem', marginTop: '0.5rem' }}>
      <h4 style={{ margin: '0 0 0.5rem' }}>{recipe.name}</h4>
      <ul style={{ paddingLeft: '1rem', margin: '0.5rem 0' }}>
        {Object.entries(recipe.ingredients).map(([cat, items]) => (
          items.length > 0 && <li key={cat}><strong>{cat}:</strong> {items.join(', ')}</li>
        ))}
      </ul>
      {recipe.instructions && (
        <p style={{ fontStyle: 'italic', margin: '0.5rem 0' }}>{recipe.instructions}</p>
      )}
      {showLink && recipe.link && recipe.link.startsWith('http') && (
        <div style={{ margin: '0.5rem 0' }}>
          <a href={recipe.link} target="_blank" rel="noopener noreferrer">View Source</a>
        </div>
      )}
      <button onClick={onAdd} style={{ padding: '0.5rem 1rem', backgroundColor: '#179497', color: 'white', border: 'none', borderRadius: '4px' }}>
        Add to Recipes
      </button>
    </div>
  );

  const handleImportLink = async () => {
    if (!link) return;
    const user = auth.currentUser;
    if (!user) { setStatus('Please sign in to parse recipes.'); return; }
    setStatus('Parsing recipe...');
    try {
      const response = await axios.post('/.netlify/functions/chatgptProxy', {
        prompt: `Extract the name, simplified cooking instructions, and categorize ingredients from this recipe URL: ${link}. Respond only in JSON: { name, instructions, ingredients: { Protein, Starch, Produce, Pantry }, link }`
      });
      const cleaned = response.data.reply.trim();
      const parsed = JSON.parse(cleaned.slice(cleaned.indexOf('{'), cleaned.lastIndexOf('}') + 1));
      setParsedImport(parsed); setStatus('Recipe parsed.');
    } catch (err) {
      console.error(err); setStatus('Error parsing recipe.');
    }
  };

  const addImportRecipe = async () => {
    const user = auth.currentUser;
    if (!user) { setStatus('Please sign in to add recipes.'); return; }
    try {
      await addDoc(collection(db, 'recipes'), { ...parsedImport, userId: user.uid });
      setStatus('Recipe added!'); setParsedImport(null); setLink('');
    } catch (err) { console.error(err); setStatus('Error adding recipe.'); }
  };

  const handleRoulette = async () => {
    const user = auth.currentUser;
    if (!user) { setRouletteStatus('Sign in to generate.'); return; }
    const { style, cuisine, mainIngredient, chef } = pickerValues;
    if (!style || !cuisine || !mainIngredient || !chef) {
      setRouletteStatus('Please select all fields.');
      return;
    }
    setRouletteStatus('Generating recipe...');
    try {
      const prompt = `Create a ${style} ${cuisine} recipe using ${mainIngredient} in the style of ${chef}. Return only JSON: { name, instructions, ingredients: { Protein, Starch, Produce, Pantry }, link }`;
      const res = await axios.post('/.netlify/functions/chatgptProxy', { prompt });
      const cleaned = res.data.reply.trim();
      const parsed = JSON.parse(cleaned.slice(cleaned.indexOf('{'), cleaned.lastIndexOf('}') + 1));
      setRouletteRecipe(parsed); setRouletteStatus('Recipe generated.');
    } catch (err) { console.error(err); setRouletteStatus('Failed to generate.'); }
  };

  const addRouletteRecipe = async () => {
    const user = auth.currentUser;
    if (!user) { setRouletteStatus('Sign in to add.'); return; }
    try {
      await addDoc(collection(db, 'recipes'), { ...rouletteRecipe, userId: user.uid });
      setRouletteStatus('Added!'); setRouletteRecipe(null);
    } catch (err) { console.error(err); setRouletteStatus('Error adding.'); }
  };

  const handleCustomPrompt = async () => {
    const user = auth.currentUser;
    if (!user) { setCustomStatus('Sign in to generate.'); return; }
    setCustomStatus('Generating recipe...');
    try {
      const res = await axios.post('/.netlify/functions/chatgptProxy', { prompt: `Generate a custom recipe based on this prompt: ${customPrompt}. Return only JSON: { name, instructions, ingredients: { Protein, Starch, Produce, Pantry }, link }` });
      const cleaned = res.data.reply.trim();
      const parsed = JSON.parse(cleaned.slice(cleaned.indexOf('{'), cleaned.lastIndexOf('}') + 1));
      setCustomRecipeObj(parsed); setCustomStatus('Recipe generated.');
    } catch (err) { console.error(err); setCustomStatus('Error generating.'); }
  };

  const addCustomRecipe = async () => {
    const user = auth.currentUser;
    if (!user) { setCustomStatus('Sign in to add.'); return; }
    try {
      await addDoc(collection(db, 'recipes'), { ...customRecipeObj, userId: user.uid });
      setCustomStatus('Added!'); setCustomRecipeObj(null);
    } catch (err) { console.error(err); setCustomStatus('Error adding.'); }
  };

  const headingStyle = { fontWeight:'normal', textAlign:'left', fontSize:'1.1rem', padding:'0.3rem 0', background:'none', border:'none', width:'100%' };
  const editBtnStyle = { padding: '0.5rem 1rem', backgroundColor: '#3498db', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginTop: '0.5rem' };

  return (
    <div style={{ paddingTop:'3rem' }}>
      {/* Import */}
      <div style={{ marginBottom:'1rem' }}>
        <button onClick={()=>toggleSection('import')} style={headingStyle}>{arrow(expandedSection==='import')} Import Recipe from Link</button>
        {expandedSection==='import'&&(
          <div style={{marginTop:'0.5rem'}}> 
            <input type="text" value={link} onChange={e=>setLink(e.target.value)} placeholder="Recipe URL" style={{width:'100%',padding:'0.5rem'}}/>
            <button onClick={handleImportLink} style={editBtnStyle}>Generate Recipe</button>
            {status && <p>{status}</p>}
            {parsedImport && renderRecipeCard(parsedImport, addImportRecipe, true)}
          </div>
        )}
      </div>

      {/* Roulette */}
      <div style={{ marginBottom:'1rem' }}>
        <button onClick={()=>toggleSection('roulette')} style={headingStyle}>{arrow(expandedSection==='roulette')} Recipe Roulette</button>
        {expandedSection==='roulette'&&(
          <div style={{marginTop:'0.5rem'}}>
            <p style={{ marginBottom: '1rem' }}>
              Create a&nbsp;
              <select
                value={pickerValues.style}
                onChange={e=>setPickerValues(prev=>({...prev, style: e.target.value}))}
                style={{ padding: '0.25rem', fontSize: '1rem', border: '1px solid #ccc', borderRadius: '4px' }}
              >
                <option value="">-- select style --</option>
                {options.style.map(s=><option key={s} value={s}>{s}</option>)}
              ></select>
              &nbsp;
              <select
                value={pickerValues.cuisine}
                onChange={e=>setPickerValues(prev=>({...prev, cuisine: e.target.value}))}
                style={{ padding: '0.25rem', fontSize: '1rem', border: '1px solid #ccc', borderRadius: '4px' }}
              >
                <option value="">-- select cuisine --</option>
                {options.cuisine.map(c=><option key={c} value={c}>{c}</option>)}
              ></select>
              &nbsp;recipe using&nbsp;
              <select
                value={pickerValues.mainIngredient}
                onChange={e=>setPickerValues(prev=>({...prev, mainIngredient: e.target.value}))}
                style={{ padding: '0.25rem', fontSize: '1rem', border: '1px solid #ccc', borderRadius: '4px' }}
              >
                <option value="">-- select ingredient --</option>
                {options.mainIngredient.map(m=><option key={m} value={m}>{m}</option>)}
              ></select>
              &nbsp;in the style of&nbsp;
              <select
                value={pickerValues.chef}
                onChange={e=>setPickerValues(prev=>({...prev, chef: e.target.value}))}
                style={{ padding: '0.25rem', fontSize: '1rem', border: '1px solid #ccc', borderRadius: '4px' }}
              >
                <option value="">-- select chef --</option>
                {options.chef.map(ch=><option key={ch} value={ch}>{ch}</option>)}
              ></select>
              .
            </p>
            <button onClick={handleRoulette} style={editBtnStyle}>Generate Recipe</button>
            {rouletteStatus && <p>{rouletteStatus}</p>}
            {rouletteRecipe && renderRecipeCard(rouletteRecipe, addRouletteRecipe, false)}
          </div>
        )}
      </div>

      {/* Custom */}
      <div>
        <button onClick={()=>toggleSection('custom')} style={headingStyle}>{arrow(expandedSection==='custom')} Generate Custom Recipe</button>
        {expandedSection==='custom'&&(
          <div style={{marginTop:'0.5rem'}}>
            <textarea value={customPrompt} onChange={e=>setCustomPrompt(e.target.value)} placeholder="Your prompt..." rows={3} style={{width:'100%',padding:'0.5rem'}}></textarea>
            <button onClick={handleCustomPrompt} style={editBtnStyle}>Generate Recipe</button>
            {customStatus && <p>{customStatus}</p>}
            {customRecipeObj && renderRecipeCard(customRecipeObj, addCustomRecipe, false)}
          </div>
        )}
      </div>
    </div>
  );
}