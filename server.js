require('dotenv').config();
const express = require('express');
const fs = require('fs');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3000;
const AUTH_KEY = process.env.AUTH_KEY; // Load from Netlify env vars

app.use(express.json());
app.use(express.static('public'));

// API endpoint to generate a transcript
app.post('/api/transcript', async (req, res) => {
    const { botToken, channelId } = req.body;
    const providedAuthKey = req.headers['authorization'];

    // Validate auth key
    if (!providedAuthKey || providedAuthKey !== AUTH_KEY) {
        return res.status(403).json({ error: "Unauthorized: Invalid API key." });
    }

    if (!botToken || !channelId) {
        return res.status(400).json({ error: "Bot token and channel ID are required." });
    }

    try {
        const messages = await getMessages(botToken, channelId);
        if (!messages.length) return res.status(404).json({ error: "No messages found." });

        const filePath = generateHTML(messages);
        const fileLink = `https://wearedegenerates.org/${filePath}`;

        res.json({ message: "Transcript generated", link: fileLink });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

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

app.listen(PORT, () => console.log(`API running on port ${PORT}`));
