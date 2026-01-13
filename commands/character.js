import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } from 'discord.js';
import { saveCharacter, getCharacters, formatCharacterSheet, deleteCharacter } from '../utils/characterManager.js';
import { rollAbilityScores } from '../utils/diceRoller.js';
import { generateCharacterConcept } from '../utils/openai.js';
import { DND_CONFIG, COLORS } from '../config.js';

export const data = new SlashCommandBuilder()
    .setName('character')
    .setDescription('Управление персонажами D&D')
    .addSubcommand(subcommand =>
        subcommand
            .setName('create')
            .setDescription('Создать нового персонажа'))
    .addSubcommand(subcommand =>
        subcommand
            .setName('list')
            .setDescription('Показать ваших персонажей'))
    .addSubcommand(subcommand =>
        subcommand
            .setName('sheet')
            .setDescription('Показать лист персонажа')
            .addIntegerOption(option =>
                option.setName('id')
                    .setDescription('ID персонажа')
                    .setRequired(false)))
    .addSubcommand(subcommand =>
        subcommand
            .setName('delete')
            .setDescription('Удалить персонажа')
            .addIntegerOption(option =>
                option.setName('id')
                    .setDescription('ID персонажа для удаления')
                    .setRequired(true)))
    .addSubcommand(subcommand =>
        subcommand
            .setName('generate')
            .setDescription('Генерировать концепцию персонажа с AI')
            .addStringOption(option =>
                option.setName('class')
                    .setDescription('Класс персонажа')
                    .setRequired(true)
                    .addChoices(
                        ...DND_CONFIG.classes.map(c => ({ name: c, value: c }))
                    ))
            .addStringOption(option =>
                option.setName('race')
                    .setDescription('Раса персонажа')
                    .setRequired(true)
                    .addChoices(
                        ...DND_CONFIG.races.map(r => ({ name: r, value: r }))
                    ))
            .addStringOption(option =>
                option.setName('background')
                    .setDescription('Дополнительная информация для генерации')
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
        case 'sheet':
            await handleSheet(interaction);
            break;
        case 'delete':
            await handleDelete(interaction);
            break;
        case 'generate':
            await handleGenerate(interaction);
            break;
    }
}

async function handleCreate(interaction) {
    // Create modal for character creation
    const modal = new ModalBuilder()
        .setCustomId('createCharacter')
        .setTitle('Создание персонажа D&D');

    const nameInput = new TextInputBuilder()
        .setCustomId('charName')
        .setLabel('Имя персонажа')
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setMaxLength(50)
        .setPlaceholder('Например: Арагорн');

    const raceInput = new TextInputBuilder()
        .setCustomId('charRace')
        .setLabel('Раса')
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setMaxLength(30)
        .setPlaceholder('Например: Человек, Эльф, Дварф');

    const classInput = new TextInputBuilder()
        .setCustomId('charClass')
        .setLabel('Класс')
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setMaxLength(30)
        .setPlaceholder('Например: Воин, Маг, Плут');

    const levelInput = new TextInputBuilder()
        .setCustomId('charLevel')
        .setLabel('Уровень (оставьте пустым для 1)')
        .setStyle(TextInputStyle.Short)
        .setRequired(false)
        .setMaxLength(2)
        .setPlaceholder('1-20');

    const alignmentInput = new TextInputBuilder()
        .setCustomId('charAlignment')
        .setLabel('Мировоззрение (необязательно)')
        .setStyle(TextInputStyle.Short)
        .setRequired(false)
        .setMaxLength(50)
        .setPlaceholder('Например: Законно-добрый');

    const nameRow = new ActionRowBuilder().addComponents(nameInput);
    const raceRow = new ActionRowBuilder().addComponents(raceInput);
    const classRow = new ActionRowBuilder().addComponents(classInput);
    const levelRow = new ActionRowBuilder().addComponents(levelInput);
    const alignmentRow = new ActionRowBuilder().addComponents(alignmentInput);

    modal.addComponents(nameRow, raceRow, classRow, levelRow, alignmentRow);

    await interaction.showModal(modal);
}

