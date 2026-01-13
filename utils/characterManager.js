import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DATA_DIR = join(dirname(__dirname), 'data', 'characters');

// Ensure data directory exists
if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
}

export function saveCharacter(userId, character) {
    const filePath = join(DATA_DIR, `${userId}.json`);

    let characters = [];
    if (existsSync(filePath)) {
        const data = readFileSync(filePath, 'utf8');
        characters = JSON.parse(data);
    }

    // Add timestamp and ID
    character.id = Date.now();
    character.createdAt = new Date().toISOString();

    characters.push(character);
    writeFileSync(filePath, JSON.stringify(characters, null, 2));

    return character;
}

export function getCharacters(userId) {
    const filePath = join(DATA_DIR, `${userId}.json`);

    if (!existsSync(filePath)) {
        return [];
    }

    const data = readFileSync(filePath, 'utf8');
    return JSON.parse(data);
}

export function getCharacter(userId, characterId) {
    const characters = getCharacters(userId);
    return characters.find(c => c.id === characterId);
}

export function deleteCharacter(userId, characterId) {
    const filePath = join(DATA_DIR, `${userId}.json`);

    if (!existsSync(filePath)) {
        return false;
    }

    const characters = getCharacters(userId);
    const filtered = characters.filter(c => c.id !== characterId);

    writeFileSync(filePath, JSON.stringify(filtered, null, 2));
    return true;
}

export function formatCharacterSheet(character) {
    const abilities = character.abilities || {};

    let sheet = `**${character.name}**\n`;
    sheet += `${character.race} ${character.class} ${character.level || 1} уровня\n`;
    sheet += `⚖️ Мировоззрение: ${character.alignment || 'Не указано'}\n\n`;

    sheet += `**Характеристики:**\n`;
    sheet += `🗡️ СИЛ: ${abilities.strength || 10} (${getModifier(abilities.strength || 10)})\n`;
    sheet += `🏹 ЛОВ: ${abilities.dexterity || 10} (${getModifier(abilities.dexterity || 10)})\n`;
    sheet += `❤️ ТЕЛ: ${abilities.constitution || 10} (${getModifier(abilities.constitution || 10)})\n`;
    sheet += `📚 ИНТ: ${abilities.intelligence || 10} (${getModifier(abilities.intelligence || 10)})\n`;
    sheet += `🔮 МДР: ${abilities.wisdom || 10} (${getModifier(abilities.wisdom || 10)})\n`;
    sheet += `✨ ХАР: ${abilities.charisma || 10} (${getModifier(abilities.charisma || 10)})\n\n`;

    if (character.background) {
        sheet += `**Предыстория:**\n${character.background}\n\n`;
    }

    if (character.traits) {
        sheet += `**Черты характера:** ${character.traits}\n`;
    }

    if (character.ideals) {
        sheet += `**Идеалы:** ${character.ideals}\n`;
    }

    if (character.bonds) {
        sheet += `**Привязанности:** ${character.bonds}\n`;
    }

    if (character.flaws) {
        sheet += `**Слабости:** ${character.flaws}\n`;
    }

    return sheet;
}

function getModifier(score) {
    const modifier = Math.floor((score - 10) / 2);
    return modifier >= 0 ? `+${modifier}` : `${modifier}`;
}

export function calculateModifier(abilityScore) {
    return Math.floor((abilityScore - 10) / 2);
}
