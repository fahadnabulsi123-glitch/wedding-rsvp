import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import Head from 'next/head'
import * as XLSX from 'xlsx'

export default function Dashboard() {
  const [guests, setGuests] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [sending, setSending] = useState(false)
  const [reminding, setReminding] = useState(false)
  const [toast, setToast] = useState(null)
  const [filter, setFilter] = useState('all')
  const fileRef = useRef()

  const stats = {
    total: guests.length,
    confirmed: guests.filter(g => g.status === 'confirmed').length,
    declined: guests.filter(g => g.status === 'declined').length,
    pending: guests.filter(g => g.status === 'pending').length,
  }

  useEffect(() => { fetchGuests() }, [])

  async function fetchGuests() {
    setLoading(true)
    const { data } = await supabase.from('guests').select('*').order('created_at', { ascending: true })
    setGuests(data || [])
    setLoading(false)
  }

  function showToast(msg, type = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 4000)
  }

  async function handleFileUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    try {
      const buffer = await file.arrayBuffer()
      const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)))
      const res = await fetch('/api/upload-guests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileData: base64 })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      showToast(`✓ ${data.count} guests uploaded successfully`)
      fetchGuests()
    } catch (err) {
      showToast(err.message, 'error')
    }
    setUploading(false)
    fileRef.current.value = ''
  }

  async function handleSendInvites() {
    if (!confirm(`Send WhatsApp invites to all ${stats.total} guests who haven't been invited yet?`)) return
    setSending(true)
    try {
      const res = await fetch('/api/send-invites', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) })
      const data = await res.json()
      const success = data.results?.filter(r => r.success).length || 0
      showToast(`✓ Invites sent to ${success} guests`)
      fetchGuests()
    } catch (err) {
      showToast(err.message, 'error')
    }
    setSending(false)
  }

  async function handleSendReminders() {
    if (!confirm(`Send WhatsApp reminders to all ${stats.pending} pending guests?`)) return
    setReminding(true)
    try {
      const res = await fetch('/api/send-reminders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) })
      const data = await res.json()
      showToast(`✓ Reminders sent to ${data.total} guests`)
      fetchGuests()
    } catch (err) {
      showToast(err.message, 'error')
    }
    setReminding(false)
  }

  async function handleExport() {
    window.open('/api/export', '_blank')
  }

  async function handleDeleteGuest(id) {
    await supabase.from('guests').delete().eq('id', id)
    fetchGuests()
  }

  const filteredGuests = guests.filter(g => filter === 'all' || g.status === filter)

  return (
    <>
      <Head>
        <title>Fahad & Sema Wedding — Guest Manager</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=Tajawal:wght@300;400;500&display=swap" rel="stylesheet" />
      </Head>

      <style jsx global>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { background: #0d0a08; color: #f5efe8; font-family: 'Cormorant Garamond', Georgia, serif; min-height: 100vh; }
        .header {
          border-bottom: 1px solid rgba(201,169,110,0.2);
          padding: 2rem 3rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 1rem;
        }
        .header-left { }
        .header-title-ar { font-family: 'Tajawal', sans-serif; font-size: 0.85rem; color: #c9a96e; direction: rtl; }
        .header-title { font-size: 1.8rem; font-style: italic; font-weight: 300; color: #f5efe8; }
        .header-sub { font-size: 0.85rem; color: #a89880; letter-spacing: 0.15em; text-transform: uppercase; }
        .main { padding: 2rem 3rem; max-width: 1200px; margin: 0 auto; }
        .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 2.5rem; }
        .stat-card {
          border: 1px solid rgba(201,169,110,0.15);
          padding: 1.5rem;
          text-align: center;
          background: rgba(201,169,110,0.03);
          transition: border-color 0.2s;
        }
        .stat-card:hover { border-color: rgba(201,169,110,0.4); }
        .stat-number { font-size: 2.8rem; font-weight: 300; color: #c9a96e; line-height: 1; }
        .stat-label { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.2em; color: #a89880; margin-top: 0.5rem; }
        .stat-confirmed .stat-number { color: #7cb87c; }
        .stat-declined .stat-number { color: #c47c7c; }
        .stat-pending .stat-number { color: #c9a96e; }
        .actions { display: flex; gap: 1rem; margin-bottom: 2rem; flex-wrap: wrap; }
        .btn {
          padding: 0.7rem 1.5rem;
          font-family: 'Cormorant Garamond', serif;
          font-size: 0.95rem;
          cursor: pointer;
          border: 1px solid #c9a96e;
          transition: all 0.2s;
          letter-spacing: 0.05em;
          white-space: nowrap;
        }
        .btn-primary { background: #c9a96e; color: #0d0a08; }
        .btn-primary:hover { background: #e8c882; }
        .btn-outline { background: transparent; color: #c9a96e; }
        .btn-outline:hover { background: rgba(201,169,110,0.1); }
        .btn-danger { border-color: #c47c7c; color: #c47c7c; background: transparent; }
        .btn-danger:hover { background: rgba(196,124,124,0.1); }
        .btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .file-input { display: none; }
        .filters { display: flex; gap: 0.5rem; margin-bottom: 1.5rem; flex-wrap: wrap; }
        .filter-btn {
          padding: 0.4rem 1rem;
          font-size: 0.8rem;
          font-family: 'Cormorant Garamond', serif;
          cursor: pointer;
          border: 1px solid rgba(201,169,110,0.3);
          background: transparent;
          color: #a89880;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          transition: all 0.2s;
        }
        .filter-btn.active { background: rgba(201,169,110,0.15); color: #c9a96e; border-color: #c9a96e; }
        table { width: 100%; border-collapse: collapse; }
        th {
          text-align: left;
          padding: 0.75rem 1rem;
          font-size: 0.7rem;
          text-transform: uppercase;
          letter-spacing: 0.2em;
          color: #a89880;
          border-bottom: 1px solid rgba(201,169,110,0.15);
          font-weight: 400;
        }
        td {
          padding: 0.85rem 1rem;
          font-size: 0.95rem;
          border-bottom: 1px solid rgba(255,255,255,0.04);
          color: #d4c5b0;
        }
        tr:hover td { background: rgba(201,169,110,0.03); }
        .badge {
          display: inline-block;
          padding: 0.2rem 0.7rem;
          font-size: 0.75rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          border-radius: 0;
        }
        .badge-confirmed { background: rgba(124,184,124,0.15); color: #7cb87c; border: 1px solid rgba(124,184,124,0.3); }
        .badge-declined { background: rgba(196,124,124,0.15); color: #c47c7c; border: 1px solid rgba(196,124,124,0.3); }
        .badge-pending { background: rgba(201,169,110,0.1); color: #c9a96e; border: 1px solid rgba(201,169,110,0.3); }
        .delete-btn {
          background: none;
          border: none;
          color: rgba(196,124,124,0.4);
          cursor: pointer;
          font-size: 1rem;
          padding: 0.2rem 0.5rem;
          transition: color 0.2s;
        }
        .delete-btn:hover { color: #c47c7c; }
        .empty { text-align: center; padding: 4rem; color: #a89880; font-style: italic; }
        .toast {
          position: fixed;
          bottom: 2rem;
          right: 2rem;
          padding: 1rem 1.5rem;
          border: 1px solid #c9a96e;
          background: #1a1510;
          color: #f5efe8;
          font-size: 0.9rem;
          animation: slideUp 0.3s ease;
          z-index: 100;
          max-width: 350px;
        }
        .toast.error { border-color: #c47c7c; color: #c47c7c; }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .template-box {
          border: 1px solid rgba(201,169,110,0.2);
          padding: 1rem 1.5rem;
          margin-bottom: 2rem;
          background: rgba(201,169,110,0.03);
          font-size: 0.8rem;
          color: #a89880;
        }
        .template-title { color: #c9a96e; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.2em; margin-bottom: 0.5rem; }
        code { font-family: monospace; background: rgba(255,255,255,0.05); padding: 0.1rem 0.4rem; }
        @media (max-width: 768px) {
          .header { padding: 1.5rem; }
          .main { padding: 1.5rem; }
          .stats { grid-template-columns: repeat(2, 1fr); }
          th:nth-child(4), td:nth-child(4),
          th:nth-child(5), td:nth-child(5) { display: none; }
        }
      `}</style>

      <div className="header">
        <div className="header-left">
          <div className="header-title-ar">إدارة ضيوف حفل الزفاف</div>
          <div className="header-title">Fahad & Sema — Wedding Guest Manager</div>
          <div className="header-sub">RSVP Dashboard</div>
        </div>
      </div>

      <div className="main">
        {/* Stats */}
        <div className="stats">
          <div className="stat-card">
            <div className="stat-number">{stats.total}</div>
            <div className="stat-label">Total Guests</div>
          </div>
          <div className="stat-card stat-confirmed">
            <div className="stat-number">{stats.confirmed}</div>
            <div className="stat-label">Confirmed ✓</div>
          </div>
          <div className="stat-card stat-declined">
            <div className="stat-number">{stats.declined}</div>
            <div className="stat-label">Declined ✗</div>
          </div>
          <div className="stat-card stat-pending">
            <div className="stat-number">{stats.pending}</div>
            <div className="stat-label">Pending ·</div>
          </div>
        </div>

        {/* Excel Template Guide */}
        <div className="template-box">
          <div className="template-title">📋 Excel Template Format</div>
          Your Excel file should have these column headers: <code>Name</code> &nbsp;|&nbsp; <code>Name AR</code> &nbsp;|&nbsp; <code>Phone</code>
          &nbsp;&nbsp; Phone numbers must include country code, e.g. <code>+966501234567</code>
        </div>

        {/* Actions */}
        <div className="actions">
          <input ref={fileRef} type="file" accept=".xlsx,.xls" className="file-input" onChange={handleFileUpload} />
          <button className="btn btn-primary" onClick={() => fileRef.current.click()} disabled={uploading}>
            {uploading ? 'Uploading...' : '↑ Upload Guest List'}
          </button>
          <button className="btn btn-outline" onClick={handleSendInvites} disabled={sending || stats.total === 0}>
            {sending ? 'Sending...' : `✉ Send Invites (${guests.filter(g => !g.invite_sent_at).length} unsent)`}
          </button>
          <button className="btn btn-outline" onClick={handleSendReminders} disabled={reminding || stats.pending === 0}>
            {reminding ? 'Sending...' : `🔔 Send Reminders (${stats.pending} pending)`}
          </button>
          <button className="btn btn-outline" onClick={fetchGuests}>↻ Refresh</button>
          <button className="btn btn-outline" onClick={handleExport} disabled={stats.total === 0}>↓ Export Excel</button>
        </div>

        {/* Filters */}
        <div className="filters">
          {['all', 'confirmed', 'pending', 'declined'].map(f => (
            <button key={f} className={`filter-btn ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
              {f} {f !== 'all' ? `(${stats[f] ?? guests.filter(g => g.status === f).length})` : `(${stats.total})`}
            </button>
          ))}
        </div>

        {/* Guest Table */}
        {loading ? (
          <div className="empty">Loading guests...</div>
        ) : filteredGuests.length === 0 ? (
          <div className="empty">
            {guests.length === 0
              ? 'No guests yet. Upload your Excel file to get started.'
              : `No ${filter} guests.`}
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Phone</th>
                <th>Status</th>
                <th>Invite Sent</th>
                <th>Reminders</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredGuests.map((g, i) => (
                <tr key={g.id}>
                  <td style={{ color: '#a89880', fontSize: '0.8rem' }}>{i + 1}</td>
                  <td>
                    <div>{g.name}</div>
                    {g.name_ar && <div style={{ fontFamily: 'Tajawal, sans-serif', fontSize: '0.85rem', color: '#a89880', direction: 'rtl' }}>{g.name_ar}</div>}
                  </td>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{g.phone}</td>
                  <td><span className={`badge badge-${g.status}`}>{g.status}</span></td>
                  <td style={{ fontSize: '0.85rem' }}>{g.invite_sent_at ? new Date(g.invite_sent_at).toLocaleDateString() : <span style={{ color: '#a89880' }}>—</span>}</td>
                  <td style={{ fontSize: '0.85rem', color: '#a89880' }}>{g.reminder_count || 0}</td>
                  <td><button className="delete-btn" onClick={() => handleDeleteGuest(g.id)} title="Remove guest">✕</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {toast && <div className={`toast ${toast.type === 'error' ? 'error' : ''}`}>{toast.msg}</div>}
    </>
  )
}
