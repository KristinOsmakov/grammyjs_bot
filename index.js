require('dotenv').config();
const { Bot, GrammyError, HttpError, Keyboard, session, webhookCallback } = require('grammy');
const express = require('express');

const bot = new Bot(process.env.BOT_API_KEY);

// Инициализация сессии
bot.use(session({ initial: () => ({ waitingForPrice: false, waitingForCarData: false }) }));

// Команда /start
bot.command('start', async (ctx) => {
    const userName = ctx.from.first_name
    const servicesKeyboard = new Keyboard()
        .text('Заказы обуви с POIZON')
        .resized();
    await ctx.reply(
        `Привет, ${userName}! Я бот ТоварБел.\n\nДавай я помогу тебе рассчитать примерную стоимость товара в Китае в USD.\n
        \nНапиши стоимость товара в юанях (¥):`,
        { reply_markup: servicesKeyboard }
    );
});

// Команда /help
bot.command('help', async (ctx) => {
    await ctx.reply('Этот бот помогает Вам рассчитать стоимость товара из Китая в USD.');
});

// Обработка голосовых сообщений
bot.on(':voice', async (ctx) => {
    await ctx.reply('Супер! Я получил голосовое сообщение, мог бы ты продублировать текстовым сообщением?');
});

// Установка команд бота
bot.api.setMyCommands([
    { command: 'start', description: 'Начать' },
    { command: 'help', description: 'Помощь' },
]);


// Обработка кнопки "Заказы с POIZON"
bot.hears('Заказы обуви с POIZON', async (ctx) => {
    ctx.session.waitingForPrice = true; // Устанавливаем флаг ожидания цены
    await ctx.reply('Укажите стоимость пары обуви в юанях (¥), чтобы я рассчитал стоимость в USD с учетом доставки в Минск.');
});

bot.hears('Заказы товаров с POIZON (все, кроме обуви)', async (ctx) => {
    ctx.session.waitingForOtherPrice = true; // Устанавливаем флаг ожидания цены
    await ctx.reply('Укажите стоимость товара в юанях (¥), чтобы я рассчитал стоимость в USD без учета доставки в Минск.');
});


// Обработка текстовых сообщений
bot.on('message:text', async (ctx) => {
    if (ctx.session.waitingForOtherPrice) {
        // Обработка стоимости обуви
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
            await ctx.reply(`
                \n
                Стоимость Вашего товара (без учета доставки в Минск): ${result.toFixed(2)}USD.\n\nДля оформления заказа можно обратиться к нашему специалисту - @tovarbel_by\n\nОбращаем Ваше внимание, что стоимость товара может измениться на день оплаты.
                `);
        } else {
            await ctx.reply('Пожалуйста, введите стоимость в юанях (¥) (числовое значение)');
        }

        // Сбрасываем флаг ожидания
        ctx.session.waitingForOtherPrice = false;
    } else if (ctx.session.waitingForPrice) {
        // Обработка стоимости обуви
        const price = parseFloat(ctx.message.text);
        if (!isNaN(price)) {
            let result = price / 7;
            if (result < 100) {
                result = result + 10 + 15;
            } else if (result > 100 && result < 1000) {
                result = result * 1.1 + 15;
            } else if (result >= 1000) {
                result = result * 1.05 + 15;
            }
            await ctx.reply(`
                \n
                Стоимость Вашего товара c учетом доставки в Минск: ${result.toFixed(2)}USD.\n\nДля оформления заказа можно обратиться к нашему специалисту - @tovarbel_by\n\nОбращаем Ваше внимание, что стоимость товара может измениться на день оплаты.
                `);
        } else {
            await ctx.reply('Пожалуйста, введите стоимость в юанях (¥) (числовое значение)');
        }
        // ctx.session.waitingForPrice = false; // Сбрасываем флаг
    }
});

// Обработка ошибок
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
app.use(express.json());
app.use(webhookCallback(bot, 'express'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Бот запущен на порту ${PORT}`);
});