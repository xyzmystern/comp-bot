import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import type { BotCommand } from "../types";
import { db } from "@workspace/db";
import { competitivePlayersTable } from "@workspace/db";
import { eq, and, ilike, desc } from "drizzle-orm";

const command: BotCommand = {
  name: "lookup",
  description: "Search for a registered competitive player by IGN",
  usage: "lookup <query>",
  category: "utility",

  slashData: new SlashCommandBuilder()
    .setName("lookup")
    .setDescription("Search for a registered competitive player by IGN")
    .addStringOption((o) =>
      o
        .setName("query")
        .setDescription("Search text (matches IGN)")
        .setRequired(true),
    ),

  async execute({ message, args, client }) {
    const query = args.join(" ");
    if (!query) { await message.reply("❌ Please provide a search query."); return; }
    const embed = await buildLookupEmbed(message.guild!.id, query, client as any, message.client as any);
    await message.reply({ embeds: [embed] });
  },

  async executeSlash(interaction) {
    const query = interaction.options.getString("query", true);
    await interaction.deferReply({ ephemeral: true });
    const embed = await buildLookupEmbed(interaction.guildId!, query, interaction.client as any, interaction.client as any);
    await interaction.editReply({ embeds: [embed] });
  },
};

async function buildLookupEmbed(
  guildId: string,
  query: string,
  client: { users: { fetch(id: string): Promise<{ username: string }> }; user: { username: string } | null },
  _client2: unknown,
) {
  const results = await db
    .select()
    .from(competitivePlayersTable)
    .where(
      and(
        eq(competitivePlayersTable.guildId, guildId),
        ilike(competitivePlayersTable.ign, `%${query}%`),
      ),
    )
    .orderBy(desc(competitivePlayersTable.pr))
    .limit(10);

  const botName = client.user?.username ?? "BuildNow Competitive Hub";

  if (results.length === 0) {
    return new EmbedBuilder()
      .setAuthor({ name: botName })
      .setTitle(`🔍 Search results (0)`)
      .setDescription(`No players found matching \`${query}\`.`)
      .setColor(0x2b2d31);
  }

  const lines: string[] = [];
  for (let i = 0; i < results.length; i++) {
    const player = results[i]!;
    let discordUsername = "unknown";
    try {
      const user = await client.users.fetch(player.userId);
      discordUsername = user.username;
    } catch {
      discordUsername = "unknown";
    }
    const ign = player.ign ?? "(not registered)";
    lines.push(`${i + 1}. **${ign}** — @${discordUsername} — ${player.pr} PR`);
  }

  return new EmbedBuilder()
    .setAuthor({ name: botName })
    .setTitle(`🔍 Search results (${results.length})`)
    .setDescription(lines.join("\n"))
    .setColor(0x2b2d31);
}

export default command;
