import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import type { BotCommand } from "../types";

function buildEmbed(username: string, url: string) {
  return new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle(`${username}'s Avatar`)
    .setImage(url)
    .setURL(url);
}

const command: BotCommand = {
  name: "avatar",
  description: "Show a user's avatar",
  usage: "avatar [@user]",
  aliases: ["pfp", "av"],
  category: "utility",

  slashData: new SlashCommandBuilder()
    .setName("avatar")
    .setDescription("Show a user's avatar")
    .addUserOption((o) =>
      o.setName("user").setDescription("The user whose avatar to show"),
    ),

  async execute({ message }) {
    const target = message.mentions.users.first() ?? message.author;
    const url = target.displayAvatarURL({ size: 512 });
    await message.reply({ embeds: [buildEmbed(target.username, url)] });
  },

  async executeSlash(interaction) {
    const target = interaction.options.getUser("user") ?? interaction.user;
    const url = target.displayAvatarURL({ size: 512 });
    await interaction.reply({ embeds: [buildEmbed(target.username, url)] });
  },
};

export default command;
