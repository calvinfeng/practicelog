import { LogLabelJSON } from './types'

export const alphabetOrder = (a: LogLabelJSON, b: LogLabelJSON): number => {
  if (a.name < b.name) {
    return -1
  }
  if (a.name > b.name) {
    return 1
  }
  return 0
}
