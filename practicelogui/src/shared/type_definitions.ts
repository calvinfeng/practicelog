export type LogLabelJSON = {
  id: string
  parent_id: string | null
  children: string[]
  name: string
  duration: number
}

export type LogLabelDurationJSON = {
  id: string
  duration: number
}

export type LogEntryJSON = {
  id: string
  date: Date
  username: string
  message: string
  details: string
  duration: number
  labels: LogLabelJSON[]
  assignments: LogAssignmentJSON[]
}

export type LogAssignmentJSON = {
  position: number
  name: string
  completed: boolean
}

export type GoogleUserProfile = {
  id_token: string
  access_token: string
  user_id: string
  email: string
  full_name: string
  first_name: string
  last_name: string
  avatar_url: string
}

export type AuthValidationResponse = {
  expires_in: number
  id: string
  email: string
  family_name: string
  given_name: string
  name: string
  locale: string
  picture: string
  verified_email: boolean
}

export type GoogleError = {
  error: string
  details: string
}

export enum DeleteConfirmationTarget {
  None = "NONE",
  Child = "CHILD",
  Parent = "PARENT"
}

export enum Mode {
  EditEntry = "EDIT_ENTRY",
  NewEntry = "NEW_ENTRY"
}

export const nilUUID = '00000000-0000-0000-0000-000000000000'

export type PracticeTimeSeriesDataPoint = {
  year: number
  month: number
  day: number
  key: string
  value: number
}

export type ThumbnailJSON = {
  url: string
  width: number
  height: number
}

export type VideoLogEntryJSON = {
  id: string
  username: string
  published: Date
  video_orientation: string
  title: string
  description: string
  is_monthly_progress: boolean
  thumbnails: Map<string, ThumbnailJSON>
  minutes_of_guitar_practice: number
}
