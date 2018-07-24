const Telegraf = require('telegraf')
const session = require('telegraf/session')
const exec = require('child_process').exec;

const bot = new Telegraf(process.env.BOT_TOKEN)

// // Register session middleware
bot.use(session())

bot.start((ctx) =>  {
  ctx.reply('Welcome! /add <ip> to start')
})

bot.command('add', (ctx) =>  {
  const ip =  ctx.message.text.substr(ctx.message.entities[0].length)
  if (ip.length < 6) {
    ctx.reply("invalid ip")
    return
  }
  ctx.session.ip = ip
  ctx.reply("added " + ctx.session.ip + ". Try /status")
  monitor(ctx.session, (text)=>{
    ctx.reply(text)
  })
})

bot.command('status', (ctx) =>  {
  ctx.reply(status(ctx.session.ip, (text)=>{
    ctx.reply(text)
  }))
})

bot.startPolling()

/************ engine ************/

const status = (ip, cb) => {
  const command = 'gincoin-cli masternode status'
  exec(command, (error, stdout, stderr) => {
    cb(ip + ": " + stdout)
  });
}

const monitor = (session, cb) => {  
  cb("Starting to monitor " + session.ip)
  setInterval(()=>{
    const command = 'gincoin-cli masternode status'
    exec(command, (error, stdout, stderr) => {
      if (!session.status) {
        session.status = stdout
        cb("initial status: ")
        cb(session.status)
        return
      }
      if (session.status != stdout) {
        cb("status changed from: ")
        cb(session.status)
        cb("to: ")
        cb(stdout)
        session.status = stdout
        return
      }
      cb(ip + " - checked")
    });    
  }, 2000)  
}