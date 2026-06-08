import { SlashCommandBuilder } from "discord.js";
import type { BotCommand } from "../types";

function doRoll(input?: string): string {
  let count = 1;
  let sides = 6;
  if (input) {
    const match = input.match(/^(\d+)d(\d+)$/i);
    if (!match) return "❌ Use format like `2d6` or `1d20`.";
    count = Math.min(parseInt(match[1]!), 20);
    sides = Math.min(parseInt(match[2]!), 1000);
  }
  const rolls: number[] = [];
  for (let i = 0; i < count; i++) rolls.push(Math.floor(Math.random() * sides) + 1);
  const total = rolls.reduce((a, b) => a + b, 0);
  const rollStr = rolls.length > 1 ? ` (${rolls.join(" + ")})` : "";
  return `🎲 Rolled **${count}d${sides}**: **${total}**${rollStr}`;
}

const command: BotCommand = {
  name: "roll",
  description: "Roll a dice (default 1d6, supports NdN format)",
  usage: "roll [NdN]",
  aliases: ["dice"],
  category: "fun",

  slashData: new SlashCommandBuilder()
    .setName("roll")
    .setDescription("Roll a dice")
    .addStringOption((o) =>
      o.setName("dice").setDescription("Dice format e.g. 2d6 (default: 1d6)"),
    ),

  async execute({ message, args }) {
    const result = doRoll(args[0]);
    await message.reply(result);
  },

  async executeSlash(interaction) {
    const result = doRoll(interaction.options.getString("dice") ?? undefined);
    await interaction.reply(result);
  },
};

export default command;
