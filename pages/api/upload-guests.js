import { supabase } from '../../lib/supabase'
import * as XLSX from 'xlsx'

export const config = {
  api: { bodyParser: { sizeLimit: '10mb' } }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  try {
    const { fileData } = req.body
    const buffer = Buffer.from(fileData, 'base64')
    const workbook = XLSX.read(buffer, { type: 'buffer' })
    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    const rows = XLSX.utils.sheet_to_json(sheet)

    const guests = rows.map(row => ({
      name: row['Name'] || row['name'] || row['الاسم'] || '',
      name_ar: row['Name AR'] || row['name_ar'] || row['الاسم بالعربي'] || null,
      phone: String(row['Phone'] || row['phone'] || row['رقم الجوال'] || '').replace(/\s+/g, ''),
      max_guests: parseInt(row['Max Guests'] || row['max_guests'] || row['عدد المدعوين'] || 1)
    })).filter(g => g.name && g.phone)

    // Get existing phones to avoid duplicates
    const { data: existing } = await supabase
      .from('guests')
      .select('phone')

    const existingPhones = new Set((existing || []).map(g => g.phone))

    const newGuests = guests.filter(g => !existingPhones.has(g.phone))
    const skipped = guests.length - newGuests.length

    let inserted = 0
    if (newGuests.length > 0) {
      const { data, error } = await supabase
        .from('guests')
        .insert(newGuests)
        .select()
      if (error) throw error
      inserted = data.length
    }

    res.status(200).json({ 
      success: true, 
      inserted, 
      skipped,
      message: skipped > 0 
        ? `${inserted} guests added, ${skipped} duplicates skipped.`
        : `${inserted} guests added successfully.`
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
}


