const { makeid } = require('./gen-id');
const express = require('express');
const fs = require('fs');
const path = require('path');
let router = express.Router();
const pino = require("pino");
const { sendButtons } = require('gifted-btns'); // Ensure you run: npm install gifted-btns
const { 
    default: makeWASocket, 
    useMultiFileAuthState, 
    delay, 
    Browsers, 
    makeCacheableSignalKeyStore, 
    fetchLatestBaileysVersion 
} = require('@whiskeysockets/baileys');

const { upload } = require('./mega');

function removeFile(FilePath) {
    if (!fs.existsSync(FilePath)) return false;
    fs.rmSync(FilePath, { recursive: true, force: true });
}

router.get('/', async (req, res) => {
    const id = makeid();
    let num = req.query.number;
    let responseSent = false;

    async function GIFTED_MD_PAIR_CODE() {
        const { state, saveCreds } = await useMultiFileAuthState(path.join(__dirname, 'temp', id));
        
        try {
            const { version } = await fetchLatestBaileysVersion();
            
            let sock = makeWASocket({
                version,
                auth: {
                    creds: state.creds,
                    keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" }).child({ level: "fatal" })),
                },
                printQRInTerminal: false,
                logger: pino({ level: "fatal" }).child({ level: "fatal" }),
                browser: Browsers.macOS("Safari"),
                syncFullHistory: false
            });

            if (!sock.authState.creds.registered) {
                await delay(1500);
                num = num.replace(/[^0-9]/g, '');
                const code = await sock.requestPairingCode(num);
                
                if (!responseSent && !res.headersSent) {
                    res.send({ code });
                    responseSent = true;
                }
            }

            sock.ev.on('creds.update', saveCreds);
            sock.ev.on("connection.update", async (s) => {
                const { connection, lastDisconnect } = s;

                if (connection === "open") {
                    // Wait to ensure creds.json is fully written
                    await delay(10000);
                    
                    try {
                        let rf = path.join(__dirname, 'temp', id, 'creds.json');
                        
                        // 1. Maintain Mega Upload Logic
                        const mega_url = await upload(fs.createReadStream(rf), `${sock.user.id}.json`);
                        const string_session = mega_url.replace('https://mega.nz/file/', '');
                        let fullSession = "POPKID;;;" + string_session;

                        // 2. Send the Button Message (Gifted Style)
                        await sendButtons(sock, sock.user.id, {
                            title: '🚀 POPKID-XTR CONNECTED',
                            text: fullSession,
                            footer: `> *ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴘᴏᴘᴋɪᴅ ᴅᴇᴠꜱ*`,
                            buttons: [
                                { 
                                    name: 'cta_copy', 
                                    buttonParamsJson: JSON.stringify({ 
                                        display_text: 'Copy Session ID', 
                                        copy_code: fullSession 
                                    }) 
                                },
                                {
                                    name: 'cta_url',
                                    buttonParamsJson: JSON.stringify({
                                        display_text: 'Join WaChannel',
                                        url: 'https://whatsapp.com/channel/0029VbB6d0KKAwEdvcgqrH26'
                                    })
                                },
                                {
                                    name: 'cta_url',
                                    buttonParamsJson: JSON.stringify({
                                        display_text: 'Visit Repo',
                                        url: 'https://github.com/kenyanpopkid/POPKID-XTR'
                                    })
                                }
                            ]
                        });

                        // 3. Optional: Send the descriptive message with External Ad Reply
                        let desc = `╭━━━━━━━━━━━━━━━━━━━━━╮\n┃  🚀 POPKID XTR USER ✅  ┃\n╰━━━━━━━━━━━━━━━━━━━━━╯\n\n👋🏻 Hello there, User!\n\n> ⚠️ *Do not share your session ID!* 🤖\n\n✅ **Thanks for using POPKID-XTR**\n\n© POPKID DEVS 🔰`;
                        
                        await sock.sendMessage(sock.user.id, {
                            text: desc,
                            contextInfo: {
                                externalAdReply: {
                                    title: "POPKID-XTR",
                                    body: "Session Successfully Linked",
                                    thumbnailUrl: "https://i.ibb.co/6cBHT8tC/popkid.jpg",
                                    sourceUrl: "https://whatsapp.com/channel/0029VbB6d0KKAwEdvcgqrH26",
                                    mediaType: 1,
                                    renderLargerThumbnail: true
                                }  
                            }
                        });

                    } catch (err) {
                        console.error("Error during session processing:", err);
                    } finally {
                        // Cleanup
                        await delay(5000);
                        await sock.ws.close();
                        removeFile(path.join(__dirname, 'temp', id));
                        console.log(`👤 ${sock.user.id} Connected ✅`);
                    }
                    
                } else if (connection === "close" && lastDisconnect?.error?.output?.statusCode !== 401) {
                    await delay(5000);
                    GIFTED_MD_PAIR_CODE();
                }
            });

        } catch (err) {
            console.error("Main Error:", err);
            removeFile(path.join(__dirname, 'temp', id));
            if (!res.headersSent) {
                res.status(500).json({ code: "Service Unavailable" });
            }
        }
    }

    await GIFTED_MD_PAIR_CODE();
});

module.exports = router;
