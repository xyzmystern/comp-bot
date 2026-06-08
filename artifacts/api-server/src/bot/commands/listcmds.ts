import { EmbedBuilder } from "discord.js";
import type { BotCommand } from "../types";
import { db } from "@workspace/db";
import { customCommandsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const command: BotCommand = {
  name: "listcmds",
  description: "List all custom commands for this server",
  usage: "listcmds",
  aliases: ["customcmds", "mycmds"],
  category: "utility",
  async execute({ message, prefix }) {
    const cmds = await db
      .select()
      .from(customCommandsTable)
      .where(eq(customCommandsTable.guildId, message.guild!.id));

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle("⭐ Custom Commands")
      .setDescription(
        cmds.length === 0
          ? `No custom commands yet. Use \`${prefix}addcmd <name> <response>\` to add one!`
          : cmds.map((c) => `\`${prefix}${c.name}\` — ${c.response.slice(0, 60)}${c.response.length > 60 ? "…" : ""}`).join("\n"),
      )
      .setFooter({ text: `${cmds.length} custom command(s)` });

    await message.reply({ embeds: [embed] });
  },
};

export default command;
