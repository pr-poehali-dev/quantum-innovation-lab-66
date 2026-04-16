import { useState } from "react"
import { LinkBioPage } from "./pages/LinkBioPage"
import { DepartmentsPage } from "./pages/DepartmentsPage"
import { EmployeesPage } from "./pages/EmployeesPage"
import { KeysPage } from "./pages/KeysPage"
import { AccessLevelsPage } from "./pages/AccessLevelsPage"
import { JournalPage } from "./pages/JournalPage"

type Page = "home" | "departments" | "employees" | "keys" | "access-levels" | "journal"

function App() {
  const [page, setPage] = useState<Page>("home")

  if (page === "departments") return <DepartmentsPage onBack={() => setPage("home")} />
  if (page === "employees") return <EmployeesPage onBack={() => setPage("home")} />
  if (page === "keys") return <KeysPage onBack={() => setPage("home")} />
  if (page === "access-levels") return <AccessLevelsPage onBack={() => setPage("home")} />
  if (page === "journal") return <JournalPage onBack={() => setPage("home")} />
  return <LinkBioPage onNavigate={setPage} />
}

export default App
