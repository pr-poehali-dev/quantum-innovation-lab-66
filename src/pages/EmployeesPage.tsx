import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Icon from "@/components/ui/icon"

const EMP_URL = "https://functions.poehali.dev/2d90d816-6c5d-4e4c-8b0b-c753d534fc7b"
const DEPT_URL = "https://functions.poehali.dev/0f625e18-7ba4-45b0-8674-aa0112e31e24"

interface Employee {
  id: number
  full_name: string
  department_id: number | null
  department_name: string
  key_number: string
  access_level: string
}

interface Department {
  id: number
  name: string
}

const ACCESS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  high:   { label: "Высокий",  color: "#7c3aed", bg: "rgba(139,92,246,0.1)" },
  medium: { label: "Средний",  color: "#d97706", bg: "rgba(251,191,36,0.12)" },
  low:    { label: "Базовый",  color: "#059669", bg: "rgba(16,185,129,0.1)" },
}

const glassCard = {
  background: "rgba(255,255,255,0.45)",
  backdropFilter: "blur(40px) saturate(180%)",
  WebkitBackdropFilter: "blur(40px) saturate(180%)",
  boxShadow: `inset 0 1px 1px rgba(255,255,255,0.9), 0 0 0 1px rgba(255,255,255,0.6), 0 4px 16px rgba(0,0,0,0.06), 0 16px 40px rgba(0,0,0,0.08)`,
  border: "1px solid rgba(255,255,255,0.5)",
}

const inputClass = "w-full bg-white/60 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder:text-gray-400 outline-none border border-white/70 focus:border-violet-300 transition-colors"

export function EmployeesPage({ onBack }: { onBack: () => void }) {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [search, setSearch] = useState("")

  const [form, setForm] = useState({
    full_name: "",
    department_id: "",
    key_number: "",
    access_level: "low",
  })

  const parse = async (res: Response) => {
    const raw = await res.json()
    return typeof raw === "string" ? JSON.parse(raw) : raw
  }

  const fetchAll = async () => {
    setLoading(true)
    const [empRes, deptRes] = await Promise.all([fetch(EMP_URL), fetch(DEPT_URL)])
    const [empData, deptData] = await Promise.all([parse(empRes), parse(deptRes)])
    setEmployees(empData.employees || [])
    setDepartments(deptData.departments || [])
    setLoading(false)
  }

  useEffect(() => { fetchAll() }, [])

  const handleAdd = async () => {
    if (!form.full_name.trim()) return
    setSaving(true)
    await fetch(EMP_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        full_name: form.full_name,
        department_id: form.department_id ? Number(form.department_id) : null,
        key_number: form.key_number,
        access_level: form.access_level,
      }),
    })
    setForm({ full_name: "", department_id: "", key_number: "", access_level: "low" })
    setShowForm(false)
    setSaving(false)
    fetchAll()
  }

  const handleDelete = async (id: number) => {
    setDeletingId(id)
    await fetch(`${EMP_URL}?id=${id}`, { method: "DELETE" })
    setDeletingId(null)
    fetchAll()
  }

  const filtered = employees.filter(e =>
    e.full_name.toLowerCase().includes(search.toLowerCase()) ||
    e.department_name.toLowerCase().includes(search.toLowerCase()) ||
    e.key_number.toLowerCase().includes(search.toLowerCase())
  )

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
              <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Сотрудники</h1>
              <p className="text-sm text-gray-500 mt-1">{employees.length} чел. в реестре</p>
            </div>
            <motion.button
              onClick={() => setShowForm(v => !v)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
              style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}
              whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
            >
              <Icon name={showForm ? "X" : "UserPlus"} size={16} />
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
              <input className={inputClass} placeholder="ФИО *" value={form.full_name}
                onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} />

              <select className={inputClass} value={form.department_id}
                onChange={e => setForm(f => ({ ...f, department_id: e.target.value }))}>
                <option value="">— Отдел —</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>

              <input className={inputClass} placeholder="Номер ключа / карты" value={form.key_number}
                onChange={e => setForm(f => ({ ...f, key_number: e.target.value }))} />

              <select className={inputClass} value={form.access_level}
                onChange={e => setForm(f => ({ ...f, access_level: e.target.value }))}>
                <option value="low">Базовый допуск</option>
                <option value="medium">Средний допуск</option>
                <option value="high">Высокий допуск</option>
              </select>

              <motion.button onClick={handleAdd} disabled={saving || !form.full_name.trim()}
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

        {/* Search */}
        {!loading && employees.length > 0 && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} style={glassCard} className="rounded-2xl px-4 py-3 flex items-center gap-3">
            <Icon name="Search" size={16} className="text-gray-400 shrink-0" />
            <input className="flex-1 bg-transparent text-sm text-gray-800 placeholder:text-gray-400 outline-none"
              placeholder="Поиск по ФИО, отделу или ключу..."
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
            <Icon name="Users" size={40} className="text-gray-300" />
            <p className="text-gray-500 text-sm">{search ? "Никого не найдено" : "Сотрудники ещё не добавлены"}</p>
          </motion.div>
        ) : (
          <motion.div className="flex flex-col gap-3"
            initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.05 } } }}>
            {filtered.map(emp => {
              const access = ACCESS_LABELS[emp.access_level] || ACCESS_LABELS.low
              return (
                <motion.div key={emp.id}
                  variants={{ hidden: { opacity:0, y:16 }, visible: { opacity:1, y:0, transition: { type:"spring", stiffness:350, damping:26 } } }}
                  style={glassCard} className="rounded-2xl px-5 py-4 flex items-center gap-4 group"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-violet-600"
                    style={{ background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.15)" }}>
                    <Icon name="User" size={20} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-[15px] font-semibold text-gray-800 tracking-tight truncate">{emp.full_name}</h3>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-[12px] text-gray-500">{emp.department_name}</span>
                      {emp.key_number && (
                        <>
                          <span className="text-gray-300 text-[10px]">•</span>
                          <span className="flex items-center gap-1 text-[12px] text-gray-500">
                            <Icon name="KeyRound" size={11} /> {emp.key_number}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                      style={{ color: access.color, background: access.bg }}>
                      {access.label}
                    </span>
                    <motion.button onClick={() => handleDelete(emp.id)} disabled={deletingId === emp.id}
                      className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center h-8 w-8 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50"
                      whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                      {deletingId === emp.id
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
