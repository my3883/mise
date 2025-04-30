
import React, { useState } from 'react';
import { db, collection, addDoc } from '../firestore';
import { auth } from '../firebase';
import axios from 'axios';

const arrow = (expanded) => expanded ? '▼' : '▶';

const options = {
  mainIngredient: ['chicken','beef','pork','salmon','white fish','shrimp','tofu','mushroom','beans','veggies'],
  cuisine: ['American','Chinese','Indian','Italian','Japanese','Mexican','Middle Eastern','Southeast Asian'],
  style: ['light','rich','spicy','bold','zesty','funky','umami-forward'],
  chef: ['Alice Waters','Judy Rogers','Julia Child','Kenji Alt-Lopez','Mario Batali','Michael Solomonov','Morimoto','Ottolenghi','Rick Bayless','Thomas Keller']
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
    setStatus('');
    setRouletteStatus('');
    setCustomStatus('');
  };

  // Card renderer: showLink only if true
  const renderRecipeCard = (recipe, onAdd, showLink=false) => (
    <div style={{ border:'1px solid #ccc', borderRadius:'4px', padding:'1rem', marginTop:'0.5rem', textAlign:'left' }}>
      <h4 style={{ margin:'0 0 0.5rem' }}>{recipe.name}</h4>
      <ul style={{ paddingLeft:'1rem', margin:'0.5rem 0' }}>
        {Object.entries(recipe.ingredients).map(([cat, items]) => items.length ? (
          <li key={cat}><strong>{cat}:</strong> {items.join(', ')}</li>
        ) : null)}
      </ul>
      {recipe.instructions && <p style={{ fontStyle:'italic', margin:'0.5rem 0' }}>{recipe.instructions}</p>}
      {showLink && recipe.link?.startsWith('http') && (
        <div style={{ margin:'0.5rem 0' }}>
          <a href={recipe.link} target="_blank" rel="noopener noreferrer">View Source</a>
        </div>
      )}
      <button onClick={onAdd} style={{ padding:'0.5rem 1rem', backgroundColor:'#179497', color:'white', border:'none', borderRadius:'4px', marginTop:'0.5rem' }}>
        Add to Recipes
      </button>
    </div>
  );

  // Import section
  const handleImportLink = async () => {
    if (!link) return;
    const user = auth.currentUser;
    if (!user) return setStatus('Please sign in.');
    setStatus('Parsing recipe...');
    try {
      const { data } = await axios.post('/.netlify/functions/chatgptProxy', {
        prompt: `Extract the name, simplified cooking instructions, and ingredients categories from this URL: ${link}. Respond only in JSON: { name, instructions, ingredients: { Protein: [], Starch: [], Produce: [], Pantry: [] }, link }. Do not include any additional fields.`
      });
      console.log('Import response:', data);
      const json = JSON.parse(data.reply.trim());
      setParsedImport(json);
      setStatus('Recipe parsed.');
    } catch (err) {
      console.error('Import error:', err.response || err);
      setStatus(`Error parsing: ${err.message}`);
    }
  };

  const addImportRecipe = async () => {
    const user = auth.currentUser;
    if (!user) return setStatus('Please sign in.');
    try {
      await addDoc(collection(db, 'recipes'), { ...parsedImport, userId: user.uid });
      setStatus('Recipe added!');
      setParsedImport(null);
      setLink('');
    } catch (err) {
      console.error('Add import error:', err);
      setStatus(`Error adding recipe: ${err.message}`);
    }
  };

  // Roulette: force no link, basic instructions
  const handleRoulette = async () => {
    const user = auth.currentUser;
    const { style, cuisine, mainIngredient, chef } = pickerValues;
    if (!user) return setRouletteStatus('Please sign in.');
    if (!style || !cuisine || !mainIngredient || !chef) return setRouletteStatus('Select all fields.');
    setRouletteStatus('Generating recipe...');
    try {
      const { data } = await axios.post('/.netlify/functions/chatgptProxy', {
        prompt: `Create a ${style} ${cuisine} recipe using ${mainIngredient} in the style of ${chef}. Include concise step-by-step instructions. Respond only in JSON: { name, instructions, ingredients: { Protein: [], Starch: [], Produce: [], Pantry: [] } }. Do NOT include any link field or URL.`
      });
      console.log('Roulette response:', data);
      const json = JSON.parse(data.reply.trim());
      const clean = { name: json.name, instructions: json.instructions, ingredients: json.ingredients };
      setRouletteRecipe(clean);
      setRouletteStatus('Recipe generated.');
    } catch (err) {
      console.error('Roulette error:', err.response || err);
      setRouletteStatus(`Error generating: ${err.message}`);
    }
  };

  const addRouletteRecipe = async () => {
    const user = auth.currentUser;
    if (!user) return setRouletteStatus('Please sign in.');
    try {
      await addDoc(collection(db, 'recipes'), { ...rouletteRecipe, userId: user.uid });
      setRouletteStatus('Added!');
      setRouletteRecipe(null);
    } catch (err) {
      console.error('Add roulette error:', err);
      setRouletteStatus(`Error adding recipe: ${err.message}`);
    }
  };

  // Custom: no link, basic instructions
  const handleCustomPrompt = async () => {
    const user = auth.currentUser;
    if (!user) return setCustomStatus('Please sign in.');
    if (!customPrompt) return;
    setCustomStatus('Generating recipe...');
    try {
      const { data } = await axios.post('/.netlify/functions/chatgptProxy', {
        prompt: `Generate a custom recipe: ${customPrompt}. Provide concise step-by-step instructions. Respond only in JSON: { name, instructions, ingredients: { Protein: [], Starch: [], Produce: [], Pantry: [] } }. Do NOT include any link.`
      });
      console.log('Custom response:', data);
      const json = JSON.parse(data.reply.trim());
      setCustomRecipeObj({ name: json.name, instructions: json.instructions, ingredients: json.ingredients });
      setCustomStatus('Recipe generated.');
    } catch (err) {
      console.error('Custom error:', err.response || err);
      setCustomStatus(`Error generating: ${err.message}`);
    }
  };

  const addCustomRecipe = async () => {
    const user = auth.currentUser;
    if (!user) return setCustomStatus('Please sign in.');
    try {
      await addDoc(collection(db, 'recipes'), { ...customRecipeObj, userId: user.uid });
      setCustomStatus('Added!');
      setCustomRecipeObj(null);
    } catch (err) {
      console.error('Add custom error:', err);
      setCustomStatus(`Error adding recipe: ${err.message}`);
    }
  };

  const headingStyle = { padding:'0.3rem 0', textAlign:'left', fontWeight:'normal', fontSize:'1.1rem', background:'none', border:'none', width:'100%' };
  const buttonStyle = { padding:'0.5rem 1rem', backgroundColor:'#3498db', color:'white', border:'none', borderRadius:'4px', cursor:'pointer', marginTop:'0.5rem' };

  return (
    <div style={{ paddingTop:'3rem', textAlign:'left' }}>
      {/* Import Section */}
      <div style={{ marginBottom:'1rem' }}>
        <button onClick={()=>toggleSection('import')} style={headingStyle}>{arrow(expandedSection==='import')} Import Recipe from Link</button>
        {expandedSection==='import' && (
          <div style={{ marginTop:'0.5rem' }}>
            <input type="text" value={link} onChange={e=>setLink(e.target.value)} placeholder="Recipe URL" style={{ width:'100%', padding:'0.5rem' }} />
            <button onClick={handleImportLink} style={buttonStyle}>Generate Recipe</button>
            {status && <p>{status}</p>}
            {parsedImport && renderRecipeCard(parsedImport, addImportRecipe,true)}
          </div>
        )}
      </div>
      {/* Roulette Section */}
      <div style={{ marginBottom:'1rem' }}>
        <button onClick={()=>toggleSection('roulette')} style={headingStyle}>{arrow(expandedSection==='roulette')} Recipe Roulette</button>
        {expandedSection==='roulette' && (
          <div style={{ marginTop:'0.5rem' }}>
            <p style={{ lineHeight:'2rem' }}>
              Create a &nbsp;
              <select value={pickerValues.style} onChange={e=>setPickerValues(prev=>({...prev,style:e.target.value}))} style={{ padding:'0.25rem', fontSize:'1rem', border:'1px solid #ccc', borderRadius:'4px' }}>
                <option value="">-- style --</option>
                {options.style.map(s=><option key={s} value={s}>{s}</option>)}
              </select>
              &nbsp;
              <select value={pickerValues.cuisine} onChange={e=>setPickerValues(prev=>({...prev,cuisine:e.target.value}))} style={{ padding:'0.25rem', fontSize:'1rem', border:'1px solid #ccc', borderRadius:'4px' }}>
                <option value="">-- cuisine --</option>
                {options.cuisine.map(c=><option key={c} value={c}>{c}</option>)}
              </select>
              &nbsp;recipe using&nbsp;
              <select value={pickerValues.mainIngredient} onChange={e=>setPickerValues(prev=>({...prev,mainIngredient:e.target.value}))} style={{ padding:'0.25rem', fontSize:'1rem', border:'1px solid #ccc', borderRadius:'4px' }}>
                <option value="">-- ingredient --</option>
                {options.mainIngredient.map(m=><option key={m} value={m}>{m}</option>)}
              </select>
              &nbsp;in the style of&nbsp;
              <select value={pickerValues.chef} onChange={e=>setPickerValues(prev=>({...prev,chef:e.target.value}))} style={{ padding:'0.25rem', fontSize:'1rem', border:'1px solid #ccc', borderRadius:'4px' }}>
                <option value="">-- chef --</option>
                {options.chef.map(ch=><option key={ch} value={ch}>{ch}</option>)}
              </select>
              .
            </p>
            <button onClick={handleRoulette} style={buttonStyle}>Generate Recipe</button>
            {rouletteStatus && <p>{rouletteStatus}</p>}
            {rouletteRecipe && renderRecipeCard(rouletteRecipe, addRouletteRecipe,false)}
          </div>
        )}
      </div>
      {/* Custom Section */}
      <div>
        <button onClick={()=>toggleSection('custom')} style={headingStyle}>{arrow(expandedSection==='custom')} Generate Custom Recipe</button>
        {expandedSection==='custom' && (
          <div style={{ marginTop:'0.5rem' }}>
            <textarea value={customPrompt} onChange={e=>setCustomPrompt(e.target.value)} placeholder="Describe what you want" rows={3} style={{ width:'100%', padding:'0.5rem' }} />
            <button onClick={handleCustomPrompt} style={buttonStyle}>Generate Recipe</button>
            {customStatus && <p>{customStatus}</p>}
            {customRecipeObj && renderRecipeCard(customRecipeObj, addCustomRecipe,false)}
          </div>
        )}
      </div>
    </div>
  );
}
