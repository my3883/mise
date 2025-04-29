import React, { useState } from 'react';
import { db, collection, addDoc } from '../firestore';
import { auth } from '../firebase';
import axios from 'axios';

const arrow = (expanded) => expanded ? '▼' : '▶';

const options = {
  mainIngredient: ['chicken', 'beef', 'pork', 'salmon', 'white fish', 'shrimp', 'tofu', 'mushroom', 'beans', 'veggies'],
  cuisine: ['American', 'Chinese', 'Indian', 'Italian', 'Japanese', 'Mexican', 'Middle Eastern', 'Southeast Asian'],
  style: ['light', 'rich', 'spicy', 'bold', 'zesty', 'funky', 'umami-forward'],
  chef: ['Alice Waters', 'Judy Rogers', 'Julia Child', 'Kenji Alt-Lopez', 'Mario Batali', 'Michael Solomonov', 'Morimoto', 'Ottolenghi', 'Rick Bayless', 'Thomas Keller']
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
  const [pickerValues, setPickerValues] = useState({ mainIngredient: options.mainIngredient[0], cuisine: options.cuisine[0], style: options.style[0], chef: options.chef[0] });

  const toggleSection = (section) => {
    setExpandedSection(prev => (prev === section ? null : section));
    setStatus(''); setRouletteStatus(''); setCustomStatus('');
  };

  const renderRecipeCard = (recipe, onAdd, showLink = false) => (
    <div style={{ border: '1px solid #ccc', borderRadius: '4px', padding: '1rem', marginTop: '0.5rem', textAlign: 'left' }}>
      <h4 style={{ margin: '0 0 0.5rem' }}>{recipe.name}</h4>
      <ul style={{ paddingLeft: '1rem', margin: '0.5rem 0' }}>
        {Object.entries(recipe.ingredients).map(([cat, items]) => (
          items.length > 0 && <li key={cat}><strong>{cat}:</strong> {items.join(', ')}</li>
        ))}
      </ul>
      {recipe.instructions && <p style={{ fontStyle: 'italic', margin: '0.5rem 0' }}>{recipe.instructions}</p>}
      {showLink && recipe.link && recipe.link.startsWith('http') && (
        <div style={{ margin: '0.5rem 0' }}>
          <a href={recipe.link} target="_blank" rel="noopener noreferrer">View Source</a>
        </div>
      )}
      <button onClick={onAdd} style={{ padding: '0.5rem 1rem', backgroundColor: '#179497', color: 'white', border: 'none', borderRadius: '4px', marginTop: '0.5rem' }}>
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
        prompt: `Extract the name, simplified cooking instructions, and categorize the ingredients from this recipe link: ${link}. Respond only in JSON format like this: { "name": "...", "ingredients": { "Protein": [], "Starch": [], "Produce": [], "Pantry": [] }, "instructions": "...", "link": "..." } with no explanation.`
      });
      const cleaned = response.data.reply.trim();
      const json = JSON.parse(cleaned);
      setParsedImport(json);
      setStatus('Recipe parsed.');
    } catch (err) {
      console.error(err);
      setStatus('Error parsing recipe.');
    }
  };
  const addImportRecipe = async () => {
    const user = auth.currentUser;
    if (!user) { setStatus('Please sign in to add recipes.'); return; }
    await addDoc(collection(db, 'recipes'), { ...parsedImport, userId: user.uid });
    setStatus('Recipe added!');
    setParsedImport(null);
    setLink('');
  };

  const handleRoulette = async () => {
    const user = auth.currentUser;
    if (!user) { setRouletteStatus('Please sign in to use recipe roulette.'); return; }
    setRouletteStatus('Spinning the roulette...');
    const prompt = `Create a recipe using ${pickerValues.mainIngredient} with a ${pickerValues.style} flavor profile and ${pickerValues.cuisine} influence, in the style of ${pickerValues.chef}. Return only JSON with fields: name, ingredients, instructions, and ensure no link field is included.`;
    try {
      const response = await axios.post('/.netlify/functions/chatgptProxy', { prompt });
      const cleaned = response.data.reply.trim();
      const parsed = JSON.parse(cleaned);
      await addDoc(collection(db, 'recipes'), { ...parsed, userId: auth.currentUser.uid });
      setRouletteStatus('Roulette recipe added!');
      setRouletteRecipe(parsed);
    } catch (err) {
      console.error(err);
      setRouletteStatus('Failed to generate roulette recipe.');
    }
  };

  const handleCustomPrompt = async () => {
    const user = auth.currentUser;
    if (!user) { setCustomStatus('Please sign in to generate recipes.'); return; }
    if (!customPrompt) return;
    setCustomStatus('Generating recipe...');
    try {
      const response = await axios.post('/.netlify/functions/chatgptProxy', {
        prompt: `Generate a custom recipe based on this prompt: ${customPrompt}. Return only JSON with fields: name, ingredients, instructions. Do not include a link.`
      });
      const cleaned = response.data.reply.trim();
      const parsed = JSON.parse(cleaned);
      await addDoc(collection(db, 'recipes'), { ...parsed, userId: user.uid });
      setCustomStatus('Custom recipe added!');
      setCustomRecipeObj(parsed);
      setCustomPrompt('');
    } catch (err) {
      console.error(err);
      setCustomStatus('Error generating recipe.');
    }
  };

  const headingStyle = { fontWeight: 'normal', textAlign: 'left', fontSize: '1.1rem', padding: '0.3rem 0', background: 'none', border: 'none', width: '100%' };

  return (
    <div style={{ paddingTop: '3rem', textAlign: 'left' }}>
      <div style={{ marginBottom: '1rem' }}>
        <button onClick={() => toggleSection('import')} style={headingStyle}>
          {arrow(expandedSection === 'import')} Import Recipe from Link
        </button>
        {expandedSection === 'import' && parsedImport === null && (
          <div style={{ marginTop: '0.5rem' }}>
            <input
              type="text"
              placeholder="Enter recipe URL"
              value={link}
              onChange={e => setLink(e.target.value)}
              style={{ width: '100%', padding: '0.5rem', fontSize: '1rem', marginBottom: '0.5rem' }}
            />
            <button
              onClick={handleImportLink}
              style={{ padding: '0.5rem 1rem', backgroundColor: '#179497', color: 'white', border: 'none', borderRadius: '4px' }}
            >
              Generate Recipe
            </button>
            {status && <p>{status}</p>}
          </div>
        )}
        {parsedImport && renderRecipeCard(parsedImport, addImportRecipe, true)}
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <button onClick={() => toggleSection('roulette')} style={headingStyle}>
          {arrow(expandedSection === 'roulette')} Recipe Roulette
        </button>
        {expandedSection === 'roulette' && (
          <div style={{ marginTop: '0.5rem' }}>
            <p style={{ marginBottom: '1rem' }}>Create a recipe using:</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <select
                value={pickerValues.mainIngredient}
                onChange={e => setPickerValues(prev => ({ ...prev, mainIngredient: e.target.value }))}
                style={{ width: '100%', padding: '0.5rem', fontSize: '1rem', border: '1px solid #ccc', borderRadius: '4px' }}
              >
                <option value="">-- Select main ingredient --</option>
                {options.mainIngredient.map(val => (
                  <option key={val} value={val}>
                    {val}
                  </option>
                ))}
              </select>
              <select
                value={pickerValues.style}
                onChange={e => setPickerValues(prev => ({ ...prev, style: e.target.value }))}
                style={{ width: '100%', padding: '0.5rem', fontSize: '1rem', border: '1px solid #ccc', borderRadius: '4px' }}
              >
                <option value="">-- Select style --</option>
                {options.style.map(val => (
                  <option key={val} value={val}>
                    {val}
                  </option>
                ))}
              </select>
              <select
                value={pickerValues.cuisine}
                onChange={e => setPickerValues(prev => ({ ...prev, cuisine: e.target.value }))}
                style={{ width: '100%', padding: '0.5rem', fontSize: '1rem', border: '1px solid #ccc', borderRadius: '4px' }}
              >
                <option value="">-- Select cuisine --</option>
                {options.cuisine.map(val => (
                  <option key={val} value={val}>
                    {val}
                  </option>
                ))}
              </select>
              <select
                value={pickerValues.chef}
                onChange={e => setPickerValues(prev => ({ ...prev, chef: e.target.value }))}
                style={{ width: '100%', padding: '0.5rem', fontSize: '1rem', border: '1px solid #ccc', borderRadius: '4px' }}
              >
                <option value="">-- Select chef --</option>
                {options.chef.map(val => (
                  <option key={val} value={val}>
                    {val}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={handleRoulette}
              style={{ marginTop: '1rem', padding: '0.5rem 1rem', backgroundColor: '#179497', color: 'white', border: 'none', borderRadius: '4px' }}
            >
              Generate Recipe
            </button>
            {rouletteStatus && <p>{rouletteStatus}</p>}
            {rouletteRecipe && renderRecipeCard(rouletteRecipe, addRouletteRecipe, false)}
          </div>
        )}
      </div>

      <div>
        <button onClick={() => toggleSection('custom')} style={headingStyle}>
          {arrow(expandedSection === 'custom')} Generate Custom Recipe
        </button>
        {expandedSection === 'custom' && (
          <div style={{ marginTop: '0.5rem' }}>
            <textarea
              placeholder="..."
              value={customPrompt}
              onChange={e => setCustomPrompt(e.target.value)}
              style={{ width: '100%', padding: '0.5rem' }}
              rows={3}
            />
            <button
              onClick={handleCustomPrompt}
              style={{ marginTop: '1rem', padding: '0.5rem 1rem', backgroundColor: '#179497', color: 'white', border: 'none', borderRadius: '4px' }}
            >
              Generate Recipe
            </button>
            {customStatus && <p>{customStatus}</p>}
            {customRecipeObj && renderRecipeCard(customRecipeObj, addCustomRecipe, false)}
          </div>
        )}
      </div>
    </div>
  );
}