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

    const { data, error } = await supabase
      .from('guests')
      .insert(guests)
      .select()

    if (error) throw error

    res.status(200).json({ success: true, count: data.length, guests: data })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
}


