import type {
  StatBarsChart,
  StatCalendarChart,
  StatChartData,
  StatLineChart,
  StatRidgelineChart,
  StatTone,
  StatValue,
} from './types'

const toneVars: Record<StatTone, string> = {
  sage: 'var(--stat-sage)',
  clay: 'var(--stat-clay)',
  slate: 'var(--stat-slate)',
  gold: 'var(--stat-gold)',
}

type Point = { x: number; y: number }

type StatChartProps = {
  chart: StatChartData
  tone: StatTone
}

export function StatChart({ chart, tone }: StatChartProps) {
  if (chart.type === 'bars') {
    return <BarsChart chart={chart} tone={tone} />
  }

  if (chart.type === 'calendar') {
    return <CalendarChart chart={chart} tone={tone} />
  }

  if (chart.type === 'ridgeline') {
    return <RidgelineChart chart={chart} tone={tone} />
  }

  return <LineChart chart={chart} tone={tone} />
}

type LineChartProps = {
  chart: StatLineChart
  tone: StatTone
}

function LineChart({ chart, tone }: LineChartProps) {
  const accent = toneVars[tone]
  const previousValues = chart.previous ?? []
  const allValues = numericValues([...chart.current, ...previousValues])
  const { min, range } = getScale(allValues)
  const domain = Math.max(chart.current.length, previousValues.length, 2)
  const currentPoints = toPoints(chart.current, domain, min, range)
  const previousPoints = chart.previous ? toPoints(previousValues, domain, min, range) : []
  const currentSegments = splitSegments(currentPoints)
  const previousSegments = splitSegments(previousPoints)
  const currentDots = currentPoints
    .map((point, index) => ({ point, index }))
    .filter((item): item is { point: Point; index: number } => item.point !== null)
  const lastDotIndex = currentDots.at(-1)?.index

  return (
    <div className="relative h-full min-h-16">
      <svg
        aria-hidden="true"
        className="absolute inset-0 h-full w-full overflow-visible"
        preserveAspectRatio="none"
        viewBox="0 0 100 100"
      >
        {currentSegments.map((segment, index) => (
          <polygon
            fill={accent}
            key={`area-${index}`}
            opacity="0.07"
            points={areaPoints(segment)}
          />
        ))}

        {previousSegments.map((segment, index) => (
          <polyline
            fill="none"
            key={`previous-${index}`}
            points={polylinePoints(segment)}
            stroke={accent}
            strokeDasharray="3 4"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeOpacity="0.38"
            strokeWidth="1.3"
            vectorEffect="non-scaling-stroke"
          />
        ))}

        {currentSegments.map((segment, index) => (
          <polyline
            fill="none"
            key={`current-${index}`}
            points={polylinePoints(segment)}
            stroke={accent}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.6"
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>

      {currentDots.map(({ point, index }) => {
        const isLast = index === lastDotIndex

        return (
          <span
            aria-hidden="true"
            className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full"
            key={`dot-${index}`}
            style={{
              backgroundColor: accent,
              height: isLast ? '0.45rem' : '0.32rem',
              left: `${point.x}%`,
              top: `${point.y}%`,
              width: isLast ? '0.45rem' : '0.32rem',
            }}
          />
        )
      })}
    </div>
  )
}

type BarsChartProps = {
  chart: StatBarsChart
  tone: StatTone
}

function BarsChart({ chart, tone }: BarsChartProps) {
  const accent = toneVars[tone]
  const previousValues = chart.previous ?? []
  const weeks = Math.max(
    previousValues.length,
    chart.current.completed.length,
    chart.current.failed.length,
  )
  const currentTotals = chart.current.completed.map((completed, index) => {
    const failed = chart.current.failed[index]

    return typeof completed === 'number' && typeof failed === 'number' ? completed + failed : null
  })
  const max = Math.max(...numericValues([...previousValues, ...currentTotals]), 1)

  return (
    <div className="flex h-full min-h-16 items-end justify-center gap-2 sm:gap-4">
      {Array.from({ length: weeks }, (_, index) => {
        const previous = previousValues[index]
        const completed = chart.current.completed[index]
        const failed = chart.current.failed[index]
        const hasCurrent = typeof completed === 'number' && typeof failed === 'number'
        const total = hasCurrent ? completed + failed : 0

        return (
          <div className="flex h-full items-end justify-center gap-[2px]" key={index}>
            {typeof previous === 'number' ? (
              <span
                className="w-[0.56rem] shrink-0 rounded-t-[2px] border border-dashed sm:w-[0.72rem]"
                style={{
                  borderColor: accent,
                  height: `${Math.max(6, (previous / max) * 100)}%`,
                  opacity: 0.55,
                }}
              />
            ) : null}

            {hasCurrent ? (
              <span
                className="flex w-[0.72rem] shrink-0 flex-col justify-end overflow-hidden rounded-t-[2px] sm:w-[0.95rem]"
                style={{ height: `${Math.max(6, (total / max) * 100)}%` }}
              >
                <span
                  className="w-full"
                  style={{
                    backgroundColor: accent,
                    height: `${(failed / Math.max(total, 1)) * 100}%`,
                    opacity: 0.34,
                  }}
                />
                <span
                  className="w-full"
                  style={{
                    backgroundColor: accent,
                    height: `${(completed / Math.max(total, 1)) * 100}%`,
                  }}
                />
              </span>
            ) : null}
          </div>
        )
      })}
    </div>
  )
}

type RidgelineChartProps = {
  chart: StatRidgelineChart
  tone: StatTone
}

function RidgelineChart({ chart, tone }: RidgelineChartProps) {
  const accent = toneVars[tone]
  const previousValues = chart.previous ?? []
  const allValues = numericValues([...chart.current, ...previousValues])
  const { min, range } = getScale(allValues)
  const domain = Math.max(chart.current.length, previousValues.length, 2)
  const currentPoints = compactPoints(toPoints(chart.current, domain, min, range))
  const previousPoints = chart.previous
    ? compactPoints(toPoints(previousValues, domain, min, range))
    : []
  const singlePoints = currentPoints.length === 1 ? currentPoints : []

  return (
    <div className="relative h-full min-h-16">
      <svg
        aria-hidden="true"
        className="absolute inset-0 h-full w-full"
        preserveAspectRatio="none"
        viewBox="0 0 100 100"
      >
        <path d={ridgeArea(previousPoints)} fill={accent} opacity="0.035" />
        <path d={ridgeArea(currentPoints)} fill={accent} opacity="0.14" />

        <path
          d={smoothPath(previousPoints)}
          fill="none"
          opacity="0.4"
          stroke={accent}
          strokeDasharray="3 4"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.2"
          vectorEffect="non-scaling-stroke"
        />

        <path
          d={smoothPath(currentPoints)}
          fill="none"
          stroke={accent}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      {singlePoints.map((point, index) => (
        <span
          aria-hidden="true"
          className="absolute h-[0.45rem] w-[0.45rem] -translate-x-1/2 -translate-y-1/2 rounded-full"
          key={`single-${index}`}
          style={{
            backgroundColor: accent,
            left: `${point.x}%`,
            top: `${point.y}%`,
          }}
        />
      ))}
    </div>
  )
}

type CalendarChartProps = {
  chart: StatCalendarChart
  tone: StatTone
}

function CalendarChart({ chart, tone }: CalendarChartProps) {
  const accent = toneVars[tone]
  const currentMax = Math.max(...numericValues(chart.current), 1)

  return (
    <div className="flex h-full min-h-16 items-center justify-center gap-3 sm:gap-4">
      <CalendarDots accent={accent} max={currentMax} values={chart.current} />
      {chart.previous ? (
        <CalendarDots accent={accent} ghost max={currentMax} values={chart.previous} />
      ) : null}
    </div>
  )
}

type CalendarDotsProps = {
  accent: string
  ghost?: boolean
  max: number
  values: StatValue[]
}

function CalendarDots({ accent, ghost = false, max, values }: CalendarDotsProps) {
  return (
    <div className="grid grid-cols-7 grid-rows-5 gap-[3px] sm:gap-1">
      {Array.from({ length: 35 }, (_, index) => {
        const value = values[index]
        const dotClass = 'h-[0.3rem] w-[0.3rem] rounded-full sm:h-1.5 sm:w-1.5'

        if (typeof value !== 'number') {
          return <span className={dotClass} key={index} />
        }

        if (ghost) {
          return (
            <span
              className={`${dotClass} border`}
              key={index}
              style={{ borderColor: accent, opacity: 0.38 }}
            />
          )
        }

        const intensity = value > 0 ? 0.3 + (value / max) * 0.7 : 0.14

        return (
          <span
            className={`${dotClass} border`}
            key={index}
            style={{
              backgroundColor: value > 0 ? accent : 'transparent',
              borderColor: accent,
              opacity: intensity,
            }}
          />
        )
      })}
    </div>
  )
}

function numericValues(values: StatValue[]): number[] {
  return values.filter((value): value is number => typeof value === 'number')
}

function getScale(values: number[]) {
  const max = values.length > 0 ? Math.max(...values) : 1
  const min = values.length > 0 ? Math.min(...values) : 0

  return { min, range: Math.max(max - min, 1) }
}

function toPoints(
  values: StatValue[],
  domain: number,
  min: number,
  range: number,
): (Point | null)[] {
  return values.map((value, index) =>
    typeof value === 'number'
      ? {
          x: (index / (domain - 1)) * 100,
          y: 88 - ((value - min) / range) * 72,
        }
      : null,
  )
}

function compactPoints(points: (Point | null)[]): Point[] {
  return points.filter((point): point is Point => point !== null)
}

function splitSegments(points: (Point | null)[]): Point[][] {
  const segments: Point[][] = []
  let current: Point[] = []

  for (const point of points) {
    if (point) {
      current.push(point)
      continue
    }

    if (current.length > 0) {
      segments.push(current)
      current = []
    }
  }

  if (current.length > 0) {
    segments.push(current)
  }

  return segments
}

function polylinePoints(points: Point[]): string {
  return points.map((point) => `${point.x},${point.y}`).join(' ')
}

function areaPoints(points: Point[]): string {
  if (points.length === 0) return ''

  return `${points[0].x},100 ${polylinePoints(points)} ${points.at(-1)?.x ?? 0},100`
}

function ridgeArea(points: Point[]): string {
  if (points.length < 2) return ''

  return `${smoothPath(points)} L ${points.at(-1)?.x ?? 0},100 L ${points[0].x},100 Z`
}

function smoothPath(points: Point[]): string {
  if (points.length === 0) return ''

  return points.reduce((path, point, index) => {
    if (index === 0) return `M ${point.x},${point.y}`

    const previous = points[index - 1]
    const midX = (previous.x + point.x) / 2

    return `${path} C ${midX},${previous.y} ${midX},${point.y} ${point.x},${point.y}`
  }, '')
}
