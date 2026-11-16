export type StatIconName = 'bike' | 'coffee' | 'boulder' | 'git'

export type StatTone = 'sage' | 'clay' | 'slate' | 'gold'

export type StatValue = number | null

export type StatLineChart = {
  type: 'line'
  current: StatValue[]
  previous: StatValue[] | null
}

export type StatBarsChart = {
  type: 'bars'
  current: {
    completed: StatValue[]
    failed: StatValue[]
  }
  previous: StatValue[] | null
}

export type StatCalendarChart = {
  type: 'calendar'
  current: StatValue[]
  previous: StatValue[] | null
}

export type StatRidgelineChart = {
  type: 'ridgeline'
  current: StatValue[]
  previous: StatValue[] | null
}

export type StatChartData = StatLineChart | StatBarsChart | StatCalendarChart | StatRidgelineChart

export type StatDetail = {
  value: number
  label: string
}

export type HomeStatCardData = {
  id: string
  title: string
  icon: StatIconName
  value: number
  unit?: string
  delta?: number
  tone: StatTone
  featured?: boolean
  details?: StatDetail[]
  chart: StatChartData
}

export type HomeStatsData = {
  cards: HomeStatCardData[]
}
