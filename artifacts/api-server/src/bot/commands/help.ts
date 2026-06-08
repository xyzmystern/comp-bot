import { EmbedBuilder } from "discord.js";
import type { BotCommand } from "../types";

const command: BotCommand = {
  name: "help",
  description: "Show all commands or info about a specific command",
  usage: "help [command]",
  category: "info",
  async execute({ message, args, commands, prefix }) {
    if (args.length > 0) {
      const cmd = commands.get(args[0]!.toLowerCase());
      if (!cmd) {
        await message.reply(`❌ No command named \`${args[0]}\`.`);
        return;
      }
      const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle(`Command: ${prefix}${cmd.name}`)
        .setDescription(cmd.description)
        .addFields(
          { name: "Category", value: cmd.category, inline: true },
          {
            name: "Usage",
            value: `\`${prefix}${cmd.usage ?? cmd.name}\``,
            inline: true,
          },
        );
      if (cmd.aliases?.length) {
        embed.addFields({
          name: "Aliases",
          value: cmd.aliases.map((a) => `\`${a}\``).join(", "),
          inline: true,
        });
      }
      await message.reply({ embeds: [embed] });
      return;
    }

    const categories: Record<string, BotCommand[]> = {};
    const seen = new Set<string>();
    for (const cmd of commands.values()) {
      if (seen.has(cmd.name)) continue;
      seen.add(cmd.name);
      if (!categories[cmd.category]) categories[cmd.category] = [];
      categories[cmd.category]!.push(cmd);
    }

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle("📖 Bot Commands")
      .setDescription(
        `Use \`${prefix}help <command>\` for details on a specific command.\nPrefix: \`${prefix}\``,
      )
      .setFooter({ text: `${seen.size} commands available` });

    const categoryEmojis: Record<string, string> = {
      moderation: "🔨",
      utility: "🔧",
      fun: "🎲",
      info: "ℹ️",
      custom: "⭐",
    };

    for (const [cat, cmds] of Object.entries(categories)) {
      embed.addFields({
        name: `${categoryEmojis[cat] ?? "•"} ${cat.charAt(0).toUpperCase() + cat.slice(1)}`,
        value: cmds.map((c) => `\`${c.name}\``).join(", "),
      });
    }

    await message.reply({ embeds: [embed] });
  },
};

export default command;
