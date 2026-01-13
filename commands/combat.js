import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { rollInitiative } from '../utils/diceRoller.js';
import { COLORS } from '../config.js';

export const data = new SlashCommandBuilder()
    .setName('combat')
    .setDescription('Помощь в бою D&D')
    .addSubcommand(subcommand =>
        subcommand
            .setName('initiative')
            .setDescription('Бросить инициативу')
            .addIntegerOption(option =>
                option.setName('modifier')
                    .setDescription('Модификатор инициативы (обычно бонус Ловкости)')
                    .setRequired(false)))
    .addSubcommand(subcommand =>
        subcommand
            .setName('actions')
            .setDescription('Показать доступные действия в бою'))
    .addSubcommand(subcommand =>
        subcommand
            .setName('conditions')
            .setDescription('Показать состояния персонажа'));

export async function execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    switch (subcommand) {
        case 'initiative':
            await handleInitiative(interaction);
            break;
        case 'actions':
            await handleActions(interaction);
            break;
        case 'conditions':
            await handleConditions(interaction);
            break;
    }
}

async function handleInitiative(interaction) {
    const modifier = interaction.options.getInteger('modifier') || 0;
    const result = rollInitiative(modifier);

    const embed = new EmbedBuilder()
        .setColor(COLORS.warning)
        .setTitle('⚔️ Бросок инициативы')
        .setDescription(`**${interaction.user.username}** бросает инициативу!`)
        .addFields(
            { name: '🎲 Бросок', value: `${result.roll}`, inline: true },
            { name: '➕ Модификатор', value: `${modifier >= 0 ? '+' : ''}${modifier}`, inline: true },
            { name: '🎯 Итого', value: `**${result.total}**`, inline: true }
        );

    await interaction.reply({ embeds: [embed] });
}

async function handleActions(interaction) {
    const embed = new EmbedBuilder()
        .setColor(COLORS.info)
        .setTitle('⚔️ Действия в бою D&D 5e')
        .setDescription('Вот что вы можете сделать в свой ход:')
        .addFields(
            {
                name: '🗡️ Действие (Action)',
                value: '• Атака\n• Сотворение заклинания\n• Рывок\n• Отход\n• Уклонение\n• Помощь\n• Использование предмета\n• Поиск\n• Готовность',
                inline: true
            },
            {
                name: '🏃 Бонусное действие',
                value: 'Некоторые способности и заклинания используют бонусное действие. Проверьте описание вашего класса.',
                inline: true
            },
            {
                name: '🚶 Движение',
                value: 'Вы можете переместиться на расстояние, равное вашей скорости (обычно 30 футов).',
                inline: true
            },
            {
                name: '⚡ Реакция',
                value: '• Провоцированная атака\n• Заклинание Щит\n• Другие способности с меткой "реакция"',
                inline: true
            },
            {
                name: '💬 Свободное действие',
                value: 'Короткая фраза, жест, взаимодействие с одним предметом',
                inline: true
            }
        )
        .setFooter({ text: 'D&D 5e Player\'s Handbook' });

    await interaction.reply({ embeds: [embed], ephemeral: true });
}

async function handleConditions(interaction) {
    const embed = new EmbedBuilder()
        .setColor(COLORS.warning)
        .setTitle('💫 Состояния персонажа D&D 5e')
        .addFields(
            { name: '😵 Ослеплён', value: 'Провал проверок зрения. Атаки с помехой. Атаки по вам с преимуществом.', inline: true },
            { name: '🤕 Очарован', value: 'Не можете атаковать очаровавшего. Они имеют преимущество в социальных проверках.', inline: true },
            { name: '😱 Испуган', value: 'Помеха на проверки способностей и атаки, пока источник страха виден.', inline: true },
            { name: '🔇 Оглушён', value: 'Провал проверок слуха. Помеха на Инициативу.', inline: true },
            { name: '😴 Недееспособен', value: 'Не можете совершать действия или реакции.', inline: true },
            { name: '🗿 Окаменение', value: 'Вес x10, не стареете, недееспособны, сопротивление всему урону.', inline: true },
            { name: '🦎 Отравлен', value: 'Помеха на броски атак и проверки характеристик.', inline: true },
            { name: '😫 Парализован', value: 'Недееспособны, не можете двигаться. Автопровал СИЛ/ЛОВ. Атаки с преимуществом. Крит в упор.', inline: true },
            { name: '🎯 Сбит с ног', value: 'Только ползком. Помеха на атаки. Атаки с преимуществом в упор, с помехой издалека.', inline: true },
            { name: '🔒 Схвачен', value: 'Скорость 0. Заканчивается при недееспособности схватившего.', inline: true },
            { name: '🛡️ Обездвижен', value: 'Скорость 0. Провал ЛОВ. Атаки с преимуществом.', inline: true },
            { name: '👻 Невидимость', value: 'Невозможно увидеть. Проверки Скрытности с преимуществом. Атаки с преимуществом. Атаки по вам с помехой.', inline: true },
            { name: '🩸 Истощение', value: '1-Помеха на проверки\n2-Скорость /2\n3-Помеха на атаки/спасы\n4-HP max /2\n5-Скорость 0\n6-Смерть', inline: false }
        )
        .setFooter({ text: 'D&D 5e Player\'s Handbook - Appendix A' });

    await interaction.reply({ embeds: [embed], ephemeral: true });
}
