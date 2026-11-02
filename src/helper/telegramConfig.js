var { TelegramBot } = require('node-telegram-bot-api');
var dotenv = require('dotenv');
dotenv.config(); // Load environment variables from .env file
var logError = require('../helper/log_error');
var token = process.env.TELEGRAM_TOKEN;
var {IsEmpty} = require('../helper/validate');

//init telegram bot
var bot = new TelegramBot(token);


const SendMessageToTelegram = async (req, res) => {
    try {
        var {  Message } = req.body;
       
        if(IsEmpty(Message)){
            res.send({
                message: "Message is required"
                });
        }
        var Listuser = ["-1004353592882","1001388981"];
        //send message
        for(var i=0 ; i<Listuser.length ; i++){
            await bot.sendMessage(Listuser[i] , Message);
        }
        
        res.send({
            message: "Message sent to Telegram successfully"
        });
    }
    catch(error) {
        logError(res , error , "SendMessageToTelegram");
    }
    

}

module.exports = {SendMessageToTelegram};