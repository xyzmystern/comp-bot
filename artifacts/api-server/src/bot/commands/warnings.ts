import { EmbedBuilder, PermissionFlagsBits } from "discord.js";
import type { BotCommand } from "../types";
import { db } from "@workspace/db";
import { warningsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

const command: BotCommand = {
  name: "warnings",
  description: "View warnings for a member",
  usage: "warnings @user",
  aliases: ["warns"],
  category: "moderation",
  async execute({ message }) {
    if (!message.member?.permissions.has(PermissionFlagsBits.ModerateMembers)) {
      await message.reply("❌ You don't have permission to view warnings.");
      return;
    }

    const target = message.mentions.members?.first();
    if (!target) {
      await message.reply("❌ Please mention a member.");
      return;
    }

    const warns = await db
      .select()
      .from(warningsTable)
      .where(
        and(
          eq(warningsTable.guildId, message.guild!.id),
          eq(warningsTable.userId, target.id),
        ),
      );

    const embed = new EmbedBuilder()
      .setColor(0xffcc00)
      .setTitle(`⚠️ Warnings for ${target.user.tag}`)
      .setDescription(
        warns.length === 0
          ? "No warnings on record."
          : warns
              .map(
                (w, i) =>
                  `**${i + 1}.** ${w.reason} — <t:${Math.floor(w.createdAt.getTime() / 1000)}:R>`,
              )
              .join("\n"),
      )
      .setFooter({ text: `Total: ${warns.length} warning(s)` });

    await message.reply({ embeds: [embed] });
  },
};

export default command;
