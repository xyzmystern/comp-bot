import type { BotCommand } from "../types";

const command: BotCommand = {
  name: "roll",
  description: "Roll a dice (default 1d6, supports NdN format)",
  usage: "roll [NdN]",
  aliases: ["dice"],
  category: "fun",
  async execute({ message, args }) {
    let count = 1;
    let sides = 6;

    if (args[0]) {
      const match = args[0].match(/^(\d+)d(\d+)$/i);
      if (!match) {
        await message.reply("❌ Use format like `2d6` or `1d20`.");
        return;
      }
      count = Math.min(parseInt(match[1]!), 20);
      sides = Math.min(parseInt(match[2]!), 1000);
    }

    const rolls: number[] = [];
    for (let i = 0; i < count; i++) {
      rolls.push(Math.floor(Math.random() * sides) + 1);
    }

    const total = rolls.reduce((a, b) => a + b, 0);
    const rollStr = rolls.length > 1 ? ` (${rolls.join(" + ")})` : "";

    await message.reply(
      `🎲 Rolled **${count}d${sides}**: **${total}**${rollStr}`,
    );
  },
};

export default command;
