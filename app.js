const linebot = require("linebot");
const axios = require("axios");
const log4js = require("log4js");
const config = require("./config");

log4js.configure({
  appenders: { log: { type: "file", filename: "lineBot.log" } },
  categories: { default: { appenders: ["log"], level: "info" } },
});

const logger = log4js.getLogger("log");
const bot = linebot({
  channelId: config.channelId,
  channelSecret: config.channelSecret,
  channelAccessToken: config.channelAccessToken,
});

bot.on("message", (event) => {
  logger.info(JSON.stringify(event));
  let type = /\d/.test(event.message.text) ? "NUMBER" : "NAME";

  axios
    .post(
      `${config.baseUrl}auth/api/login`,
      {
        username: config.username,
        pd: config.pd,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    )
    .then((response) =>
      axios.post(
        `${config.baseUrl}api/requiredPaymentDetail/findDefaultCondition`,
        {
          id: "6044324",
          clientId: 2896,
          type: type,
          keyWord: event.message.text,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${response.data.token}`,
          },
        }
      )
    )
    .then((response) => {
      let replies = "";

      if (!response.data.payload.length) return event.reply("查無資料");
      for (let i = 0; i < response.data.payload.length; i++) {
        isPaid = response.data.payload[i].isPaid ? "已繳款" : "未繳款";
        replies += `${response.data.payload[i].reqName}\n繳款人: ${response.data.payload[i].name}\n繳款狀態: ${isPaid}\n房號: ${response.data.payload[i].number}\n匯款: 至各銀行或郵局另填匯款單\n匯入行: 聯邦北投\n收款人戶名: 北投大業邸管理委員會\n收款人帳號: ${response.data.payload[i].bankTellerVa}\n金額: ${response.data.payload[i].amountActuallyPaid}(需自付匯費)`;
        if (i < response.data.payload.length - 1) replies += "\n\n";
      }
      return event.reply(replies);
    })
    .catch((error) => {
      logger.error(JSON.stringify(error));
    });
});

bot.listen("/linewebhook", 3000, () => {
  console.log("[BOT is ready to go]");
  logger.info("[BOT is ready to go]");
});
