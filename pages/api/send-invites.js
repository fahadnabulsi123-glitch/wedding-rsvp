import { supabase } from '../../lib/supabase'
import { sendInvite } from '../../lib/whatsapp'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  try {
    const { guestIds } = req.body

    let query = supabase.from('guests').select('*')
    if (guestIds && guestIds.length > 0) {
      query = query.in('id', guestIds)
    } else {
      query = query.is('invite_sent_at', null)
    }

    const { data: guests, error } = await query
    if (error) throw error

    const results = []
    for (const guest of guests) {
      try {
        await sendInvite(guest)
        await supabase
          .from('guests')
          .update({ invite_sent_at: new Date().toISOString() })
          .eq('id', guest.id)
        results.push({ id: guest.id, name: guest.name, success: true })
        // Small delay to avoid rate limiting
        await new Promise(r => setTimeout(r, 300))
      } catch (err) {
        results.push({ id: guest.id, name: guest.name, success: false, error: err.message })
      }
    }

    res.status(200).json({ results })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
