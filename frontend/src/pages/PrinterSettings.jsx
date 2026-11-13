import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Check, Printer } from 'lucide-react'
import toast from 'react-hot-toast'
import api, { apiErrorMessage } from '../services/api'
import { ChaskaMark, BRAND_NAME } from '../components/ui/Logo'
import PrintFooter from '../components/pos/PrintFooter'
import { DEFAULT_PRINTER, readPrinterSettings, writePrinterSettings, paperClass } from '../utils/printerSettings'

export default function PrinterSettings() {
  const [form, setForm] = useState(() => readPrinterSettings())
  const [saving, setSaving] = useState(false)
  const [testOpen, setTestOpen] = useState(false)

  useEffect(() => {
    api
      .get('/settings')
      .then(({ data }) => {
        if (data?.printer) {
          const next = writePrinterSettings({ ...DEFAULT_PRINTER, ...data.printer })
          setForm(next)
        }
      })
      .catch(() => {})
  }, [])

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }))

  const save = async () => {
    setSaving(true)
    try {
      writePrinterSettings(form)
      await api.put('/settings', { printer: form })
      toast.success('Printer settings saved')
    } catch (err) {
      writePrinterSettings(form)
      toast.error(apiErrorMessage(err, 'Saved locally. Server sync failed.'))
    } finally {
      setSaving(false)
    }
  }

  const testPrint = () => {
    setTestOpen(true)
    setTimeout(() => {
      window.print()
      setTestOpen(false)
    }, 250)
  }

  return (
    <div className="min-h-screen bg-lex-900 text-lex-ink">
      <header className="sticky top-0 z-20 border-b border-lex-700 bg-white px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <Link to="/pos" className="pos-nav-btn">
            <ArrowLeft className="h-4 w-4 text-lex-gold" />
            POS
          </Link>
          <div className="flex items-center gap-2">
            <ChaskaMark className="h-8 w-8" />
            <div>
              <h1 className="text-lg font-bold">Printer Settings</h1>
              <p className="text-xs text-lex-muted">Bill & KOT thermal configuration</p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-4 p-4 sm:p-6">
        <section className="lex-surface p-5">
          <h2 className="mb-4 text-base font-bold">Printer</h2>
          <label className="mb-1.5 block text-sm font-semibold">Printer name</label>
          <input
            className="lex-input mb-4"
            value={form.name}
            onChange={(e) => setField('name', e.target.value)}
            placeholder="Default System Printer"
          />
          <p className="text-xs text-lex-muted">
            Browser printing uses the OS print dialog. Set the physical printer there for USB, Bluetooth, or LAN devices.
          </p>
        </section>

        <section className="lex-surface p-5">
          <h2 className="mb-4 text-base font-bold">Paper size</h2>
          <div className="grid grid-cols-2 gap-3">
            {['58mm', '80mm'].map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => setField('paperSize', size)}
                className={`lex-press rounded-2xl border px-4 py-4 text-left font-semibold transition ${
                  form.paperSize === size
                    ? 'border-lex-gold bg-lex-gold text-white'
                    : 'border-lex-700 bg-white text-lex-ink hover:border-lex-gold/35'
                }`}
              >
                {size} thermal
              </button>
            ))}
          </div>
        </section>

        <section className="lex-surface p-5">
          <h2 className="mb-4 text-base font-bold">Connection</h2>
          <div className="grid grid-cols-3 gap-2">
            {['USB', 'Bluetooth', 'LAN'].map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setField('connection', c)}
                className={`lex-press rounded-xl px-3 py-3 text-sm font-semibold transition ${
                  form.connection === c
                    ? 'bg-lex-gold text-white'
                    : 'border border-lex-700 bg-white text-lex-ink hover:border-lex-gold/35'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </section>

        <section className="lex-surface space-y-3 p-5">
          <h2 className="mb-2 text-base font-bold">Print jobs</h2>
          {[
            ['printBill', 'Enable Bill printing'],
            ['printKot', 'Enable KOT printing'],
            ['autoPrintBill', 'Auto-print Bill on confirm'],
            ['autoPrintKot', 'Auto-print KOT on confirm'],
          ].map(([key, label]) => (
            <label key={key} className="flex items-center justify-between gap-3 rounded-xl border border-lex-700 bg-lex-800 px-4 py-3">
              <span className="text-sm font-medium">{label}</span>
              <input
                type="checkbox"
                checked={Boolean(form[key])}
                onChange={(e) => setField(key, e.target.checked)}
                className="h-4 w-4 accent-lex-gold"
              />
            </label>
          ))}
        </section>

        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={save} disabled={saving} className="lex-btn-primary">
            <Check className="h-4 w-4" />
            {saving ? 'Saving…' : 'Save settings'}
          </button>
          <button type="button" onClick={testPrint} className="lex-btn-secondary">
            <Printer className="h-4 w-4" />
            Test print
          </button>
        </div>
      </main>

      {testOpen && (
        <div id="receipt-print" className={`fixed left-[-9999px] top-0 bg-white p-5 text-black ${paperClass(form.paperSize)}`}>
          <p className="text-center text-sm font-bold">{BRAND_NAME}</p>
          <p className="mt-2 text-center text-lg font-extrabold">TEST PRINT</p>
          <p className="mt-2 text-center text-xs">
            {form.name} · {form.paperSize} · {form.connection}
          </p>
          <PrintFooter />
        </div>
      )}
    </div>
  )
}
