import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatTime(time: string): string {
  const [hours, minutes] = time.split(':')
  const h = parseInt(hours)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const hour12 = h % 12 || 12
  return `${hour12}:${minutes} ${ampm}`
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

export function formatEventDateRange(start: string, end: string): string {
  const s = new Date(start)
  const e = new Date(end)
  const sMonth = s.toLocaleDateString('en-US', { month: 'long' })
  const eMonth = e.toLocaleDateString('en-US', { month: 'long' })
  const sDay = s.getDate()
  const eDay = e.getDate()
  const year = e.getFullYear()

  if (sMonth === eMonth) {
    return `${sMonth} ${sDay} - ${eDay}, ${year}`
  }
  return `${sMonth} ${sDay} - ${eMonth} ${eDay}, ${year}`
}
