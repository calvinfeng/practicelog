import React from 'react'
import { Typography } from '@material-ui/core'

import { LogAssignmentJSON, LogEntryJSON, LogLabelJSON } from '../../shared/type_definitions'
import { Paper } from '@material-ui/core'
import DateSelector from './DateSelector'
import LabelSelector from './LabelSelector'
import DurationSelector from './DurationSelector'

enum Mode {
  EditEntry = "EDIT_ENTRY",
  NewEntry = "NEW_ENTRY"
}

type Props = {
  // Prefix selected means the current entity is selected for modification.
  // The assumption is that the entity already exists.
  selectedLogEntry: LogEntryJSON | null

  // Collection of all labels
  logLabels: LogLabelJSON[]

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

  // Prefix selected means the current entity is selected for modification.
  // The assumption is that the entity already exists.
  selectedLabelID: string | null
  selectedAssignment: LogAssignmentJSON | null
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
  selectedLabelID: null,
  selectedAssignment: null
}

export default class LogEntryManagement extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    if (props.selectedLogEntry == null) {
      this.state = defaultState
    } else {
      // If selectedLogEntry has a nil ID, we are creating a new entry.
      let mode: Mode = Mode.EditEntry
      if (props.selectedLogEntry.id.length === 0) {
        mode = Mode.NewEntry
      }

      this.state = {
        mode: mode,
        inputID: props.selectedLogEntry.id,
        inputDate: props.selectedLogEntry.date,
        inputDuration: props.selectedLogEntry.duration,
        inputMessage: props.selectedLogEntry.message,
        inputAssignmentName: "",
        inputLabelList: props.selectedLogEntry.labels,
        inputAssignmentList: props.selectedLogEntry.assignments,
        selectedLabelID: null,
        selectedAssignment: null
      }
    }
  }

  componentWillReceiveProps(nextProps: Props) {
    if (nextProps.selectedLogEntry === null) {
      this.setState(defaultState)
      return
    }

    let mode: Mode = Mode.EditEntry
    if (nextProps.selectedLogEntry.id.length === 0) {
      mode = Mode.NewEntry
    }

    this.setState({
      mode: mode,
      inputID: nextProps.selectedLogEntry.id,
      inputDate: nextProps.selectedLogEntry.date,
      inputDuration: nextProps.selectedLogEntry.duration,
      inputMessage: nextProps.selectedLogEntry.message,
      inputAssignmentName: "",
      inputLabelList: nextProps.selectedLogEntry.labels,
      inputAssignmentList: nextProps.selectedLogEntry.assignments,
      selectedLabelID: null,
      selectedAssignment: null
    })
  }

  handleSetInputDate = (value: Date | null) => {
    this.setState({ inputDate: value })
  }

  handleSetInputDuration = (value: number) => {
    this.setState({ inputDuration: value})
  }

  handleSetInputLabelList = (value:  LogLabelJSON[]) => {
    this.setState({ inputLabelList: value })
  }

  handleSetSelectedLabelID = (value: string | null) => {
    this.setState({ selectedLabelID: value })
  }

  handleRemoveFromInputLabelList = (labelID: string) => () => {
    this.setState({
      inputLabelList: this.state.inputLabelList.filter((label: LogLabelJSON) => {
       return label.id !== labelID
     })
    })
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
        <LabelSelector
          logLabels={this.props.logLabels}
          removeFromInputLabelList={this.handleRemoveFromInputLabelList}
          inputLabelList={this.state.inputLabelList}
          setInputLabelList={this.handleSetInputLabelList}
          selectedLabelID={this.state.selectedLabelID}
          setSelectLabelID={this.handleSetSelectedLabelID} />
        <DurationSelector
          inputDuration={this.state.inputDuration}
          setInputDuration={this.handleSetInputDuration} />
      </Paper>
    )
  }
}
