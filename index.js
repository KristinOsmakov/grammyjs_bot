require('dotenv').config()
const { Bot, GrammyError, HttpError, Keyboard, session } = require('grammy')

const bot = new Bot(process.env.BOT_API_KEY)
//отслеживание состояния пользователя - когда пользователь выбирает "Заказы с POIZON", состояние waitingForPrice устанавливается в true
bot.use(session({ initial: () => ({ waitingForPrice: false }) }));

const sendStartCommand = async () => {
    try {
        // Получаем информацию о боте
        const botInfo = await bot.api.getMe();
        const botUsername = botInfo.username;

        // Отправляем команду /start от имени бота
        await bot.api.sendMessage(botInfo.id, '/start');
        console.log('Команда /start отправлена автоматически.');
    } catch (error) {
        console.error('Ошибка при отправке команды /start:', error);
    }
};

// Вызываем функцию при запуске бота
sendStartCommand();

//сообщения бота при запуске команд из меню
bot.command('start', async (ctx) => {
    await ctx.reply(
        'Привет! Я бот ТоварБел. Давай я помогу тебе рассчитать примерную стоимость товара в Китае в USD. Напиши стоимость товара в юанях (¥). Если тебя все устроит, кидай ссылку на товар мне и я закажу тебе его.')
    })

bot.command('help', async (ctx) => {
    await ctx.reply(
        'А помощи не будет, фраерок...')
        })
    
bot.command('services', async (ctx) => {
    const moodKeyboard2 = new Keyboard().text('Автозапчасти Дубай').text('Автозапчасти Китай').row().text('Заказы с POIZON').resized();
        await ctx.reply('Выберите категорию:', { reply_markup: moodKeyboard2 });
    })
    
//ответ бота в случае, когда записали голосовое сообщение
bot.on(':voice', async (ctx) => {
        await ctx.reply('Супер! Я получил голосовое сообщение, мог бы ты продублировать текстовым сообщением?')
    })

//массив значений кнопок
bot.api.setMyCommands([
        { command: 'start', description: 'Начать' },
        { command: 'help', description: 'Помощь' },
        { command: 'services', description: 'МЕНЮ УСЛУГ' },
    ])

    
//ответы бота при нажатии на кнопки
    bot.hears('Автозапчасти Дубай', async (ctx) => {
        await ctx.reply('Вот контакт нашего менеджера по приобретению и доставке автозапчастей из Дубая.')
    })
    bot.hears('Автозапчасти Китай', async (ctx) => {
        await ctx.reply('Вот контакт нашего менеджера по приобретению и доставке автозапчастей из Китая.')
    })
    bot.hears('Заказы с POIZON', async (ctx) => {
        ctx.session.waitingForPrice = true;
        await ctx.reply('Укажите стоимость товара в юанях (¥), чтобы я рассчитал примерную стоимость в USD.')
    })

//получение сообщения со стоимостью товара
    bot.on('message:text', async (ctx) => {
        if(ctx.session.waitingForPrice) {
            const price = parseFloat(ctx.message.text)

            if(!isNaN(price)) {
                const result = price / 6.7
                await ctx.reply(`Примерная стоимость товара в USD: ${result.toFixed(2)}`)
            }
            else {await ctx.reply('Пожалуйста, введите стоимость в юанях (¥) (числовое значение)')}
            ctx.session.waitingForPrice = false
        }
    })


    //проверка ошибок
    bot.catch((err) => {
        const ctx = err.ctx
        console.error(`Error while handling update ${ctx.update.update_id}:`)
        const e = err.error

        if(e instanceof GrammyError) {
            console.error("Error in request:", e.description)
    } else if(e instanceof HttpError) {
        console.error("Could not contact Telegram:", e)
    } else {
        console.error("Unknown error:", e)
    }
})

    bot.start()
