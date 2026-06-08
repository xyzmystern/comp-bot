import { PermissionFlagsBits } from "discord.js";
import type { BotCommand } from "../types";
import { db } from "@workspace/db";
import { customCommandsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

const command: BotCommand = {
  name: "removecmd",
  description: "Remove a custom command from this server",
  usage: "removecmd <name>",
  aliases: ["delcmd", "deletecmd"],
  category: "utility",
  async execute({ message, args, prefix }) {
    if (!message.member?.permissions.has(PermissionFlagsBits.ManageGuild)) {
      await message.reply("❌ You need Manage Server permission to remove commands.");
      return;
    }

    const name = args[0]?.toLowerCase();
    if (!name) {
      await message.reply(`❌ Usage: \`${prefix}removecmd <name>\``);
      return;
    }

    const deleted = await db
      .delete(customCommandsTable)
      .where(
        and(
          eq(customCommandsTable.guildId, message.guild!.id),
          eq(customCommandsTable.name, name),
        ),
      )
      .returning();

    if (deleted.length === 0) {
      await message.reply(`❌ No custom command named \`${name}\` found.`);
    } else {
      await message.reply(`✅ Removed custom command \`${prefix}${name}\`.`);
    }
  },
};

export default command;
