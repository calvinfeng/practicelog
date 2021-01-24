import React from 'react'

import { LogLabelJSON, LogEntryJSON, LogAssignmentJSON } from '../shared/type_definitions'
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
import MusicNote from '@material-ui/icons/MusicNote'
import DeleteIcon from '@material-ui/icons/Delete'
import EditIcon from '@material-ui/icons/Edit'
import AssignmentIcon from '@material-ui/icons/Assignment';
import AssignmentTurnedInSharpIcon from '@material-ui/icons/AssignmentTurnedInSharp';
import AssignmentOutlinedIcon from '@material-ui/icons/AssignmentOutlined';
import FileCopyIcon from '@material-ui/icons/FileCopy';

type Props = {
  logEntries: LogEntryJSON[]
  scrollToBottom: () => void
  handleHTTPDeleteLogEntry: (log: LogEntryJSON) => void
  handleSetEditLogEntry: (log: LogEntryJSON) => void
  handleSetViewLogEntryAndAnchorEl: (event: React.MouseEvent<HTMLButtonElement>, log: LogEntryJSON) => void
}

function hasAllAssignmentCompleted(list: LogAssignmentJSON[]): boolean {
  return list.filter((assignment: LogAssignmentJSON) => {
    return assignment.completed
  }).length === list.length
}

export default function LogTable(props: Props) {
  const tableRows: JSX.Element[] = []
  const cellStyle = { "padding": "5px" }
  const longCellStyle = { "padding": "5px", "width": "35%" }
  
  const makeHandlerSetLogEdit = (log: LogEntryJSON) => () => {
    props.handleSetEditLogEntry(log)
    props.scrollToBottom()
  }

  const makeHandlerDeleteLogEntry = (log: LogEntryJSON) => () => {
    props.handleHTTPDeleteLogEntry(log)
  }

  const makeHandlerSetLogCopy = (log: LogEntryJSON) => () => {
    const copy: LogEntryJSON = Object.assign({}, log, {id: ""})
    copy.date = new Date()
    if (copy.assignments) {
      // Default assignment to be incompleted
      copy.assignments.forEach((assignment) => {
        assignment.completed = false
      })
    }
    props.handleSetEditLogEntry(copy)
    props.scrollToBottom()
  }

  const makeHandlerSetLogViewAndAssignment = (log: LogEntryJSON) => (event: React.MouseEvent<HTMLButtonElement>) => {
    props.handleSetViewLogEntryAndAnchorEl(event, log)
  }
  
  props.logEntries.forEach((log: LogEntryJSON) => {
    const chipStyle = { "margin": "0.1rem" }

    let labels: JSX.Element[] = []
    if (log.labels) {
      labels = log.labels.map((label: LogLabelJSON) => (
        <Chip style={chipStyle} label={label.name} icon={<MusicNote />} color="primary" />
      ))
    }

    /**
     * When assignments are null, the icon is disabled
     */
    let assignmentIconButton: JSX.Element
    if (log.assignments === null || log.assignments === undefined || log.assignments.length === 0) {
      assignmentIconButton = (
        <IconButton color="primary" component="span" onClick={makeHandlerSetLogViewAndAssignment(log)}
          disabled={true}>
          <AssignmentOutlinedIcon />
        </IconButton>
      )
    } else if (hasAllAssignmentCompleted(log.assignments)) {
      assignmentIconButton = (
        <IconButton color="primary" component="span" onClick={makeHandlerSetLogViewAndAssignment(log)}>
          <AssignmentTurnedInSharpIcon />
        </IconButton>
      )
    } else {
      assignmentIconButton = (
        <IconButton color="primary" component="span" onClick={makeHandlerSetLogViewAndAssignment(log)}>
          <AssignmentIcon />
        </IconButton>
      )
    }

    tableRows.push(
      <TableRow>
        <TableCell style={cellStyle}>{log.date.toDateString()}</TableCell>
        <TableCell style={cellStyle}>{log.duration} mins</TableCell>
        <TableCell style={longCellStyle}>{labels}</TableCell>
        <TableCell style={longCellStyle}>{log.message}</TableCell>
        <TableCell style={cellStyle}>
        {assignmentIconButton}
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
