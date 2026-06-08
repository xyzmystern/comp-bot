import { EmbedBuilder, PermissionFlagsBits } from "discord.js";
import type { BotCommand } from "../types";
import { db } from "@workspace/db";
import { customCommandsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

const command: BotCommand = {
  name: "addcmd",
  description: "Add a custom command for this server",
  usage: "addcmd <name> <response>",
  category: "utility",
  async execute({ message, args, prefix }) {
    if (!message.member?.permissions.has(PermissionFlagsBits.ManageGuild)) {
      await message.reply("❌ You need Manage Server permission to add commands.");
      return;
    }

    const name = args[0]?.toLowerCase();
    const response = args.slice(1).join(" ");

    if (!name || !response) {
      await message.reply(`❌ Usage: \`${prefix}addcmd <name> <response>\``);
      return;
    }

    if (name.length > 30) {
      await message.reply("❌ Command name must be 30 characters or fewer.");
      return;
    }

    const [existing] = await db
      .select()
      .from(customCommandsTable)
      .where(
        and(
          eq(customCommandsTable.guildId, message.guild!.id),
          eq(customCommandsTable.name, name),
        ),
      )
      .limit(1);

    if (existing) {
      await db
        .update(customCommandsTable)
        .set({ response, updatedAt: new Date() })
        .where(eq(customCommandsTable.id, existing.id));

      await message.reply(`✅ Updated custom command \`${prefix}${name}\`.`);
    } else {
      await db.insert(customCommandsTable).values({
        guildId: message.guild!.id,
        name,
        response,
        createdBy: message.author.id,
      });

      const embed = new EmbedBuilder()
        .setColor(0x00cc99)
        .setTitle("✅ Custom Command Added")
        .addFields(
          { name: "Command", value: `\`${prefix}${name}\``, inline: true },
          { name: "Response", value: response },
        );

      await message.reply({ embeds: [embed] });
    }
  },
};

export default command;
