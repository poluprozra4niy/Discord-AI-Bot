import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { rollDice, getDiceEmoji } from '../utils/diceRoller.js';
import { COLORS } from '../config.js';

export const data = new SlashCommandBuilder()
    .setName('roll')
    .setDescription('Бросить кубики D&D')
    .addStringOption(option =>
        option.setName('dice')
            .setDescription('Формат: 1d20, 2d6+3, d20 advantage, 3d8-2')
            .setRequired(true))
    .addStringOption(option =>
        option.setName('reason')
            .setDescription('Причина броска (например: Атака мечом, Проверка Скрытности)')
            .setRequired(false));

export async function execute(interaction) {
    const diceNotation = interaction.options.getString('dice');
    const reason = interaction.options.getString('reason');

    try {
        const result = rollDice(diceNotation);

        // Create embed
        const embed = new EmbedBuilder()
            .setColor(result.total >= 20 ? COLORS.success : COLORS.primary)
            .setTitle(`🎲 ${reason || 'Бросок кубиков'}`)
            .setDescription(`**${interaction.user.username}** бросает \`${diceNotation}\``);

        // Add result based on roll type
        if (result.type === 'advantage') {
            embed.addFields(
                {
                    name: '🎲 Броски (Преимущество)',
                    value: `${result.rolls[0]} и ${result.rolls[1]}`,
                    inline: true
                },
                {
                    name: '✨ Выбран',
                    value: `**${result.chosen}**`,
                    inline: true
                },
                {
                    name: '🎯 Итого',
                    value: `**${result.total}**${result.modifier !== 0 ? ` (${result.chosen}${result.modifier >= 0 ? '+' : ''}${result.modifier})` : ''}`,
                    inline: true
                }
            );
        } else if (result.type === 'disadvantage') {
            embed.addFields(
                {
                    name: '🎲 Броски (Помеха)',
                    value: `${result.rolls[0]} и ${result.rolls[1]}`,
                    inline: true
                },
                {
                    name: '💀 Выбран',
                    value: `**${result.chosen}**`,
                    inline: true
                },
                {
                    name: '🎯 Итого',
                    value: `**${result.total}**${result.modifier !== 0 ? ` (${result.chosen}${result.modifier >= 0 ? '+' : ''}${result.modifier})` : ''}`,
                    inline: true
                }
            );
        } else {
            // Normal roll
            const diceDisplay = result.rolls.map(r => {
                if (r <= 6) return getDiceEmoji(r);
                return `\`${r}\``;
            }).join(' ');

            embed.addFields(
                {
                    name: '🎲 Результат',
                    value: diceDisplay,
                    inline: false
                },
                {
                    name: '🎯 Итого',
                    value: `**${result.total}**\n\`${result.breakdown}\``,
                    inline: false
                }
            );
        }

        // Special messages for critical success/failure
        if (result.total === 20 || (result.rolls.length === 1 && result.rolls[0] === 20)) {
            embed.setFooter({ text: '🌟 КРИТИЧЕСКИЙ УСПЕХ! 🌟' });
        } else if (result.total === 1 || (result.rolls.length === 1 && result.rolls[0] === 1)) {
            embed.setFooter({ text: '💀 КРИТИЧЕСКИЙ ПРОВАЛ! 💀' });
        }

        await interaction.reply({ embeds: [embed] });
    } catch (error) {
        await interaction.reply({
            content: `❌ ${error.message}`,
            ephemeral: true
        });
    }
}
