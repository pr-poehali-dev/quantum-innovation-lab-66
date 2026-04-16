import { useState } from "react"
import { LinkBioPage } from "./pages/LinkBioPage"
import { DepartmentsPage } from "./pages/DepartmentsPage"

type Page = "home" | "departments"

function App() {
  const [page, setPage] = useState<Page>("home")

  if (page === "departments") return <DepartmentsPage onBack={() => setPage("home")} />
  return <LinkBioPage onNavigate={setPage} />
}

export default App
