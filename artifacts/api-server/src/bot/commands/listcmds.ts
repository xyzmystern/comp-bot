import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import type { BotCommand } from "../types";
import { db } from "@workspace/db";
import { customCommandsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

async function buildEmbed(guildId: string, prefix: string) {
  const cmds = await db
    .select()
    .from(customCommandsTable)
    .where(eq(customCommandsTable.guildId, guildId));

  return new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle("⭐ Custom Commands")
    .setDescription(
      cmds.length === 0
        ? `No custom commands yet. Use \`${prefix}addcmd <name> <response>\` to add one!`
        : cmds
            .map(
              (c) =>
                `\`${prefix}${c.name}\` — ${c.response.slice(0, 60)}${c.response.length > 60 ? "…" : ""}`,
            )
            .join("\n"),
    )
    .setFooter({ text: `${cmds.length} custom command(s)` });
}

const command: BotCommand = {
  name: "listcmds",
  description: "List all custom commands for this server",
  usage: "listcmds",
  aliases: ["customcmds", "mycmds"],
  category: "utility",

  slashData: new SlashCommandBuilder()
    .setName("listcmds")
    .setDescription("List all custom commands for this server"),

  async execute({ message, prefix }) {
    await message.reply({ embeds: [await buildEmbed(message.guild!.id, prefix)] });
  },

  async executeSlash(interaction) {
    await interaction.reply({ embeds: [await buildEmbed(interaction.guildId!, "/")] });
  },
};

export default command;
