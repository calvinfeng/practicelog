import React from 'react'

import { LogLabelJSON, LogEntryJSON } from '../shared/type_definitions'
import './LogTable.scss'

import {
  Chip,
  TableRow,
  TableCell,
  IconButton,
  TableContainer,
  Paper,
  Table,
  TableHead,
  TableBody,
} from '@material-ui/core'
import { MusicNote } from '@material-ui/icons'
import DeleteIcon from '@material-ui/icons/Delete'
import EditIcon from '@material-ui/icons/Edit'
import AssignmentIcon from '@material-ui/icons/Assignment';
import FileCopyIcon from '@material-ui/icons/FileCopy';

type Props = {
  logEntries: LogEntryJSON[]
  handleHTTPDeleteLogEntry: (log: LogEntryJSON) => void
  handleSetLogEntryEdit: (log: LogEntryJSON) => void
  handleSetLogEntryViewAndAnchorEl: (event: React.MouseEvent<HTMLButtonElement>, log: LogEntryJSON) => void
}

export default function LogTable(props: Props) {
  const tableRows: JSX.Element[] = []
  const cellStyle = { "padding": "5px" }

  const makeHandlerSetLogEdit = (log: LogEntryJSON) => () => {
    props.handleSetLogEntryEdit(log)
  }

  const makeHandlerDeleteLogEntry = (log: LogEntryJSON) => () => {
    props.handleHTTPDeleteLogEntry(log)
  }

  const makeHandlerSetLogCopy = (log: LogEntryJSON) => () => {
    const copy: LogEntryJSON = Object.assign({}, log, {id: ""})
    props.handleSetLogEntryEdit(copy)
  }

  const makeHandlerSetLogViewAndAssignment = (log: LogEntryJSON) => (event: React.MouseEvent<HTMLButtonElement>) => {
    props.handleSetLogEntryViewAndAnchorEl(event, log)
  }
  
  props.logEntries.forEach((log: LogEntryJSON) => {
    const chipStyle = { "margin": "0.1rem" }

    let labels: JSX.Element[] = []
    if (log.labels) {
      labels = log.labels.map((label: LogLabelJSON) => (
        <Chip style={chipStyle} label={label.name} icon={<MusicNote />} color="primary" />
      ))
    }

    tableRows.push(
      <TableRow>
        <TableCell style={cellStyle}>{log.date.toDateString()}</TableCell>
        <TableCell style={cellStyle}>{log.duration} minutes</TableCell>
        <TableCell style={cellStyle}>{labels}</TableCell>
        <TableCell style={cellStyle}>{log.message}</TableCell>
        <TableCell style={cellStyle}>
        <IconButton color="primary" component="span" onClick={makeHandlerSetLogViewAndAssignment(log)}>
          <AssignmentIcon/>
        </IconButton>
        <IconButton color="primary" component="span" onClick={makeHandlerSetLogEdit(log)}>
          <EditIcon />
        </IconButton>
        <IconButton color="primary" component="span" onClick={makeHandlerSetLogCopy(log)}>
          <FileCopyIcon />
        </IconButton>
        <IconButton color="secondary" component="span" onClick={makeHandlerDeleteLogEntry(log)}>
          <DeleteIcon />
        </IconButton>
        </TableCell>
      </TableRow>
    )
  })
  
  return (
    <TableContainer className="LogTable" component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell style={cellStyle}>Date</TableCell>
            <TableCell style={cellStyle}>Duration</TableCell>
            <TableCell style={cellStyle}>Labels</TableCell>
            <TableCell style={cellStyle}>Message</TableCell>
            <TableCell style={cellStyle}>Action</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {tableRows}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
