import { icons } from "lucide-react"

interface IconProps {
  name: string
  size?: number
  className?: string
  fallback?: string
  strokeWidth?: number
}

export default function Icon({ name, size = 24, className, fallback, strokeWidth = 2 }: IconProps) {
  const LucideIcon = icons[name as keyof typeof icons] || (fallback ? icons[fallback as keyof typeof icons] : null)
  if (!LucideIcon) return null
  return <LucideIcon size={size} className={className} strokeWidth={strokeWidth} />
}
