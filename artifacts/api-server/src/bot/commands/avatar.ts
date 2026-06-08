import { EmbedBuilder } from "discord.js";
import type { BotCommand } from "../types";

const command: BotCommand = {
  name: "avatar",
  description: "Show a user's avatar",
  usage: "avatar [@user]",
  aliases: ["pfp", "av"],
  category: "utility",
  async execute({ message }) {
    const target = message.mentions.users.first() ?? message.author;
    const url = target.displayAvatarURL({ size: 512 });

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle(`${target.username}'s Avatar`)
      .setImage(url)
      .setURL(url);

    await message.reply({ embeds: [embed] });
  },
};

export default command;
