import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Icon from "@/components/ui/icon"

const JOURNAL_URL = "https://functions.poehali.dev/a7aff14d-592a-48a0-8e4c-0b3e4dab0b8e"
const EMP_URL = "https://functions.poehali.dev/2d90d816-6c5d-4e4c-8b0b-c753d534fc7b"

interface JournalEvent {
  id: number
  event_type: string
  employee_id: number | null
  employee_name: string
  key_number: string
  zone: string
  result: string
  note: string
  created_at: string
}

interface Employee {
  id: number
  full_name: string
}

const EVENT_TYPES: Record<string, { label: string; icon: string }> = {
  entry:   { label: "Вход",        icon: "LogIn" },
  exit:    { label: "Выход",       icon: "LogOut" },
  alarm:   { label: "Тревога",     icon: "BellRing" },
  block:   { label: "Блокировка",  icon: "ShieldOff" },
  manual:  { label: "Вручную",     icon: "ClipboardList" },
}

const RESULTS: Record<string, { label: string; color: string; bg: string }> = {
  allowed:  { label: "Разрешён",   color: "#059669", bg: "rgba(16,185,129,0.1)" },
  denied:   { label: "Отказ",      color: "#dc2626", bg: "rgba(239,68,68,0.1)" },
  alarm:    { label: "Тревога",    color: "#d97706", bg: "rgba(251,191,36,0.12)" },
}

const glassCard = {
  background: "rgba(255,255,255,0.45)",
  backdropFilter: "blur(40px) saturate(180%)",
  WebkitBackdropFilter: "blur(40px) saturate(180%)",
  boxShadow: `inset 0 1px 1px rgba(255,255,255,0.9), 0 0 0 1px rgba(255,255,255,0.6), 0 4px 16px rgba(0,0,0,0.06), 0 16px 40px rgba(0,0,0,0.08)`,
  border: "1px solid rgba(255,255,255,0.5)",
}

const inputClass = "w-full bg-white/60 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder:text-gray-400 outline-none border border-white/70 focus:border-violet-300 transition-colors"

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })
}

