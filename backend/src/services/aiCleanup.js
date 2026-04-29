const { OpenAI } = require('openai');

async function cleanup(text) {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const res = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content:
          'You are a transcript editor. Fix grammar, punctuation, and formatting errors. Keep all original content and meaning. Return only the corrected transcript, no commentary.',
      },
      { role: 'user', content: text },
    ],
  });

  return res.choices[0].message.content.trim();
}

module.exports = { cleanup };
