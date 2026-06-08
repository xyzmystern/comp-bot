import { PermissionFlagsBits } from "discord.js";
import type { BotCommand } from "../types";
import { db } from "@workspace/db";
import { guildSettingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const command: BotCommand = {
  name: "prefix",
  description: "Change the bot prefix for this server",
  usage: "prefix <new_prefix>",
  category: "utility",
  async execute({ message, args }) {
    if (!message.member?.permissions.has(PermissionFlagsBits.ManageGuild)) {
      await message.reply("❌ You need Manage Server permission to change the prefix.");
      return;
    }

    const newPrefix = args[0];
    if (!newPrefix || newPrefix.length > 5) {
      await message.reply("❌ Please provide a prefix (max 5 characters).");
      return;
    }

    await db
      .insert(guildSettingsTable)
      .values({ guildId: message.guild!.id, prefix: newPrefix })
      .onConflictDoUpdate({
        target: guildSettingsTable.guildId,
        set: { prefix: newPrefix, updatedAt: new Date() },
      });

    await message.reply(`✅ Prefix changed to \`${newPrefix}\`. New commands: \`${newPrefix}help\``);
  },
};

export default command;
