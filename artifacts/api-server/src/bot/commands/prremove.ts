import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import type { BotCommand } from "../types";
import { db } from "@workspace/db";
import { competitivePlayersTable, prHistoryTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { buildEmbed } from "./pradd";

const command: BotCommand = {
  name: "prremove",
  description: "Remove PR (competitive points) from a player",
  usage: "prremove @user <amount> [reason]",
  category: "moderation",

  slashData: new SlashCommandBuilder()
    .setName("prremove")
    .setDescription("Remove PR (competitive points) from a player")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addUserOption((o) =>
      o.setName("user").setDescription("The player to remove PR from").setRequired(true),
    )
    .addIntegerOption((o) =>
      o.setName("amount").setDescription("Amount of PR to remove").setRequired(true).setMinValue(1),
    )
    .addStringOption((o) =>
      o.setName("reason").setDescription("Reason for the PR removal"),
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
    const newPr = await removePr(message.guild!.id, target.id, message.author.id, amount, reason);
    await message.reply({ embeds: [buildEmbed(target.user.tag, amount, newPr, reason, false)] });
  },

  async executeSlash(interaction) {
    const user = interaction.options.getUser("user", true);
    const amount = interaction.options.getInteger("amount", true);
    const reason = interaction.options.getString("reason") ?? null;
    const newPr = await removePr(interaction.guildId!, user.id, interaction.user.id, amount, reason);
    await interaction.reply({ embeds: [buildEmbed(user.tag, amount, newPr, reason, false)] });
  },
};

async function removePr(guildId: string, userId: string, modId: string, amount: number, reason: string | null): Promise<number> {
  const [existing] = await db
    .select()
    .from(competitivePlayersTable)
    .where(and(eq(competitivePlayersTable.guildId, guildId), eq(competitivePlayersTable.userId, userId)))
    .limit(1);

  const currentPr = existing?.pr ?? 0;
  const newPr = Math.max(0, currentPr - amount);

  if (existing) {
    await db.update(competitivePlayersTable)
      .set({ pr: newPr, updatedAt: new Date() })
      .where(eq(competitivePlayersTable.id, existing.id));
  } else {
    await db.insert(competitivePlayersTable).values({ guildId, userId, pr: 0 });
  }

  await db.insert(prHistoryTable).values({ guildId, userId, delta: -amount, reason, moderatorId: modId });

  return newPr;
}

export default command;
