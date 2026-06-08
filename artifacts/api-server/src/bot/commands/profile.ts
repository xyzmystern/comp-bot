import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import type { BotCommand } from "../types";
import { db } from "@workspace/db";
import { competitivePlayersTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";

async function getPlayerProfile(guildId: string, userId: string) {
  const [player] = await db
    .select()
    .from(competitivePlayersTable)
    .where(
      and(
        eq(competitivePlayersTable.guildId, guildId),
        eq(competitivePlayersTable.userId, userId),
      ),
    )
    .limit(1);
  return player ?? null;
}

async function getPlayerRank(guildId: string, userId: string): Promise<number | null> {
  const all = await db
    .select()
    .from(competitivePlayersTable)
    .where(eq(competitivePlayersTable.guildId, guildId))
    .orderBy(desc(competitivePlayersTable.pr));

  const idx = all.findIndex((p) => p.userId === userId);
  return idx === -1 ? null : idx + 1;
}

function buildProfileEmbed(
  discordUsername: string,
  player: NonNullable<Awaited<ReturnType<typeof getPlayerProfile>>>,
  rank: number | null,
  botName: string,
) {
  const description = [
    `• **IGN:** ${player.ign ?? "—"}`,
    `• **Game ID:** ${player.gameId ?? "—"}`,
    `• **Region:** ${player.region ?? "—"}`,
    `• **Platform:** ${player.platform ?? "—"}`,
    `• **Country:** ${player.country ?? "—"}`,
    `• **PR:** ${player.pr}`,
    rank ? `• **Rank:** #${rank}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  return new EmbedBuilder()
    .setAuthor({ name: botName })
    .setTitle(`Profile for ${discordUsername}`)
    .setDescription(description)
    .setColor(0x2b2d31);
}

const command: BotCommand = {
  name: "profile",
  description: "View a player's competitive profile",
  usage: "profile [@user]",
  category: "utility",

  slashData: new SlashCommandBuilder()
    .setName("profile")
    .setDescription("View a player's competitive profile")
    .addUserOption((o) =>
      o.setName("user").setDescription("The player to look up (defaults to you)"),
    ),

  async execute({ message, client }) {
    const target = message.mentions.users.first() ?? message.author;
    const player = await getPlayerProfile(message.guild!.id, target.id);
    if (!player || !player.ign) {
      await message.reply(
        target.id === message.author.id
          ? "❌ You haven't registered yet. Use `/register` to set up your profile."
          : `❌ **${target.username}** hasn't registered for the competitive system.`,
      );
      return;
    }
    const rank = await getPlayerRank(message.guild!.id, target.id);
    const embed = buildProfileEmbed(target.username, player, rank, client.user!.username);
    await message.reply({ embeds: [embed] });
  },

  async executeSlash(interaction) {
    const target = interaction.options.getUser("user") ?? interaction.user;
    const player = await getPlayerProfile(interaction.guildId!, target.id);

    if (!player || !player.ign) {
      await interaction.reply({
        content:
          target.id === interaction.user.id
            ? "❌ You haven't registered yet. Use `/register` to set up your profile."
            : `❌ **${target.username}** hasn't registered for the competitive system.`,
        ephemeral: true,
      });
      return;
    }

    const rank = await getPlayerRank(interaction.guildId!, target.id);
    const botName = interaction.client.user?.username ?? "BuildNow Competitive Hub";
    const embed = buildProfileEmbed(target.username, player, rank, botName);
    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};

export default command;
