require('dotenv').config()
const { Bot, GrammyError, HttpError, Keyboard } = require('grammy')

const bot = new Bot(process.env.BOT_API_KEY)

bot.command('start', async (ctx) => {
    await ctx.reply(
        'Привет! Я бот ТоварБел. Давай я помогу тебе рассчитать примерную стоимость товара в Китае в USD. Напиши стоимость товара в юанях (¥). Если тебя все устроит, кидай ссылку на товар мне и я закажу тебе его.')
    })
    
    bot.on(':voice', async (ctx) => {
        await ctx.reply('Супер! Я получил голосовое сообщение, мог бы ты написать текстом?')
    })
    // bot.on('message', async (ctx) => {
    //     await ctx.reply('Надо подумать...')
    // })
    

    bot.api.setMyCommands([
        { command: 'start', description: 'Начать' },
        { command: 'help', description: 'Помощь' },
    ])

    bot.command('mood', async (ctx) => {
        // const moodKeyboard = new Keyboard().text('Хорошо').row().text('Норм').text('Плохо').resized()
        const moodLabels = ['Хорошо', 'Норм', 'Плохо']
        const rows = moodLabels.map((label) => {return [Keyboard.text(label)]
        })
        const moodKeyboard2 = Keyboard.from(rows).resized()
        await ctx.reply('Как дела?', { reply_markup: moodKeyboard2 })
    })

    bot.hears('Хорошо', async (ctx) => {
        await ctx.reply('Класс!')
    })

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
