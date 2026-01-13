/**
 * Split long messages into chunks that fit Discord's 2000 character limit
 * Tries to split at natural breakpoints (paragraphs, sentences)
 */
export function splitMessage(text, maxLength = 2000) {
    if (text.length <= maxLength) {
        return [text];
    }

    const chunks = [];
    let remaining = text;

    while (remaining.length > 0) {
        if (remaining.length <= maxLength) {
            chunks.push(remaining);
            break;
        }

        // Try to find a good split point
        let splitIndex = maxLength;

        // First, try to split at paragraph break (double newline)
        const paragraphBreak = remaining.lastIndexOf('\n\n', maxLength);
        if (paragraphBreak > maxLength * 0.5) {
            splitIndex = paragraphBreak + 2;
        } else {
            // Try to split at single newline
            const lineBreak = remaining.lastIndexOf('\n', maxLength);
            if (lineBreak > maxLength * 0.5) {
                splitIndex = lineBreak + 1;
            } else {
                // Try to split at sentence end
                const sentenceEnd = Math.max(
                    remaining.lastIndexOf('. ', maxLength),
                    remaining.lastIndexOf('! ', maxLength),
                    remaining.lastIndexOf('? ', maxLength)
                );
                if (sentenceEnd > maxLength * 0.5) {
                    splitIndex = sentenceEnd + 2;
                } else {
                    // Last resort: split at last space
                    const lastSpace = remaining.lastIndexOf(' ', maxLength);
                    if (lastSpace > maxLength * 0.5) {
                        splitIndex = lastSpace + 1;
                    }
                }
            }
        }

        // Extract chunk and update remaining
        const chunk = remaining.substring(0, splitIndex).trim();
        chunks.push(chunk);
        remaining = remaining.substring(splitIndex).trim();
    }

    return chunks;
}

/**
 * Send a potentially long message by splitting it into multiple messages if needed
 * @param {ChatInputCommandInteraction} interaction - Discord interaction
 * @param {string} content - Message to send
 * @param {boolean} isInitialReply - Whether this is the first reply (use editReply vs followUp)
 */
export async function sendLongMessage(interaction, content, isInitialReply = true) {
    const chunks = splitMessage(content);

    console.log(`📨 Разбиваю сообщение на ${chunks.length} частей`);

    // Send first chunk
    if (isInitialReply) {
        await interaction.editReply(chunks[0]);
    } else {
        await interaction.reply(chunks[0]);
    }

    // Send remaining chunks directly to the channel
    if (chunks.length > 1) {
        const channel = interaction.channel;

        for (let i = 1; i < chunks.length; i++) {
            // Small delay to ensure messages arrive in order
            await new Promise(resolve => setTimeout(resolve, 500));
            console.log(`📤 Отправляю часть ${i + 1}/${chunks.length}`);
            await channel.send(chunks[i]);
        }
    }

    console.log(`✅ Отправлено ${chunks.length} сообщений`);
    return chunks.length;
}
