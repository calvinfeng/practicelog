import React from 'react'
import {
  Grid,
  Button
} from '@mui/material'

import {
  LogLabelJSON,
  LogAssignmentJSON,
  LogEntryJSON,
  Mode } from '../../types'

import { Save, Add } from '@mui/icons-material'

type Props = {
  mode: Mode
  inputID: string | null
  inputDate: Date | null
  inputDuration: number
  inputMessage: string
  inputLabelList: LogLabelJSON[]
  inputAssignmentList: LogAssignmentJSON[]
  handleHTTPUpdateLogEntry: (entry: LogEntryJSON) => void
  handleHTTPCreateLogEntry: (entry: LogEntryJSON) => void
  handleDeselectLogEntry: () => void
}

export default function Submission(props: Props) {
  const buttonStyle = { margin: "0.1rem" }
  let buttonGridItems: JSX.Element[] = []
  switch (props.mode) {
    case Mode.EditEntry:
      buttonGridItems = [
        <Grid item key="save-entry-submission">
          <Button style={buttonStyle} variant="contained" color="primary" startIcon={<Save />}
            onClick={ () => {
              const entry: LogEntryJSON = {
                id: props.inputID as string,
                username: "calvin.j.feng@gmail.com",
                date: new Date(),
                duration: props.inputDuration,
                message: props.inputMessage,
                labels: props.inputLabelList,
                assignments: props.inputAssignmentList,
                details: "",
              }
              if (props.inputDate !== null) {
                entry.date = props.inputDate
              }
              console.log("update log entry with date", entry.date.toISOString())
              props.handleHTTPUpdateLogEntry(entry)
            }}>
            Save Entry
          </Button>
        </Grid>,
        <Grid item key="cancel-save-entry-submission">
          <Button style={buttonStyle} variant="contained" color="secondary"
            onClick={props.handleDeselectLogEntry}>
            Cancel
          </Button>
        </Grid>
      ]
      break
    case Mode.NewEntry:
      buttonGridItems = [
        <Grid item key="new-entry-submission">
          <Button style={buttonStyle} variant="contained" color="primary" startIcon={<Add />}
            onClick={() => {
              const entry: LogEntryJSON = {
                id: "00000000-0000-0000-0000-000000000000",
                username: "calvin.j.feng@gmail.com",
                date: new Date(),
                duration: props.inputDuration,
                message: props.inputMessage,
                labels: props.inputLabelList,
                assignments: props.inputAssignmentList,
                details: "",
              }
              if (props.inputDate !== null) {
                entry.date = props.inputDate
              }
              console.log("create log entry with date", entry.date.toISOString())
              props.handleHTTPCreateLogEntry(entry)
            }}>
            New Entry
          </Button>
        </Grid>,
        <Grid item key="cancel-new-entry-submission">
          <Button
            style={buttonStyle}
            variant="contained"
            color="secondary"
            onClick={props.handleDeselectLogEntry}>
            Cancel
          </Button>
        </Grid>
      ]
      break
  }

  return (
    <Grid container
      direction="row" justifyContent="flex-end" alignItems="flex-end" spacing={0} style={{ marginTop: "1rem "}}>
      {buttonGridItems}
    </Grid>
  )
}
