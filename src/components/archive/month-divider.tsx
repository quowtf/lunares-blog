type MonthDividerProps = {
  children: string
}

export function MonthDivider({ children }: MonthDividerProps) {
  return (
    <div className="flex items-center gap-4">
      <h2 className="shrink-0 font-serif text-lg tracking-tight text-stone-900">{children}</h2>
      <div className="h-px flex-1 bg-stone-200" />
    </div>
  )
}
