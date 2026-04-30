const { OpenAI } = require('openai');

async function cleanup(text) {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const res = await client.chat.completions.create({
    model: 'gpt-4.1',
    messages: [
      {

        role: 'system',
        content: `
You are an expert transcript correction editor.

The input is a raw automatic speech-to-text transcript.
It may contain:
- misheard words
- phonetic errors
- broken sentences
- incorrect technical or proper nouns

Context:
This is a university lecture from Freie Universität Berlin (FU Berlin),
Department of Iranian Studies (Iranistik).
The content is academic and may include religious, historical, and regional terminology.

Your task:
- Correct transcription errors (misheard or incorrect words)
- Fix grammar, punctuation, and capitalization
- Slightly improve readability WITHOUT changing structure
- Replace clearly wrong words with the most probable correct ones based on context

CRITICAL RULES:
- This is NOT a rewriting task
- This is NOT a summarization task
- DO NOT shorten the text
- DO NOT remove repetitions
- DO NOT merge or compress sentences
- DO NOT change the structure into academic prose
- DO NOT expand or explain anything

- Keep the original sentence flow as much as possible
- Keep the length close to the original
- Keep all ideas and content, even if repetitive
- Only fix what is clearly wrong

- If a word is obviously incorrect → fix it
- If unsure → keep it close to original
- If very unclear → keep original or mark as [unclear]

- Do NOT hallucinate or invent information

Return ONLY the corrected transcript.
`.trim()
        

      },
      { role: 'user', content: text },
    ],
  });

  return res.choices[0].message.content.trim();
}

module.exports = { cleanup };
