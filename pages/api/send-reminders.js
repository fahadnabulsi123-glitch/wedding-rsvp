import { supabase } from '../../lib/supabase'
import { sendReminder } from '../../lib/whatsapp'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  try {
    const { data: guests, error } = await supabase
      .from('guests')
      .select('*')
      .eq('status', 'pending')
      .not('invite_sent_at', 'is', null)

    if (error) throw error

    const results = []
    for (const guest of guests) {
      try {
        await sendReminder(guest)
        await supabase
          .from('guests')
          .update({
            last_reminder_at: new Date().toISOString(),
            reminder_count: (guest.reminder_count || 0) + 1
          })
          .eq('id', guest.id)
        results.push({ id: guest.id, name: guest.name, success: true })
        await new Promise(r => setTimeout(r, 300))
      } catch (err) {
        results.push({ id: guest.id, name: guest.name, success: false, error: err.message })
      }
    }

    res.status(200).json({ results, total: results.length })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
