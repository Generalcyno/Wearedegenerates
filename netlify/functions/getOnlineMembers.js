import fetch from "node-fetch";

export async function handler() {
    const token = process.env.DISCORD_BOT_TOKEN;
    const guildId = process.env.DISCORD_GUILD_ID;

    const response = await fetch(`https://discord.com/api/v10/guilds/${guildId}/members?limit=1000`, {
        headers: {
            "Authorization": `Bot ${token}`,
            "Content-Type": "application/json"
        }
    });

    if (!response.ok) {
        return {
            statusCode: response.status,
            body: JSON.stringify({ error: "Failed to fetch members" }),
        };
    }

    const members = await response.json();
    const totalCount = members.length;
    const onlineCount = members.filter(member => member.presence?.status === "online").length;

    return {
        statusCode: 200,
        body: JSON.stringify({
            total_members: totalCount.toLocaleString(),
            online_members: onlineCount.toLocaleString()
        }),
    };
}
