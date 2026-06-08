import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import type { BotCommand } from "../types";

async function buildEmbed(guild: NonNullable<ReturnType<typeof Object>>) {
  await guild.fetch();
  return new EmbedBuilder()
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
}

const command: BotCommand = {
  name: "serverinfo",
  description: "Display info about the server",
  usage: "serverinfo",
  aliases: ["guildinfo", "server"],
  category: "info",

  slashData: new SlashCommandBuilder()
    .setName("serverinfo")
    .setDescription("Display info about the server"),

  async execute({ message }) {
    await message.reply({ embeds: [await buildEmbed(message.guild!)] });
  },

  async executeSlash(interaction) {
    await interaction.reply({ embeds: [await buildEmbed(interaction.guild!)] });
  },
};

export default command;
