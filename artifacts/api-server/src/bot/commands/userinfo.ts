import { EmbedBuilder, SlashCommandBuilder, GuildMember } from "discord.js";
import type { BotCommand } from "../types";

function buildEmbed(member: GuildMember) {
  const user = member.user;
  return new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle(user.username)
    .setThumbnail(user.displayAvatarURL())
    .addFields(
      { name: "Display Name", value: member.displayName, inline: true },
      { name: "ID", value: user.id, inline: true },
      { name: "Account Created", value: `<t:${Math.floor(user.createdTimestamp / 1000)}:R>`, inline: true },
      { name: "Joined Server", value: member.joinedAt ? `<t:${Math.floor(member.joinedAt.getTime() / 1000)}:R>` : "Unknown", inline: true },
      {
        name: "Roles",
        value:
          member.roles.cache
            .filter((r) => r.name !== "@everyone")
            .map((r) => `<@&${r.id}>`)
            .slice(0, 10)
            .join(", ") || "None",
      },
    )
    .setFooter({ text: `Bot: ${user.bot ? "Yes" : "No"}` });
}

const command: BotCommand = {
  name: "userinfo",
  description: "Display info about a user",
  usage: "userinfo [@user]",
  aliases: ["whois", "ui"],
  category: "info",

  slashData: new SlashCommandBuilder()
    .setName("userinfo")
    .setDescription("Display info about a user")
    .addUserOption((o) =>
      o.setName("user").setDescription("The user to look up"),
    ),

  async execute({ message }) {
    const target = message.mentions.members?.first() ?? message.member!;
    await message.reply({ embeds: [buildEmbed(target)] });
  },

  async executeSlash(interaction) {
    const raw = interaction.options.getMember("user");
    const member = (raw instanceof GuildMember ? raw : null) ?? interaction.member as GuildMember;
    await interaction.reply({ embeds: [buildEmbed(member)] });
  },
};

export default command;