export function JournalPage({ onBack }: { onBack: () => void }) {
  const [events, setEvents] = useState<JournalEvent[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [filterResult, setFilterResult] = useState("all")

  const [form, setForm] = useState({
    event_type: "entry",
    employee_id: "",
    key_number: "",
    zone: "",
    result: "allowed",
    note: "",
  })

  const parse = async (res: Response) => {
    const raw = await res.json()
    return typeof raw === "string" ? JSON.parse(raw) : raw
  }

  const fetchAll = async () => {
    setLoading(true)
    const [jevRes, empRes] = await Promise.all([fetch(JOURNAL_URL), fetch(EMP_URL)])
    const [jevData, empData] = await Promise.all([parse(jevRes), parse(empRes)])
    setEvents(jevData.events || [])
    setEmployees(empData.employees || [])
    setLoading(false)
  }

  useEffect(() => { fetchAll() }, [])

  const handleAdd = async () => {
    setSaving(true)
    await fetch(JOURNAL_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        employee_id: form.employee_id ? Number(form.employee_id) : null,
      }),
    })
    setForm({ event_type: "entry", employee_id: "", key_number: "", zone: "", result: "allowed", note: "" })
    setShowForm(false)
    setSaving(false)
    fetchAll()
  }

  const filtered = filterResult === "all" ? events : events.filter(e => e.result === filterResult)

  const counts = {
    all: events.length,
    allowed: events.filter(e => e.result === "allowed").length,
    denied: events.filter(e => e.result === "denied").length,
    alarm: events.filter(e => e.result === "alarm").length,
  }

  return (
    <main className="relative min-h-screen px-6 py-10 flex flex-col overflow-hidden">
      <div className="fixed inset-0 z-0 bg-gradient-to-br from-slate-50 via-white to-slate-100" />
      <motion.div className="fixed z-0 w-[500px] h-[500px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(147,51,234,0.2) 0%, transparent 70%)", filter: "blur(60px)", top: "-10%", left: "-10%" }}
        animate={{ x: [0,100,50,0], y: [0,50,100,0] }} transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div className="fixed z-0 w-[500px] h-[500px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(59,130,246,0.18) 0%, transparent 70%)", filter: "blur(70px)", bottom: "-5%", right: "-10%" }}
        animate={{ x: [0,-60,-30,0], y: [0,60,-30,0] }} transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="relative z-10 mx-auto max-w-[560px] w-full flex flex-col gap-5">

        {/* Header */}
        <motion.div initial={{ opacity:0, y:-16 }} animate={{ opacity:1, y:0 }} transition={{ type:"spring", stiffness:300, damping:25 }}>
          <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors mb-6 text-sm">
            <Icon name="ChevronLeft" size={18} /> Назад
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Журнал событий</h1>
              <p className="text-sm text-gray-500 mt-1">{events.length} записей в журнале</p>
            </div>
            <motion.button
              onClick={() => setShowForm(v => !v)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
              style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}
              whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
            >
              <Icon name={showForm ? "X" : "Plus"} size={16} />
              {showForm ? "Отмена" : "Добавить"}
            </motion.button>
          </div>
        </motion.div>

        {/* Add form */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity:0, y:-12, scale:0.97 }} animate={{ opacity:1, y:0, scale:1 }} exit={{ opacity:0, y:-12, scale:0.97 }}
              transition={{ type:"spring", stiffness:350, damping:28 }}
              style={glassCard} className="rounded-2xl p-5 flex flex-col gap-3"
            >
              <div className="grid grid-cols-2 gap-3">
                <select className={inputClass} value={form.event_type}
                  onChange={e => setForm(f => ({ ...f, event_type: e.target.value }))}>
                  {Object.entries(EVENT_TYPES).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>
                <select className={inputClass} value={form.result}
                  onChange={e => setForm(f => ({ ...f, result: e.target.value }))}>
                  <option value="allowed">Разрешён</option>
                  <option value="denied">Отказ</option>
                  <option value="alarm">Тревога</option>
                </select>
              </div>

              <select className={inputClass} value={form.employee_id}
                onChange={e => setForm(f => ({ ...f, employee_id: e.target.value }))}>
                <option value="">— Сотрудник —</option>
                {employees.map(e => <option key={e.id} value={e.id}>{e.full_name}</option>)}
              </select>

              <div className="grid grid-cols-2 gap-3">
                <input className={inputClass} placeholder="Номер ключа" value={form.key_number}
                  onChange={e => setForm(f => ({ ...f, key_number: e.target.value }))} />
                <input className={inputClass} placeholder="Зона / точка" value={form.zone}
                  onChange={e => setForm(f => ({ ...f, zone: e.target.value }))} />
              </div>

              <input className={inputClass} placeholder="Примечание" value={form.note}
                onChange={e => setForm(f => ({ ...f, note: e.target.value }))} />

              <motion.button onClick={handleAdd} disabled={saving}
                className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              >
                {saving ? <Icon name="Loader2" size={16} className="animate-spin" /> : <Icon name="Check" size={16} />}
                {saving ? "Сохраняем..." : "Добавить запись"}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filter tabs */}
        {!loading && events.length > 0 && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} style={glassCard} className="rounded-2xl px-3 py-2 flex items-center gap-1">
            {(["all","allowed","denied","alarm"] as const).map(r => (
              <button key={r} onClick={() => setFilterResult(r)}
                className="flex-1 px-2 py-1.5 rounded-xl text-xs font-semibold transition-all"
                style={filterResult === r
                  ? { background: "linear-gradient(135deg, #7c3aed, #4f46e5)", color: "#fff" }
                  : { color: "#6b7280" }}>
                {r === "all" ? "Все" : RESULTS[r].label}
                <span className="opacity-60 ml-1">({counts[r]})</span>
              </button>
            ))}
          </motion.div>
        )}

        {/* Events list */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Icon name="Loader2" size={28} className="animate-spin text-violet-400" />
          </div>
        ) : filtered.length === 0 ? (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}
            style={glassCard} className="rounded-2xl p-10 flex flex-col items-center gap-3 text-center">
            <Icon name="ClipboardList" size={40} className="text-gray-300" />
            <p className="text-gray-500 text-sm">{filterResult !== "all" ? "Нет событий с таким фильтром" : "Журнал пуст"}</p>
          </motion.div>
        ) : (
          <motion.div className="flex flex-col gap-3"
            initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.04 } } }}>
            {filtered.map(ev => {
              const et = EVENT_TYPES[ev.event_type] || EVENT_TYPES.manual
              const rs = RESULTS[ev.result] || RESULTS.allowed
              return (
                <motion.div key={ev.id}
                  variants={{ hidden: { opacity:0, y:12 }, visible: { opacity:1, y:0, transition: { type:"spring", stiffness:350, damping:26 } } }}
                  style={glassCard} className="rounded-2xl px-5 py-4 flex items-center gap-4"
                >
                  {/* Icon */}
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                    style={{ background: rs.bg, border: `1px solid ${rs.color}22` }}>
                    <Icon name={et.icon} size={18} style={{ color: rs.color }} />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[14px] font-semibold text-gray-800">{et.label}</span>
                      {ev.zone && (
                        <span className="flex items-center gap-1 text-[11px] text-gray-400">
                          <Icon name="MapPin" size={10} /> {ev.zone}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-[12px] text-gray-500 truncate">{ev.employee_name}</span>
                      {ev.key_number && (
                        <>
                          <span className="text-gray-300 text-[10px]">•</span>
                          <span className="flex items-center gap-1 text-[12px] text-gray-400">
                            <Icon name="KeyRound" size={10} /> {ev.key_number}
                          </span>
                        </>
                      )}
                      {ev.note && (
                        <>
                          <span className="text-gray-300 text-[10px]">•</span>
                          <span className="text-[12px] text-gray-400 truncate">{ev.note}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Right: status + time */}
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                      style={{ color: rs.color, background: rs.bg }}>
                      {rs.label}
                    </span>
                    <span className="text-[11px] text-gray-400">{formatDate(ev.created_at)}</span>
                  </div>
                </motion.div>
              )
            })}
          </motion.div>
        )}
      </div>
    </main>
  )
}
