import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { generateNPC, generateQuest, generateLocation, dmAssist } from '../utils/openai.js';
import { COLORS } from '../config.js';

export const data = new SlashCommandBuilder()
    .setName('generate')
    .setDescription('Генерация контента для D&D с помощью AI')
    .addSubcommand(subcommand =>
        subcommand
            .setName('npc')
            .setDescription('Сгенерировать NPC персонажа')
            .addStringOption(option =>
                option.setName('context')
                    .setDescription('Контекст (например: таверна, злодей, торговец)')
                    .setRequired(false)))
    .addSubcommand(subcommand =>
        subcommand
            .setName('quest')
            .setDescription('Сгенерировать квест или приключение')
            .addStringOption(option =>
                option.setName('context')
                    .setDescription('Контекст (например: уровень 1-3, подземелье, городское)')
                    .setRequired(false)))
    .addSubcommand(subcommand =>
        subcommand
            .setName('location')
            .setDescription('Сгенерировать описание локации')
            .addStringOption(option =>
                option.setName('context')
                    .setDescription('Тип локации (например: лес, город, пещера)')
                    .setRequired(false)))
    .addSubcommand(subcommand =>
        subcommand
            .setName('dm')
            .setDescription('AI помощник Мастера подземелий')
            .addStringOption(option =>
                option.setName('request')
                    .setDescription('Ваш запрос к DM помощнику')
                    .setRequired(true)));

export async function execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    await interaction.deferReply();

    try {
        let result;
        let title;
        let emoji;

        switch (subcommand) {
            case 'npc':
                const npcContext = interaction.options.getString('context') || '';
                result = await generateNPC(npcContext);
                title = '🧙 Сгенерированный NPC';
                emoji = '🧙';
                break;

            case 'quest':
                const questContext = interaction.options.getString('context') || '';
                result = await generateQuest(questContext);
                title = '📜 Сгенерированный квест';
                emoji = '📜';
                break;

            case 'location':
                const locationContext = interaction.options.getString('context') || '';
                result = await generateLocation(locationContext);
                title = '🗺️ Сгенерированная локация';
                emoji = '🗺️';
                break;

            case 'dm':
                const request = interaction.options.getString('request');
                result = await dmAssist(request);
                title = '🎲 DM Помощник';
                emoji = '🎲';
                break;
        }

        // Check if response fits in embed (Discord embed description limit is 4096)
        // But we'll use 3800 to be safe with formatting
        if (result.length <= 3800) {
            // Use embed for responses that fit
            const embed = new EmbedBuilder()
                .setColor(COLORS.magic)
                .setTitle(`${emoji} ${title}`)
                .setDescription(result)
                .setFooter({ text: 'Сгенерировано AI • Используйте как источник вдохновения!' })
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
            console.log(`✅ Отправлен ответ (${result.length} символов) как embed`);
        } else {
            // Split long responses into multiple plain text messages
            const { sendLongMessage } = await import('../utils/messageSplitter.js');

            const formattedMessage = `${emoji} **${title}**\n\n${result}\n\n*Сгенерировано AI • Используйте как источник вдохновения!*`;

            console.log(`📏 Длина ответа: ${result.length} символов (слишком длинно для embed)`);

            await sendLongMessage(interaction, formattedMessage, true);
        }

    } catch (error) {
        console.error('Generation error:', error);
        await interaction.editReply({
            content: '❌ Ошибка при генерации контента. Проверьте настройки OpenAI API и наличие API ключа в .env файле.',
            ephemeral: true
        });
    }
}
