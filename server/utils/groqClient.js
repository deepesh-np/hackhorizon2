const Groq = require("groq-sdk");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const visionModels = [
  "meta-llama/llama-4-scout-17b-16e-instruct",
  "llama-3.3-70b-versatile",
  "openai/gpt-oss-120b",
];

const textModels = [
  "llama-4-scout-17b-16e-instruct",
  "llama-3.3-70b-versatile",
  "llama-3.1-70b-versatile",
  "llama-3.1-8b-instant",
  "llama-3.2-3b-preview",
  "llama-3.2-1b-preview",
  "llama3-70b-8192",
  "llama3-8b-8192",
  "mixtral-8x7b-32768",
  "gemma2-9b-it",
  "gemma-7b-it",
];

const callGroqWithFallback = async (options, models) => {
  let lastError;
  for (const model of models) {
    try {
      console.log(`Trying Groq model: ${model}`);
      const chatCompletion = await groq.chat.completions.create({
        ...options,
        model: model,
      });
      return chatCompletion;
    } catch (error) {
      console.warn(`Model ${model} failed: ${error.message}. Falling back...`);
      lastError = error;
    }
  }
  throw lastError;
};

module.exports = { groq, visionModels, textModels, callGroqWithFallback };
