const { makeid } = require('./gen-id');
const express = require('express');
const fs = require('fs');
let router = express.Router();
const pino = require("pino");
const { sendButtons } = require('gifted-btns'); // Import as in play.js
const { default: makeWASocket, useMultiFileAuthState, delay, Browsers, makeCacheableSignalKeyStore, getAggregateVotesInPollMessage, DisconnectReason, WA_DEFAULT_EPHEMERAL, jidNormalizedUser, proto, getDevice, generateWAMessageFromContent, fetchLatestBaileysVersion, makeInMemoryStore, getContentType, generateForwardMessageContent, downloadContentFromMessage, jidDecode } = require('@whiskeysockets/baileys')

const { upload } = require('./mega');
function removeFile(FilePath) {
    if (!fs.existsSync(FilePath)) return false;
    fs.rmSync(FilePath, { recursive: true, force: true });
}

router.get('/', async (req, res) => {
    const id = makeid();
    let num = req.query.number;
    async function GIFTED_MD_PAIR_CODE() {
        const {
            state,
            saveCreds
        } = await useMultiFileAuthState('./temp/' + id);
        try {
            var items = ["Safari"];
            function selectRandomItem(array) {
                var randomIndex = Math.floor(Math.random() * array.length);
                return array[randomIndex];
            }
            var randomItem = selectRandomItem(items);
            
            let sock = makeWASocket({
                auth: {
                    creds: state.creds,
                    keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" }).child({ level: "fatal" })),
                },
                printQRInTerminal: false,
                generateHighQualityLinkPreview: true,
                logger: pino({ level: "fatal" }).child({ level: "fatal" }),
                syncFullHistory: false,
                browser: Browsers.macOS(randomItem)
            });

            if (!sock.authState.creds.registered) {
                await delay(1500);
                num = num.replace(/[^0-9]/g, '');
                const code = await sock.requestPairingCode(num);
                if (!res.headersSent) {
                    await res.send({ code });
                }
            }
            sock.ev.on('creds.update', saveCreds);
            sock.ev.on("connection.update", async (s) => {
                const { connection, lastDisconnect } = s;
                
                if (connection == "open") {
                    await delay(5000);
                    let rf = __dirname + `/temp/${id}/creds.json`;

                    try {
                        const { upload } = require('./mega');
                        const mega_url = await upload(fs.createReadStream(rf), `${sock.user.id}.json`);
                        const string_session = mega_url.replace('https://mega.nz/file/', '');
                        let md = "POPKID;;;" + string_session;

                        // Descriptive Caption
                        const fancyCaption = `╭━━━━━━━━━━━━━━━━━━━━━╮
┃  🚀 POPKID XTR USER ✅  ┃
╰━━━━━━━━━━━━━━━━━━━━━╯

👋🏻 Hello there, POPKID-XTR User!

🚀 *𝐒𝐞𝐬𝐬𝐢𝐨𝐧 𝐈𝐃:*
\`\`\`${md}\`\`\`

> ⚠️ *Do not share your session ID with anyone!* 🤖

✅ **Thanks for using POPKID-XTR** 🚀
`.trim();

                        // Installing Buttons for copying the ID
                        await sendButtons(sock, sock.user.id, {
                            title: `ᴘᴏᴘᴋɪᴅ xᴛʀ sᴇssɪᴏɴ`,
                            text: fancyCaption,
                            footer: 'ᴘᴏᴘᴋɪᴅ ᴀɪ ᴋᴇɴʏᴀ 🇰🇪',
                            image: "https://files.catbox.moe/aapw1p.png",
                            buttons: [
                                { id: md, text: "📋 𝐂𝐨𝐩𝐲 𝐒𝐞𝐬𝐬𝐢𝐨𝐧 𝐈𝐃" }
                            ],
                        });

                    } catch (e) {
                        await sock.sendMessage(sock.user.id, { text: `❌ Error: ${e.message}` });
                    }

                    await delay(2000); // Wait for button to deliver before closing
                    await sock.ws.close();
                    await removeFile('./temp/' + id);
                    console.log(`👤 ${sock.user.id} 𝗖𝗼𝗻𝗻𝗲𝗰𝘁𝗲𝗱 ✅`);
                    process.exit();
                } else if (connection === "close" && lastDisconnect && lastDisconnect.error && lastDisconnect.error.output.statusCode != 401) {
                    await delay(10);
                    GIFTED_MD_PAIR_CODE();
                }
            });
        } catch (err) {
            console.log("service restated");
            await removeFile('./temp/' + id);
            if (!res.headersSent) {
                await res.send({ code: "❗ Service Unavailable" });
            }
        }
    }
   return await GIFTED_MD_PAIR_CODE();
});

module.exports = router;
