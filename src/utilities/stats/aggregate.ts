import configPromise from '@payload-config'
import { getPayload } from 'payload'

import type {
  HomeStatCardData,
  HomeStatsData,
  StatChartData,
  StatValue,
} from '@/components/archive/stats/types'
import type { Activity } from '@/payload-types'

import { STAT_DEFINITIONS, STAT_ORDER, type StatType } from './config'
import { getCurrentAndPreviousMonth, getMonthDayRange } from './date'

type ActivitiesByType = Record<StatType, Activity[]>

type Period = {
  activities: Activity[]
  days: number
}

export async function getHomeStats(now = new Date()): Promise<HomeStatsData> {
  const payload = await getPayload({ config: configPromise })
  const { current, previous } = getCurrentAndPreviousMonth(now)
  const currentRange = getMonthDayRange(current.month, current.year)
  const previousRange = getMonthDayRange(previous.month, previous.year)

  const [currentActivities, previousActivities] = await Promise.all([
    queryActivities(payload, currentRange.start, currentRange.end),
    queryActivities(payload, previousRange.start, previousRange.end),
  ])

  const currentByType = groupByType(currentActivities)
  const previousByType = groupByType(previousActivities)
  const currentEndDay = getEndDay(currentActivities)

  return {
    cards: STAT_ORDER.map((type) =>
      buildCard({
        current: buildPeriod(currentByType[type], currentEndDay),
        definition: STAT_DEFINITIONS[type],
        previous: buildPeriod(
          previousByType[type],
          getDaysInRange(previousRange.start, previousRange.end),
        ),
        type,
      }),
    ),
  }
}

async function queryActivities(
  payload: Awaited<ReturnType<typeof getPayload>>,
  start: string,
  end: string,
): Promise<Activity[]> {
  const result = await payload.find({
    collection: 'activities',
    depth: 0,
    overrideAccess: true,
    pagination: false,
    where: {
      and: [
        {
          day: {
            greater_than_equal: start,
          },
        },
        {
          day: {
            less_than_equal: end,
          },
        },
      ],
    },
  })

  return result.docs as Activity[]
}

function groupByType(activities: Activity[]): ActivitiesByType {
  const grouped: ActivitiesByType = {
    bike: [],
    boulder: [],
    code: [],
    coffee: [],
  }

  for (const activity of activities) {
    grouped[activity.type].push(activity)
  }

  return grouped
}

function getEndDay(activities: Activity[]): number {
  return activities.reduce((max, activity) => Math.max(max, Number(activity.day.slice(8, 10))), 0)
}

function getDaysInRange(start: string, end: string): number {
  return Number(end.slice(8, 10)) - Number(start.slice(8, 10)) + 1
}

function buildPeriod(activities: Activity[], days: number): Period {
  return {
    activities,
    days,
  }
}

type BuildCardArgs = {
  current: Period
  definition: (typeof STAT_DEFINITIONS)[StatType]
  previous: Period
  type: StatType
}

function buildCard({ current, definition, previous, type }: BuildCardArgs): HomeStatCardData {
  const currentEndDay = getEndDay(current.activities)
  const previousSeries =
    previous.activities.length > 0 ? buildSeries(previous.activities, previous.days) : null
  const currentValue = sumValue(current.activities)
  const previousValue = sumValue(previous.activities)
  const delta =
    currentEndDay > 0 && previousValue > 0
      ? Math.round(((currentValue - previousValue) / previousValue) * 100)
      : undefined

  return {
    chart: buildChart(
      definition.chartType,
      current.activities,
      currentEndDay,
      previous,
      previousSeries,
    ),
    delta,
    details: buildDetails(definition, current.activities, currentValue, currentEndDay),
    featured: definition.featured,
    icon: definition.icon,
    id: type,
    title: definition.title,
    tone: definition.tone,
    unit: definition.unit,
    value: currentValue,
  }
}

