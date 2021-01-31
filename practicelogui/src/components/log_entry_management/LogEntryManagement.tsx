import React from 'react'
import {
  Typography,
  Paper } from '@material-ui/core'
import {
  LogAssignmentJSON,
  LogEntryJSON,
  LogLabelJSON, 
  Mode } from '../../shared/type_definitions'

import DateSelector from './DateSelector'
import LabelSelector from './LabelSelector'
import DurationSelector from './DurationSelector'
import MessageEditor from './MessageEditor'
import AssignmentEditor from './AssignmentEditor'

import './LogEntryManagement.scss'
import Submission from './Submission'

type Props = {
  // Prefix selected means the current entity is selected for modification.
  // The assumption is that the entity already exists.
  selectedLogEntry: LogEntryJSON | null

  // Collection of all labels
  logLabels: LogLabelJSON[]

  handleDeselectLogEntry: () => void
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
  inputLabelList: LogLabelJSON[]
  inputAssignmentList: LogAssignmentJSON[]
}

const defaultState: State = {
  mode: Mode.NewEntry,
  inputID: null,
  inputDate: new Date(),
  inputDuration: 0,
  inputMessage: "",
  inputLabelList: [],
  inputAssignmentList: [],
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
        inputLabelList: props.selectedLogEntry.labels,
        inputAssignmentList: props.selectedLogEntry.assignments,
      }
    }
  }

  componentWillReceiveProps(nextProps: Props) {
    if (nextProps.selectedLogEntry === null && this.props.selectedLogEntry === null) {
      return
    }

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
      inputLabelList: nextProps.selectedLogEntry.labels,
      inputAssignmentList: nextProps.selectedLogEntry.assignments,
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
  
  handleSetInputAssignmentList = (value: LogAssignmentJSON[]) => {
    this.setState({ inputAssignmentList: value})
  }

  handleSetInputMessage = (value: string) => {
    this.setState({ inputMessage: value })
  }

  handleRemoveFromInputLabelList = (labelID: string) => {
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
          inputLabelList={this.state.inputLabelList}
          removeFromInputLabelList={this.handleRemoveFromInputLabelList}
          setInputLabelList={this.handleSetInputLabelList} />
        <DurationSelector
          inputDuration={this.state.inputDuration}
          setInputDuration={this.handleSetInputDuration} />
        <MessageEditor
          inputMessage={this.state.inputMessage}
          setInputMessage={this.handleSetInputMessage} />
        <AssignmentEditor
          inputAssignmentList={this.state.inputAssignmentList}
          setInputAssignmentList={this.handleSetInputAssignmentList} />
        <Submission 
          mode={this.state.mode}
          inputID={this.state.inputID}
          inputDate={this.state.inputDate}
          inputDuration={this.state.inputDuration}
          inputMessage={this.state.inputMessage}
          inputLabelList={this.state.inputLabelList}
          inputAssignmentList={this.state.inputAssignmentList}
          handleHTTPUpdateLogEntry={this.props.handleHTTPUpdateLogEntry}
          handleHTTPCreateLogEntry={this.props.handleHTTPCreateLogEntry}
          handleDeselectLogEntry={this.props.handleDeselectLogEntry} />
      </Paper>
    )
  }
}
