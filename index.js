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
        .text('Заказы с POIZON')
        .resized();
    await ctx.reply(
        `Привет, ${userName}! Я бот ТоварБел. Давай я помогу тебе рассчитать примерную стоимость товара в Китае в USD. Напиши стоимость товара в юанях (¥).`,
        { reply_markup: servicesKeyboard }
    );
});

// Команда /help
bot.command('help', async (ctx) => {
    await ctx.reply('Этот бот помогает Вам рассчитать стоимость товара из Китая в USD. ');
});

// Команда /services
// bot.command('services', async (ctx) => {
//     const moodKeyboard2 = new Keyboard()
//         // .text('Автозапчасти')
//         .row()
//         .text('Заказы с POIZON')
//         .resized();
//     await ctx.reply('Выберите категорию:', { reply_markup: moodKeyboard2 });
// });

// Обработка голосовых сообщений
bot.on(':voice', async (ctx) => {
    await ctx.reply('Супер! Я получил голосовое сообщение, мог бы ты продублировать текстовым сообщением?');
});

// Установка команд бота
bot.api.setMyCommands([
    { command: 'start', description: 'Начать' },
    { command: 'help', description: 'Помощь' },
    // { command: 'services', description: 'МЕНЮ УСЛУГ' },
]);


// Обработка кнопки "Автозапчасти"
bot.hears('Автозапчасти', async (ctx) => {
    await ctx.reply(
        'Заполните данные об автомобиле:\n' + 
        '(Все данные вводить через точку с запятой (";"). \n' +
        'В примечании стоит указать, в какой стране — Китае или ОАЭ — предпочтительнее искать запчасти).\n' +
        '\n' +
        'Марка\n' + 
        'Модель\n' + 
        'Год (от 2016 г.в.)\n' + 
        'VIN - номер\n' + 
        'Запасная часть\n' + 
        'Примечание\n' +
        '\n' + 
        'Пример ввода:  Mazda; CX-5; 2018; ABC123456789; Крышка багажника, капот, крыло переднее правое; Нужны оригинальные запчасти. \n'
    );
    ctx.session.waitingForCarData = true; // Устанавливаем флаг ожидания данных
});

// Обработка кнопки "Заказы с POIZON"
bot.hears('Заказы с POIZON', async (ctx) => {
    ctx.session.waitingForPrice = true; // Устанавливаем флаг ожидания цены
    await ctx.reply('Укажите стоимость товара в юанях (¥), чтобы я рассчитал стоимость выкупа в USD.');
});

bot.hears('Автозапчасти Китай', async (ctx) => {
    await ctx.reply(
        'Заполните данные об автомобиле:\n' + 
        '(Все данные вводить через точку с запятой (";"), пункты со "*" обязательны для заполнения) \n' +
        '\n' +
        'Марка*\n' + 
        'Модель*\n' + 
        'Год (от 2016 г.в.)*\n' + 
        'VIN - номер*\n' + 
        'Запасная часть*\n' + 
        'Примечание\n' +
        '\n' + 
        'Пример ввода:  Mazda; CX-5; 2018; ABC123456789; Крышка багажника, капот, крыло переднее правое; Нужны оригинальные запчасти. \n'
    );
    ctx.session.waitingForCarData = true; // Устанавливаем флаг ожидания данных
 });

// Обработка текстовых сообщений
bot.on('message:text', async (ctx) => {
    if (ctx.session.waitingForCarData) {
        // Обработка данных об автомобиле
        const userInput = ctx.message.text;

        // Разбиваем введенные данные по точке с запятой
        const dataParts = userInput.split(';').map(part => part.trim());

        // Проверяем, что введены все 6 частей данных
        if (dataParts.length === 6) {
            const [brand, model, year, vin, part, note] = dataParts;

            // Проверяем, что год является числом
            const yearNumber = parseInt(year, 10);
            if (isNaN(yearNumber)) {
                await ctx.reply('Год выпуска должен быть числом. Пожалуйста, исправьте данные.');
                return;
            }

            // Проверяем, что год >= 2016
            if (yearNumber < 2016) {
                await ctx.reply('К сожалению, мы не подбираем запчасти для автомобилей старше 2016 года выпуска.');
                return;
            }
            if (vin.length < 17) {
                await ctx.reply('VIN - номер должен содержать 17 символов. Пожалуйста, исправьте данные.');
                return;
            }

            // Форматируем данные для вывода
            const formattedData = `
Марка: ${brand}
Модель: ${model}
Год (от 2016 г.в.): ${year}
VIN - номер: ${vin}
Запасная часть: ${part}
Примечание: ${note}
            `;

            // Отправляем отформатированные данные
            await ctx.reply(`Данные приняты:\n${formattedData}`);
        } else {
            // Если данные введены некорректно
            await ctx.reply('Данные введены некорректно. Пожалуйста, используйте формат, как в примере.');
        }

        // Сбрасываем флаг ожидания
        ctx.session.waitingForCarData = false;
    } else if (ctx.session.waitingForPrice) {
        // Обработка стоимости товара
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
                Стоимость Вашего товара: ${result.toFixed(2)}USD (без учета доставки).
                \n
                \n
                Для оформления заказа можно обратиться к нашему специалисту - @tovarbel_by
                \n
                \n
                \n
                Обращаем Ваше внимание, что стоимость товара может измениться на день оплаты.
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