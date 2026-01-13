import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DATA_DIR = join(dirname(__dirname), 'data', 'sessions');

// Ensure data directory exists
if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
}

/**
 * Create a new game session
 */
export function createSession(guildId, sessionData) {
    const filePath = join(DATA_DIR, `${guildId}.json`);

    let sessions = [];
    if (existsSync(filePath)) {
        const data = readFileSync(filePath, 'utf8');
        sessions = JSON.parse(data);
    }

    // Add timestamp and ID
    const session = {
        id: Date.now(),
        name: sessionData.name,
        date: sessionData.date,
        gmUserId: sessionData.gmUserId,
        gmName: sessionData.gmName,
        participants: [], // [{userId, userName, characterId, characterName}]
        status: 'scheduled', // scheduled, active, completed
        createdAt: new Date().toISOString(),
        notes: sessionData.notes || ''
    };

    sessions.push(session);
    writeFileSync(filePath, JSON.stringify(sessions, null, 2));

    return session;
}

/**
 * Get all sessions for a guild
 */
export function getSessions(guildId, status = null) {
    const filePath = join(DATA_DIR, `${guildId}.json`);

    if (!existsSync(filePath)) {
        return [];
    }

    const data = readFileSync(filePath, 'utf8');
    const sessions = JSON.parse(data);

    if (status) {
        return sessions.filter(s => s.status === status);
    }

    return sessions;
}

/**
 * Get a specific session by ID
 */
export function getSession(guildId, sessionId) {
    const sessions = getSessions(guildId);
    return sessions.find(s => s.id === sessionId);
}

/**
 * Add participant to session
 */
export function joinSession(guildId, sessionId, participantData) {
    const filePath = join(DATA_DIR, `${guildId}.json`);
    const sessions = getSessions(guildId);
    const session = sessions.find(s => s.id === sessionId);

    if (!session) {
        return { success: false, error: 'Session not found' };
    }

    // Check if user already joined
    const alreadyJoined = session.participants.some(p => p.userId === participantData.userId);
    if (alreadyJoined) {
        return { success: false, error: 'Already joined this session' };
    }

    session.participants.push({
        userId: participantData.userId,
        userName: participantData.userName,
        characterId: participantData.characterId,
        characterName: participantData.characterName
    });

    writeFileSync(filePath, JSON.stringify(sessions, null, 2));

    return { success: true, session };
}

/**
 * Remove participant from session
 */
export function leaveSession(guildId, sessionId, userId) {
    const filePath = join(DATA_DIR, `${guildId}.json`);
    const sessions = getSessions(guildId);
    const session = sessions.find(s => s.id === sessionId);

    if (!session) {
        return { success: false, error: 'Session not found' };
    }

    session.participants = session.participants.filter(p => p.userId !== userId);

    writeFileSync(filePath, JSON.stringify(sessions, null, 2));

    return { success: true, session };
}

/**
 * Update session status
 */
export function updateSessionStatus(guildId, sessionId, newStatus) {
    const filePath = join(DATA_DIR, `${guildId}.json`);
    const sessions = getSessions(guildId);
    const session = sessions.find(s => s.id === sessionId);

    if (!session) {
        return false;
    }

    session.status = newStatus;
    writeFileSync(filePath, JSON.stringify(sessions, null, 2));

    return true;
}

/**
 * Delete a session
 */
export function deleteSession(guildId, sessionId) {
    const filePath = join(DATA_DIR, `${guildId}.json`);

    if (!existsSync(filePath)) {
        return false;
    }

    const sessions = getSessions(guildId);
    const filtered = sessions.filter(s => s.id !== sessionId);

    writeFileSync(filePath, JSON.stringify(filtered, null, 2));
    return true;
}

/**
 * Format session for display
 */
export function formatSession(session) {
    let output = `**${session.name}**\n`;
    output += `📅 Дата: ${session.date}\n`;
    output += `🎲 Гейм-мастер: ${session.gmName}\n`;
    output += `📊 Статус: ${getStatusEmoji(session.status)} ${getStatusName(session.status)}\n`;
    output += `👥 Участники: ${session.participants.length}\n`;

    if (session.participants.length > 0) {
        output += `\n**Список участников:**\n`;
        session.participants.forEach(p => {
            output += `- ${p.userName} (${p.characterName})\n`;
        });
    }

    if (session.notes) {
        output += `\n📝 Заметки: ${session.notes}`;
    }

    return output;
}

function getStatusEmoji(status) {
    switch (status) {
        case 'scheduled': return '📅';
        case 'active': return '🎮';
        case 'completed': return '✅';
        default: return '❓';
    }
}

function getStatusName(status) {
    switch (status) {
        case 'scheduled': return 'Запланирована';
        case 'active': return 'В процессе';
        case 'completed': return 'Завершена';
        default: return 'Неизвестно';
    }
}