function buildChart(
  chartType: (typeof STAT_DEFINITIONS)[StatType]['chartType'],
  currentActivities: Activity[],
  currentEndDay: number,
  previous: Period,
  previousSeries: StatValue[] | null,
): StatChartData {
  if (chartType === 'bars') {
    return {
      type: 'bars',
      current: {
        completed: buildWeeklyBoulder(currentActivities, currentEndDay, 'completed'),
        failed: buildWeeklyBoulder(currentActivities, currentEndDay, 'failed'),
      },
      previous:
        previous.activities.length > 0
          ? buildWeeklyValue(previous.activities, previous.days)
          : null,
    }
  }

  if (chartType === 'calendar') {
    return {
      type: 'calendar',
      current: buildSeries(currentActivities, currentEndDay),
      previous: previousSeries,
    }
  }

  if (chartType === 'ridgeline') {
    return {
      type: 'ridgeline',
      current: buildSeries(currentActivities, currentEndDay),
      previous: previousSeries,
    }
  }

  return {
    type: 'line',
    current: buildSeries(currentActivities, currentEndDay),
    previous: previousSeries,
  }
}

function buildSeries(activities: Activity[], length: number): StatValue[] {
  const series: StatValue[] = Array.from({ length }, () => null)

  for (const activity of activities) {
    const index = Number(activity.day.slice(8, 10)) - 1

    if (index >= 0 && index < length) {
      series[index] = (series[index] ?? 0) + (activity.value ?? 0)
    }
  }

  return series
}

function buildWeeklyValue(activities: Activity[], length: number): StatValue[] {
  const weeks: StatValue[] = Array.from({ length: Math.ceil(length / 7) }, () => null)

  for (const activity of activities) {
    const index = Math.floor((Number(activity.day.slice(8, 10)) - 1) / 7)

    if (index >= 0 && index < weeks.length) {
      weeks[index] = (weeks[index] ?? 0) + (activity.value ?? 0)
    }
  }

  return weeks
}

function buildWeeklyBoulder(
  activities: Activity[],
  length: number,
  field: 'completed' | 'failed',
): StatValue[] {
  const weeks: StatValue[] = Array.from({ length: Math.ceil(length / 7) }, () => null)

  for (const activity of activities) {
    if (typeof activity.attempts !== 'number' || typeof activity.failed !== 'number') continue

    const index = Math.floor((Number(activity.day.slice(8, 10)) - 1) / 7)
    const value = field === 'completed' ? activity.attempts - activity.failed : activity.failed

    if (index >= 0 && index < weeks.length) {
      weeks[index] = (weeks[index] ?? 0) + value
    }
  }

  return weeks
}

function sumValue(activities: Activity[]): number {
  return activities.reduce((sum, activity) => sum + (activity.value ?? 0), 0)
}

function buildDetails(
  definition: (typeof STAT_DEFINITIONS)[StatType],
  activities: Activity[],
  total: number,
  endDay: number,
): HomeStatCardData['details'] {
  if (!definition.details || activities.length === 0) return undefined

  const activeDays = new Set(
    activities.filter((activity) => (activity.value ?? 0) > 0).map((activity) => activity.day),
  ).size

  return definition.details.map((detail) => {
    switch (detail.type) {
      case 'completed':
        return {
          label: detail.label,
          value: activities.reduce(
            (sum, activity) =>
              sum +
              (typeof activity.attempts === 'number' && typeof activity.failed === 'number'
                ? activity.attempts - activity.failed
                : 0),
            0,
          ),
        }
      case 'failed':
        return {
          label: detail.label,
          value: activities.reduce((sum, activity) => sum + (activity.failed ?? 0), 0),
        }
      case 'average':
        return {
          label: detail.label,
          value: endDay > 0 ? Number((total / endDay).toFixed(detail.precision ?? 0)) : 0,
        }
      case 'activeDays':
        return {
          label: activeDays === 1 ? 'día activo' : detail.label,
          value: activeDays,
        }
    }
  })
}
