require('dotenv').config();
const { Bot, GrammyError, HttpError, Keyboard, session, webhookCallback } = require('grammy');
const express = require('express'); // Добавляем express

const bot = new Bot(process.env.BOT_API_KEY);

// //Функция для генерации таблицы 
// function generateTable(inputs) {
//     return `
//   <b>Таблица:</b>
//   <table>
//     <tr>
//       <td>Марка</td>
//       <td>${inputs[0]}</td>
//     </tr>
//     <tr>
//       <td>Модель</td>
//       <td>${inputs[1]}</td>
//     </tr>
//     <tr>
//       <td>Год выпуска</td>
//       <td>${inputs[2]}</td>
//     </tr>
//     <tr>
//       <td>VIN - номер</td>
//       <td>${inputs[3]}</td>
//     </tr>
//     <tr>
//       <td>Необходимая запчасть</td>
//       <td>${inputs[4]}</td>
//     </tr>
//     <tr>
//       <td>Фотография запчасти</td>
//       <td>${inputs[5]}</td>
//     </tr>
//     <tr>
//       <td>Примечание</td>
//       <td>${inputs[6]}</td>
//     </tr>
//   </table>
//     `;
//   }

//   // Генерируем таблицу
//   const table = generateTable(inputs);


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
    await ctx.reply('Заполните таблицу и мы с Вами свяжемся.');
    
    // Запрашиваем данные у пользователя
    await ctx.reply('Введите марку автомобиля:');
    const brand = await ctx.waitFor('message:text');
    
    await ctx.reply('Введите модель автомобиля:');
    const model = await ctx.waitFor('message:text');
    
    await ctx.reply('Введите год выпуска:');
    const year = await ctx.waitFor('message:text');
    
    await ctx.reply('Введите VIN-номер:');
    const vin = await ctx.waitFor('message:text');
    
    await ctx.reply('Введите необходимую запчасть:');
    const part = await ctx.waitFor('message:text');
    
    await ctx.reply('Отправьте фотографию запчасти:');
    const photo = await ctx.waitFor(':photo');
    
    await ctx.reply('Введите примечание:');
    const note = await ctx.waitFor('message:text');
    
    // Собираем данные в массив
    const inputs = [
      brand.message.text,
      model.message.text,
      year.message.text,
      vin.message.text,
      part.message.text,
      photo.message.photo[0].file_id, // Сохраняем ID фотографии
      note.message.text
    ];
    
    // Генерируем таблицу
    const table = generateHtmlTable(inputs);
    
    // Отправляем таблицу
    await ctx.reply(table, { parse_mode: "HTML" });
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