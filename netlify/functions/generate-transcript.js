import fs from 'fs';
import fetch from 'node-fetch'; // Use native fetch if using Node.js 18+

const AUTH_KEY = process.env.AUTH_KEY; // Set this in Netlify's environment variables

export async function handler(event) {
    // Only allow POST requests
    if (event.httpMethod !== "POST") {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: "Method Not Allowed" }),
        };
    }

    // Parse the request body
    const { botToken, channelId } = JSON.parse(event.body);
    const providedAuthKey = event.headers['authorization'] || event.headers['Authorization'];

    // Validate the auth key
    if (!providedAuthKey || providedAuthKey !== AUTH_KEY) {
        return {
            statusCode: 403,
            body: JSON.stringify({ error: "Unauthorized: Invalid API key." }),
        };
    }

    // Validate required fields
    if (!botToken || !channelId) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: "Bot token and channel ID are required." }),
        };
    }

    try {
        // Fetch messages from Discord
        const messages = await getMessages(botToken, channelId);
        if (!messages.length) {
            return {
                statusCode: 404,
                body: JSON.stringify({ error: "No messages found." }),
            };
        }

        // Generate the HTML transcript
        const fileName = `transcript_${Date.now()}.html`;
        const filePath = `/tmp/${fileName}`; // Save in Netlify's /tmp directory
        generateHTML(messages, filePath);

        // Generate a public link to the transcript
        const fileLink = `https://wearedegenerates.org/transcripts/${fileName}`;

        // Return the link in the response
        return {
            statusCode: 200,
            body: JSON.stringify({ message: "Transcript generated", link: fileLink }),
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message }),
        };
    }
}

// Fetch messages from Discord
async function getMessages(botToken, channelId) {
    const response = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages?limit=50`, {
        method: "GET",
        headers: {
            "Authorization": `Bot ${botToken}`,
            "Content-Type": "application/json",
        },
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch messages: ${response.statusText}`);
    }

    return await response.json();
}

// Generate HTML from messages
function generateHTML(messages, filePath) {
    const htmlContent = `
    <html>
    <head><title>Chat Transcript</title></head>
    <body>
        <h1>Chat Transcript</h1>
        <ul>
            ${messages.map(msg => {
                let content = `<li><strong>${msg.author.username}:</strong> ${msg.content}</li>`;

                // Add images if available
                if (msg.attachments && msg.attachments.length > 0) {
                    msg.attachments.forEach(attachment => {
                        content += `<li><img src="${attachment.url}" alt="Image" style="max-width:300px;"></li>`;
                    });
                }

                // Add embeds if available
                if (msg.embeds && msg.embeds.length > 0) {
                    msg.embeds.forEach(embed => {
                        content += `<li><strong>Embed:</strong> ${embed.title || 'No Title'}<br>
                                    ${embed.description || ''}<br>`;
                        if (embed.image) {
                            content += `<img src="${embed.image.url}" alt="Embed Image" style="max-width:300px;">`;
                        }
                        content += `</li>`;
                    });
                }

                return content;
            }).join('')}
        </ul>
    </body>
    </html>`;

    fs.writeFileSync(filePath, htmlContent);
    console.log(`Transcript saved at: ${filePath}`);
}
