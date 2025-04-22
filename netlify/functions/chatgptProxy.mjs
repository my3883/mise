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
            content: `You are Mise, a helpful Sous Chef. When asked for a recipe, you must select one from a reputable cooking website (like NYT Cooking, Bon Appétit, Serious Eats, or Food Network) and provide a working recipe link. Start your response with "Yes chef!" followed by a short summary that includes the name of the chef or publication and why it's a great match. Then respond with a valid JSON object like this:
          
          {
            "name": "Recipe Title",
            "ingredients": {
              "Protein": ["..."],
              "Starch": ["..."],
              "Veggies": ["..."],
              "Pantry": ["..."]
            },
            "link": "https://valid-working-url.com/recipe"
          }
          
          Do not make up links. Do not return any explanation or commentary outside this format. Only include real, verifiable sources.`
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
