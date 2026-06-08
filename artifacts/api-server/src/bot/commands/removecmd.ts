import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import type { BotCommand } from "../types";
import { db } from "@workspace/db";
import { customCommandsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

async function deleteCmd(guildId: string, name: string) {
  return db
    .delete(customCommandsTable)
    .where(and(eq(customCommandsTable.guildId, guildId), eq(customCommandsTable.name, name)))
    .returning();
}

const command: BotCommand = {
  name: "removecmd",
  description: "Remove a custom command from this server",
  usage: "removecmd <name>",
  aliases: ["delcmd", "deletecmd"],
  category: "utility",

  slashData: new SlashCommandBuilder()
    .setName("removecmd")
    .setDescription("Remove a custom command from this server")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addStringOption((o) =>
      o.setName("name").setDescription("Command name to remove").setRequired(true),
    ),

  async execute({ message, args, prefix }) {
    if (!message.member?.permissions.has(PermissionFlagsBits.ManageGuild)) {
      await message.reply("❌ You need Manage Server permission."); return;
    }
    const name = args[0]?.toLowerCase();
    if (!name) { await message.reply(`❌ Usage: \`${prefix}removecmd <name>\``); return; }
    const deleted = await deleteCmd(message.guild!.id, name);
    await message.reply(deleted.length === 0 ? `❌ No command \`${name}\` found.` : `✅ Removed \`${prefix}${name}\`.`);
  },

  async executeSlash(interaction) {
    const name = interaction.options.getString("name", true).toLowerCase();
    const deleted = await deleteCmd(interaction.guildId!, name);
    await interaction.reply(deleted.length === 0 ? `❌ No command \`${name}\` found.` : `✅ Removed custom command \`${name}\`.`);
  },
};

export default command;
