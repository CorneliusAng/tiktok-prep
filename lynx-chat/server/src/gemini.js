import { GoogleGenerativeAI } from '@google/generative-ai';

const defaultModel = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

export async function createGeminiStream(messages, { signal } = {}) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY missing');

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: defaultModel });

  const lastUser = findLastUserMessage(messages);
  const prompt = lastUser || 'Hello!';

  const result = await model.generateContentStream({ contents: [{ role: 'user', parts: [{ text: prompt }] }], safetySettings: [] }, { signal });

  async function* iterator() {
    for await (const item of result.stream) {
      // Coalesce only text parts
      const text = item?.text();
      if (text) yield text;
    }
  }

  return iterator();
}

function findLastUserMessage(messages) {
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (m && m.role === 'user' && typeof m.content === 'string' && m.content.trim()) return m.content;
  }
  return '';
}


