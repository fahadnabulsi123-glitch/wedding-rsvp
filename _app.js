import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import Head from 'next/head'

export default function RSVPPage() {
  const router = useRouter()
  const { token } = router.query
  const [guest, setGuest] = useState(null)
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!token) return
    supabase
      .from('guests')
      .select('*')
      .eq('token', token)
      .single()
      .then(({ data, error }) => {
        if (error || !data) setStatus('not_found')
        else {
          setGuest(data)
          if (data.status !== 'pending') setStatus(data.status)
        }
        setLoading(false)
      })
  }, [token])

  async function respond(response) {
    setSubmitting(true)
    await supabase
      .from('guests')
      .update({ status: response, responded_at: new Date().toISOString() })
      .eq('token', token)
    setStatus(response)
    setSubmitting(false)
  }

  return (
    <>
      <Head>
        <title>Wedding RSVP - Fahad & Sema</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=Tajawal:wght@300;400&display=swap" rel="stylesheet" />
      </Head>

      <style jsx global>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          min-height: 100vh;
          background: #0d0a08;
          color: #f5efe8;
          font-family: 'Cormorant Garamond', Georgia, serif;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .container {
          max-width: 480px;
          width: 90%;
          text-align: center;
          padding: 3rem 2rem;
          animation: fadeIn 1s ease;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .ornament { color: #c9a96e; font-size: 2rem; letter-spacing: 0.3em; margin-bottom: 1.5rem; }
        .title-ar { font-family: 'Tajawal', sans-serif; font-size: 1.1rem; font-weight: 300; color: #c9a96e; margin-bottom: 0.5rem; direction: rtl; }
        .title-en { font-size: 2.4rem; font-weight: 300; font-style: italic; color: #f5efe8; line-height: 1.2; }
        .names { font-size: 1.8rem; font-weight: 300; color: #c9a96e; margin: 1.5rem 0; letter-spacing: 0.05em; }
        .divider { width: 60px; height: 1px; background: #c9a96e; margin: 1.5rem auto; opacity: 0.5; }
        .greeting-ar { font-family: 'Tajawal', sans-serif; font-size: 1rem; font-weight: 300; direction: rtl; color: #d4c5b0; margin-bottom: 0.5rem; }
        .greeting-en { font-size: 1rem; color: #d4c5b0; font-style: italic; }
        .guest-name { font-size: 1.6rem; color: #f5efe8; margin: 1.5rem 0 0.5rem; font-style: italic; }
        .question-ar { font-family: 'Tajawal', sans-serif; font-size: 1rem; direction: rtl; color: #c9a96e; margin-bottom: 0.3rem; }
        .question-en { font-size: 0.95rem; color: #c9a96e; margin-bottom: 2rem; }
        .buttons { display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; }
        .btn {
          padding: 0.9rem 2.5rem;
          font-family: 'Cormorant Garamond', serif;
          font-size: 1rem;
          cursor: pointer;
          border: 1px solid #c9a96e;
          transition: all 0.3s ease;
          letter-spacing: 0.1em;
        }
        .btn-confirm { background: #c9a96e; color: #0d0a08; }
        .btn-confirm:hover { background: #e8c882; border-color: #e8c882; }
        .btn-decline { background: transparent; color: #c9a96e; }
        .btn-decline:hover { background: rgba(201,169,110,0.1); }
        .btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .response-box { margin-top: 2rem; }
        .response-icon { font-size: 3rem; margin-bottom: 1rem; }
        .response-title-ar { font-family: 'Tajawal', sans-serif; font-size: 1.2rem; direction: rtl; color: #c9a96e; margin-bottom: 0.5rem; }
        .response-title-en { font-size: 1.3rem; font-style: italic; color: #f5efe8; margin-bottom: 1rem; }
        .response-msg { font-size: 0.9rem; color: #a89880; font-style: italic; }
      `}</style>

      <div className="container">
        <div className="ornament">✦ ✦ ✦</div>
        <div className="title-ar">دعوة زفاف</div>
        <div className="title-en">Wedding Invitation</div>
        <div className="names">Fahad & Sema</div>
        <div className="divider" />

        {loading && <p style={{ color: '#a89880', fontStyle: 'italic' }}>Loading...</p>}

        {!loading && status === 'not_found' && (
          <p style={{ color: '#a89880' }}>This invitation link is invalid or has expired.</p>
        )}

        {!loading && guest && !status && (
          <>
            <div className="greeting-ar">نرجو تشريفنا بحضوركم الكريم</div>
            <div className="greeting-en">We joyfully request the pleasure of your company</div>
            <div className="guest-name">{guest.name_ar || guest.name}</div>
            <div className="divider" />
            <div className="question-ar">هل ستتشرفون بحضور حفل زفافنا؟</div>
            <div className="question-en">Will you be joining us to celebrate our wedding?</div>
            <div className="buttons">
              <button className="btn btn-confirm" onClick={() => respond('confirmed')} disabled={submitting}>
                {submitting ? '...' : '✓ Attending / سأحضر'}
              </button>
              <button className="btn btn-decline" onClick={() => respond('declined')} disabled={submitting}>
                {submitting ? '...' : '✗ Regrets / لن أتمكن'}
              </button>
            </div>
          </>
        )}

        {!loading && status === 'confirmed' && (
          <div className="response-box">
            <div className="response-icon">🤍</div>
            <div className="response-title-ar">شكراً لتأكيد حضوركم</div>
            <div className="response-title-en">We look forward to seeing you</div>
            <div className="response-msg">Your attendance has been confirmed. We can't wait to celebrate with you.</div>
          </div>
        )}

        {!loading && status === 'declined' && (
          <div className="response-box">
            <div className="response-icon">🌸</div>
            <div className="response-title-ar">شكراً على ردكم</div>
            <div className="response-title-en">Thank you for letting us know</div>
            <div className="response-msg">You will be missed. We wish you all the best.</div>
          </div>
        )}

        <div style={{ marginTop: '3rem', opacity: 0.3 }}>
          <div className="ornament" style={{ fontSize: '1rem' }}>✦ ✦ ✦</div>
        </div>
      </div>
    </>
  )
}
