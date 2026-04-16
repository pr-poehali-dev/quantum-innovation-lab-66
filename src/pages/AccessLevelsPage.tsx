import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Icon from "@/components/ui/icon"

const API_URL = "https://functions.poehali.dev/f9b0741e-bf95-493e-ab06-90a6fb915575"

interface AccessLevel {
  id: number
  name: string
  code: string
  color: string
  zones: string
  description: string
  created_at: string
  employee_count: number
}

const PRESET_COLORS = [
  "#059669", "#d97706", "#7c3aed", "#dc2626", "#2563eb", "#0891b2", "#db2777",
]

const glassCard = {
  background: "rgba(255,255,255,0.45)",
  backdropFilter: "blur(40px) saturate(180%)",
  WebkitBackdropFilter: "blur(40px) saturate(180%)",
  boxShadow: `inset 0 1px 1px rgba(255,255,255,0.9), 0 0 0 1px rgba(255,255,255,0.6), 0 4px 16px rgba(0,0,0,0.06), 0 16px 40px rgba(0,0,0,0.08)`,
  border: "1px solid rgba(255,255,255,0.5)",
}

const inputClass = "w-full bg-white/60 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder:text-gray-400 outline-none border border-white/70 focus:border-violet-300 transition-colors"

export function AccessLevelsPage({ onBack }: { onBack: () => void }) {
  const [levels, setLevels] = useState<AccessLevel[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const [form, setForm] = useState({
    name: "",
    code: "",
    color: "#6366f1",
    zones: "",
    description: "",
  })

  const fetchLevels = async () => {
    setLoading(true)
    const res = await fetch(API_URL)
    const raw = await res.json()
    const data = typeof raw === "string" ? JSON.parse(raw) : raw
    setLevels(data.levels || [])
    setLoading(false)
  }

  useEffect(() => { fetchLevels() }, [])

  const handleAdd = async () => {
    if (!form.name.trim() || !form.code.trim()) return
    setSaving(true)
    await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    setForm({ name: "", code: "", color: "#6366f1", zones: "", description: "" })
    setShowForm(false)
    setSaving(false)
    fetchLevels()
  }

  const handleDelete = async (id: number) => {
    setDeletingId(id)
    await fetch(`${API_URL}?id=${id}`, { method: "DELETE" })
    setDeletingId(null)
    fetchLevels()
  }

  const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return `rgba(${r},${g},${b},${alpha})`
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
              <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Уровни допуска</h1>
              <p className="text-sm text-gray-500 mt-1">Зоны доступа и права сотрудников</p>
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
                <input className={inputClass} placeholder="Название *" value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                <input className={inputClass} placeholder="Код (англ.) *" value={form.code}
                  onChange={e => setForm(f => ({ ...f, code: e.target.value }))} />
              </div>

              <input className={inputClass} placeholder="Зоны доступа (через запятую)" value={form.zones}
                onChange={e => setForm(f => ({ ...f, zones: e.target.value }))} />

              <input className={inputClass} placeholder="Описание" value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />

              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-500 shrink-0">Цвет:</span>
                <div className="flex gap-2 flex-wrap">
                  {PRESET_COLORS.map(c => (
                    <button key={c} onClick={() => setForm(f => ({ ...f, color: c }))}
                      className="h-7 w-7 rounded-full transition-all"
                      style={{
                        background: c,
                        outline: form.color === c ? `3px solid ${c}` : "none",
                        outlineOffset: "2px",
                        opacity: form.color === c ? 1 : 0.6,
                      }} />
                  ))}
                </div>
              </div>

              <motion.button onClick={handleAdd} disabled={saving || !form.name.trim() || !form.code.trim()}
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

        {/* List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Icon name="Loader2" size={28} className="animate-spin text-violet-400" />
          </div>
        ) : levels.length === 0 ? (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}
            style={glassCard} className="rounded-2xl p-10 flex flex-col items-center gap-3 text-center">
            <Icon name="ShieldCheck" size={40} className="text-gray-300" />
            <p className="text-gray-500 text-sm">Уровни допуска ещё не добавлены</p>
          </motion.div>
        ) : (
          <motion.div className="flex flex-col gap-4"
            initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.07 } } }}>
            {levels.map(level => (
              <motion.div key={level.id}
                variants={{ hidden: { opacity:0, y:16 }, visible: { opacity:1, y:0, transition: { type:"spring", stiffness:350, damping:26 } } }}
                style={glassCard} className="rounded-2xl overflow-hidden group"
              >
                {/* Color bar */}
                <div className="h-1.5 w-full" style={{ background: level.color }} />

                <div className="px-5 py-4 flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl mt-0.5"
                    style={{ background: hexToRgba(level.color, 0.12), border: `1px solid ${hexToRgba(level.color, 0.2)}` }}>
                    <Icon name="ShieldCheck" size={20} style={{ color: level.color }} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-[15px] font-semibold text-gray-800 tracking-tight">{level.name}</h3>
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded-md text-gray-400"
                        style={{ background: "rgba(0,0,0,0.04)" }}>
                        {level.code}
                      </span>
                    </div>

                    {level.description && (
                      <p className="text-[12px] text-gray-500 mt-0.5">{level.description}</p>
                    )}

                    {level.zones && (
                      <div className="flex items-start gap-1.5 mt-2 flex-wrap">
                        {level.zones.split(",").map(z => z.trim()).filter(Boolean).map(zone => (
                          <span key={zone} className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-medium"
                            style={{ color: level.color, background: hexToRgba(level.color, 0.1) }}>
                            <Icon name="MapPin" size={10} />
                            {zone}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <div className="flex items-center gap-1.5 text-[12px] text-gray-500">
                      <Icon name="Users" size={13} />
                      <span>{level.employee_count} чел.</span>
                    </div>
                    <motion.button onClick={() => handleDelete(level.id)} disabled={deletingId === level.id}
                      className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center h-8 w-8 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50"
                      whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                      {deletingId === level.id
                        ? <Icon name="Loader2" size={15} className="animate-spin" />
                        : <Icon name="Trash2" size={15} />}
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </main>
  )
}
