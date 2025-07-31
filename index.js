const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, downloadContentFromMessage } = require("@whiskeysockets/baileys");
const P = require("pino");
const axios = require("axios");
const fs = require("fs");
const ytdl = require("ytdl-core");
const { exec } = require("child_process");
const { downloadFileFromGoogleDrive } = require("./lib/gdrive");

const GROUP_LINK = "https://chat.whatsapp.com/ENuOm0cYcbaLoXBYs6Ppwe?mode=ac_t";

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState("auth_info");
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true,
        logger: P({ level: "silent" })
    });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("messages.upsert", async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const from = msg.key.remoteJid;
        const body = msg.message.conversation || msg.message.extendedTextMessage?.text || "";
        const cmd = body.trim().toLowerCase();

        console.log("[USER]:", cmd);

        if (cmd.startsWith(".song ")) {
            const query = cmd.slice(6);
            sock.sendMessage(from, { text: `🎵 Finding MP3: *${query}*...` });

            const link = `https://www.yt-download.org/api/button/mp3/${encodeURIComponent(query)}`;
            sock.sendMessage(from, { text: `🎶 Download your song:\n${link}` });
        }

        else if (cmd.startsWith(".movie ")) {
            const movie = cmd.slice(7);
            sock.sendMessage(from, { text: `🎬 Movie: *${movie}*` });
            sock.sendMessage(from, {
                text: `🔗 Direct: https://example.com/download/${encodeURIComponent(movie)}\n📥 Torrent: https://1337x.to/search/${encodeURIComponent(movie)}/1/`
            });
        }

        else if (cmd.startsWith(".gdrive ")) {
            const gLink = cmd.split(" ")[1];
            sock.sendMessage(from, { text: `📁 Downloading from Google Drive...\n🔗 ${gLink}` });

            try {
                const filePath = await downloadFileFromGoogleDrive(gLink);
                const fileName = filePath.split("/").pop();

                await sock.sendMessage(from, {
                    document: fs.readFileSync(filePath),
                    fileName: fileName,
                    mimetype: "application/octet-stream"
                });

                fs.unlinkSync(filePath);
            } catch (err) {
                sock.sendMessage(from, { text: `❌ Failed to download file.` });
                console.error(err);
            }
        }

        else if (cmd === ".group") {
            sock.sendMessage(from, { text: `👥 Join our group:\n${GROUP_LINK}` });
        }

        else if (cmd === ".menu") {
            sock.sendMessage(from, {
                text: `✨ *Sky & Poetry Bot* ✨\n\nCommands:\n.song <name>\n.movie <name>\n.gdrive <link>\n.group\n.menu`
            });
        }

        else if (["hi", "hello", "hey"].includes(cmd)) {
            sock.sendMessage(from, { text: `👋 Hello! Type .menu to see what I can do.` });
        }
    });

    sock.ev.on("connection.update", (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === "close") {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) startBot();
        } else if (connection === "open") {
            console.log("✅ Bot connected!");
        }
    });
}

startBot();
