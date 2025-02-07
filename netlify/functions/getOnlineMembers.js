import fetch from "node-fetch";

export async function handler() {
  const token = process.env.DISCORD_BOT_TOKEN;
  const guildId = process.env.DISCORD_GUILD_ID;
  
  const url = `https://discord.com/api/v10/guilds/${guildId}?with_counts=true`;

  const response = await fetch(url, {
    headers: {
      "Authorization": `Bot ${token}`,
      "Content-Type": "application/json"
    }
  });

  if (!response.ok) {
    return {
      statusCode: response.status,
      body: JSON.stringify({ error: "Failed to fetch guild info" }),
    };
  }

  const guildData = await response.json();
  const totalCount = guildData.approximate_member_count;

  return {
    statusCode: 200,
    body: JSON.stringify({
      total: totalCount
    }),
  };
}
