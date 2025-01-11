require('dotenv').config();
const { Bot, GrammyError, HttpError, Keyboard, session, webhookCallback } = require('grammy');
const express = require('express'); // Добавляем express

const bot = new Bot(process.env.BOT_API_KEY);

// Отслеживание состояния пользователя
bot.use(session({ initial: () => ({ waitingForPrice: false }) }));

// Сообщения бота при запуске команд из меню
bot.command('start', async (ctx) => {
    await ctx.reply(
        'Привет! Я бот ТоварБел. Давай я помогу тебе рассчитать примерную стоимость товара в Китае в USD. Напиши стоимость товара в юанях (¥). Если тебя все устроит, кидай ссылку на товар мне и я закажу тебе его.'
    );
});

bot.command('help', async (ctx) => {
    await ctx.reply('А помощи не будет, фраерок...');
});

bot.command('services', async (ctx) => {
    const moodKeyboard2 = new Keyboard()
        .text('Автозапчасти Дубай')
        .text('Автозапчасти Китай')
        .row()
        .text('Заказы с POIZON')
        .resized();
    await ctx.reply('Выберите категорию:', { reply_markup: moodKeyboard2 });
});

// Ответ бота в случае, когда записали голосовое сообщение
bot.on(':voice', async (ctx) => {
    await ctx.reply('Супер! Я получил голосовое сообщение, мог бы ты продублировать текстовым сообщением?');
});

// Массив значений кнопок
bot.api.setMyCommands([
    { command: 'start', description: 'Начать' },
    { command: 'help', description: 'Помощь' },
    { command: 'services', description: 'МЕНЮ УСЛУГ' },
]);

// Ответы бота при нажатии на кнопки
bot.hears('Автозапчасти Дубай', async (ctx) => {
    await ctx.reply('Вот контакт нашего менеджера по приобретению и доставке автозапчастей из Дубая.');
});

bot.hears('Автозапчасти Китай', async (ctx) => {
    await ctx.reply(
        'Заполните данные об Автомобиле через точку с запятой (";"):\n' + 
        'Марка:\n' + 
        'Модель:\n' + 
        'Год (от 2016 г.в.):\n' + 
        'VIN - номер:\n' + 
        'Запасная часть:\n' + 
        'Примечание:\n' + 
        'Пример:  Mazda; CX-5; 2018; ABC123456789; Крашка багажника, капот, крыло переднее правое; Нужны оригинальные запчастиn/');
});

bot.hears('Заказы с POIZON', async (ctx) => {
    ctx.session.waitingForPrice = true;
    await ctx.reply('Укажите стоимость товара в юанях (¥), чтобы я рассчитал примерную стоимость в USD.');
});

// Получение сообщения со стоимостью товара
bot.on('message:text', async (ctx) => {
    if (ctx.session.waitingForPrice) {
        const price = parseFloat(ctx.message.text);

        if (!isNaN(price)) {
            let result = price / 7;
            if (result < 100) {
                result = result + 10;
            } else if (result > 100 && result < 1000) {
                result = result * 1.1;
            } else if (result >= 1000) {
                result = result * 1.05;
            }
            await ctx.reply(`Ориентировочная стоимость товара c учетом доставки в USD: ${result.toFixed(2)}`);
        } else {
            await ctx.reply('Пожалуйста, введите стоимость в юанях (¥) (числовое значение)');
        }

        // // Сбрасываем состояние ожидания в любом случае
        // ctx.session.waitingForPrice = false;
    }
});

// Проверка ошибок
bot.catch((err) => {
    const ctx = err.ctx;
    console.error(`Error while handling update ${ctx.update.update_id}:`);
    const e = err.error;

    if (e instanceof GrammyError) {
        console.error('Error in request:', e.description);
    } else if (e instanceof HttpError) {
        console.error('Could not contact Telegram:', e);
    } else {
        console.error('Unknown error:', e);
    }
});

// Настройка вебхуков
const app = express();
app.use(express.json()); // Для обработки JSON-запросов
app.use(webhookCallback(bot, 'express')); // Интеграция бота с express

const PORT = process.env.PORT || 3000; // Используем порт, предоставляемый Render.com
app.listen(PORT, () => {
    console.log(`Бот запущен на порту ${PORT}`);
});