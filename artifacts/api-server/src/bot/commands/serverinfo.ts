import { EmbedBuilder } from "discord.js";
import type { BotCommand } from "../types";

const command: BotCommand = {
  name: "serverinfo",
  description: "Display info about the server",
  usage: "serverinfo",
  aliases: ["guildinfo", "server"],
  category: "info",
  async execute({ message }) {
    const guild = message.guild!;
    await guild.fetch();

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle(guild.name)
      .setThumbnail(guild.iconURL() ?? null)
      .addFields(
        { name: "Owner", value: `<@${guild.ownerId}>`, inline: true },
        { name: "Members", value: String(guild.memberCount), inline: true },
        { name: "Channels", value: String(guild.channels.cache.size), inline: true },
        { name: "Roles", value: String(guild.roles.cache.size), inline: true },
        { name: "Boosts", value: String(guild.premiumSubscriptionCount ?? 0), inline: true },
        { name: "Created", value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`, inline: true },
      )
      .setFooter({ text: `ID: ${guild.id}` })
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  },
};

export default command;
