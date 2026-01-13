// Dice Roller Utility for D&D
// Supports standard dice notation: 1d20, 2d6+3, 3d8-2, etc.

export function rollDice(notation) {
    // Clean notation
    notation = notation.toLowerCase().replace(/\s/g, '');

    // Parse advantage/disadvantage
    let advantage = notation.includes('advantage') || notation.includes('adv');
    let disadvantage = notation.includes('disadvantage') || notation.includes('dis');

    // Remove advantage/disadvantage from notation
    notation = notation.replace(/(dis)?advantage/g, '').replace(/adv|dis/g, '');

    // Parse dice notation (XdY+Z or XdY-Z)
    const regex = /(\d*)d(\d+)([+-]\d+)?/;
    const match = notation.match(regex);

    if (!match) {
        throw new Error('Неверный формат! Используйте формат: 1d20, 2d6+3, d20 advantage');
    }

    const count = parseInt(match[1] || '1');
    const sides = parseInt(match[2]);
    const modifier = parseInt(match[3] || '0');

    // Roll dice
    const rolls = [];
    for (let i = 0; i < count; i++) {
        rolls.push(Math.floor(Math.random() * sides) + 1);
    }

    // Handle advantage/disadvantage for d20
    if ((advantage || disadvantage) && sides === 20) {
        const secondRoll = Math.floor(Math.random() * 20) + 1;

        if (advantage) {
            const maxRoll = Math.max(rolls[0], secondRoll);
            return {
                rolls: [rolls[0], secondRoll],
                chosen: maxRoll,
                modifier,
                total: maxRoll + modifier,
                notation,
                type: 'advantage'
            };
        } else {
            const minRoll = Math.min(rolls[0], secondRoll);
            return {
                rolls: [rolls[0], secondRoll],
                chosen: minRoll,
                modifier,
                total: minRoll + modifier,
                notation,
                type: 'disadvantage'
            };
        }
    }

    // Calculate total
    const sum = rolls.reduce((a, b) => a + b, 0);
    const total = sum + modifier;

    return {
        rolls,
        modifier,
        total,
        notation,
        type: 'normal',
        breakdown: `${rolls.join(' + ')}${modifier !== 0 ? ` ${modifier >= 0 ? '+' : ''} ${modifier}` : ''} = ${total}`
    };
}

export function rollAbilityScores() {
    const scores = [];

    for (let i = 0; i < 6; i++) {
        // Roll 4d6, drop lowest
        const rolls = [];
        for (let j = 0; j < 4; j++) {
            rolls.push(Math.floor(Math.random() * 6) + 1);
        }

        rolls.sort((a, b) => a - b);
        const dropped = rolls.shift(); // Remove lowest
        const total = rolls.reduce((a, b) => a + b, 0);

        scores.push({
            rolls: [...rolls, dropped],
            kept: rolls,
            dropped,
            total
        });
    }

    return scores;
}

export function rollInitiative(modifier = 0) {
    const roll = Math.floor(Math.random() * 20) + 1;
    return {
        roll,
        modifier,
        total: roll + modifier
    };
}

// Dice emoji mapping
export function getDiceEmoji(value) {
    const diceEmoji = {
        1: '⚀',
        2: '⚁',
        3: '⚂',
        4: '⚃',
        5: '⚄',
        6: '⚅'
    };

    return diceEmoji[value] || '🎲';
}
