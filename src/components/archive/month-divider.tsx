type MonthDividerProps = {
  children: string
}

export function MonthDivider({ children }: MonthDividerProps) {
  return (
    <div className="flex items-center gap-4">
      <h2 className="shrink-0 font-serif text-lg tracking-tight text-foreground">{children}</h2>
      <div className="h-px flex-1 bg-border" />
    </div>
  )
}
