import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { COLORS } from '../config.js';

export const data = new SlashCommandBuilder()
    .setName('help')
    .setDescription('Показать список всех команд бота');

export async function execute(interaction) {
    const embed = new EmbedBuilder()
        .setColor(COLORS.primary)
        .setTitle('🎲 D&D AI Bot - Справка')
        .setDescription('Полный список доступных команд для игры в Dungeons & Dragons 5e')
        .addFields(
            {
                name: '🎲 Кубики',
                value: '`/roll [dice]` - Бросить кубики (1d20, 2d6+3, d20 advantage)\n`/combat initiative` - Бросок инициативы',
                inline: false
            },
            {
                name: '👤 Персонажи',
                value: '`/character create` - Создать персонажа\n`/character generate` - AI генерация концепции\n`/character list` - Список ваших персонажей\n`/character sheet` - Показать лист персонажа',
                inline: false
            },
            {
                name: '✨ AI Генерация',
                value: '`/generate npc` - Сгенерировать NPC\n`/generate quest` - Сгенерировать квест\n`/generate location` - Сгенерировать локацию\n`/generate dm` - Помощник Мастера',
                inline: false
            },
            {
                name: '📚 Поиск',
                value: '`/lookup spell` - Найти заклинание\n`/lookup item` - Найти предмет\n`/lookup rule` - Спросить о правилах (AI)',
                inline: false
            },
            {
                name: '⚔️ Бой',
                value: '`/combat actions` - Действия в бою\n`/combat conditions` - Состояния персонажа',
                inline: false
            },
            {
                name: '🎲 Игровые сессии',
                value: '`/session create` - Создать сессию\n`/session list` - Все сессии\n`/session join` - Присоединиться\n`/session info` - Информация',
                inline: false
            },
            {
                name: '❓ Дополнительно',
                value: '`/help` - Эта справка',
                inline: false
            }
        )
        .setFooter({ text: 'D&D 5e AI Bot • Создано для помощи в игре' })
        .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
}
