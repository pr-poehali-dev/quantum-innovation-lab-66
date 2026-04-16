import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Icon from "@/components/ui/icon"

const API_URL = "https://functions.poehali.dev/0f625e18-7ba4-45b0-8674-aa0112e31e24"

interface Department {
  id: number
  name: string
  description: string
  created_at: string
}

const glassCard = {
  background: "rgba(255, 255, 255, 0.45)",
  backdropFilter: "blur(40px) saturate(180%)",
  WebkitBackdropFilter: "blur(40px) saturate(180%)",
  boxShadow: `
    inset 0 1px 1px rgba(255,255,255,0.9),
    0 0 0 1px rgba(255,255,255,0.6),
    0 4px 16px rgba(0,0,0,0.06),
    0 16px 40px rgba(0,0,0,0.08)
  `,
  border: "1px solid rgba(255,255,255,0.5)",
}

export function DepartmentsPage({ onBack }: { onBack: () => void }) {
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const fetchDepts = async () => {
    setLoading(true)
    const res = await fetch(API_URL)
    const raw = await res.json()
    const data = typeof raw === "string" ? JSON.parse(raw) : raw
    setDepartments(data.departments || [])
    setLoading(false)
  }

  useEffect(() => { fetchDepts() }, [])

  const handleAdd = async () => {
    if (!name.trim()) return
    setSaving(true)
    await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description }),
    })
    setName("")
    setDescription("")
    setShowForm(false)
    setSaving(false)
    fetchDepts()
  }

  const handleDelete = async (id: number) => {
    setDeletingId(id)
    await fetch(`${API_URL}?id=${id}`, { method: "DELETE" })
    setDeletingId(null)
    fetchDepts()
  }

  return (
    <main className="relative min-h-screen px-6 py-10 flex flex-col overflow-hidden">
      <div className="fixed inset-0 z-0 bg-gradient-to-br from-slate-50 via-white to-slate-100" />

      <motion.div
        className="fixed z-0 w-[500px] h-[500px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(147,51,234,0.2) 0%, transparent 70%)", filter: "blur(60px)", top: "-10%", left: "-10%" }}
        animate={{ x: [0,100,50,0], y: [0,50,100,0] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="fixed z-0 w-[500px] h-[500px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(59,130,246,0.18) 0%, transparent 70%)", filter: "blur(70px)", bottom: "-5%", right: "-10%" }}
        animate={{ x: [0,-60,-30,0], y: [0,60,-30,0] }}
        transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="relative z-10 mx-auto max-w-[520px] w-full flex flex-col gap-6">
        {/* Header */}
        <motion.div initial={{ opacity:0, y:-16 }} animate={{ opacity:1, y:0 }} transition={{ type:"spring", stiffness:300, damping:25 }}>
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors mb-6 text-sm"
          >
            <Icon name="ChevronLeft" size={18} />
            Назад
          </button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Отделы</h1>
              <p className="text-sm text-gray-500 mt-1">Список подразделений организации</p>
            </div>
            <motion.button
              onClick={() => setShowForm(v => !v)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
              style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
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
              initial={{ opacity:0, y:-12, scale:0.97 }}
              animate={{ opacity:1, y:0, scale:1 }}
              exit={{ opacity:0, y:-12, scale:0.97 }}
              transition={{ type:"spring", stiffness:350, damping:28 }}
              style={glassCard}
              className="rounded-2xl p-5 flex flex-col gap-3"
            >
              <input
                className="w-full bg-white/60 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder:text-gray-400 outline-none border border-white/70 focus:border-violet-300 transition-colors"
                placeholder="Название отдела *"
                value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleAdd()}
              />
              <input
                className="w-full bg-white/60 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder:text-gray-400 outline-none border border-white/70 focus:border-violet-300 transition-colors"
                placeholder="Описание (необязательно)"
                value={description}
                onChange={e => setDescription(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleAdd()}
              />
              <motion.button
                onClick={handleAdd}
                disabled={saving || !name.trim()}
                className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
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
        ) : departments.length === 0 ? (
          <motion.div
            initial={{ opacity:0 }} animate={{ opacity:1 }}
            style={glassCard}
            className="rounded-2xl p-10 flex flex-col items-center gap-3 text-center"
          >
            <Icon name="Building2" size={40} className="text-gray-300" />
            <p className="text-gray-500 text-sm">Отделы ещё не добавлены</p>
          </motion.div>
        ) : (
          <motion.div className="flex flex-col gap-3" initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.05 } } }}>
            {departments.map(dept => (
              <motion.div
                key={dept.id}
                variants={{ hidden: { opacity:0, y:16 }, visible: { opacity:1, y:0, transition: { type:"spring", stiffness:350, damping:26 } } }}
                style={glassCard}
                className="rounded-2xl px-5 py-4 flex items-center gap-4 group"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-violet-600"
                  style={{ background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.15)" }}>
                  <Icon name="Building2" size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-[15px] font-semibold text-gray-800 tracking-tight truncate">{dept.name}</h3>
                  {dept.description && (
                    <p className="text-[12px] text-gray-500 truncate mt-0.5">{dept.description}</p>
                  )}
                </div>
                <motion.button
                  onClick={() => handleDelete(dept.id)}
                  disabled={deletingId === dept.id}
                  className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center h-8 w-8 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  {deletingId === dept.id
                    ? <Icon name="Loader2" size={15} className="animate-spin" />
                    : <Icon name="Trash2" size={15} />
                  }
                </motion.button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </main>
  )
}
