import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import type { BotCommand } from "../types";
import { db } from "@workspace/db";
import { guildSettingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

async function getSettings(guildId: string) {
  const [s] = await db.select().from(guildSettingsTable).where(eq(guildSettingsTable.guildId, guildId)).limit(1);
  return s;
}

const command: BotCommand = {
  name: "welcome",
  description: "Configure welcome messages for new members",
  usage: "welcome <set|disable|test> [#channel] [message]",
  category: "utility",

  slashData: new SlashCommandBuilder()
    .setName("welcome")
    .setDescription("Configure welcome messages for new members")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((sub) =>
      sub
        .setName("set")
        .setDescription("Set the welcome channel and message")
        .addChannelOption((o) =>
          o.setName("channel").setDescription("Channel to send welcome messages in").setRequired(true),
        )
        .addStringOption((o) =>
          o.setName("message").setDescription("Welcome message (use {user}, {server}, {count})"),
        ),
    )
    .addSubcommand((sub) =>
      sub.setName("disable").setDescription("Disable welcome messages"),
    )
    .addSubcommand((sub) =>
      sub.setName("test").setDescription("Send a test welcome message"),
    ),

  async execute({ message, args, prefix }) {
    if (!message.member?.permissions.has(PermissionFlagsBits.ManageGuild)) {
      await message.reply("❌ You need Manage Server permission."); return;
    }
    const sub = args[0]?.toLowerCase();
    const guildId = message.guild!.id;

    if (sub === "set") {
      const channel = message.mentions.channels.first();
      if (!channel) {
        await message.reply(`❌ Usage: \`${prefix}welcome set #channel [message]\`\nVariables: \`{user}\`, \`{server}\`, \`{count}\``); return;
      }
      const welcomeMsg = args.slice(2).join(" ") || "Welcome to **{server}**, {user}! You are member #{count}. 🎉";
      await db.insert(guildSettingsTable).values({ guildId, welcomeChannelId: channel.id, welcomeMessage: welcomeMsg })
        .onConflictDoUpdate({ target: guildSettingsTable.guildId, set: { welcomeChannelId: channel.id, welcomeMessage: welcomeMsg, updatedAt: new Date() } });
      await message.reply(`✅ Welcome messages → <#${channel.id}>\nMessage: \`${welcomeMsg}\``);

    } else if (sub === "disable") {
      await db.insert(guildSettingsTable).values({ guildId, welcomeChannelId: null, welcomeMessage: null })
        .onConflictDoUpdate({ target: guildSettingsTable.guildId, set: { welcomeChannelId: null, welcomeMessage: null, updatedAt: new Date() } });
      await message.reply("✅ Welcome messages disabled.");

    } else if (sub === "test") {
      const settings = await getSettings(guildId);
      if (!settings?.welcomeChannelId) {
        await message.reply(`❌ No welcome channel set. Use \`${prefix}welcome set #channel\` first.`); return;
      }
      const ch = message.guild!.channels.cache.get(settings.welcomeChannelId);
      if (!ch?.isTextBased() || !("send" in ch)) {
        await message.reply("❌ The welcome channel is no longer accessible."); return;
      }
      const msg = (settings.welcomeMessage ?? "Welcome, {user}!")
        .replace("{user}", `<@${message.author.id}>`).replace("{server}", message.guild!.name).replace("{count}", String(message.guild!.memberCount));
      await ch.send(msg);
      await message.reply(`✅ Test sent to <#${settings.welcomeChannelId}>.`);

    } else {
      await message.reply(
        `**Welcome usage:**\n\`${prefix}welcome set #channel [msg]\` — Set channel\n\`${prefix}welcome test\` — Test\n\`${prefix}welcome disable\` — Disable\n\nVariables: \`{user}\`, \`{server}\`, \`{count}\``
      );
    }
  },

  async executeSlash(interaction) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guildId!;

    if (sub === "set") {
      const channel = interaction.options.getChannel("channel", true);
      const welcomeMsg = interaction.options.getString("message") ?? "Welcome to **{server}**, {user}! You are member #{count}. 🎉";
      await db.insert(guildSettingsTable).values({ guildId, welcomeChannelId: channel.id, welcomeMessage: welcomeMsg })
        .onConflictDoUpdate({ target: guildSettingsTable.guildId, set: { welcomeChannelId: channel.id, welcomeMessage: welcomeMsg, updatedAt: new Date() } });
      await interaction.reply(`✅ Welcome messages → <#${channel.id}>\nMessage: \`${welcomeMsg}\``);

    } else if (sub === "disable") {
      await db.insert(guildSettingsTable).values({ guildId, welcomeChannelId: null, welcomeMessage: null })
        .onConflictDoUpdate({ target: guildSettingsTable.guildId, set: { welcomeChannelId: null, welcomeMessage: null, updatedAt: new Date() } });
      await interaction.reply("✅ Welcome messages disabled.");

    } else if (sub === "test") {
      const settings = await getSettings(guildId);
      if (!settings?.welcomeChannelId) {
        await interaction.reply({ content: "❌ No welcome channel set. Use `/welcome set` first.", ephemeral: true }); return;
      }
      const ch = interaction.guild!.channels.cache.get(settings.welcomeChannelId);
      if (!ch?.isTextBased() || !("send" in ch)) {
        await interaction.reply({ content: "❌ The welcome channel is no longer accessible.", ephemeral: true }); return;
      }
      const msg = (settings.welcomeMessage ?? "Welcome, {user}!")
        .replace("{user}", `<@${interaction.user.id}>`).replace("{server}", interaction.guild!.name).replace("{count}", String(interaction.guild!.memberCount));
      await ch.send(msg);
      await interaction.reply(`✅ Test sent to <#${settings.welcomeChannelId}>.`);
    }
  },
};

export default command;
