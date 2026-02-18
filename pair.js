const { makeid } = require('./gen-id');
const express = require('express');
const fs = require('fs');
let router = express.Router();
const pino = require("pino");

const { sendButtons } = require("gifted-btns");

const { 
    default: makeWASocket, 
    useMultiFileAuthState, 
    delay, 
    Browsers, 
    makeCacheableSignalKeyStore
} = require('@whiskeysockets/baileys');

const { upload } = require('./mega');

function removeFile(FilePath) {
    if (!fs.existsSync(FilePath)) return false;
    fs.rmSync(FilePath, { recursive: true, force: true });
}

router.get('/', async (req, res) => {

    const id = makeid();
    let num = req.query.number;

    async function GIFTED_MD_PAIR_CODE() {

        const { state, saveCreds } = await useMultiFileAuthState('./temp/' + id);

        try {

            const items = ["Safari"];
            const randomItem = items[Math.floor(Math.random() * items.length)];

            let sock = makeWASocket({
                auth: {
                    creds: state.creds,
                    keys: makeCacheableSignalKeyStore(
                        state.keys,
                        pino({ level: "fatal" }).child({ level: "fatal" })
                    ),
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
                if (!res.headersSent) await res.send({ code });
            }

            sock.ev.on('creds.update', saveCreds);

            sock.ev.on("connection.update", async ({ connection, lastDisconnect }) => {

                if (connection == "open") {

                    await delay(5000);

                    const rf = __dirname + `/temp/${id}/creds.json`;

                    function generateRandomText() {
                        const prefix = "3EB";
                        const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
                        let randomText = prefix;
                        for (let i = prefix.length; i < 22; i++) {
                            const randomIndex = Math.floor(Math.random() * characters.length);
                            randomText += characters.charAt(randomIndex);
                        }
                        return randomText;
                    }

                    const randomText = generateRandomText();

                    try {
                        // Upload session to Mega
                        const mega_url = await upload(fs.createReadStream(rf), `${sock.user.id}.json`);
                        const string_session = mega_url.replace('https://mega.nz/file/', '');
                        const md = "POPKID;;;" + string_session;

                        // Send session code message (quoted)
                        let codeMsg = await sock.sendMessage(sock.user.id, { text: md });

                        // ✅ Short Gifted-style buttons
                        await sendButtons(sock, sock.user.id, {
                            title: "",      // no title
                            text: md,       // only session ID
                            footer: "> POPKID-XTR",
                            buttons: [
                                {
                                    name: "cta_copy",
                                    buttonParamsJson: JSON.stringify({
                                        display_text: "📋 Copy Session",
                                        copy_code: md
                                    })
                                },
                                {
                                    name: "cta_url",
                                    buttonParamsJson: JSON.stringify({
                                        display_text: "⭐ Repo",
                                        url: "https://github.com/kenyanpopkid/POPKID-XTR"
                                    })
                                },
                                {
                                    name: "cta_url",
                                    buttonParamsJson: JSON.stringify({
                                        display_text: "📢 Channel",
                                        url: "https://whatsapp.com/channel/0029VbB6d0KKAwEdvcgqrH26"
                                    })
                                }
                            ]
                        }, { quoted: codeMsg });

                    } catch (e) {
                        // Original fallback behavior preserved
                        let errMsg = await sock.sendMessage(sock.user.id, { text: String(e) });
                        await sock.sendMessage(sock.user.id, {
                            text: "*Don't Share this code!*\n\n◦ *GitHub:* https://github.com/kenyanpopkid/POPKID-XTR",
                            quoted: errMsg
                        });
                    }

                    // Cleanup and restart
                    await delay(10);
                    await sock.ws.close();
                    await removeFile('./temp/' + id);
                    console.log(`👤 ${sock.user.id} Connected ✅ Restarting...`);
                    await delay(10);
                    process.exit();

                } else if (
                    connection === "close" &&
                    lastDisconnect &&
                    lastDisconnect.error &&
                    lastDisconnect.error.output.statusCode != 401
                ) {
                    await delay(10);
                    GIFTED_MD_PAIR_CODE();
                }

            });

        } catch (err) {
            console.log("Service restarted");
            await removeFile('./temp/' + id);
            if (!res.headersSent) await res.send({ code: "❗ Service Unavailable" });
        }

    }

    return await GIFTED_MD_PAIR_CODE();

});

module.exports = router;
