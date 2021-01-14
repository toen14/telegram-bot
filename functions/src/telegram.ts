import * as express from "express";
import * as functions from "firebase-functions";
import * as TelegramBot from "node-telegram-bot-api";
import { ytChannelsMessage } from "./resources/yt_channels";
import { latestVideosMessage, playlistMessage } from "./resources/my_channel";

const router = express.Router();

/**
 * Telegram bot webhook handler
 * @param bot <TelegramBot>
 * @param config <functions.config.Config>
 */
export default function (bot: TelegramBot, config: functions.config.Config) {
  const webhookUrl = `https://us-central1-upkoding.cloudfunctions.net/UpKodingBot/telegram/webhook/${config.telegram.bot_token}`;
  bot
    .setWebHook(webhookUrl)
    .then(() => console.log("webhook registered"))
    .catch((err) => console.log("failed registering webhook: " + err.message));

  // -- Admin command handlers --
  // Return user info (useful to get user's numeric Telegram ID)
  bot.onText(/\/probe_me/, async (msg: TelegramBot.Message) => {
    // only bot admin can call this
    if (msg.chat.username === config.telegram.admin_username) {
      await bot.sendMessage(msg.chat.id, JSON.stringify(msg.chat));
    }
  });

  // Return group info (useful to get group's numeric Telegram ID)
  bot.onText(/\/probe_group/, async (msg: TelegramBot.Message) => {
    // only bot admin can call this
    if (msg.from?.id === parseInt(config.telegram.admin_id)) {
      // info about group sent to the bot admin
      await bot.sendMessage(config.telegram.admin_id, JSON.stringify(msg.chat));
    }
  });

  // -- Message handlers --
  bot.onText(/\/start/, async (msg: TelegramBot.Message) => {
    await bot.sendMessage(
      msg.chat.id,
      `Halo kak ${msg.from?.first_name}, UpKodingBot masih di bengkel: https://github.com/upkoding/telegram-bot`
    );
  });

  bot.onText(/\/channels/, async (msg: TelegramBot.Message) => {
    await bot.sendMessage(msg.chat.id, ytChannelsMessage(), {
      parse_mode: "Markdown",
      disable_web_page_preview: true,
    });
  });

  bot.onText(/\/videos/, async (msg: TelegramBot.Message) => {
    const text = await latestVideosMessage();
    await bot.sendMessage(msg.chat.id, text, {
      parse_mode: "Markdown",
      disable_web_page_preview: true,
    });
  });

  bot.onText(/\/playlists/, async (msg: TelegramBot.Message) => {
    const text = await playlistMessage();
    await bot.sendMessage(msg.chat.id, text, {
      parse_mode: "Markdown",
      disable_web_page_preview: true,
    });
  });

  // bot.on("message", async (msg: TelegramBot.Message) => {
  //   await bot.sendMessage(config.telegram.admin_id, JSON.stringify(msg));
  // });

  // webhook route
  router.post(
    `/webhook/${config.telegram.bot_token}`,
    (req: express.Request, res: express.Response) => {
      bot.processUpdate(req.body);
      res.sendStatus(200);
    }
  );

  return router;
}