async function handleList(interaction) {
    const characters = getCharacters(interaction.user.id);

    if (characters.length === 0) {
        await interaction.reply({
            content: '📝 У вас пока нет сохранённых персонажей. Используйте `/character create` для создания!',
            ephemeral: true
        });
        return;
    }

    const embed = new EmbedBuilder()
        .setColor(COLORS.primary)
        .setTitle('📚 Ваши персонажи')
        .setDescription(characters.map(char =>
            `\`${char.id}\` - **${char.name}** (${char.race} ${char.class} ${char.level || 1})`
        ).join('\n'));

    await interaction.reply({ embeds: [embed], ephemeral: true });
}

async function handleSheet(interaction) {
    const characterId = interaction.options.getInteger('id');
    const characters = getCharacters(interaction.user.id);

    // If no ID provided, show selection menu
    if (!characterId) {
        if (characters.length === 0) {
            await interaction.reply({
                content: '📝 У вас нет персонажей! Используйте `/character create` для создания.',
                ephemeral: true
            });
            return;
        }

        // Create character select menu
        const { StringSelectMenuBuilder, ActionRowBuilder } = await import('discord.js');

        const characterSelect = new StringSelectMenuBuilder()
            .setCustomId('selectCharacterSheet')
            .setPlaceholder('Выберите персонажа для просмотра')
            .addOptions(
                characters.map(char => ({
                    label: char.name,
                    description: `${char.race} ${char.class} ${char.level || 1}`,
                    value: char.id.toString()
                }))
            );

        const row = new ActionRowBuilder().addComponents(characterSelect);

        await interaction.reply({
            content: '**Лист персонажа**\n\nВыберите персонажа из списка:',
            components: [row],
            ephemeral: true
        });
        return;
    }

    // If ID provided, show sheet directly
    const character = characters.find(c => c.id === characterId);

    if (!character) {
        await interaction.reply({
            content: '❌ Персонаж не найден!',
            ephemeral: true
        });
        return;
    }

    const sheet = formatCharacterSheet(character);

    const embed = new EmbedBuilder()
        .setColor(COLORS.primary)
        .setTitle('📜 Лист персонажа')
        .setDescription(sheet)
        .setFooter({ text: `ID: ${character.id} | Создан: ${new Date(character.createdAt).toLocaleDateString('ru-RU')}` });

    await interaction.reply({ embeds: [embed] });
}

async function handleDelete(interaction) {
    const characterId = interaction.options.getInteger('id');
    const { deleteCharacter } = await import('../utils/characterManager.js');

    const characters = getCharacters(interaction.user.id);
    const character = characters.find(c => c.id === characterId);

    if (!character) {
        await interaction.reply({
            content: '❌ Персонаж не найден!',
            ephemeral: true
        });
        return;
    }

    const success = deleteCharacter(interaction.user.id, characterId);

    if (success) {
        await interaction.reply({
            content: `✅ Персонаж **${character.name}** (ID: ${characterId}) успешно удалён!`,
            ephemeral: true
        });
    } else {
        await interaction.reply({
            content: '❌ Ошибка при удалении персонажа!',
            ephemeral: true
        });
    }
}

async function handleGenerate(interaction) {
    const className = interaction.options.getString('class');
    const race = interaction.options.getString('race');
    const background = interaction.options.getString('background') || '';

    await interaction.deferReply();

    try {
        const concept = await generateCharacterConcept(className, race, background);

        const embed = new EmbedBuilder()
            .setColor(COLORS.magic)
            .setTitle('✨ Концепция персонажа')
            .setDescription(`**${race} ${className}**\n\n${concept}`)
            .setFooter({ text: 'Сгенерировано AI • Вы можете использовать эту концепцию для создания персонажа!' });

        await interaction.editReply({ embeds: [embed] });
    } catch (error) {
        await interaction.editReply({
            content: '❌ Ошибка при генерации персонажа. Проверьте настройки OpenAI API.'
        });
    }
}
