import { PermissionFlagsBits } from "discord.js";
import type { BotCommand } from "../types";
import { db } from "@workspace/db";
import { guildSettingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const command: BotCommand = {
  name: "welcome",
  description: "Configure the welcome message for new members",
  usage: "welcome <set|disable|test> [channel] [message]",
  category: "utility",
  async execute({ message, args, prefix }) {
    if (!message.member?.permissions.has(PermissionFlagsBits.ManageGuild)) {
      await message.reply("❌ You need Manage Server permission.");
      return;
    }

    const sub = args[0]?.toLowerCase();

    if (sub === "set") {
      const channel = message.mentions.channels.first();
      if (!channel) {
        await message.reply(`❌ Usage: \`${prefix}welcome set #channel [custom message]\`\nVariables: \`{user}\`, \`{server}\`, \`{count}\``);
        return;
      }
      const welcomeMsg = args.slice(2).join(" ") || `Welcome to **{server}**, {user}! You are member #{count}. 🎉`;

      await db
        .insert(guildSettingsTable)
        .values({ guildId: message.guild!.id, welcomeChannelId: channel.id, welcomeMessage: welcomeMsg })
        .onConflictDoUpdate({
          target: guildSettingsTable.guildId,
          set: { welcomeChannelId: channel.id, welcomeMessage: welcomeMsg, updatedAt: new Date() },
        });

      await message.reply(`✅ Welcome messages will be sent to <#${channel.id}>.\nMessage: \`${welcomeMsg}\``);
    } else if (sub === "disable") {
      await db
        .insert(guildSettingsTable)
        .values({ guildId: message.guild!.id, welcomeChannelId: null, welcomeMessage: null })
        .onConflictDoUpdate({
          target: guildSettingsTable.guildId,
          set: { welcomeChannelId: null, welcomeMessage: null, updatedAt: new Date() },
        });

      await message.reply("✅ Welcome messages disabled.");
    } else if (sub === "test") {
      const [settings] = await db
        .select()
        .from(guildSettingsTable)
        .where(eq(guildSettingsTable.guildId, message.guild!.id))
        .limit(1);

      if (!settings?.welcomeChannelId) {
        await message.reply(`❌ No welcome channel set. Use \`${prefix}welcome set #channel\` first.`);
        return;
      }

      const ch = message.guild!.channels.cache.get(settings.welcomeChannelId);
      if (!ch?.isTextBased()) {
        await message.reply("❌ The welcome channel is no longer accessible.");
        return;
      }

      const msg = (settings.welcomeMessage ?? "Welcome, {user}!")
        .replace("{user}", `<@${message.author.id}>`)
        .replace("{server}", message.guild!.name)
        .replace("{count}", String(message.guild!.memberCount));

      await ch.send(msg);
      await message.reply(`✅ Test welcome message sent to <#${settings.welcomeChannelId}>.`);
    } else {
      await message.reply(
        `**Welcome command usage:**\n` +
          `\`${prefix}welcome set #channel [message]\` — Set welcome channel\n` +
          `\`${prefix}welcome test\` — Send a test message\n` +
          `\`${prefix}welcome disable\` — Disable welcome messages\n\n` +
          `**Variables:** \`{user}\`, \`{server}\`, \`{count}\``,
      );
    }
  },
};

export default command;
