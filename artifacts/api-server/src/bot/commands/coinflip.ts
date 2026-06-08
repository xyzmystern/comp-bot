import { SlashCommandBuilder } from "discord.js";
import type { BotCommand } from "../types";

const command: BotCommand = {
  name: "coinflip",
  description: "Flip a coin",
  usage: "coinflip",
  aliases: ["flip", "coin"],
  category: "fun",

  slashData: new SlashCommandBuilder()
    .setName("coinflip")
    .setDescription("Flip a coin"),

  async execute({ message }) {
    const result = Math.random() < 0.5 ? "Heads" : "Tails";
    await message.reply(`${result === "Heads" ? "🪙" : "🔄"} The coin landed on **${result}**!`);
  },

  async executeSlash(interaction) {
    const result = Math.random() < 0.5 ? "Heads" : "Tails";
    await interaction.reply(`${result === "Heads" ? "🪙" : "🔄"} The coin landed on **${result}**!`);
  },
};

export default command;
