import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import type { BotCommand } from "../types";
import { db } from "@workspace/db";
import { competitivePlayersTable } from "@workspace/db";
import { eq, desc, gt, count } from "drizzle-orm";

const RANK_MEDALS: Record<number, string> = {
  1: "🥇",
  2: "🥈",
  3: "🥉",
};

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
}

async function buildLeaderboard(guildId: string, guild: { name: string; members: { fetch(id: string): Promise<{ user: { username: string } }> } }) {
  // Total ranked players
  const [{ value: totalCount }] = await db
    .select({ value: count() })
    .from(competitivePlayersTable)
    .where(eq(competitivePlayersTable.guildId, guildId));

  // Top 10
  const top = await db
    .select()
    .from(competitivePlayersTable)
    .where(eq(competitivePlayersTable.guildId, guildId))
    .orderBy(desc(competitivePlayersTable.pr))
    .limit(10);

  const lines: string[] = [];
  for (let i = 0; i < top.length; i++) {
    const player = top[i]!;
    const rank = i + 1;
    const medal = RANK_MEDALS[rank];
    const prefix = medal ? `${medal}` : `**${rank}.**`;

    const ign = player.ign ?? "(not registered)";
    const region = player.region ?? "—";

    lines.push(`${prefix} **${ign}** — ${player.pr} PR · ${region}`);
  }

  const now = new Date();
  const embed = new EmbedBuilder()
    .setColor(0xffd700)
    .setTitle("🏆 PR Leaderboard")
    .setDescription(lines.join("\n") || "No ranked players yet.")
    .setFooter({
      text: `Top ${Math.min(10, top.length)} of ${totalCount} ranked players • ${guild.name} | Today at ${formatTime(now)}`,
    });

  return embed;
}

const command: BotCommand = {
  name: "leaderboard",
  description: "Show the top competitive players by PR",
  usage: "leaderboard",
  aliases: ["lb", "top"],
  category: "utility",

  slashData: new SlashCommandBuilder()
    .setName("leaderboard")
    .setDescription("Show the top competitive players by PR"),

  async execute({ message }) {
    const embed = await buildLeaderboard(message.guild!.id, message.guild! as any);
    await message.reply({ embeds: [embed] });
  },

  async executeSlash(interaction) {
    await interaction.deferReply();
    const embed = await buildLeaderboard(interaction.guildId!, interaction.guild! as any);
    await interaction.editReply({ embeds: [embed] });
  },
};

export default command;
