import { Router } from 'express';
import { query } from '../database/client';
import { authMiddleware } from '../middleware/auth.middleware';
import { sseService } from '../services/sse.service';
import { messagesRepository } from '../database/repositories/messages.repository';
import { GoogleGenAI, Type, ThinkingLevel, HarmCategory, HarmBlockThreshold } from '@google/genai';
import { z } from 'zod';
import * as admin from 'firebase-admin';

console.log('[API] Registering routes...');

export const apiRouter = Router();

apiRouter.use((req, res, next) => {
  console.log(`[API] Request: ${req.method} ${req.path}`);
  next();
});

// --- AI CONFIG & SCHEMAS ---

const gameResponseSchema = z.object({
  reasoning: z.string(),
  story: z.string(),
  worldUpdates: z.string(),
  factionUpdates: z.record(z.string(), z.string()),
  hiddenTimersUpdates: z.record(z.string(), z.number()),
  stateUpdates: z.array(z.object({
    uid: z.string(),
    hp: z.number(),
    mana: z.number(),
    stress: z.number(),
    alignment: z.string(),
    inventory: z.array(z.string()),
    skills: z.array(z.string()),
    injuries: z.array(z.string()),
    statuses: z.array(z.string()),
    mutations: z.array(z.string()),
    reputation: z.record(z.string(), z.number()),
    stats: z.object({
      speed: z.number(),
      reaction: z.number(),
      strength: z.number(),
      power: z.number(),
      durability: z.number(),
      stamina: z.number()
    })
  })),
  wikiCandidates: z.array(z.object({
    name: z.string(),
    rawFacts: z.string(),
    reason: z.string()
  }))
});

const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_CIVIC_INTEGRITY, threshold: HarmBlockThreshold.BLOCK_NONE },
];

function getAIKeys(): string[] {
  const primaryKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  const additionalKeys = process.env.GEMINI_API_KEYS ? process.env.GEMINI_API_KEYS.split(',').map(k => k.trim()).filter(k => k) : [];
  const allKeys = primaryKey ? [primaryKey, ...additionalKeys] : additionalKeys;
  return Array.from(new Set(allKeys));
}

async function generateWithFallback(prompt: string, baseConfig: any, models: string[] = ["gemini-3-flash-preview", "gemini-3.1-flash-lite-preview"]) {
  let lastError;
  const keys = getAIKeys();
  if (keys.length === 0) throw new Error("GEMINI_API_KEY is missing.");

  const modelList = baseConfig.model ? [baseConfig.model, ...models.filter(m => m !== baseConfig.model)] : models;

  for (const key of keys) {
    const ai = new GoogleGenAI({ apiKey: key });
    for (const modelName of modelList) {
      try {
        const config = { ...baseConfig };
        delete config.model;
        if (modelName === "gemini-3.1-flash-lite-preview" && config.thinkingConfig) delete config.thinkingConfig;

        const response = await (ai as any).models.generateContent({
          model: modelName,
          contents: prompt,
          config: { ...config, safetySettings }
        });
        const text = response.text;
        if (!text) throw new Error(`AI returned no text.`);
        return text;
      } catch (error: any) {
        lastError = error;
        if (error.message?.includes("429") || error.message?.includes("API key not valid")) break;
        continue;
      }
    }
  }
  throw lastError;
}

async function generateWithValidation(prompt: string, baseConfig: any, attempt = 1): Promise<any> {
    const maxAttempts = 3;
    try {
        const rawResponse = await generateWithFallback(prompt, baseConfig);
        return gameResponseSchema.parse(JSON.parse(rawResponse));
    } catch (error) {
        if (attempt >= maxAttempts) throw error;
        const retryPrompt = `${prompt}\n\nПРЕДЫДУЩИЙ ОТВЕТ БЫЛ НЕВАЛИДНЫМ: ${error}. ПОЖАЛУЙСТА, ИСПРАВЬ ОШИБКИ И ВЕРНИ ВАЛИДНЫЙ JSON.`;
        return generateWithValidation(retryPrompt, baseConfig, attempt + 1);
    }
}

// --- SMOKE TESTS ---

