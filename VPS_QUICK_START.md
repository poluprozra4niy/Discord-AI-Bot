# 🚀 Быстрый старт для VPS

## Шаг 1: Подключение к VPS

```bash
ssh root@ВАШ_IP_АДРЕС
# или
ssh username@ВАШ_IP_АДРЕС
```

## Шаг 2: Одной командой установить все

```bash
# Скопируй и вставь эту команду целиком:
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash - && \
sudo apt install -y nodejs git && \
sudo npm install -g pm2 && \
cd ~ && \
git clone https://github.com/ТВОЙ_USERNAME/discord-dnd-bot.git && \
cd discord-dnd-bot && \
npm install
```

## Шаг 3: Настрой .env файл

```bash
cp .env.example .env
nano .env
```

Вставь свои данные:
- `DISCORD_TOKEN` - твой токен бота
- `CLIENT_ID` - Application ID
- `GUILD_ID` - ID сервера Discord
- `OPENAI_API_KEY` - ключ OpenAI

**Сохрани:** `Ctrl+O`, `Enter`, `Ctrl+X`

## Шаг 4: Запусти бота

```bash
# Зарегистрируй команды
npm run deploy

# Запусти через PM2
pm2 start ecosystem.config.cjs

# Настрой автозапуск
pm2 save
pm2 startup
# Выполни команду, которую покажет PM2
```

## Шаг 5: Готово! ✅

Проверь статус:
```bash
pm2 status
pm2 logs dnd-bot
```

---

## Полезные команды

```bash
# Просмотр логов
pm2 logs dnd-bot

# Перезапуск
pm2 restart dnd-bot

# Обновление (после изменений в коде)
chmod +x update.sh
./update.sh

# Статус
pm2 status

# Мониторинг
pm2 monit
```

## Обновление бота

После изменений в коде на GitHub:

```bash
./update.sh
```

Или вручную:
```bash
cd ~/discord-dnd-bot
git pull origin main
npm install
npm run deploy
pm2 restart dnd-bot
```
