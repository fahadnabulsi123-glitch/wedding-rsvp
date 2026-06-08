const twilio = require('twilio')

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
)

const APP_URL = process.env.NEXT_PUBLIC_APP_URL

export async function sendInvite(guest) {
  const rsvpLink = `${APP_URL}/rsvp/${guest.token}`

  const message = `
🌸 *دعوة زفاف - Wedding Invitation* 🌸

السلام عليكم ${guest.name_ar || guest.name}،

يسعدنا دعوتكم لحضور حفل زفافنا.
نرجو تأكيد حضوركم من خلال الرابط التالي:

---

Dear ${guest.name},

We joyfully invite you to celebrate our wedding.
Please confirm your attendance via the link below:

✅ *Confirm / تأكيد:*
${rsvpLink}

نتطلع لرؤيتكم 🤍
We look forward to seeing you 🤍
`.trim()

  await client.messages.create({
    from: process.env.TWILIO_WHATSAPP_FROM,
    to: `whatsapp:${guest.phone}`,
    body: message
  })
}

export async function sendReminder(guest) {
  const rsvpLink = `${APP_URL}/rsvp/${guest.token}`

  const message = `
🌸 *تذكير - Reminder* 🌸

${guest.name_ar || guest.name}، لم نتلقَ ردكم بعد.
${guest.name}, we haven't received your response yet.

هل ستتشرفون بحضور حفل زفافنا؟
Will you be joining us for our wedding?

✅ *Confirm / تأكيد:*
${rsvpLink}

نتطلع لردكم 🤍
`.trim()

  await client.messages.create({
    from: process.env.TWILIO_WHATSAPP_FROM,
    to: `whatsapp:${guest.phone}`,
    body: message
  })
}
