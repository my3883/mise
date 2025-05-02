import axios from 'axios';

export default async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const { prompt } = await req.json();

  if (!prompt) {
    return new Response(JSON.stringify({ error: 'Prompt is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `You are Mise, a helpful Sous Chef. Respond to recipe requests and return ONLY a valid JSON object in this format:
          
          {
            "name": "Recipe Title",
            "ingredients": {
              "Protein": ["..."],
              "Produce": ["..."],
              "Starch": ["..."],
              "Pantry": ["..."]
            "Instructions" ["..."]
            "link": "https://valid-working-url.com/recipe"
          }
          
          If you are making up a recipe don't include any link. Do not include any explanation, commentary, or text outside the JSON.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
        }
      }
    );

    return new Response(JSON.stringify({ reply: response.data.choices[0].message.content }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('ChatGPT Netlify error:', error.response?.data || error.message);
    return new Response(JSON.stringify({ error: 'Error talking to ChatGPT.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
