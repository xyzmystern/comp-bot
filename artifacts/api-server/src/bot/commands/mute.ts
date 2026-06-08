import {
  EmbedBuilder,
  GuildMember,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";
import type { BotCommand } from "../types";

function parseDuration(str: string): number | null {
  const match = str.match(/^(\d+)(s|m|h|d)$/);
  if (!match) return null;
  const n = parseInt(match[1]!);
  const multipliers: Record<string, number> = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
  return n * (multipliers[match[2]!] ?? 0);
}

function muteEmbed(tag: string, durationStr: string, mod: string, reason: string) {
  return new EmbedBuilder()
    .setColor(0xffa500)
    .setTitle("🔇 Member Muted")
    .addFields(
      { name: "User", value: tag, inline: true },
      { name: "Duration", value: durationStr, inline: true },
      { name: "Moderator", value: mod, inline: true },
      { name: "Reason", value: reason },
    )
    .setTimestamp();
}

const command: BotCommand = {
  name: "mute",
  description: "Timeout (mute) a member for a duration (e.g. 10m, 1h, 1d)",
  usage: "mute @user <duration> [reason]",
  category: "moderation",

  slashData: new SlashCommandBuilder()
    .setName("mute")
    .setDescription("Timeout a member for a duration")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption((o) =>
      o.setName("user").setDescription("The member to mute").setRequired(true),
    )
    .addStringOption((o) =>
      o
        .setName("duration")
        .setDescription("Duration: 10m, 1h, 2d")
        .setRequired(true),
    )
    .addStringOption((o) =>
      o.setName("reason").setDescription("Reason for the mute"),
    ),

  async execute({ message, args }) {
    if (!message.member?.permissions.has(PermissionFlagsBits.ModerateMembers)) {
      await message.reply("❌ You need Moderate Members permission."); return;
    }
    const target = message.mentions.members?.first();
    if (!target) { await message.reply("❌ Please mention a member."); return; }
    const durationStr = args[1];
    if (!durationStr) { await message.reply("❌ Please provide a duration (e.g. `10m`, `1h`)."); return; }
    const ms = parseDuration(durationStr);
    if (!ms) { await message.reply("❌ Invalid duration. Use `10m`, `1h`, `2d`, etc."); return; }
    const reason = args.slice(2).join(" ") || "No reason provided";
    await target.timeout(ms, reason);
    await message.reply({ embeds: [muteEmbed(target.user.tag, durationStr, message.author.tag, reason)] });
  },

  async executeSlash(interaction) {
    const raw = interaction.options.getMember("user");
    if (!(raw instanceof GuildMember)) {
      await interaction.reply({ content: "❌ Could not find that member.", ephemeral: true }); return;
    }
    const durationStr = interaction.options.getString("duration", true);
    const ms = parseDuration(durationStr);
    if (!ms) {
      await interaction.reply({ content: "❌ Invalid duration. Use `10m`, `1h`, `2d`, etc.", ephemeral: true }); return;
    }
    const reason = interaction.options.getString("reason") ?? "No reason provided";
    await raw.timeout(ms, reason);
    await interaction.reply({ embeds: [muteEmbed(raw.user.tag, durationStr, interaction.user.tag, reason)] });
  },
};

export default command;
