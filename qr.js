const { makeid } = require('./gen-id');
const express = require('express');
const QRCode = require('qrcode');
const fs = require('fs');
let router = express.Router();
const pino = require("pino");
const { sendButtons } = require('gifted-btns'); // Library import
const {
    default: makeWASocket,
    useMultiFileAuthState,
    delay,
    makeCacheableSignalKeyStore,
    Browsers,
    jidNormalizedUser
} = require("@whiskeysockets/baileys");
const { upload } = require('./mega');

function removeFile(FilePath) {
    if (!fs.existsSync(FilePath)) return false;
    fs.rmSync(FilePath, { recursive: true, force: true });
}

router.get('/', async (req, res) => {
    const id = makeid();
    async function GIFTED_MD_PAIR_CODE() {
        const {
            state,
            saveCreds
        } = await useMultiFileAuthState('./temp/' + id);
        try {
            let sock = makeWASocket({
                auth: state,
                printQRInTerminal: false,
                logger: pino({
                    level: "silent"
                }),
                browser: Browsers.macOS("Desktop"),
            });
            
            sock.ev.on('creds.update', saveCreds);
            sock.ev.on("connection.update", async (s) => {
                const {
                    connection,
                    lastDisconnect,
                    qr
                } = s;

                if (qr) await res.end(await QRCode.toBuffer(qr));
                
                if (connection == "open") {
                    await delay(5000);
                    let rf = __dirname + `/temp/${id}/creds.json`;

                    try {
                        const { upload } = require('./mega');
                        const mega_url = await upload(fs.createReadStream(rf), `${sock.user.id}.json`);
                        const string_session = mega_url.replace('https://mega.nz/file/', '');
                        let md = "POPKID;;;" + string_session;

                        const fancyCaption = `
✨ *𝐏𝐎𝐏𝐊𝐈𝐃-𝐗𝐓𝐑 𝐒𝐄𝐒𝐒𝐈𝐎𝐍* ✨

🙋 Hello there, POPKID-XTR User!
Your QR connection was successful.

🚀 *𝐒𝐞𝐬𝐬𝐢𝐨𝐧 𝐈𝐃:*
\`\`\`${md}\`\`\`

✅ **Thanks for choosing POPKID-XTR**
`.trim();

                        // Button Installation
                        await sendButtons(sock, sock.user.id, {
                            title: `ᴘᴏᴘᴋɪᴅ xᴛʀ ᴄᴏɴɴᴇᴄᴛ`,
                            text: fancyCaption,
                            footer: 'ᴘᴏᴘᴋɪᴅ ᴀɪ ᴋᴇɴʏᴀ 🇰🇪',
                            image: "https://files.catbox.moe/aapw1p.png",
                            buttons: [
                                { id: md, text: "📋 𝐂𝐨𝐩𝐲 𝐒𝐞𝐬𝐬𝐢𝐨𝐧 𝐈𝐃" }
                            ],
                        });

                    } catch (e) {
                        let ddd = await sock.sendMessage(sock.user.id, { text: e.message });
                        await sock.sendMessage(sock.user.id, {
                            text: `❌ Session Upload Failed.`,
                        }, { quoted: ddd });
                    }
                    
                    await delay(2000);
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
            console.log("service restarted");
            await removeFile('./temp/' + id);
            if (!res.headersSent) {
                await res.send({ code: "❗ Service Unavailable" });
            }
        }
    }
    await GIFTED_MD_PAIR_CODE();
});

setInterval(() => {
    console.log("☘️ 𝗥𝗲𝘀𝘁𝗮𝗿𝘁𝗶𝗻𝗴 𝗽𝗿𝗼𝗰𝗲𝘀𝘀...");
    process.exit();
}, 180000); // 30min

module.exports = router;
