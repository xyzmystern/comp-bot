import { Client } from "discord.js";
import { db } from "@workspace/db";
import { remindersTable } from "@workspace/db";
import { eq, lte, and } from "drizzle-orm";
import { logger } from "../lib/logger";

export function startReminderLoop(client: Client): void {
  setInterval(async () => {
    try {
      const due = await db
        .select()
        .from(remindersTable)
        .where(
          and(
            eq(remindersTable.sent, false),
            lte(remindersTable.remindAt, new Date()),
          ),
        );

      for (const reminder of due) {
        try {
          const channel = await client.channels
            .fetch(reminder.channelId)
            .catch(() => null);
          if (channel?.isTextBased() && "send" in channel) {
            await channel.send(
              `⏰ <@${reminder.userId}> Reminder: **${reminder.message}**`,
            );
          }
          await db
            .update(remindersTable)
            .set({ sent: true })
            .where(eq(remindersTable.id, reminder.id));
        } catch (err) {
          logger.error({ err, reminderId: reminder.id }, "Failed to send reminder");
        }
      }
    } catch (err) {
      logger.error({ err }, "Error in reminder loop");
    }
  }, 10_000); // check every 10 seconds
}
