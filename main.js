var cluster = require('cluster');
if (cluster.isMaster) {
  cluster.fork();

  cluster.on('exit', function(worker, code, signal) {
    cluster.fork();
  });
}

if (cluster.isWorker) {

/// BEGIN

const Telegraf = require('telegraf')
const LocalSession = require('telegraf-session-local')
 
const exec = require('child_process').exec;

const bot = new Telegraf(process.env.BOT_TOKEN)

bot.catch((err) => {
  console.log('Ooops', err)
})

// // Register session middleware
bot.use((new LocalSession({ database: 'example_db.json' })).middleware())

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
    ctx.reply(text || "-")
  })
})

bot.command('status', (ctx) =>  {
  ctx.reply(status(ctx.session, (text)=>{
    ctx.reply(text || "-")
  }))
})

bot.command('position', (ctx) =>  {
  ctx.reply(position(ctx.session, (text)=>{
    ctx.reply(text || "-")
  }))
})

bot.startPolling()
console.log("bot started")

/************ engine ************/

const status = (session, cb) => {
  const command = 'gincoin-cli masternode status'
  exec(command, (error, stdout, stderr) => {
    cb(session.ip + ": " + stdout)
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
      // cb(session.ip + " - checked")
    });    
  }, 60000)  
}

const position = (session, cb) => {
  if (!session.ip) {
    cb("missing ip")
    return;
  }
  const command = "~/bin/get_position_GINCoin " + session.ip
  exec(command, (error, stdout, stderr) => {
    console.log(command, error, stdout, stderr)
    cb(stdout)
  })
}

//// END
}
