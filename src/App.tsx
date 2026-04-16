import { useState } from "react"
import { LinkBioPage } from "./pages/LinkBioPage"
import { DepartmentsPage } from "./pages/DepartmentsPage"
import { EmployeesPage } from "./pages/EmployeesPage"
import { KeysPage } from "./pages/KeysPage"

type Page = "home" | "departments" | "employees" | "keys"

function App() {
  const [page, setPage] = useState<Page>("home")

  if (page === "departments") return <DepartmentsPage onBack={() => setPage("home")} />
  if (page === "employees") return <EmployeesPage onBack={() => setPage("home")} />
  if (page === "keys") return <KeysPage onBack={() => setPage("home")} />
  return <LinkBioPage onNavigate={setPage} />
}

export default App
