
const HOOK = process.env.DISCORD_WEBHOOK!;

export async function sendDiscordAlert(message: string, embed?: any) {
  const payload: any = { content: message };
  if (embed) payload.embeds = [embed];
  await fetch(HOOK, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
}
