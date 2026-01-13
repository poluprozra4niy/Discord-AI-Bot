import { SlashCommandBuilder, EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, StringSelectMenuBuilder } from 'discord.js';
import { createSession, getSessions, getSession, joinSession, leaveSession, deleteSession, formatSession } from '../utils/sessionManager.js';
import { getCharacters } from '../utils/characterManager.js';
import { COLORS } from '../config.js';

export const data = new SlashCommandBuilder()
    .setName('session')
    .setDescription('Управление игровыми сессиями D&D')
    .addSubcommand(subcommand =>
        subcommand
            .setName('create')
            .setDescription('Создать новую игровую сессию'))
    .addSubcommand(subcommand =>
        subcommand
            .setName('list')
            .setDescription('Показать все сессии')
            .addStringOption(option =>
                option.setName('status')
                    .setDescription('Фильтр по статусу')
                    .setRequired(false)
                    .addChoices(
                        { name: 'Запланированные', value: 'scheduled' },
                        { name: 'Активные', value: 'active' },
                        { name: 'Завершенные', value: 'completed' }
                    )))
    .addSubcommand(subcommand =>
        subcommand
            .setName('info')
            .setDescription('Подробная информация о сессии')
            .addIntegerOption(option =>
                option.setName('id')
                    .setDescription('ID сессии')
                    .setRequired(false)))
    .addSubcommand(subcommand =>
        subcommand
            .setName('join')
            .setDescription('Присоединиться к сессии с персонажем'))
    .addSubcommand(subcommand =>
        subcommand
            .setName('leave')
            .setDescription('Покинуть сессию')
            .addIntegerOption(option =>
                option.setName('id')
                    .setDescription('ID сессии')
                    .setRequired(true)))
    .addSubcommand(subcommand =>
        subcommand
            .setName('delete')
            .setDescription('Удалить сессию (только для GM)')
            .addIntegerOption(option =>
                option.setName('id')
                    .setDescription('ID сессии')
                    .setRequired(false)));

export async function execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    switch (subcommand) {
        case 'create':
            await handleCreate(interaction);
            break;
        case 'list':
            await handleList(interaction);
            break;
        case 'info':
            await handleInfo(interaction);
            break;
        case 'join':
            await handleJoin(interaction);
            break;
        case 'leave':
            await handleLeave(interaction);
            break;
        case 'delete':
            await handleDelete(interaction);
            break;
    }
}

async function handleCreate(interaction) {
    // Create modal for session creation - must be immediate, no delays!
    const modal = new ModalBuilder()
        .setCustomId('createSession')
        .setTitle('Создание игровой сессии');

    const nameInput = new TextInputBuilder()
        .setCustomId('sessionName')
        .setLabel('Название сессии')
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setMaxLength(100);

    const dateInput = new TextInputBuilder()
        .setCustomId('sessionDate')
        .setLabel('Дата и время (например: 25.12.2024 18:00)')
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setMaxLength(50);

    const notesInput = new TextInputBuilder()
        .setCustomId('sessionNotes')
        .setLabel('Заметки (описание, важная информация)')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(false)
        .setMaxLength(500);

    const mentionInput = new TextInputBuilder()
        .setCustomId('sessionMention')
        .setLabel('Упомянуть роль (ID или @роль, необязательно)')
        .setStyle(TextInputStyle.Short)
        .setRequired(false)
        .setMaxLength(100)
        .setPlaceholder('Например: @Игроки или ID роли');

    const row1 = new ActionRowBuilder().addComponents(nameInput);
    const row2 = new ActionRowBuilder().addComponents(dateInput);
    const row3 = new ActionRowBuilder().addComponents(notesInput);
    const row4 = new ActionRowBuilder().addComponents(mentionInput);

    modal.addComponents(row1, row2, row3, row4);

    await interaction.showModal(modal);
}

async function handleList(interaction) {
    const statusFilter = interaction.options.getString('status');
    const sessions = getSessions(interaction.guild.id, statusFilter);

    if (sessions.length === 0) {
        const message = statusFilter
            ? `📝 Нет сессий со статусом "${statusFilter}"`
            : '📝 Пока нет созданных сессий. Используйте `/session create` для создания!';

        await interaction.reply({
            content: message,
            ephemeral: true
        });
        return;
    }

    const embed = new EmbedBuilder()
        .setColor(COLORS.primary)
        .setTitle('🎲 Игровые сессии D&D')
        .setDescription(sessions.map(session => {
            const statusEmoji = session.status === 'scheduled' ? '📅' :
                session.status === 'active' ? '🎮' : '✅';
            return `${statusEmoji} \`${session.id}\` - **${session.name}**\n` +
                `   📅 ${session.date} | 👥 ${session.participants.length} участников`;
        }).join('\n\n'))
        .setFooter({ text: 'Используйте /session info для подробностей' });

    await interaction.reply({ embeds: [embed] });
}

