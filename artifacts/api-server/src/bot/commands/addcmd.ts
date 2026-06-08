import {
  EmbedBuilder,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";
import type { BotCommand } from "../types";
import { db } from "@workspace/db";
import { customCommandsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

async function upsertCommand(
  guildId: string,
  name: string,
  response: string,
  createdBy: string,
  prefix: string,
): Promise<{ updated: boolean; embed: EmbedBuilder }> {
  const [existing] = await db
    .select()
    .from(customCommandsTable)
    .where(and(eq(customCommandsTable.guildId, guildId), eq(customCommandsTable.name, name)))
    .limit(1);

  if (existing) {
    await db
      .update(customCommandsTable)
      .set({ response, updatedAt: new Date() })
      .where(eq(customCommandsTable.id, existing.id));
    return {
      updated: true,
      embed: new EmbedBuilder().setColor(0x00cc99).setTitle("✅ Custom Command Updated").addFields(
        { name: "Command", value: `\`${prefix}${name}\``, inline: true },
        { name: "Response", value: response },
      ),
    };
  }

  await db.insert(customCommandsTable).values({ guildId, name, response, createdBy });
  return {
    updated: false,
    embed: new EmbedBuilder().setColor(0x00cc99).setTitle("✅ Custom Command Added").addFields(
      { name: "Command", value: `\`${prefix}${name}\``, inline: true },
      { name: "Response", value: response },
    ),
  };
}

const command: BotCommand = {
  name: "addcmd",
  description: "Add or update a custom command for this server",
  usage: "addcmd <name> <response>",
  category: "utility",

  slashData: new SlashCommandBuilder()
    .setName("addcmd")
    .setDescription("Add or update a custom command for this server")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addStringOption((o) =>
      o.setName("name").setDescription("Command name (no spaces)").setRequired(true),
    )
    .addStringOption((o) =>
      o.setName("response").setDescription("What the bot replies").setRequired(true),
    ),

  async execute({ message, args, prefix }) {
    if (!message.member?.permissions.has(PermissionFlagsBits.ManageGuild)) {
      await message.reply("❌ You need Manage Server permission."); return;
    }
    const name = args[0]?.toLowerCase();
    const response = args.slice(1).join(" ");
    if (!name || !response) { await message.reply(`❌ Usage: \`${prefix}addcmd <name> <response>\``); return; }
    if (name.length > 30) { await message.reply("❌ Name must be 30 characters or fewer."); return; }
    const { embed } = await upsertCommand(message.guild!.id, name, response, message.author.id, prefix);
    await message.reply({ embeds: [embed] });
  },

  async executeSlash(interaction) {
    const name = interaction.options.getString("name", true).toLowerCase();
    const response = interaction.options.getString("response", true);
    if (name.length > 30) {
      await interaction.reply({ content: "❌ Name must be 30 characters or fewer.", ephemeral: true }); return;
    }
    const { embed } = await upsertCommand(interaction.guildId!, name, response, interaction.user.id, "/");
    await interaction.reply({ embeds: [embed] });
  },
};

export default command;
