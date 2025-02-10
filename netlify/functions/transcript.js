import 'dotenv/config';
import fs from 'fs';
import fetch from 'node-fetch';


const AUTH_KEY = process.env.AUTH_KEY; // Load from Netlify env vars

exports.handler = async (event) => {
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: JSON.stringify({ error: "Method Not Allowed" }) };
    }

    const { botToken, channelId } = JSON.parse(event.body);
    const providedAuthKey = event.headers['authorization'];

    // Validate auth key
    if (!providedAuthKey || providedAuthKey !== AUTH_KEY) {
        return { statusCode: 403, body: JSON.stringify({ error: "Unauthorized: Invalid API key." }) };
    }

    if (!botToken || !channelId) {
        return { statusCode: 400, body: JSON.stringify({ error: "Bot token and channel ID are required." }) };
    }

    try {
        const messages = await getMessages(botToken, channelId);
        if (!messages.length) return { statusCode: 404, body: JSON.stringify({ error: "No messages found." }) };

        const filePath = generateHTML(messages);
        const fileLink = `https://wearedegenerates.org/${filePath}`;

        return { statusCode: 200, body: JSON.stringify({ message: "Transcript generated", link: fileLink }) };
    } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
};

async function getMessages(botToken, channelId) {
    const response = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages?limit=50`, {
        method: "GET",
        headers: { "Authorization": `Bot ${botToken}` }
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch messages: ${response.statusText}`);
    }

    return await response.json();
}

function generateHTML(messages) {
    const fileName = `messages_${Date.now()}.html`;
    const filePath = `./public/${fileName}`;

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

    return fileName;
}