async function handleInfo(interaction) {
    const sessionId = interaction.options.getInteger('id');

    // If no ID provided, show selection menu
    if (!sessionId) {
        const sessions = getSessions(interaction.guild.id);

        if (sessions.length === 0) {
            await interaction.reply({
                content: '📝 Пока нет созданных сессий.',
                ephemeral: true
            });
            return;
        }

        // Create session select menu
        const sessionSelect = new StringSelectMenuBuilder()
            .setCustomId('selectSessionInfo')
            .setPlaceholder('Выберите сессию для просмотра')
            .addOptions(
                sessions.map(session => {
                    const statusEmoji = session.status === 'scheduled' ? '📅' :
                        session.status === 'active' ? '🎮' : '✅';
                    return {
                        label: session.name,
                        description: `${session.date} | ${statusEmoji} ${session.participants.length} участников`,
                        value: session.id.toString()
                    };
                })
            );

        const row = new ActionRowBuilder().addComponents(sessionSelect);

        await interaction.reply({
            content: '**Информация о сессии**\n\nВыберите сессию из списка:',
            components: [row],
            ephemeral: true
        });
        return;
    }

    // If ID provided, show info directly
    const session = getSession(interaction.guild.id, sessionId);

    if (!session) {
        await interaction.reply({
            content: '❌ Сессия не найдена!',
            ephemeral: true
        });
        return;
    }

    const formattedSession = formatSession(session);

    const embed = new EmbedBuilder()
        .setColor(COLORS.primary)
        .setTitle('🎲 Информация о сессии')
        .setDescription(formattedSession)
        .setFooter({ text: `ID: ${session.id} | Создана: ${new Date(session.createdAt).toLocaleDateString('ru-RU')}` });

    await interaction.reply({ embeds: [embed] });
}

async function handleJoin(interaction) {
    const sessions = getSessions(interaction.guild.id, 'scheduled');

    if (sessions.length === 0) {
        await interaction.reply({
            content: '❌ Нет доступных сессий для присоединения!',
            ephemeral: true
        });
        return;
    }

    const characters = getCharacters(interaction.user.id);

    if (characters.length === 0) {
        await interaction.reply({
            content: '❌ У вас нет персонажей! Создайте персонажа командой `/character create`',
            ephemeral: true
        });
        return;
    }

    // Create session select menu
    const sessionSelect = new StringSelectMenuBuilder()
        .setCustomId('selectSession')
        .setPlaceholder('Выберите сессию')
        .addOptions(
            sessions.map(session => ({
                label: session.name,
                description: `${session.date} | GM: ${session.gmName}`,
                value: session.id.toString()
            }))
        );

    // Create character select menu
    const characterSelect = new StringSelectMenuBuilder()
        .setCustomId('selectCharacter')
        .setPlaceholder('Выберите персонажа')
        .addOptions(
            characters.map(char => ({
                label: char.name,
                description: `${char.race} ${char.class} ${char.level || 1}`,
                value: char.id.toString()
            }))
        );

    const sessionRow = new ActionRowBuilder().addComponents(sessionSelect);
    const characterRow = new ActionRowBuilder().addComponents(characterSelect);

    await interaction.reply({
        content: '**Присоединение к сессии**\n\nВыберите сессию и персонажа из списков ниже:',
        components: [sessionRow, characterRow],
        ephemeral: true
    });
}

async function handleLeave(interaction) {
    const sessionId = interaction.options.getInteger('id');
    const session = getSession(interaction.guild.id, sessionId);

    if (!session) {
        await interaction.reply({
            content: '❌ Сессия не найдена!',
            ephemeral: true
        });
        return;
    }

    const result = leaveSession(interaction.guild.id, sessionId, interaction.user.id);

    if (!result.success) {
        await interaction.reply({
            content: `❌ ${result.error}`,
            ephemeral: true
        });
        return;
    }

    await interaction.reply({
        content: `✅ Вы покинули сессию **${session.name}**`,
        ephemeral: true
    });
}

async function handleDelete(interaction) {
    const sessionId = interaction.options.getInteger('id');

    // If no ID provided, show selection menu of sessions where user is GM
    if (!sessionId) {
        const allSessions = getSessions(interaction.guild.id);
        const userSessions = allSessions.filter(s => s.gmUserId === interaction.user.id);

        if (userSessions.length === 0) {
            await interaction.reply({
                content: '📝 У вас нет сессий, которые вы можете удалить (вы должны быть GM).',
                ephemeral: true
            });
            return;
        }

        // Create session select menu
        const sessionSelect = new StringSelectMenuBuilder()
            .setCustomId('selectSessionDelete')
            .setPlaceholder('Выберите сессию для удаления')
            .addOptions(
                userSessions.map(session => {
                    const statusEmoji = session.status === 'scheduled' ? '📅' :
                        session.status === 'active' ? '🎮' : '✅';
                    return {
                        label: session.name,
                        description: `${session.date} | ${statusEmoji} ${session.participants.length} участников`,
                        value: session.id.toString()
                    };
                })
            );

        const row = new ActionRowBuilder().addComponents(sessionSelect);

        await interaction.reply({
            content: '**Удаление сессии**\n\n⚠️ Выберите сессию для удаления:',
            components: [row],
            ephemeral: true
        });
        return;
    }

    // If ID provided, delete directly
    const session = getSession(interaction.guild.id, sessionId);

    if (!session) {
        await interaction.reply({
            content: '❌ Сессия не найдена!',
            ephemeral: true
        });
        return;
    }

    // Check if user is GM
    if (session.gmUserId !== interaction.user.id) {
        await interaction.reply({
            content: '❌ Только гейм-мастер может удалить сессию!',
            ephemeral: true
        });
        return;
    }

    const success = deleteSession(interaction.guild.id, sessionId);

    if (success) {
        await interaction.reply({
            content: `✅ Сессия **${session.name}** успешно удалена!`,
            ephemeral: true
        });
    } else {
        await interaction.reply({
            content: '❌ Ошибка при удалении сессии!',
            ephemeral: true
        });
    }
}
