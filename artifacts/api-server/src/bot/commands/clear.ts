import { PermissionFlagsBits } from "discord.js";
import type { BotCommand } from "../types";

const command: BotCommand = {
  name: "clear",
  description: "Delete a number of messages (1-100)",
  usage: "clear <amount>",
  aliases: ["purge"],
  category: "moderation",
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

    if (!message.channel.isTextBased() || !("bulkDelete" in message.channel)) {
      await message.reply("❌ Cannot bulk delete in this channel.");
      return;
    }

    await message.delete().catch(() => null);
    const deleted = await message.channel.bulkDelete(amount, true);
    const confirm = await message.channel.send(
      `✅ Deleted **${deleted.size}** messages.`,
    );
    setTimeout(() => confirm.delete().catch(() => null), 3000);
  },
};

export default command;
