import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Icon from "@/components/ui/icon"

const KEYS_URL = "https://functions.poehali.dev/5309b185-8d76-4bc6-987b-718431854c6d"
const EMP_URL = "https://functions.poehali.dev/2d90d816-6c5d-4e4c-8b0b-c753d534fc7b"

interface AccessKey {
  id: number
  key_number: string
  key_type: string
  status: string
  employee_id: number | null
  employee_name: string
  issued_at: string
  note: string
}

interface Employee {
  id: number
  full_name: string
}

const STATUS = {
  active:   { label: "Активен",   color: "#059669", bg: "rgba(16,185,129,0.1)" },
  blocked:  { label: "Заблокирован", color: "#dc2626", bg: "rgba(239,68,68,0.1)" },
  lost:     { label: "Утерян",    color: "#d97706", bg: "rgba(251,191,36,0.12)" },
}

const KEY_TYPE = {
  card:    { label: "Карта",    icon: "CreditCard" },
  key:     { label: "Ключ",     icon: "KeyRound" },
  fob:     { label: "Брелок",   icon: "Nfc" },
}

const glassCard = {
  background: "rgba(255,255,255,0.45)",
  backdropFilter: "blur(40px) saturate(180%)",
  WebkitBackdropFilter: "blur(40px) saturate(180%)",
  boxShadow: `inset 0 1px 1px rgba(255,255,255,0.9), 0 0 0 1px rgba(255,255,255,0.6), 0 4px 16px rgba(0,0,0,0.06), 0 16px 40px rgba(0,0,0,0.08)`,
  border: "1px solid rgba(255,255,255,0.5)",
}

const inputClass = "w-full bg-white/60 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder:text-gray-400 outline-none border border-white/70 focus:border-violet-300 transition-colors"

