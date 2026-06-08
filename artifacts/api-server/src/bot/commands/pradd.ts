import { EmbedBuilder, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import type { BotCommand } from "../types";
import { db } from "@workspace/db";
import { competitivePlayersTable, prHistoryTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

const command: BotCommand = {
  name: "pradd",
  description: "Add PR (competitive points) to a player",
  usage: "pradd @user <amount> [reason]",
  category: "moderation",

  slashData: new SlashCommandBuilder()
    .setName("pradd")
    .setDescription("Add PR (competitive points) to a player")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addUserOption((o) =>
      o.setName("user").setDescription("The player to add PR to").setRequired(true),
    )
    .addIntegerOption((o) =>
      o.setName("amount").setDescription("Amount of PR to add").setRequired(true).setMinValue(1),
    )
    .addStringOption((o) =>
      o.setName("reason").setDescription("Reason for the PR addition"),
    ),

  async execute({ message, args }) {
    if (!message.member?.permissions.has(PermissionFlagsBits.ManageGuild)) {
      await message.reply("❌ You need Manage Server permission."); return;
    }
    const target = message.mentions.members?.first();
    if (!target) { await message.reply("❌ Please mention a player."); return; }
    const amount = parseInt(args[1] ?? "");
    if (isNaN(amount) || amount < 1) { await message.reply("❌ Please provide a valid amount."); return; }
    const reason = args.slice(2).join(" ") || null;
    await applyPr(message.guild!.id, target.id, message.author.id, amount, reason);
    const newPr = await getPlayerPr(message.guild!.id, target.id);
    const embed = buildEmbed(target.user.tag, amount, newPr, reason, true);
    await message.reply({ embeds: [embed] });
  },

  async executeSlash(interaction) {
    const user = interaction.options.getUser("user", true);
    const amount = interaction.options.getInteger("amount", true);
    const reason = interaction.options.getString("reason") ?? null;
    await applyPr(interaction.guildId!, user.id, interaction.user.id, amount, reason);
    const newPr = await getPlayerPr(interaction.guildId!, user.id);
    const embed = buildEmbed(user.tag, amount, newPr, reason, true);
    await interaction.reply({ embeds: [embed] });
  },
};

async function applyPr(guildId: string, userId: string, modId: string, delta: number, reason: string | null) {
  const [existing] = await db
    .select()
    .from(competitivePlayersTable)
    .where(and(eq(competitivePlayersTable.guildId, guildId), eq(competitivePlayersTable.userId, userId)))
    .limit(1);

  if (existing) {
    await db.update(competitivePlayersTable)
      .set({ pr: existing.pr + delta, updatedAt: new Date() })
      .where(eq(competitivePlayersTable.id, existing.id));
  } else {
    await db.insert(competitivePlayersTable).values({ guildId, userId, pr: delta });
  }

  await db.insert(prHistoryTable).values({ guildId, userId, delta, reason, moderatorId: modId });
}

async function getPlayerPr(guildId: string, userId: string): Promise<number> {
  const [p] = await db.select().from(competitivePlayersTable)
    .where(and(eq(competitivePlayersTable.guildId, guildId), eq(competitivePlayersTable.userId, userId)))
    .limit(1);
  return p?.pr ?? 0;
}

function buildEmbed(tag: string, amount: number, newPr: number, reason: string | null, add: boolean) {
  return new EmbedBuilder()
    .setColor(add ? 0x00cc66 : 0xff4444)
    .setTitle(add ? "📈 PR Added" : "📉 PR Removed")
    .addFields(
      { name: "Player", value: tag, inline: true },
      { name: add ? "PR Added" : "PR Removed", value: `**${amount} PR**`, inline: true },
      { name: "New Total", value: `**${newPr} PR**`, inline: true },
      { name: "Reason", value: reason ?? "No reason provided" },
    )
    .setTimestamp();
}

export { applyPr, getPlayerPr, buildEmbed };
export default command;
