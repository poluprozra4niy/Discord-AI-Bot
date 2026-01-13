import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

// Lazy OpenAI client initialization - only created when needed
let openai = null;

function getOpenAIClient() {
    if (!openai) {
        if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key_here') {
            throw new Error('❌ OpenAI API ключ не настроен! Заполните OPENAI_API_KEY в файле .env');
        }
        openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });
    }
    return openai;
}

// System prompts for different D&D tasks
const PROMPTS = {
    npc: `Ты - помощник Мастера подземелий. Создай интересного NPC персонажа для D&D 5e.
Включи: имя, расу, класс (если применимо), характер, краткую предысторию, мотивацию, особенности внешности.
Ответ должен быть детальным, но лаконичным (200-300 слов).`,

    quest: `Ты - помощник Мастера подземелий. Создай интересный квест или приключение для D&D 5e.
Включи: название, завязку, основную цель, возможные осложнения, награду.
Ответ должен быть вдохновляющим и готовым к использованию (200-300 слов).`,

    location: `Ты - помощник Мастера подземелий. Создай детальное описание локации для D&D 5e.
Включи: название, общую атмосферу, визуальные детали, звуки/запахи, возможные опасности или интересные находки.
Ответ должен быть образным и погружающим (200-300 слов).`,

    rules: `Ты - эксперт по правилам D&D 5e. Ответь на вопрос о правилах четко и понятно.
Если нужно, приведи примеры. Ссылайся на конкретные правила из Player's Handbook или Dungeon Master's Guide.
Будь кратким, но полным в объяснении.`,

    dmAssist: `Ты - опытный Мастер подземелий для D&D 5e. Помогай с ролевой игрой, давай советы по ведению игры,
предлагай интересные повороты сюжета, помогай в импровизации. Будь креативным и вдохновляющим.`
};

export async function generateNPC(context = '') {
    const prompt = context
        ? `${PROMPTS.npc}\n\nКонтекст: ${context}`
        : PROMPTS.npc;

    return await generateContent(prompt);
}

export async function generateQuest(context = '') {
    const prompt = context
        ? `${PROMPTS.quest}\n\nКонтекст: ${context}`
        : PROMPTS.quest;

    return await generateContent(prompt);
}

export async function generateLocation(context = '') {
    const prompt = context
        ? `${PROMPTS.location}\n\nКонтекст: ${context}`
        : PROMPTS.location;

    return await generateContent(prompt);
}

export async function askRules(question) {
    const prompt = `${PROMPTS.rules}\n\nВопрос: ${question}`;
    return await generateContent(prompt);
}

export async function dmAssist(query) {
    const prompt = `${PROMPTS.dmAssist}\n\n${query}`;
    return await generateContent(prompt);
}

async function generateContent(prompt) {
    try {
        const client = getOpenAIClient();
        const completion = await client.chat.completions.create({
            model: 'gpt-4',
            messages: [
                {
                    role: 'system',
                    content: 'Ты - профессиональный помощник для игры в Dungeons & Dragons 5e. Отвечай на русском языке.'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            temperature: 0.8,
            max_tokens: 2000,
        });

        const response = completion.choices[0].message.content;
        const usage = completion.usage;

        console.log(`🤖 GPT ответ: ${usage.completion_tokens} токенов использовано из ${2000} max`);
        console.log(`📊 Finish reason: ${completion.choices[0].finish_reason}`);

        if (completion.choices[0].finish_reason === 'length') {
            console.warn('⚠️ ВНИМАНИЕ: Ответ обрезан из-за лимита токенов!');
        }

        return response;
    } catch (error) {
        console.error('OpenAI API Error:', error);
        throw new Error('Ошибка при обращении к AI. Проверьте API ключ.');
    }
}

// Character creation assistant
export async function generateCharacterConcept(className, race, background = '') {
    const prompt = `Создай концепцию персонажа D&D 5e:
Класс: ${className}
Раса: ${race}
${background ? `Дополнительно: ${background}` : ''}

Включи:
- Имя персонажа
- Краткую предысторию (2-3 предложения)
- Черты характера (2-3)
- Идеалы, привязанности, слабости
- Внешность

Будь креативным и создай запоминающегося персонажа!`;

    return await generateContent(prompt);
}
