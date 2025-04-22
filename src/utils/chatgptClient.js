export async function askChatGPT(prompt) {
  try {
    const res = await fetch('/.netlify/functions/chatgptProxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt })
    });

    const data = await res.json();
    return data.reply || 'No response';
  } catch (error) {
    console.error('Frontend ChatGPT error:', error);
    return 'Error talking to ChatGPT.';
  }
}