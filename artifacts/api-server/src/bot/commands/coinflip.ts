import type { BotCommand } from "../types";

const command: BotCommand = {
  name: "coinflip",
  description: "Flip a coin",
  usage: "coinflip",
  aliases: ["flip", "coin"],
  category: "fun",
  async execute({ message }) {
    const result = Math.random() < 0.5 ? "Heads" : "Tails";
    const emoji = result === "Heads" ? "🪙" : "🔄";
    await message.reply(`${emoji} The coin landed on **${result}**!`);
  },
};

export default command;