export function KeysPage({ onBack }: { onBack: () => void }) {
  const [keys, setKeys] = useState<AccessKey[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")

  const [form, setForm] = useState({
    key_number: "",
    key_type: "card",
    status: "active",
    employee_id: "",
    note: "",
  })

  const parse = async (res: Response) => {
    const raw = await res.json()
    return typeof raw === "string" ? JSON.parse(raw) : raw
  }

  const fetchAll = async () => {
    setLoading(true)
    const [keysRes, empRes] = await Promise.all([fetch(KEYS_URL), fetch(EMP_URL)])
    const [keysData, empData] = await Promise.all([parse(keysRes), parse(empRes)])
    setKeys(keysData.keys || [])
    setEmployees(empData.employees || [])
    setLoading(false)
  }

  useEffect(() => { fetchAll() }, [])

  const handleAdd = async () => {
    if (!form.key_number.trim()) return
    setSaving(true)
    await fetch(KEYS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        key_number: form.key_number,
        key_type: form.key_type,
        status: form.status,
        employee_id: form.employee_id ? Number(form.employee_id) : null,
        note: form.note,
      }),
    })
    setForm({ key_number: "", key_type: "card", status: "active", employee_id: "", note: "" })
    setShowForm(false)
    setSaving(false)
    fetchAll()
  }

  const handleDelete = async (id: number) => {
    setDeletingId(id)
    await fetch(`${KEYS_URL}?id=${id}`, { method: "DELETE" })
    setDeletingId(null)
    fetchAll()
  }

  const filtered = keys.filter(k => {
    const matchSearch =
      k.key_number.toLowerCase().includes(search.toLowerCase()) ||
      k.employee_name.toLowerCase().includes(search.toLowerCase()) ||
      k.note.toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === "all" || k.status === filterStatus
    return matchSearch && matchStatus
  })

  const counts = {
    all: keys.length,
    active: keys.filter(k => k.status === "active").length,
    blocked: keys.filter(k => k.status === "blocked").length,
    lost: keys.filter(k => k.status === "lost").length,
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
              <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Ключи и карты</h1>
              <p className="text-sm text-gray-500 mt-1">{keys.length} пропусков в реестре</p>
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
              <input className={inputClass} placeholder="Номер ключа / карты *" value={form.key_number}
                onChange={e => setForm(f => ({ ...f, key_number: e.target.value }))} />

              <div className="grid grid-cols-2 gap-3">
                <select className={inputClass} value={form.key_type}
                  onChange={e => setForm(f => ({ ...f, key_type: e.target.value }))}>
                  <option value="card">Карта</option>
                  <option value="key">Ключ</option>
                  <option value="fob">Брелок</option>
                </select>
                <select className={inputClass} value={form.status}
                  onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                  <option value="active">Активен</option>
                  <option value="blocked">Заблокирован</option>
                  <option value="lost">Утерян</option>
                </select>
              </div>

              <select className={inputClass} value={form.employee_id}
                onChange={e => setForm(f => ({ ...f, employee_id: e.target.value }))}>
                <option value="">— Не назначен —</option>
                {employees.map(e => <option key={e.id} value={e.id}>{e.full_name}</option>)}
              </select>

              <input className={inputClass} placeholder="Примечание" value={form.note}
                onChange={e => setForm(f => ({ ...f, note: e.target.value }))} />

              <motion.button onClick={handleAdd} disabled={saving || !form.key_number.trim()}
                className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              >
                {saving ? <Icon name="Loader2" size={16} className="animate-spin" /> : <Icon name="Check" size={16} />}
                {saving ? "Сохраняем..." : "Сохранить"}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filter tabs */}
        {!loading && keys.length > 0 && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} style={glassCard} className="rounded-2xl px-3 py-2 flex items-center gap-1">
            {(["all","active","blocked","lost"] as const).map(s => (
              <button key={s} onClick={() => setFilterStatus(s)}
                className="flex-1 px-2 py-1.5 rounded-xl text-xs font-semibold transition-all"
                style={filterStatus === s
                  ? { background: "linear-gradient(135deg, #7c3aed, #4f46e5)", color: "#fff" }
                  : { color: "#6b7280" }}>
                {s === "all" ? "Все" : STATUS[s].label} <span className="opacity-60">({counts[s]})</span>
              </button>
            ))}
          </motion.div>
        )}

        {/* Search */}
        {!loading && keys.length > 0 && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} style={glassCard} className="rounded-2xl px-4 py-3 flex items-center gap-3">
            <Icon name="Search" size={16} className="text-gray-400 shrink-0" />
            <input className="flex-1 bg-transparent text-sm text-gray-800 placeholder:text-gray-400 outline-none"
              placeholder="Поиск по номеру, сотруднику..."
              value={search} onChange={e => setSearch(e.target.value)} />
          </motion.div>
        )}

        {/* List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Icon name="Loader2" size={28} className="animate-spin text-violet-400" />
          </div>
        ) : filtered.length === 0 ? (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}
            style={glassCard} className="rounded-2xl p-10 flex flex-col items-center gap-3 text-center">
            <Icon name="KeyRound" size={40} className="text-gray-300" />
            <p className="text-gray-500 text-sm">{search || filterStatus !== "all" ? "Ничего не найдено" : "Ключи ещё не добавлены"}</p>
          </motion.div>
        ) : (
          <motion.div className="flex flex-col gap-3"
            initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.05 } } }}>
            {filtered.map(k => {
              const st = STATUS[k.status as keyof typeof STATUS] || STATUS.active
              const kt = KEY_TYPE[k.key_type as keyof typeof KEY_TYPE] || KEY_TYPE.card
              return (
                <motion.div key={k.id}
                  variants={{ hidden: { opacity:0, y:16 }, visible: { opacity:1, y:0, transition: { type:"spring", stiffness:350, damping:26 } } }}
                  style={glassCard} className="rounded-2xl px-5 py-4 flex items-center gap-4 group"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-violet-600"
                    style={{ background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.15)" }}>
                    <Icon name={kt.icon} size={20} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-[15px] font-semibold text-gray-800 tracking-tight">{k.key_number}</h3>
                      <span className="text-[11px] text-gray-400">{kt.label}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-[12px] text-gray-500 truncate">{k.employee_name}</span>
                      {k.note && (
                        <>
                          <span className="text-gray-300 text-[10px]">•</span>
                          <span className="text-[12px] text-gray-400 truncate">{k.note}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                      style={{ color: st.color, background: st.bg }}>
                      {st.label}
                    </span>
                    <motion.button onClick={() => handleDelete(k.id)} disabled={deletingId === k.id}
                      className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center h-8 w-8 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50"
                      whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                      {deletingId === k.id
                        ? <Icon name="Loader2" size={15} className="animate-spin" />
                        : <Icon name="Trash2" size={15} />}
                    </motion.button>
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
