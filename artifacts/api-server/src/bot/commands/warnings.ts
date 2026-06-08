import {
  EmbedBuilder,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";
import type { BotCommand } from "../types";
import { db } from "@workspace/db";
import { warningsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

async function getWarnings(guildId: string, userId: string) {
  return db
    .select()
    .from(warningsTable)
    .where(and(eq(warningsTable.guildId, guildId), eq(warningsTable.userId, userId)));
}

function buildEmbed(tag: string, warns: typeof warningsTable.$inferSelect[]) {
  return new EmbedBuilder()
    .setColor(0xffcc00)
    .setTitle(`⚠️ Warnings for ${tag}`)
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
}

const command: BotCommand = {
  name: "warnings",
  description: "View warnings for a member",
  usage: "warnings @user",
  aliases: ["warns"],
  category: "moderation",

  slashData: new SlashCommandBuilder()
    .setName("warnings")
    .setDescription("View warnings for a member")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption((o) =>
      o.setName("user").setDescription("The member to check").setRequired(true),
    ),

  async execute({ message }) {
    if (!message.member?.permissions.has(PermissionFlagsBits.ModerateMembers)) {
      await message.reply("❌ You don't have permission to view warnings.");
      return;
    }
    const target = message.mentions.members?.first();
    if (!target) { await message.reply("❌ Please mention a member."); return; }
    const warns = await getWarnings(message.guild!.id, target.id);
    await message.reply({ embeds: [buildEmbed(target.user.tag, warns)] });
  },

  async executeSlash(interaction) {
    const user = interaction.options.getUser("user", true);
    const warns = await getWarnings(interaction.guildId!, user.id);
    await interaction.reply({ embeds: [buildEmbed(user.tag, warns)] });
  },
};

export default command;
