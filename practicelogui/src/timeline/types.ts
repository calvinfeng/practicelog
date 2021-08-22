export type ThumbnailJSON = {
  url: string
  width: number
  height: number
}

export type VideoGroupJSON = {
  year: number
  month: number
  practice_recordings: VideoLogEntryJSON[]
  progress_recordings: VideoLogEntryJSON[]
}

export type VideoLogEntryJSON = {
  id: string
  username: string
  published: Date
  video_orientation: string
  title: string
  description: string
  is_monthly_progress: boolean
  thumbnails: any // This is a JSON, map of string to Thumbnail JSON
  minutes_of_guitar_practice: number
}

export enum VideoOrientation {
  Portrait = 'portrait',
  Landscape = 'landscape'
}

export type SummaryJSON = {
  id: string
  username: string
  year: number
  month: number
  title: string
  subtitle: string
  body: string
}

export const MonthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December"
]
