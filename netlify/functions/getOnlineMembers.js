const { Client, GatewayIntentBits } = require('discord.js');

exports.handler = async (event, context) => {
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMembers,
    ],
  });

  try {
    await client.login(process.env.DISCORD_BOT_TOKEN); // Log in the bot
    const guild = await client.guilds.fetch(process.env.GUILD_ID); // Fetch the guild
    await guild.members.fetch(); // Fetch all members
    const memberCount = guild.memberCount; // Get total member count

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
  } finally {
    client.destroy(); // Destroy the client to free resources
  }
};
