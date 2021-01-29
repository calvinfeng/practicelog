import React from 'react'
import { LogAssignmentJSON, LogLabelJSON } from '../../shared/type_definitions'

enum Mode {
  EditEntry = "EDIT_ENTRY",
  NewEntry = "NEW_ENTRY"
}

type Props = {

}

type State = {
  mode: Mode

  // Input represents value that will be submitted to backend
  // Each input state reflects the value of an input element.
  inputID: string | null
  inputLabelID: string | null
  inputDate: Date | null
  inputDuration: number
  inputMessage: string
  inputAssignmentName: string
  inputLabelList: LogLabelJSON[]
  inputAssignmentList: LogAssignmentJSON[]

  // Editing assignment is the current assignment that is being modified.
  editingAssignment: LogAssignmentJSON | null
}

