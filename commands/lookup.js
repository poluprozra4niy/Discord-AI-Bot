import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { searchSpells, searchItems } from '../utils/dndData.js';
import { askRules } from '../utils/openai.js';
import { COLORS } from '../config.js';

export const data = new SlashCommandBuilder()
    .setName('lookup')
    .setDescription('Поиск заклинаний, предметов и правил D&D')
    .addSubcommand(subcommand =>
        subcommand
            .setName('spell')
            .setDescription('Найти заклинание')
            .addStringOption(option =>
                option.setName('name')
                    .setDescription('Название заклинания')
                    .setRequired(true)))
    .addSubcommand(subcommand =>
        subcommand
            .setName('item')
            .setDescription('Найти предмет')
            .addStringOption(option =>
                option.setName('name')
                    .setDescription('Название предмета')
                    .setRequired(true)))
    .addSubcommand(subcommand =>
        subcommand
            .setName('rule')
            .setDescription('Спросить о правилах D&D 5e (AI)')
            .addStringOption(option =>
                option.setName('question')
                    .setDescription('Ваш вопрос о правилах')
                    .setRequired(true)));

export async function execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    switch (subcommand) {
        case 'spell':
            await handleSpell(interaction);
            break;
        case 'item':
            await handleItem(interaction);
            break;
        case 'rule':
            await handleRule(interaction);
            break;
    }
}

async function handleSpell(interaction) {
    const query = interaction.options.getString('name');
    const results = searchSpells(query);

    if (results.length === 0) {
        await interaction.reply({
            content: `❌ Заклинание "${query}" не найдено. База данных содержит основные заклинания D&D 5e.`,
            ephemeral: true
        });
        return;
    }

    const spell = results[0];

    const embed = new EmbedBuilder()
        .setColor(COLORS.magic)
        .setTitle(`✨ ${spell.name}`)
        .setDescription(`*${spell.nameEn}*\n**${spell.level} уровень • ${spell.school}**`)
        .addFields(
            { name: '⏱️ Время накладывания', value: spell.castingTime, inline: true },
            { name: '📏 Дистанция', value: spell.range, inline: true },
            { name: '🎭 Компоненты', value: spell.components, inline: true },
            { name: '⌛ Длительность', value: spell.duration, inline: false },
            { name: '📖 Описание', value: spell.description, inline: false },
            { name: '🎓 Классы', value: spell.classes.join(', '), inline: false }
        );

    if (results.length > 1) {
        embed.setFooter({ text: `Найдено ещё ${results.length - 1} заклинаний. Уточните запрос.` });
    }

    await interaction.reply({ embeds: [embed] });
}

async function handleItem(interaction) {
    const query = interaction.options.getString('name');
    const results = searchItems(query);

    if (results.length === 0) {
        await interaction.reply({
            content: `❌ Предмет "${query}" не найден. База данных содержит основные предметы D&D 5e.`,
            ephemeral: true
        });
        return;
    }

    const item = results[0];

    const embed = new EmbedBuilder()
        .setColor(COLORS.warning)
        .setTitle(`⚔️ ${item.name}`)
        .setDescription(`*${item.nameEn}*\n**${item.type} • ${item.rarity}**`)
        .addFields(
            { name: '💰 Цена', value: item.cost, inline: true },
            { name: '⚖️ Вес', value: item.weight, inline: true },
            { name: '📖 Описание', value: item.description, inline: false }
        );

    if (results.length > 1) {
        embed.setFooter({ text: `Найдено ещё ${results.length - 1} предметов. Уточните запрос.` });
    }

    await interaction.reply({ embeds: [embed] });
}

async function handleRule(interaction) {
    const question = interaction.options.getString('question');

    await interaction.deferReply();

    try {
        const answer = await askRules(question);

        const embed = new EmbedBuilder()
            .setColor(COLORS.info)
            .setTitle('📚 Правила D&D 5e')
            .setDescription(`**Вопрос:** ${question}`)
            .addFields({ name: '✅ Ответ', value: answer })
            .setFooter({ text: 'Ответ сгенерирован AI • Всегда сверяйтесь с официальными правилами' });

        await interaction.editReply({ embeds: [embed] });
    } catch (error) {
        await interaction.editReply({
            content: '❌ Ошибка при обращении к AI. Проверьте настройки OpenAI API.'
        });
    }
}
