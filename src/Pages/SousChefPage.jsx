import React, { useState } from 'react';
import { db, collection, addDoc } from '../firestore';
import { auth } from '../firebase';
import axios from 'axios';
import Picker from 'react-mobile-picker';

const arrow = (expanded) => expanded ? '▼' : '▶';

const options = {
  mainIngredient: ['chicken','beef','pork','salmon','white fish','shrimp','tofu','mushrooms','beans','veggies'],
  style: ['Carbone', 'Chez Panisse', 'Joes Shanghai','Ottolenghi','Nobu', 'Noma', 'Pok Pok','Taco Bell','Uchi','Zahav','Zuni Cafe'],
  difficulty: ['under 30 minutes','1-2 hours','all day']
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
  const [pickerValues, setPickerValues] = useState({ mainIngredient:'', style:'', difficulty:'', servings:4 });
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  const toggleSection = (section) => {
    setExpandedSection(prev => prev === section ? null : section);
    setStatus(''); setRouletteStatus(''); setCustomStatus('');
  };

  const safeParse = (text) => {
    try {
      return JSON.parse(text);
    } catch (e) {
      console.error('Invalid JSON response from ChatGPT:', text);
      throw new Error(`Invalid JSON response from ChatGPT: ${text}`);
    }
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

  const callChatGPT = async (prompt) => {
    const { data } = await axios.post('/.netlify/functions/chatgptProxy', { prompt });
    const reply = data.reply?.trim() || '';
    console.log('Raw ChatGPT reply:', reply);
    return safeParse(reply);
  };

  const handleImportLink = async () => {
    if (!link) return;
    const user = auth.currentUser;
    if (!user) return setStatus('Please sign in.');
    setStatus('Parsing recipe...');
    try {
      const parsed = await callChatGPT(
        `Extract the title, simplified cooking instructions, and ingredients categories from this URL: ${link}. Respond with a list of ingredients divided into the following categories (Protein, Produce, Starch, Pantry) then include a brief set of instructions followed by a link to the recipe.`
      );
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

  const handleRoulette = async () => {
    const user = auth.currentUser;
    const { style, difficulty, mainIngredient, servings } = pickerValues;
    if (!user) return setRouletteStatus('Please sign in.');
    if (!style || !difficulty || !mainIngredient || !servings)
      return setRouletteStatus('Select all fields.');

    setRouletteStatus('Generating recipe...');

    const prompt = `Create a recipe for ${servings} people that I can cook in  ${difficulty}  using ${mainIngredient}  in the style of ${style}. Return ONLY a valid JSON object in this format: { "name": "string", "ingredients": { "Protein": [], "Starch": [], "Produce": [], "Pantry": [] }, "instructions": "string" }`;

    try {
      const parsed = await callChatGPT(prompt);
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
      setRouletteStatus('Added!'); setRouletteRecipe(null);
    } catch (err) {
      console.error('Add recipe error:', err);
      setRouletteStatus(`Error adding: ${err.message}`);
    }
  };

  const handleCustomPrompt = async () => {
    const user = auth.currentUser;
    if (!user) return setCustomStatus('Please sign in.');
    if (!customPrompt) return;
    setCustomStatus('Generating recipe...');

    try {
      const parsed = await callChatGPT(
        `Generate a custom recipe: ${customPrompt}. Explain why the recipe matches the request then include a list of ingredients divided into the following categories (Protein, Produce, Starch, Pantry) then include a brief set of instructions.`
      );
      setCustomRecipeObj(parsed);
      setCustomStatus('Recipe generated.');
    } catch (err) {
      console.error('Custom error:', err);
      setCustomStatus(err.message);
    }
  };

  const addCustomRecipe = async () => {
    const user = auth.currentUser;
    if (!user) return setCustomStatus('Please sign in.');
    try {
      await addDoc(collection(db, 'recipes'), { ...customRecipeObj, userId: user.uid });
      setCustomStatus('Added!'); setCustomRecipeObj(null);
    } catch (err) {
      console.error('Add custom error:', err);
      setCustomStatus(`Error adding: ${err.message}`);
    }
  };

  const headingStyle = { padding:'0.3rem 0', textAlign:'left', fontWeight:'normal', fontSize:'1.1rem', background:'none', border:'none', width:'100%' };
  const buttonStyle = { padding:'0.5rem 1rem', backgroundColor:'#3498db', color:'white', border:'none', borderRadius:'4px', cursor:'pointer', marginTop:'0.5rem' };
  const dropdownStyle = { padding:'0.25rem', fontSize:'1rem', border:'1px solid #ccc', borderRadius:'4px' };

  const IOSPicker = ({ value, options, onChange }) => {
    const optionObj = { val: options };
    const valueObj = { val: value };
    return (
      <Picker
        optionGroups={optionObj}
        valueGroups={valueObj}
        onChange={(name, val) => onChange(val)}
      />
    );
  };

  const renderPicker = (label, field) => (
    isMobile ? (
      <IOSPicker
        value={pickerValues[field]}
        options={options[field]}
        onChange={(val) => setPickerValues(prev => ({ ...prev, [field]: val }))}
      />
    ) : (
      <select
        value={pickerValues[field]}
        onChange={e => setPickerValues(prev => ({ ...prev, [field]: e.target.value }))}
        style={dropdownStyle}
      >
        <option value="">-- {label} --</option>
        {options[field].map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>
    )
  );

  return (
    <div style={{ padding: '1rem', textAlign: 'left', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'stretch', minHeight: '100vh' }}>
      {/* Import Section */}
      <div style={{ marginBottom:'1rem' }}>
        <button onClick={()=>toggleSection('import')} style={headingStyle}>{arrow(expandedSection==='import')} Import Recipe from Link</button>
        {expandedSection==='import'&&(
          <div style={{marginTop:'0.5rem'}}>
            <input type="text" value={link} onChange={e=>setLink(e.target.value)} placeholder="Recipe URL" style={{width:'100%',padding:'0.5rem'}}/>
            <button onClick={handleImportLink} style={buttonStyle}>Generate Recipe</button>
            {status && <p>{status}</p>}
            {parsedImport && renderRecipeCard(parsedImport, addImportRecipe,true)}
          </div>
        )}
      </div>

      {/* Roulette Section */}
      <div style={{ marginBottom:'1rem' }}>
        <button onClick={()=>toggleSection('roulette')} style={headingStyle}>{arrow(expandedSection==='roulette')} Recipe Roulette</button>
        {expandedSection==='roulette'&&(
          <div style={{marginTop:'0.5rem'}}>
            <p style={{lineHeight:'2rem'}}>
              Create a recipe for
              <input type="number" min="1" max="20" value={pickerValues.servings} onChange={e => setPickerValues(prev => ({ ...prev, servings: parseInt(e.target.value) }))} style={{...dropdownStyle, width:'4rem', margin:'0 0.5rem'}} />
              people that I can cook in
              {renderPicker('difficulty', 'difficulty')}
              using
              {renderPicker('ingredient', 'mainIngredient')}
              in the style of
              {renderPicker('style', 'style')}.
            </p>
            <button onClick={handleRoulette} style={buttonStyle}>Generate Recipe</button>
            {rouletteStatus && <p>{rouletteStatus}</p>}
            {rouletteRecipe && renderRecipeCard(rouletteRecipe, addRouletteRecipe, false)}
          </div>
        )}
      </div>

      {/* Custom Section */}
      <div>
        <button onClick={()=>toggleSection('custom')} style={headingStyle}>{arrow(expandedSection==='custom')} Generate Custom Recipe</button>
        {expandedSection==='custom'&&(
          <div style={{marginTop:'0.5rem'}}>
            <textarea value={customPrompt} onChange={e=>setCustomPrompt(e.target.value)} placeholder="Describe what you want" rows={3} style={{width:'100%',padding:'0.5rem'}} />
            <button onClick={handleCustomPrompt} style={buttonStyle}>Generate Recipe</button>
            {customStatus && <p>{customStatus}</p>}
            {customRecipeObj && renderRecipeCard(customRecipeObj, addCustomRecipe,false)}