const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  const token = process.env.DISCORD_BOT_TOKEN;
  const guildId = process.env.GUILD_ID;

  try {
    const response = await fetch(`https://discord.com/api/v10/guilds/${guildId}/members`, {
      method: 'GET',
      headers: {
        'Authorization': `Bot ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Error fetching members: ${response.statusText}`);
    }

    const members = await response.json();
    const memberCount = members.length;

    return {
      statusCode: 200,
      body: JSON.stringify({ memberCount }),
    };
  } catch (error) {
    console.error('Error fetching member count:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to fetch member count' }),
    };
  }
};
