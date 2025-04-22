// src/Pages/SousChefPage.jsx
import React, { useState } from 'react';
import { db, collection, addDoc } from '../firestore';
import { auth } from '../firebase';
import axios from 'axios';

export default function SousChefPage() {
  const [link, setLink] = useState('');
  const [status, setStatus] = useState('');

  const handleSubmit = async () => {
    if (!link) return;
    const user = auth.currentUser;
    if (!user) {
      setStatus('Please sign in to add recipes.');
      return;
    }

    try {
      setStatus('Parsing recipe...');

      const response = await axios.post('/.netlify/functions/chatgptProxy', {
        prompt: `From the recipe at this link: ${link}, extract the recipe name, a working recipe link, and the ingredients grouped into the following categories: Protein, Starch, Produce, and Pantry. For each ingredient, include the name and the quantity or measurement as written in the recipe. Respond in pure JSON format like this: { "name": "...", "ingredients": { "Protein": ["1 cup chickpeas", ...], "Starch": [...], "Produce": [...], "Pantry": [...] }, "link": "..." } — no explanation, no markdown, no extra text.`
      });

      const cleaned = response.data.reply.trim();
      const jsonStart = cleaned.indexOf('{');
      const jsonEnd = cleaned.lastIndexOf('}') + 1;
      const parsed = JSON.parse(cleaned.slice(jsonStart, jsonEnd));

      await addDoc(collection(db, 'recipes'), {
        name: parsed.name,
        link: parsed.link,
        ingredients: parsed.ingredients,
        userId: user.uid
      });

      setStatus('Recipe added successfully!');
      setLink('');
    } catch (err) {
      console.error(err);
      setStatus('Error adding recipe.');
    }
  };

  return (
    <div style={{ paddingTop: '3rem' }}>
      <h3>Paste a recipe link to add it to your list</h3>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        <input
          type="text"
          placeholder="Enter recipe URL"
          value={link}
          onChange={e => setLink(e.target.value)}
          style={{ flex: 1, padding: '0.5rem', fontSize: '1rem' }}
        />
        <button
          onClick={handleSubmit}
          style={{ padding: '0.5rem 1rem', backgroundColor: '#179497', color: 'white', border: 'none', borderRadius: '4px' }}
        >
          Add Recipe
        </button>
      </div>
      {status && <p>{status}</p>}
    </div>
  );
}
