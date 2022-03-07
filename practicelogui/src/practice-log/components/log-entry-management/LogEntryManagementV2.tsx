import React from 'react'

import {
  LogAssignmentJSON,
  LogEntryJSON,
  LogLabelJSON,
  Mode
} from '../../types'
import { Paper, Typography } from '@mui/material'

import DateSelector from './DateSelector'
import LabelSelector from './LabelSelector'
import DurationSelector from './DurationSelector'
import MessageEditor from './MessageEditor'
import AssignmentEditor from './AssignmentEditor'
import Submission from './Submission'
import './LogEntryManagement.scss'

type Props = {
  // Collection of all labels
  logLabels: LogLabelJSON[]
  logEntries: LogEntryJSON[]

  // Prefix selected means the current entity is selected for modification.
  // The assumption is that the entity already exists.
  selectedLogEntry: LogEntryJSON | null

  handleDeselectLogEntry: () => void
  handleHTTPCreateLogEntry: (logEntry: LogEntryJSON) => void
  handleHTTPUpdateLogEntry: (logEntry: LogEntryJSON) => void
}

export default function LogEntryManagementV2(props: Props) {
  const [inputID, setInputID] = React.useState<string | null>(null)
  const [inputDate, setInputDate] = React.useState<Date | null>(null)
  const [inputDuration, setInputDuration] = React.useState<number>(0)
  const [inputMessage, setInputMessage] = React.useState<string>('')
  const [inputLabelList, setInputLabelList] = React.useState<LogLabelJSON[]>([])
  const [inputAssignmentList, setInputAssignmentList] = React.useState<LogAssignmentJSON[]>([])

  // If props change, copy over the value to state. This is same as componentWillReceiveProps.
  React.useEffect(() => {
    if (props.selectedLogEntry !== null) {
      setInputID(props.selectedLogEntry.id)
      setInputDate(props.selectedLogEntry.date)
      setInputDuration(props.selectedLogEntry.duration)
      setInputMessage(props.selectedLogEntry.message)
      setInputLabelList(props.selectedLogEntry.labels)
      setInputAssignmentList(props.selectedLogEntry.assignments)
    } else {
      // Deselected log entry will make props null.
      setInputID(null)
      setInputDate(null)
      setInputDuration(0)
      setInputMessage('')
      setInputLabelList([])
      setInputAssignmentList([])
    }
  }, [props.selectedLogEntry])

  React.useEffect(() => {
    setInputID(null)
    setInputDate(null)
    setInputDuration(0)
    setInputMessage('')
    setInputLabelList([])
    setInputAssignmentList([])
  }, [props.logEntries])

  let mode: Mode = props.selectedLogEntry !== null && props.selectedLogEntry.id.length > 0 ?  Mode.EditEntry : Mode.NewEntry

  const header = () => {
    switch(mode) {
      case Mode.EditEntry:
        return <Typography variant="h5">Edit Log Entry {inputID}</Typography>
      case Mode.NewEntry:
        return <Typography variant="h5">Add Log Entry</Typography>
      default:
        return <Typography variant="h5"></Typography>
    }
  }

  const handleRemoveFromInputLabelList = (labelID: string) => {
    setInputLabelList(inputLabelList.filter((label: LogLabelJSON) => {
       return label.id !== labelID
     })
    )
  }

  // TODO: As soon as handleCreateLogEntry is successful, clear the state.
  // How to do it?
  return (
    <Paper className="LogEntryManagement">
      {header()}
      <DateSelector
        inputDate={inputDate}
        setInputDate={(value: Date | null) => setInputDate(value)} />
      <LabelSelector
        logLabels={props.logLabels}
        inputLabelList={inputLabelList}
        removeFromInputLabelList={handleRemoveFromInputLabelList}
        setInputLabelList={(value:  LogLabelJSON[]) => setInputLabelList(value)} />
      <DurationSelector
        inputDuration={inputDuration}
        setInputDuration={(value: number) => setInputDuration(value)} />
      <MessageEditor
        inputMessage={inputMessage}
        setInputMessage={(value: string) => setInputMessage(value)} />
      <AssignmentEditor
        inputAssignmentList={inputAssignmentList}
        setInputAssignmentList={(value: LogAssignmentJSON[]) => setInputAssignmentList(value)} />
      <Submission
        mode={mode}
        inputID={inputID}
        inputDate={inputDate}
        inputDuration={inputDuration}
        inputMessage={inputMessage}
        inputLabelList={inputLabelList}
        inputAssignmentList={inputAssignmentList}
        handleHTTPUpdateLogEntry={props.handleHTTPUpdateLogEntry}
        handleHTTPCreateLogEntry={props.handleHTTPCreateLogEntry}
        handleDeselectLogEntry={props.handleDeselectLogEntry} />
    </Paper>
  )
}
