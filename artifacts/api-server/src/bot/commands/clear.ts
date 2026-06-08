import {
  PermissionFlagsBits,
  SlashCommandBuilder,
  TextChannel,
  NewsChannel,
} from "discord.js";
import type { BotCommand } from "../types";

const command: BotCommand = {
  name: "clear",
  description: "Delete a number of messages (1-100)",
  usage: "clear <amount>",
  aliases: ["purge"],
  category: "moderation",

  slashData: new SlashCommandBuilder()
    .setName("clear")
    .setDescription("Delete a number of messages (1-100)")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addIntegerOption((o) =>
      o
        .setName("amount")
        .setDescription("Number of messages to delete (1-100)")
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(100),
    ),

  async execute({ message, args }) {
    if (!message.member?.permissions.has(PermissionFlagsBits.ManageMessages)) {
      await message.reply("❌ You don't have permission to manage messages.");
      return;
    }
    const amount = parseInt(args[0] ?? "");
    if (isNaN(amount) || amount < 1 || amount > 100) {
      await message.reply("❌ Please provide a number between 1 and 100.");
      return;
    }
    if (!("bulkDelete" in message.channel)) {
      await message.reply("❌ Cannot bulk delete in this channel.");
      return;
    }
    await message.delete().catch(() => null);
    const deleted = await (message.channel as TextChannel).bulkDelete(amount, true);
    const confirm = await message.channel.send(`✅ Deleted **${deleted.size}** messages.`);
    setTimeout(() => confirm.delete().catch(() => null), 3000);
  },

  async executeSlash(interaction) {
    const amount = interaction.options.getInteger("amount", true);
    const channel = interaction.channel;
    if (!channel || !(channel instanceof TextChannel || channel instanceof NewsChannel)) {
      await interaction.reply({ content: "❌ Cannot bulk delete in this channel.", ephemeral: true });
      return;
    }
    await interaction.deferReply({ ephemeral: true });
    const deleted = await channel.bulkDelete(amount, true);
    await interaction.editReply(`✅ Deleted **${deleted.size}** messages.`);
  },
};

export default command;
