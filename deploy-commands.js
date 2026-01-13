import { REST, Routes } from 'discord.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readdirSync } from 'fs';

dotenv.config();

const commands = [];
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const commandsPath = join(__dirname, 'commands');

// Load all command files
const commandFiles = readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = await import(`./commands/${file}`);
    if ('data' in command) {
        commands.push(command.data.toJSON());
        console.log(`✅ Загружена команда: ${command.data.name}`);
    }
}

// Construct and prepare an instance of the REST module
const rest = new REST().setToken(process.env.DISCORD_TOKEN);

// Deploy commands
(async () => {
    try {
        console.log(`🔄 Начинается регистрация ${commands.length} slash команд...`);

        // Register commands to specific guild (faster for development)
        if (process.env.GUILD_ID) {
            const data = await rest.put(
                Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
                { body: commands },
            );
            console.log(`✅ Успешно зарегистрировано ${data.length} команд на сервере!`);
        } else {
            // Register commands globally (takes up to 1 hour to propagate)
            const data = await rest.put(
                Routes.applicationCommands(process.env.CLIENT_ID),
                { body: commands },
            );
            console.log(`✅ Успешно зарегистрировано ${data.length} глобальных команд!`);
        }
    } catch (error) {
        console.error('❌ Ошибка регистрации команд:', error);
    }
})();
