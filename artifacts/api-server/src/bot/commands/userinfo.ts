import { EmbedBuilder } from "discord.js";
import type { BotCommand } from "../types";

const command: BotCommand = {
  name: "userinfo",
  description: "Display info about a user",
  usage: "userinfo [@user]",
  aliases: ["whois", "ui"],
  category: "info",
  async execute({ message }) {
    const target = message.mentions.members?.first() ?? message.member!;
    const user = target.user;

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle(`${user.username}`)
      .setThumbnail(user.displayAvatarURL())
      .addFields(
        { name: "Display Name", value: target.displayName, inline: true },
        { name: "ID", value: user.id, inline: true },
        { name: "Account Created", value: `<t:${Math.floor(user.createdTimestamp / 1000)}:R>`, inline: true },
        { name: "Joined Server", value: target.joinedAt ? `<t:${Math.floor(target.joinedAt.getTime() / 1000)}:R>` : "Unknown", inline: true },
        {
          name: "Roles",
          value:
            target.roles.cache
              .filter((r) => r.name !== "@everyone")
              .map((r) => `<@&${r.id}>`)
              .slice(0, 10)
              .join(", ") || "None",
        },
      )
      .setFooter({ text: `Bot: ${user.bot ? "Yes" : "No"}` });

    await message.reply({ embeds: [embed] });
  },
};

export default command;
