import dotenv from 'dotenv';

dotenv.config();

console.log('🔍 Проверка конфигурации Discord бота\n');

// Check Discord Token
const token = process.env.DISCORD_TOKEN;
console.log('DISCORD_TOKEN:');
console.log(`  Установлен: ${token ? 'Да' : 'Нет'}`);
console.log(`  Длина: ${token ? token.length : 0} символов`);
console.log(`  Начинается с: ${token ? token.substring(0, 10) + '...' : 'N/A'}`);
console.log(`  Первые 5 символов в кодах: ${token ? [...token.substring(0, 5)].map(c => c.charCodeAt(0)).join(', ') : 'N/A'}`);
console.log(`  Есть пробелы в начале/конце: ${token && (token !== token.trim()) ? 'Да ⚠️' : 'Нет'}`);

// Check Client ID
const clientId = process.env.CLIENT_ID;
console.log('\nCLIENT_ID:');
console.log(`  Значение: ${clientId || 'Не установлен'}`);
console.log(`  Валиден (только цифры): ${clientId && /^\d+$/.test(clientId) ? 'Да' : 'Нет ⚠️'}`);

// Check Guild ID
const guildId = process.env.GUILD_ID;
console.log('\nGUILD_ID:');
console.log(`  Значение: ${guildId || 'Не установлен'}`);
console.log(`  Валиден (только цифры): ${guildId && /^\d+$/.test(guildId) ? 'Да' : 'Нет ⚠️'}`);

// Check OpenAI Key
const openaiKey = process.env.OPENAI_API_KEY;
console.log('\nOPENAI_API_KEY:');
console.log(`  Установлен: ${openaiKey && openaiKey !== 'your_openai_api_key_here' ? 'Да' : 'Нет'}`);
console.log(`  Длина: ${openaiKey ? openaiKey.length : 0} символов`);

console.log('\n✅ Проверка завершена!');

// Token format check
if (token) {
    const tokenParts = token.split('.');
    console.log(`\n📋 Формат токена: ${tokenParts.length} части${tokenParts.length === 3 ? ' ✅' : ' ⚠️ (должно быть 3)'}`);

    if (tokenParts.length === 3) {
        console.log(`  Часть 1 (Bot ID): ${tokenParts[0].length} символов`);
        console.log(`  Часть 2 (Timestamp): ${tokenParts[1].length} символов`);
        console.log(`  Часть 3 (HMAC): ${tokenParts[2].length} символов`);
    }
}
