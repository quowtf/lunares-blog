import type { ReactElement } from 'react'

import type { StatIconName } from './types'

type IconProps = {
  className?: string
}

function BikeIcon({ className }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="5.5" cy="17" r="3.5" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="18.5" cy="17" r="3.5" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="m8.5 17 3.2-6.5h4.1L18.5 17M12 10.5 9.4 6.8H7.2M13.3 6.6h3.2"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.4"
      />
    </svg>
  )
}

function CoffeeIcon({ className }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M4.5 10.5h11v4.2a4.3 4.3 0 0 1-4.3 4.3H8.8a4.3 4.3 0 0 1-4.3-4.3v-4.2Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.4"
      />
      <path
        d="M15.5 11.4h1.3a2.8 2.8 0 0 1 0 5.6h-1.3M4 21h13"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.4"
      />
      <path
        d="M8 7.6c0-.9.7-1.2.7-2.1M11.7 7.6c0-.9.7-1.2.7-2.1"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.4"
      />
    </svg>
  )
}

function BoulderIcon({ className }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M3 19.5 9.2 6.8l3.1 5.6 2.5-3.9L21 19.5H3Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.4"
      />
      <path
        d="M8.2 13.3h2.6M13.8 16.4h2.4"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.4"
      />
    </svg>
  )
}

function GitIcon({ className }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="12" cy="12" r="3.1" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M3 12h5.9M15.1 12H21"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.4"
      />
    </svg>
  )
}

const iconMap: Record<StatIconName, (props: IconProps) => ReactElement> = {
  bike: BikeIcon,
  coffee: CoffeeIcon,
  boulder: BoulderIcon,
  git: GitIcon,
}

export function StatIcon({ name, className }: IconProps & { name: StatIconName }) {
  const Icon = iconMap[name]
  return <Icon className={className} />
}
