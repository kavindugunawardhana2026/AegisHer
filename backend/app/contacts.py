"""Where victims can submit the generated report.

VERIFY these before each release - phone numbers and portals change.
Last checked: 2026-10-31.
"""

AUTHORITIES = [
    {
        "name": "Sri Lanka CERT (SLCERT|CC)",
        "how": "Online incident reporting portal",
        "link": "https://cert.gov.lk/report_incident",
        "phone": "101 (cyber incident hotline)",
        "email": "report@cert.gov.lk",
    },
    {
        "name": "Sri Lanka Police - Computer Crime Investigation Division (CID)",
        "how": "Written complaint / phone",
        "link": "https://www.police.lk",
        "phone": "011 238 1058",
        "email": None,
    },
    {
        "name": "Police emergency",
        "how": "If you are in immediate danger",
        "link": None,
        "phone": "119",
        "email": None,
    },
]

PLATFORMS = [
    {"name": "StopNCII.org (intimate images - blocks re-uploads on partner platforms)", "link": "https://stopncii.org"},
    {"name": "Facebook Help Centre - report abuse", "link": "https://www.facebook.com/help/"},
    {"name": "Instagram Help Centre - report abuse", "link": "https://help.instagram.com/"},
    {"name": "TikTok - report a problem", "link": "https://www.tiktok.com/legal/report"},
    {"name": "X (Twitter) - report a violation", "link": "https://help.x.com/forms"},
    {"name": "YouTube - report content", "link": "https://support.google.com/youtube/answer/2802027"},
    {"name": "Google Search - content removal", "link": "https://support.google.com/legal/"},
    {"name": "Telegram - abuse", "link": "https://telegram.org/faq#q-there-39s-illegal-content-on-telegram-how-do-i-take-it-down"},
]

# Domain -> platform name, used to label offending URLs in the report.
PLATFORM_DOMAINS = {
    "facebook.com": "Facebook",
    "fb.com": "Facebook",
    "fb.watch": "Facebook",
    "messenger.com": "Facebook Messenger",
    "instagram.com": "Instagram",
    "threads.net": "Threads",
    "threads.com": "Threads",
    "tiktok.com": "TikTok",
    "x.com": "X (Twitter)",
    "twitter.com": "X (Twitter)",
    "youtube.com": "YouTube",
    "youtu.be": "YouTube",
    "t.me": "Telegram",
    "telegram.org": "Telegram",
    "telegram.me": "Telegram",
    "wa.me": "WhatsApp",
    "whatsapp.com": "WhatsApp",
    "reddit.com": "Reddit",
    "snapchat.com": "Snapchat",
    "discord.com": "Discord",
    "discord.gg": "Discord",
    "drive.google.com": "Google Drive",
    "linkedin.com": "LinkedIn",
}
