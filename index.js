import { Client, GatewayIntentBits, Collection } from 'discord.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readdirSync } from 'fs';

// Load environment variables
dotenv.config();

// Debug: Show token info (first/last chars only for security)
const token = process.env.DISCORD_TOKEN;
console.log(`🔍 Debug: Токен загружен (начало: ${token?.substring(0, 15)}... конец: ...${token?.substring(token.length - 10)})`);
console.log(`🔍 Debug: CLIENT_ID: ${process.env.CLIENT_ID}`);

// Create Discord client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

// Command collection
client.commands = new Collection();

// Temporary storage for session join selections
const sessionJoinSelections = new Map();

// Load commands
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const commandsPath = join(__dirname, 'commands');

try {
    const commandFiles = readdirSync(commandsPath).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
        const command = await import(`./commands/${file}`);
        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
            console.log(`✅ Загружена команда: ${command.data.name}`);
        } else {
            console.warn(`⚠️ Команда ${file} не имеет 'data' или 'execute'`);
        }
    }
} catch (error) {
    console.error('Ошибка при загрузке команд:', error);
}

// Bot ready event
client.once('ready', () => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎲 D&D AI Bot запущен!');
    console.log(`📝 Бот: ${client.user.tag}`);
    console.log(`🌐 Серверов: ${client.guilds.cache.size}`);
    console.log(`⚙️ Команд загружено: ${client.commands.size}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Set bot status
    client.user.setActivity('D&D 5e | /help', { type: 'PLAYING' });
});

// Handle slash commands
client.on('interactionCreate', async interaction => {
    if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);

        if (!command) {
            console.error(`Команда ${interaction.commandName} не найдена.`);
            return;
        }

        try {
            await command.execute(interaction);
        } catch (error) {
            console.error('Ошибка выполнения команды:', error);

            const errorMessage = {
                content: '❌ Произошла ошибка при выполнении команды!',
                ephemeral: true
            };

            if (interaction.replied || interaction.deferred) {
                await interaction.followUp(errorMessage);
            } else {
                await interaction.reply(errorMessage);
            }
        }
    } else if (interaction.isModalSubmit()) {
        // Handle modal submissions (character creation)
        if (interaction.customId === 'createCharacter') {
            const { saveCharacter } = await import('./utils/characterManager.js');
            const { rollAbilityScores } = await import('./utils/diceRoller.js');

            const name = interaction.fields.getTextInputValue('charName');
            const race = interaction.fields.getTextInputValue('charRace');
            const className = interaction.fields.getTextInputValue('charClass');
            const levelInput = interaction.fields.getTextInputValue('charLevel');
            const alignment = interaction.fields.getTextInputValue('charAlignment') || 'Не указано';

            // Parse and validate level
            let level = 1;
            if (levelInput) {
                const parsedLevel = parseInt(levelInput);
                if (parsedLevel >= 1 && parsedLevel <= 20) {
                    level = parsedLevel;
                }
            }

            // Roll ability scores
            const scores = rollAbilityScores();
            const abilities = {
                strength: scores[0].total,
                dexterity: scores[1].total,
                constitution: scores[2].total,
                intelligence: scores[3].total,
                wisdom: scores[4].total,
                charisma: scores[5].total
            };

            const character = {
                name,
                race,
                class: className,
                level,
                alignment,
                abilities,
                // Additional fields for future editing
                background: '',
                traits: '',
                ideals: '',
                bonds: '',
                flaws: '',
                equipment: [],
                spells: [],
                features: []
            };

            const saved = saveCharacter(interaction.user.id, character);

            await interaction.reply({
                content: `✅ **Персонаж создан!**\n\n🎭 **${name}**\n${race} ${className} ${level} уровня\n⚖️ Мировоззрение: ${alignment}\n📊 ID: \`${saved.id}\`\n\n🎲 **Характеристики:**\nСИЛ: ${abilities.strength} | ЛОВ: ${abilities.dexterity} | ТЕЛ: ${abilities.constitution}\nИНТ: ${abilities.intelligence} | МДР: ${abilities.wisdom} | ХАР: ${abilities.charisma}\n\n💡 Используйте \`/character sheet id:${saved.id}\` чтобы увидеть лист персонажа!\n📝 Используйте \`/character edit\` для добавления деталей!`,
                ephemeral: true
            });
        } else if (interaction.customId === 'createSession') {
            const { createSession } = await import('./utils/sessionManager.js');

            const name = interaction.fields.getTextInputValue('sessionName');
            const date = interaction.fields.getTextInputValue('sessionDate');
            const notes = interaction.fields.getTextInputValue('sessionNotes') || '';
            const mentionInput = interaction.fields.getTextInputValue('sessionMention') || '';

            const sessionData = {
                name,
                date,
                gmUserId: interaction.user.id,
                gmName: interaction.user.username,
                notes
            };

            const session = createSession(interaction.guild.id, sessionData);

            // First, reply to the interaction
            await interaction.reply({
                content: `✅ Сессия **${name}** создана! Публикую объявление...`,
                ephemeral: true
            });

            // Parse mention (role ID or @mention)
            let mentionText = '';
            let allowEveryone = false;

            if (mentionInput) {
                // Extract role ID from various formats
                const roleIdMatch = mentionInput.match(/(\d{17,19})/);
                if (roleIdMatch) {
                    const roleId = roleIdMatch[1];
                    const role = await interaction.guild.roles.fetch(roleId).catch(() => null);
                    if (role) {
                        mentionText = `<@&${roleId}>`;
                    }
                } else if (mentionInput.toLowerCase().includes('everyone')) {
                    mentionText = '@everyone';
                    allowEveryone = true;
                } else if (mentionInput.toLowerCase().includes('here')) {
                    mentionText = '@here';
                    allowEveryone = true;
                }
            }

            // Create beautiful embed
            const { EmbedBuilder } = await import('discord.js');
            const { COLORS } = await import('./config.js');

            const embed = new EmbedBuilder()
                .setColor(COLORS.success)
                .setTitle('🎲 Новая игровая сессия!')
                .setDescription(`**${name}**\n\n📅 **Дата:** ${date}\n🎭 **Гейм-мастер:** ${interaction.user.username}\n${notes ? `\n📝 **Описание:**\n${notes}\n` : ''}`)
                .addFields(
                    { name: '💡 Как присоединиться', value: 'Используйте команду `/session join`', inline: false },
                    { name: '📊 ID сессии', value: `\`${session.id}\``, inline: true }
                )
                .setFooter({ text: 'Присоединяйтесь к приключению!' })
                .setTimestamp();

            const mentionOptions = {
                content: mentionText || undefined,
                embeds: [embed],
                allowedMentions: {
                    parse: allowEveryone ? ['everyone'] : ['roles'],
                    roles: mentionText && !allowEveryone ? [mentionText.match(/(\d{17,19})/)?.[1]].filter(Boolean) : []
                }
            };

            await interaction.channel.send(mentionOptions);
        }
    } else if (interaction.isStringSelectMenu()) {
        // Handle select menu interactions
        const userId = interaction.user.id;

        // Initialize user's selection if not exists
        if (!sessionJoinSelections.has(userId)) {
            sessionJoinSelections.set(userId, {});
        }

        const userSelection = sessionJoinSelections.get(userId);

        // Handle session info selection (separate from join flow)
        if (interaction.customId === 'selectSessionInfo') {
            const { getSession, formatSession } = await import('./utils/sessionManager.js');
            const { EmbedBuilder } = await import('discord.js');
            const { COLORS } = await import('./config.js');

            const sessionId = parseInt(interaction.values[0]);
            const session = getSession(interaction.guild.id, sessionId);

            if (!session) {
                await interaction.update({
                    content: '❌ Сессия не найдена!',
                    components: []
                });
                return;
            }

            const formattedSession = formatSession(session);
            const embed = new EmbedBuilder()
                .setColor(COLORS.primary)
                .setTitle('🎲 Информация о сессии')
                .setDescription(formattedSession)
                .setFooter({ text: `ID: ${session.id} | Создана: ${new Date(session.createdAt).toLocaleDateString('ru-RU')}` });

            await interaction.update({
                content: null,
                embeds: [embed],
                components: []
            });
            return;
        }

        // Handle character sheet selection
        if (interaction.customId === 'selectCharacterSheet') {
            const { getCharacters, formatCharacterSheet } = await import('./utils/characterManager.js');
            const { EmbedBuilder } = await import('discord.js');
            const { COLORS } = await import('./config.js');

            const characterId = parseInt(interaction.values[0]);
            const characters = getCharacters(interaction.user.id);
            const character = characters.find(c => c.id === characterId);

            if (!character) {
                await interaction.update({
                    content: '❌ Персонаж не найден!',
                    components: []
                });
                return;
            }

            const sheet = formatCharacterSheet(character);
            const embed = new EmbedBuilder()
                .setColor(COLORS.primary)
                .setTitle('📜 Лист персонажа')
                .setDescription(sheet)
                .setFooter({ text: `ID: ${character.id} | Создан: ${new Date(character.createdAt).toLocaleDateString('ru-RU')}` });

            await interaction.update({
                content: null,
                embeds: [embed],
                components: []
            });
            return;
        }

        // Handle session delete selection
        if (interaction.customId === 'selectSessionDelete') {
            const { getSession, deleteSession } = await import('./utils/sessionManager.js');

            const sessionId = parseInt(interaction.values[0]);
            const session = getSession(interaction.guild.id, sessionId);

            if (!session) {
                await interaction.update({
                    content: '❌ Сессия не найдена!',
                    components: []
                });
                return;
            }

            // Double check user is GM
            if (session.gmUserId !== interaction.user.id) {
                await interaction.update({
                    content: '❌ Только гейм-мастер может удалить сессию!',
                    components: []
                });
                return;
            }

            const success = deleteSession(interaction.guild.id, sessionId);

            if (success) {
                await interaction.update({
                    content: `✅ Сессия **${session.name}** успешно удалена!`,
                    components: []
                });
            } else {
                await interaction.update({
                    content: '❌ Ошибка при удалении сессии!',
                    components: []
                });
            }
            return;
        }

        // Store the selection
        if (interaction.customId === 'selectSession') {
            userSelection.sessionId = parseInt(interaction.values[0]);
            await interaction.deferUpdate();
        } else if (interaction.customId === 'selectCharacter') {
            userSelection.characterId = parseInt(interaction.values[0]);
            await interaction.deferUpdate();
        }

        // Check if both are selected
        if (userSelection.sessionId && userSelection.characterId) {
            const { joinSession, getSession } = await import('./utils/sessionManager.js');
            const { getCharacters } = await import('./utils/characterManager.js');

            const session = getSession(interaction.guild.id, userSelection.sessionId);
            const characters = getCharacters(userId);
            const character = characters.find(c => c.id === userSelection.characterId);

            if (!session || !character) {
                await interaction.editReply({
                    content: '❌ Ошибка: сессия или персонаж не найдены!',
                    components: []
                });
                sessionJoinSelections.delete(userId);
                return;
            }

            const result = joinSession(interaction.guild.id, userSelection.sessionId, {
                userId: userId,
                userName: interaction.user.username,
                characterId: character.id,
                characterName: character.name
            });

            if (result.success) {
                await interaction.editReply({
                    content: `✅ Вы присоединились к сессии **${session.name}** с персонажем **${character.name}**!`,
                    components: []
                });
            } else {
                await interaction.editReply({
                    content: `❌ ${result.error}`,
                    components: []
                });
            }

            // Clean up
            sessionJoinSelections.delete(userId);
        }
    }
});

// Handle errors
client.on('error', error => {
    console.error('Discord client error:', error);
});

process.on('unhandledRejection', error => {
    console.error('Unhandled promise rejection:', error);
});

// Login to Discord
client.login(process.env.DISCORD_TOKEN);

// Simple HTTP server to keep Glitch awake (for UptimeRobot pings)
import express from 'express';
const app = express();

app.get('/', (req, res) => {
    const uptime = process.uptime();
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);

    res.send(`
        <html>
            <head><title>Discord D&D Bot</title></head>
            <body style="font-family: Arial; text-align: center; padding: 50px;">
                <h1>🎲 Discord D&D Bot</h1>
                <p>✅ Bot is running!</p>
                <p>⏱️ Uptime: ${hours}h ${minutes}m</p>
                <p>🤖 Status: ${client.user ? 'Connected' : 'Connecting...'}</p>
            </body>
        </html>
    `);
});

app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        uptime: process.uptime(),
        bot: client.user ? client.user.tag : 'connecting'
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🌐 HTTP server running on port ${PORT}`);
});