apiRouter.get('/health/db', async (req, res) => {
  try {
    await query('SELECT 1');
    res.json({ ok: true, message: 'Database connection is healthy' });
  } catch (error: any) {
    console.error('DB Healthcheck failed:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

apiRouter.get('/health/auth', authMiddleware, (req, res) => {
  res.json({ 
    ok: true, 
    message: 'Authentication successful',
    user: req.user 
  });
});

// --- REPORTING ---

apiRouter.post('/report', async (req, res) => {
  const { type, message, userEmail, roomId, turn, version } = req.body;
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) return res.status(500).json({ error: 'Reporting service unavailable' });

  const escapeHtml = (unsafe: string) => unsafe.replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#039;"}[m]!));
  const text = `<b>🚀 Новый репорт: ${escapeHtml(type.toUpperCase())}</b>\n<b>От:</b> ${escapeHtml(userEmail || 'Аноним')}\n<b>Комната:</b> ${roomId || 'N/A'}\n<b>Ход:</b> ${turn || 0}\n<b>Версия:</b> ${version || '0.3.0'}\n\n<b>Сообщение:</b>\n<i>${escapeHtml(message)}</i>`;

  try {
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' })
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send report' });
  }
});

// --- SSE REALTIME ---

apiRouter.get('/rooms/:roomId/events', authMiddleware, (req, res) => {
  const { roomId } = req.params;
  sseService.subscribe(roomId, res);
});

// --- GEMINI / GAME LOGIC ---

apiRouter.post("/gemini/join", authMiddleware, async (req, res) => {
  try {
    const { characterName, characterProfile, roomId } = req.body;
    const prompt = `Проанализируй анкету RPG персонажа и извлеки логичный стартовый инвентарь, список навыков/способностей и определи его мировоззрение (alignment).\nИмя персонажа: ${characterName}\nАнкета: ${characterProfile}\n\nВерни JSON объект с массивами "inventory" и "skills", а также строку "alignment". Названия должны быть на РУССКОМ языке.`;

    const text = await generateWithFallback(prompt, {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          inventory: { type: Type.ARRAY, items: { type: Type.STRING } },
          skills: { type: Type.ARRAY, items: { type: Type.STRING } },
          alignment: { type: Type.STRING }
        },
        required: ["inventory", "skills", "alignment"]
      }
    });

    let jsonText = text;
    const match = jsonText.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (match) jsonText = match[1];
    const parsed = JSON.parse(jsonText);
    
    if (roomId) {
      const db = admin.firestore();
      await db.collection('rooms').doc(roomId).collection('messages').add({
        role: 'system',
        content: `Игрок **${characterName}** присоединился к игре.`,
        turn: 0,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    res.json(parsed);
  } catch (error) {
    res.status(500).json({ error: "Failed to generate" });
  }
});

apiRouter.post("/gemini/summarize", authMiddleware, async (req, res) => {
  try {
    const { currentSummary, recentMessages, roomId } = req.body;
    const uid = (req as any).user.google_id;
    
    const db = admin.firestore();
    const roomDoc = await db.collection('rooms').doc(roomId).get();
    if (!roomDoc.exists || roomDoc.data()?.hostId !== uid) {
      return res.status(403).json({ error: "Only host can summarize" });
    }

    const prompt = `Ты летописец RPG игры. Твоя задача - обновить краткое содержание сюжета.\nТекущее содержание: ${currentSummary || "Начало приключения."}\nНовые события: ${recentMessages}\n\nНапиши обновленное краткое содержание (не более 3-4 абзацев).`;

    const aiText = await generateWithFallback(prompt, { model: "gemini-3.1-flash-lite-preview" });
    res.json({ text: aiText });
  } catch (error) {
    res.status(500).json({ error: "Failed to summarize" });
  }
});

apiRouter.post("/gemini/generate", authMiddleware, async (req, res) => {
  try {
    const prompt = `[SYSTEM PROMPT FOR GM]... ${JSON.stringify(req.body)}`;
    const result = await generateWithValidation(prompt, {
      model: 'gemini-3-flash-preview',
      thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH },
      responseMimeType: "application/json"
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Failed to generate GM response" });
  }
});

// --- ROOM MESSAGES ---

apiRouter.post('/rooms/:roomId/messages', authMiddleware, async (req, res) => {
  try {
    const { roomId } = req.params;
    const { content, type, turn_number, metadata } = req.body;
    const validTypes = ['player_action', 'ai_response', 'dice_roll', 'system', 'secret'];
    const messageType = validTypes.includes(type) ? type : 'system';

    const message = await messagesRepository.create({
      room_id: roomId,
      user_id: req.user!.id,
      type: messageType,
      content,
      metadata: metadata || {},
      turn_number: turn_number || 0
    });

    sseService.broadcast(roomId, 'message.new', message);
    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ error: 'Internal Error' });
  }
});
