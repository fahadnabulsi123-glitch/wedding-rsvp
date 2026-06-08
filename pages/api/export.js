import { supabase } from '../../lib/supabase'
import * as XLSX from 'xlsx'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()

  const { data: guests, error } = await supabase
    .from('guests')
    .select('*')
    .order('created_at', { ascending: true })

  if (error) return res.status(500).json({ error: error.message })

  const rows = guests.map(g => ({
    'Name': g.name,
    'Name (Arabic)': g.name_ar || '',
    'Phone': g.phone,
    'Status': g.status,
    'Invite Sent': g.invite_sent_at ? new Date(g.invite_sent_at).toLocaleDateString() : 'No',
    'Responded At': g.responded_at ? new Date(g.responded_at).toLocaleDateString() : '-',
    'Reminders Sent': g.reminder_count || 0
  }))

  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.json_to_sheet(rows)
  XLSX.utils.book_append_sheet(wb, ws, 'Guests')

  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  res.setHeader('Content-Disposition', 'attachment; filename=wedding-guests.xlsx')
  res.send(buffer)
}
