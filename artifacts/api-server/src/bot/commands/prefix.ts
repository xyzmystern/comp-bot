import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import type { BotCommand } from "../types";
import { db } from "@workspace/db";
import { guildSettingsTable } from "@workspace/db";

async function setPrefix(guildId: string, newPrefix: string) {
  await db
    .insert(guildSettingsTable)
    .values({ guildId, prefix: newPrefix })
    .onConflictDoUpdate({
      target: guildSettingsTable.guildId,
      set: { prefix: newPrefix, updatedAt: new Date() },
    });
}

const command: BotCommand = {
  name: "prefix",
  description: "Change the bot prefix for this server",
  usage: "prefix <new_prefix>",
  category: "utility",

  slashData: new SlashCommandBuilder()
    .setName("prefix")
    .setDescription("Change the bot prefix for this server")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addStringOption((o) =>
      o
        .setName("prefix")
        .setDescription("New prefix (max 5 characters)")
        .setRequired(true),
    ),

  async execute({ message, args }) {
    if (!message.member?.permissions.has(PermissionFlagsBits.ManageGuild)) {
      await message.reply("❌ You need Manage Server permission."); return;
    }
    const newPrefix = args[0];
    if (!newPrefix || newPrefix.length > 5) {
      await message.reply("❌ Please provide a prefix (max 5 characters)."); return;
    }
    await setPrefix(message.guild!.id, newPrefix);
    await message.reply(`✅ Prefix changed to \`${newPrefix}\`. Try \`${newPrefix}help\`!`);
  },

  async executeSlash(interaction) {
    const newPrefix = interaction.options.getString("prefix", true);
    if (newPrefix.length > 5) {
      await interaction.reply({ content: "❌ Prefix must be 5 characters or fewer.", ephemeral: true }); return;
    }
    await setPrefix(interaction.guildId!, newPrefix);
    await interaction.reply(`✅ Prefix changed to \`${newPrefix}\`. Try \`${newPrefix}help\`!`);
  },
};

export default command;
