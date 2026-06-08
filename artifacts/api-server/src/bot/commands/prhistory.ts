import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import type { BotCommand } from "../types";
import { db } from "@workspace/db";
import { prHistoryTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";

const command: BotCommand = {
  name: "prhistory",
  description: "View recent PR changes for a player",
  usage: "prhistory [@user] [limit]",
  aliases: ["prlog"],
  category: "utility",

  slashData: new SlashCommandBuilder()
    .setName("prhistory")
    .setDescription("View recent PR changes for a player")
    .addUserOption((o) =>
      o.setName("user").setDescription("The player to check (defaults to you)"),
    )
    .addIntegerOption((o) =>
      o
        .setName("limit")
        .setDescription("Number of entries to show (default 10, max 25)")
        .setMinValue(1)
        .setMaxValue(25),
    ),

  async execute({ message, args, client }) {
    const target = message.mentions.users.first() ?? message.author;
    const limit = Math.min(parseInt(args.find((a) => /^\d+$/.test(a)) ?? "10"), 25);
    const embed = await buildHistoryEmbed(
      message.guild!.id,
      target.id,
      target.username,
      limit,
      client,
    );
    await message.reply({ embeds: [embed] });
  },

  async executeSlash(interaction) {
    const target = interaction.options.getUser("user") ?? interaction.user;
    const limit = interaction.options.getInteger("limit") ?? 10;
    await interaction.deferReply({ ephemeral: true });
    const embed = await buildHistoryEmbed(
      interaction.guildId!,
      target.id,
      target.username,
      limit,
      interaction.client,
    );
    await interaction.editReply({ embeds: [embed] });
  },
};

async function buildHistoryEmbed(
  guildId: string,
  userId: string,
  username: string,
  limit: number,
  client: { users: { fetch(id: string): Promise<{ username: string }> }; user: { username: string } | null },
) {
  const history = await db
    .select()
    .from(prHistoryTable)
    .where(
      and(
        eq(prHistoryTable.guildId, guildId),
        eq(prHistoryTable.userId, userId),
      ),
    )
    .orderBy(desc(prHistoryTable.createdAt))
    .limit(limit);

  const botName = client.user?.username ?? "BuildNow Competitive Hub";

  if (history.length === 0) {
    return new EmbedBuilder()
      .setAuthor({ name: botName })
      .setColor(0x2b2d31)
      .setTitle(`📋 PR History for ${username}`)
      .setDescription("No PR history found for this player.");
  }

  const lines = await Promise.all(
    history.map(async (entry, i) => {
      const sign = entry.delta >= 0 ? "+" : "";
      const arrow = entry.delta >= 0 ? "📈" : "📉";
      const timestamp = `<t:${Math.floor(entry.createdAt.getTime() / 1000)}:R>`;
      const reason = entry.reason ? ` — *${entry.reason}*` : "";

      let modName = "Unknown";
      try {
        const mod = await client.users.fetch(entry.moderatorId);
        modName = mod.username;
      } catch {}

      return `**${i + 1}.** ${arrow} \`${sign}${entry.delta} PR\`${reason}\nby **@${modName}** · ${timestamp}`;
    }),
  );

  const totalGained = history.filter((e) => e.delta > 0).reduce((s, e) => s + e.delta, 0);
  const totalLost = history.filter((e) => e.delta < 0).reduce((s, e) => s + e.delta, 0);

  return new EmbedBuilder()
    .setAuthor({ name: botName })
    .setColor(0x2b2d31)
    .setTitle(`📋 PR History for ${username}`)
    .setDescription(lines.join("\n\n"))
    .addFields(
      { name: "Gained", value: `+${totalGained} PR`, inline: true },
      { name: "Lost", value: `${totalLost} PR`, inline: true },
    )
    .setFooter({ text: `Showing last ${history.length} change${history.length !== 1 ? "s" : ""}` });
}

export default command;
