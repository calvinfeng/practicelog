export const nilUUID = '00000000-0000-0000-0000-000000000000'

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

export type PracticeTimeSeriesDataPoint = {
  year: number
  month: number
  day: number
  key: string
  value: number
}

export enum Mode {
  EditEntry = 'EDIT_ENTRY',
  NewEntry = 'NEW_ENTRY'
}

export enum DeleteConfirmationTarget {
  None = 'NONE',
  Child = 'CHILD',
  Parent = 'PARENT'
}
