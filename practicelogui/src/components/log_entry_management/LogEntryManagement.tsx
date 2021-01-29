import React from 'react'
import { Typography } from '@material-ui/core'

import { LogAssignmentJSON, LogEntryJSON, LogLabelJSON } from '../../shared/type_definitions'
import { Paper } from '@material-ui/core'
import DateSelector from './DateSelector'

enum Mode {
  EditEntry = "EDIT_ENTRY",
  NewEntry = "NEW_ENTRY"
}

type Props = {
  logLabels: LogLabelJSON[]
  inEditLogEntry: LogEntryJSON | null
  handleClearEditLogEntry: () => void
  handleHTTPCreateLogEntry: (logEntry: LogEntryJSON) => void
  handleHTTPUpdateLogEntry: (logEntry: LogEntryJSON) => void
}

type State = {
  mode: Mode

  // Input represents value that will be submitted to backend
  // Each input state reflects the value of an input element.
  inputID: string | null
  inputDate: Date | null
  inputDuration: number
  inputMessage: string
  inputAssignmentName: string
  inputLabelList: LogLabelJSON[]
  inputAssignmentList: LogAssignmentJSON[]
  
  // Prefix in-edit means the current entity is being modified.
  // The assumption is that the entity already exists.
  inEditLabelID: string | null
  inEditAssignment: LogAssignmentJSON | null
}

const defaultState: State = {
  mode: Mode.NewEntry,
  inputID: null,
  inputDate: new Date(),
  inputDuration: 0,
  inputMessage: "",
  inputAssignmentName: "",
  inputLabelList: [],
  inputAssignmentList: [],
  inEditLabelID: null,
  inEditAssignment: null
}

export default class LogEntryManagement extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    if (props.inEditLogEntry == null) {
      this.state = defaultState
    } else {
      // If inEditLogEntry has a nil ID, we are creating a new entry.
      let mode: Mode = Mode.EditEntry
      if (props.inEditLogEntry.id.length === 0) {
        mode = Mode.NewEntry
      }

      this.state = {
        mode: mode,
        inputID: props.inEditLogEntry.id,
        inputDate: props.inEditLogEntry.date,
        inputDuration: props.inEditLogEntry.duration,
        inputMessage: props.inEditLogEntry.message,
        inputAssignmentName: "",
        inputLabelList: props.inEditLogEntry.labels,
        inputAssignmentList: props.inEditLogEntry.assignments,
        inEditLabelID: null,
        inEditAssignment: null
      }
    }
  }

  componentWillReceiveProps(nextProps: Props) {
    if (nextProps.inEditLogEntry === null) {
      this.setState(defaultState)
      return
    }

    let mode: Mode = Mode.EditEntry
    if (nextProps.inEditLogEntry.id.length === 0) {
      mode = Mode.NewEntry
    }

    this.setState({
      mode: mode,
      inputID: nextProps.inEditLogEntry.id,
      inputDate: nextProps.inEditLogEntry.date,
      inputDuration: nextProps.inEditLogEntry.duration,
      inputMessage: nextProps.inEditLogEntry.message,
      inputAssignmentName: "",
      inputLabelList: nextProps.inEditLogEntry.labels,
      inputAssignmentList: nextProps.inEditLogEntry.assignments,
      inEditLabelID: null,
      inEditAssignment: null
    })
  }

  handleSetInputDate = (date: Date | null) => {
    this.setState({ inputDate: date })
  }

  get header() {
    switch(this.state.mode) {
      case Mode.EditEntry:
        return <Typography variant="h5">Edit Log Entry {this.state.inputID}</Typography>
      case Mode.NewEntry:
        return <Typography variant="h5">Add Log Entry</Typography>  
    }
  }

  render() {
    return (
      <Paper className="LogEntryManagement">
        {this.header}
        <DateSelector
          inputDate={this.state.inputDate}
          setInputDate={this.handleSetInputDate} />
      </Paper>
    )
  }
}
