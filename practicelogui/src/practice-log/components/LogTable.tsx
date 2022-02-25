import React from 'react'

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
} from '@mui/material'
import {
  MusicNote,
  Assignment,
  AssignmentOutlined,
  AssignmentTurnedInSharp,
  Edit,
  Delete,
  FileCopy
} from '@mui/icons-material'
import { DateTime } from 'luxon'

import { LogLabelJSON, LogEntryJSON, LogAssignmentJSON } from '../types'
import './LogTable.scss'

type Props = {
  logEntries: LogEntryJSON[]
  scrollToBottom: () => void
  handleHTTPDeleteLogEntry: (log: LogEntryJSON) => void
  handleSelectLogEntry: (log: LogEntryJSON) => void
  handleFocusLogEntryAndAnchorEl: (event: React.MouseEvent<HTMLButtonElement>, log: LogEntryJSON) => void
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

  const makeHandlerSelectLogEntry = (log: LogEntryJSON) => () => {
    props.handleSelectLogEntry(log)
    props.scrollToBottom()
  }

  const makeHandlerDeleteLogEntry = (log: LogEntryJSON) => () => {
    props.handleHTTPDeleteLogEntry(log)
  }

  const makeHandlerCopyLogEntry = (log: LogEntryJSON) => () => {
    const copy: LogEntryJSON = Object.assign({}, log, {id: ""})
    copy.date = new Date()
    if (copy.assignments) {
      // Default assignment to be incompleted
      copy.assignments.forEach((assignment) => {
        assignment.completed = false
      })
    }
    props.handleSelectLogEntry(copy)
    props.scrollToBottom()
  }

  const makeHandlerSetLogViewAndAssignment = (log: LogEntryJSON) => (event: React.MouseEvent<HTMLButtonElement>) => {
    props.handleFocusLogEntryAndAnchorEl(event, log)
  }

  props.logEntries.forEach((log: LogEntryJSON) => {
    const chipStyle = { "margin": "0.1rem" }

    let labels: JSX.Element[] = []
    if (log.labels) {
      labels = log.labels.map((label: LogLabelJSON) => (
        <Chip key={label.id}
          style={chipStyle}
          label={label.name}
          icon={<MusicNote />}
          color="primary" />
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
          <AssignmentOutlined />
        </IconButton>
      )
    } else if (hasAllAssignmentCompleted(log.assignments)) {
      assignmentIconButton = (
        <IconButton color="primary" component="span" onClick={makeHandlerSetLogViewAndAssignment(log)}>
          <AssignmentTurnedInSharp />
        </IconButton>
      )
    } else {
      assignmentIconButton = (
        <IconButton color="primary" component="span" onClick={makeHandlerSetLogViewAndAssignment(log)}>
          <Assignment />
        </IconButton>
      )
    }

    tableRows.push(
      <TableRow key={log.id}>
        <TableCell style={cellStyle}>{formatDate(log.date)}</TableCell>
        <TableCell style={cellStyle}>{log.duration} mins</TableCell>
        <TableCell style={longCellStyle}>{labels}</TableCell>
        <TableCell style={longCellStyle}>{log.message}</TableCell>
        <TableCell style={cellStyle}>
        {assignmentIconButton}
        <IconButton color="primary" component="span" onClick={makeHandlerSelectLogEntry(log)}>
          <Edit />
        </IconButton>
        <IconButton color="primary" component="span" onClick={makeHandlerCopyLogEntry(log)}>
          <FileCopy />
        </IconButton>
        <IconButton color="error" component="span" onClick={makeHandlerDeleteLogEntry(log)}>
          <Delete />
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

function formatDate(d: Date): string {
  const dt = DateTime.fromISO(d.toISOString())
  dt.setZone("America/Los_Angeles")
  return dt.toLocaleString(DateTime.DATE_MED_WITH_WEEKDAY).toString()
}
