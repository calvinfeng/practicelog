import React from 'react'
import DateFnsUtils from '@date-io/date-fns'
import {
  MuiPickersUtilsProvider,
  KeyboardDatePicker
} from '@material-ui/pickers'
import { 
  Grid,
  Chip,
  Typography,
  Button,
  Slider,
  TextField,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  Paper,
  IconButton,
  List,
  ListItem,
  ListItemSecondaryAction,
  ListItemText
} from '@material-ui/core'
import AddIcon from '@material-ui/icons/Add'
import SaveIcon from '@material-ui/icons/Save'
import DeleteIcon from '@material-ui/icons/Delete'
import FormatListBulletedIcon from '@material-ui/icons/FormatListBulleted';
import MusicNote from '@material-ui/icons/MusicNote'
import EditIcon from '@material-ui/icons/Edit'
import { MaterialUiPickersDate } from '@material-ui/pickers/typings/date'

import './LogEntryManagement.scss'
import {
  LogAssignmentJSON,
  LogEntryJSON,
  LogLabelJSON
} from '../shared/type_definitions'

type Props = {
  logLabels: LogLabelJSON[]
  editLogEntry: LogEntryJSON | null
  handleClearEditLogEntry: () => void
  handleHTTPCreateLogEntry: (logEntry: LogEntryJSON) => void
  handleHTTPUpdateLogEntry: (logEntry: LogEntryJSON) => void
}

type State = {
  mode: Mode
  inputFieldLogID: string | null
  inputFieldDate: Date | null
  inputFieldDuration: number
  inputFieldMessage: string
  inputFieldNewAssignmentName: string
  inputFieldLabels: LogLabelJSON[]
  inputFieldAssignments: LogAssignmentJSON[]
  selectorFieldLabelID: string | null
  editAssignment: LogAssignmentJSON | null
}

enum Mode {
  Edit = "EDIT",
  Add = "ADD"
}

const defaultState: State = {
  mode: Mode.Add,
  inputFieldLogID: "",
  inputFieldDate: new Date(),
  inputFieldDuration: 0,
  inputFieldMessage: "",
  inputFieldLabels: [],
  inputFieldNewAssignmentName: "",
  inputFieldAssignments: [],
  selectorFieldLabelID: null,
  editAssignment: null
}

/**
 * TODO: Refactor this into multiple smaller components
 * - Assignment Panel is one
 */

export default class LogEntryManagement extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)

    if (props.editLogEntry === null) {
      this.state = defaultState
    } else {
      let mode: Mode = Mode.Edit
      if (props.editLogEntry.id.length === 0) {
        mode = Mode.Add
      }

      this.state = {
        mode: mode,
        inputFieldLogID: props.editLogEntry.id,
        inputFieldDate: props.editLogEntry.date,
        inputFieldDuration: props.editLogEntry.duration,
        inputFieldLabels: props.editLogEntry.labels,
        inputFieldMessage: props.editLogEntry.message,
        inputFieldAssignments: props.editLogEntry.assignments,
        selectorFieldLabelID: null,
        inputFieldNewAssignmentName: "",
        editAssignment: null
      }
    }
  }

  componentWillReceiveProps(nextProps: Props) {
    if (nextProps.editLogEntry === null) {
      this.setState(defaultState)
      return
    }

    let mode: Mode = Mode.Edit
    if (nextProps.editLogEntry.id.length === 0) {
      mode = Mode.Add
    }

    this.setState({
      mode: mode,
      inputFieldLogID: nextProps.editLogEntry.id,
      inputFieldDate: nextProps.editLogEntry.date,
      inputFieldDuration: nextProps.editLogEntry.duration,
      inputFieldLabels: nextProps.editLogEntry.labels,
      inputFieldMessage: nextProps.editLogEntry.message,
      inputFieldAssignments: nextProps.editLogEntry.assignments,
      selectorFieldLabelID: null,
      inputFieldNewAssignmentName: "",
      editAssignment: null
    })
  }

  isLabelSelectedAlready(labelID: string): boolean {
    const found = this.state.inputFieldLabels.find(
      (label: LogLabelJSON) => label.id === labelID
    )
    return Boolean(found)
  }

  findLabelFromProps(labelID: string): LogLabelJSON | undefined {
    return this.props.logLabels.find(
      (label: LogLabelJSON) => label.id === labelID
    )
  }

  get header() {
    switch (this.state.mode) {
      case Mode.Edit:
        return <Typography variant="h5">Edit Log Entry {this.state.inputFieldLogID}</Typography>
      case Mode.Add:
        return <Typography variant="h5">Add Log Entry</Typography>
    }
  }

  get editPanelDate() {
    const handleDateChange = (date: MaterialUiPickersDate) => {
      this.setState({ inputFieldDate: date })
    }

    return (
      <section className="edit-panel-date">
        <MuiPickersUtilsProvider utils={DateFnsUtils}>
          <KeyboardDatePicker
            disableToolbar
            variant="inline"
            format="MM/dd/yyyy"
            margin="normal"
            label="Date"
            animateYearScrolling={true}
            value={this.state.inputFieldDate}
            onChange={handleDateChange} />
        </MuiPickersUtilsProvider>
      </section>
    )
  }

  get editPanelLabels() {
    if (this.props.logLabels.length === 0) {
      return <div></div>
    }

    const newHandlerRemoveLabel = (labelID: string) => () => {
      this.setState({
       inputFieldLabels: this.state.inputFieldLabels.filter((label: LogLabelJSON) => {
         return label.id !== labelID
       })
      }) 
    }

    const chips = this.state.inputFieldLabels.map((label: LogLabelJSON) => {
      return (
        <Grid item>
          <Chip 
            style={{ margin: "0.1rem" }}
            label={label.name}
            icon={<MusicNote />}
            color="primary"
            onDelete={newHandlerRemoveLabel(label.id)} />
        </Grid>
      )
    })

    const handleLabelAdd = () => {
      if (this.state.selectorFieldLabelID === null) {
        return
      }

      if (this.isLabelSelectedAlready(this.state.selectorFieldLabelID)) {
        return
      }

      const newInputFieldLabels = [...this.state.inputFieldLabels]

      const labelToAdd = this.findLabelFromProps(this.state.selectorFieldLabelID)
      if (labelToAdd) {
        newInputFieldLabels.push(labelToAdd)
      }

      if (labelToAdd &&
          labelToAdd.parent_id !== null &&
          !this.isLabelSelectedAlready(labelToAdd.parent_id)
      ) {
          const parentToAdd = this.findLabelFromProps(labelToAdd.parent_id)
          if (parentToAdd) {
            newInputFieldLabels.push(parentToAdd)
          }
        }
      this.setState({ inputFieldLabels: newInputFieldLabels })
    }

    const handleSelectorFieldLabelChange = (ev: React.ChangeEvent<{ name?: string; value: unknown }>) => {
      this.setState({
        selectorFieldLabelID: ev.target.value as string
      })
    }

    return (
      <section className="edit-panel-labels">
        <Grid direction="row" justify="flex-start" alignItems="center" container spacing={0}>
          {chips}
        </Grid>
        <Grid direction="row" justify="flex-end" alignItems="flex-end" container spacing={0}>
          <Grid item>
          <FormControl style={{width: "200px"}}>
            <InputLabel id="label-selector-label">Label</InputLabel>
              <Select
                labelId="label-selector-label"
                id="label-selector"
                value={this.state.selectorFieldLabelID}
                onChange={handleSelectorFieldLabelChange}>
                  {this.props.logLabels.map((label: LogLabelJSON) => {
                    return <MenuItem value={label.id}>
                      {label.name}
                    </MenuItem>
                  })}
              </Select>
          </FormControl>  
          </Grid>
          <Grid item>
            <Button
              variant="outlined"
              color="primary"
              style={{marginLeft: "0.5rem"}}
              onClick={handleLabelAdd}
              startIcon={<AddIcon/>}>
              Add Label
            </Button>
          </Grid>
        </Grid>
      </section>
    )
  }

  get editPanelDuration() {
    const handleDurationChange = (_: React.ChangeEvent<{}>, value: unknown) => {
      this.setState({ inputFieldDuration: value as number })
    }

    return (
      <section className="edit-panel-duration">
        <Typography id="discrete-minute-slider" gutterBottom>
          Duration: {this.state.inputFieldDuration} minutes
        </Typography>
        <Slider
          defaultValue={0}
          value={this.state.inputFieldDuration}
          onChange={handleDurationChange}
          aria-labelledby="discrete-minute-slider"
          valueLabelDisplay="auto"
          step={5}
          marks={true}
          min={0}
          max={180} />
      </section>
    )
  }

  get editPanelMessage() {
    const handleMessageChange = (ev: React.ChangeEvent<HTMLInputElement>) => {
      this.setState({ inputFieldMessage: ev.target.value })
    }

    return (
      <section className="edit-panel-message">
        <TextField
          label="Log Message"
          value={this.state.inputFieldMessage}
          onChange={handleMessageChange}
          fullWidth
          InputLabelProps={{ shrink: true }} />
      </section>
    )
  }

  get editPanelAssignmentList() {
    if (!Boolean(this.state.inputFieldAssignments)) {
      return <List dense={false}></List>
    }

    // Optional Input: event: React.MouseEvent<HTMLButtonElement, MouseEvent> for button
    const newHandlerDeleteAssignment = (assignment: LogAssignmentJSON) => () => {
      const newAssignments = [...this.state.inputFieldAssignments]
      newAssignments.splice(assignment.position, 1)
      for (let i = 0; i < newAssignments.length; i++) {
        newAssignments[i].position = i
      }

      this.setState({ inputFieldAssignments: newAssignments })
    }

    const newHandlerEditAssignment =(assignment: LogAssignmentJSON) => () => {
      this.setState({
        editAssignment: assignment, 
        inputFieldNewAssignmentName: assignment.name
      })
    }

    const items = this.state.inputFieldAssignments.map((assignment: LogAssignmentJSON) => {
      return (
        <ListItem>
          <FormatListBulletedIcon color="action" />
          <ListItemText primary={assignment.name} style={{"marginLeft": "1rem"}}/>
          <ListItemSecondaryAction>
            <IconButton edge="end" aria-label="Edit" onClick={newHandlerEditAssignment(assignment)}>
              <EditIcon />
            </IconButton>
            <IconButton edge="end" aria-label="Delete" onClick={newHandlerDeleteAssignment(assignment)}>
              <DeleteIcon />
            </IconButton>
          </ListItemSecondaryAction>
        </ListItem>
      )
    })

    return <List dense={false}>{items}</List>
  }

  get editPanelNewAssignment() {
    const handleNewAssignmentSubmit = (ev: React.FormEvent<HTMLFormElement>) => {
      ev.preventDefault()
      let newAssignmentList: LogAssignmentJSON[] = []
      if (Boolean(this.state.inputFieldAssignments)) {
        newAssignmentList = [...this.state.inputFieldAssignments]
      }

      if (this.state.editAssignment !== null) {
        newAssignmentList[this.state.editAssignment.position].name = this.state.inputFieldNewAssignmentName
        newAssignmentList[this.state.editAssignment.position].completed = false
      } else {
        newAssignmentList.push({
          position: newAssignmentList.length,
          name: this.state.inputFieldNewAssignmentName,
          completed: false
        })
      }

      this.setState({
        inputFieldAssignments: newAssignmentList,
        inputFieldNewAssignmentName: "",
        editAssignment: null
      })
    }

    const handleAssignmentNameTextFieldChange = (ev: React.ChangeEvent<HTMLInputElement>) => {
      this.setState({
        inputFieldNewAssignmentName: ev.target.value
      })
    }

    const handleClearEditAssignment = () => {
      this.setState({ editAssignment: null, inputFieldNewAssignmentName: "" })
    }

    const gridItems: JSX.Element[] = [
      <Grid item>
        <TextField
          style={{width: "500px"}}
          label="Assignment Name"
          value={this.state.inputFieldNewAssignmentName}
          onChange={handleAssignmentNameTextFieldChange}
          fullWidth
          InputLabelProps={{ shrink: true }} />
      </Grid>
    ]

    if (this.state.editAssignment !== null) {
      gridItems.push(
        <Grid item>
          <Button variant="outlined" color="primary" type="submit" form="assignment-form"
            style={{marginLeft: "0.5rem"}}>
              Save Assignment {this.state.editAssignment.position}
          </Button>
        </Grid>
      )
    } else {
      let newPosition: number = 0
      if (this.state.inputFieldAssignments) {
        newPosition = this.state.inputFieldAssignments.length
      }
      gridItems.push(
        <Grid item>
          <Button variant="outlined" color="primary" type="submit" form="assignment-form"
            style={{marginLeft: "0.5rem"}}>
              Add Assignment {newPosition}
          </Button>
        </Grid>
      )
    }

    gridItems.push(
      <Grid item>
        <Button variant="outlined" color="secondary" onClick={handleClearEditAssignment}
          disabled={this.state.editAssignment === null}
          style={{marginLeft: "0.5rem"}}>
            Clear
        </Button>
      </Grid>
    )

    return (
      <form className="assignment-input" id="assignment-form" onSubmit={handleNewAssignmentSubmit}>
        <Grid container 
          direction="row" justify="flex-end" alignItems="flex-end" spacing={0} style={{ marginTop: "1rem "}}>
          {gridItems}
        </Grid>
      </form>
    )
  }

  get submission() {
    const buttonStyle = { margin: "0.1rem" }
    let buttonGridItems: JSX.Element[] = []
    switch (this.state.mode) {
      case Mode.Edit:
        buttonGridItems = [
          <Grid item>
            <Button style={buttonStyle} variant="contained" color="primary" startIcon={<SaveIcon />}
              onClick={ () => {
                const logEntry: LogEntryJSON = {
                  id: this.state.inputFieldLogID as string,
                  user_id: "calvin.j.feng@gmail.com",
                  date: new Date(),
                  duration: this.state.inputFieldDuration,
                  message: this.state.inputFieldMessage,
                  labels: this.state.inputFieldLabels,
                  assignments: this.state.inputFieldAssignments,
                  details: "",
                }
                if (this.state.inputFieldDate !== null) {
                  logEntry.date = this.state.inputFieldDate
                }
                console.log("update log entry with date", logEntry.date)
                this.props.handleHTTPUpdateLogEntry(logEntry)
              }}>
              Save Entry
            </Button>
          </Grid>,
          <Grid item>
            <Button style={buttonStyle} variant="contained" color="secondary"
              onClick={this.props.handleClearEditLogEntry}>
              Cancel
            </Button>
          </Grid>
        ]
        break
      case Mode.Add:
        buttonGridItems = [
          <Grid item>
            <Button style={buttonStyle} variant="contained" color="primary" startIcon={<AddIcon />}
              onClick={() => {
                const logEntry: LogEntryJSON = {
                  id: "00000000-0000-0000-0000-000000000000",
                  user_id: "calvin.j.feng@gmail.com",  
                  date: new Date(),
                  duration: this.state.inputFieldDuration,
                  message: this.state.inputFieldMessage,
                  labels: this.state.inputFieldLabels, 
                  assignments: this.state.inputFieldAssignments,
                  details: "",
                }
                if (this.state.inputFieldDate !== null) {
                  logEntry.date = this.state.inputFieldDate
                }
                console.log("create log entry with date", logEntry.date)
                this.props.handleHTTPCreateLogEntry(logEntry)
              }}>
              New Entry
            </Button>
          </Grid>,
          <Grid item>
            <Button style={buttonStyle} variant="contained" color="secondary"
              onClick={this.props.handleClearEditLogEntry}>
              Cancel
            </Button>
          </Grid>
        ]
        break
    }

    return (
      <Grid container 
        direction="row" justify="flex-end" alignItems="flex-end" spacing={0} style={{ marginTop: "1rem "}}>
        {buttonGridItems}
      </Grid>
    )
  }

  render() {    
    return (
      <Paper className="LogEntryManagement">
        {this.header}
        {this.editPanelDate}
        {this.editPanelDuration}
        {this.editPanelLabels}
        {this.editPanelAssignmentList}
        {this.editPanelNewAssignment}
        {this.editPanelMessage}
        {this.submission}
      </Paper>
    )
  }
}

type AssignmentTextInputProps = {
  currentAssignmentList: LogAssignmentJSON[]
  editingAssignment: LogAssignmentJSON | null

  setAssignmentList: (list: LogAssignmentJSON[]) => void
  clearEditingAssignment: () => void
}

function AssignmentTextInput(props: AssignmentTextInputProps) {

  const [newAssignmentName, setNewAssignmentName] = React.useState("")

  const handleFormSubmitAssignment = (ev: React.FormEvent<HTMLFormElement>) => {
    ev.preventDefault()
    let newAssignmentList: LogAssignmentJSON[] = []
    if (Boolean(props.currentAssignmentList)) {
      newAssignmentList = [...props.currentAssignmentList]
    }
    
    if (props.editingAssignment !== null) {
      newAssignmentList[props.editingAssignment.position].name = newAssignmentName
      newAssignmentList[props.editingAssignment.position].completed = false
    } else {
      newAssignmentList.push({
        position: newAssignmentList.length,
        name: newAssignmentName,
        completed: false
      })
    }

    setNewAssignmentName("")
    props.setAssignmentList(newAssignmentList)
    props.clearEditingAssignment()
  }

  const handleTFChangeAssignmentName = (ev: React.ChangeEvent<HTMLInputElement>) => {
    setNewAssignmentName(ev.target.value)
  }

  const gridItems: JSX.Element[] = [
    <Grid item>
      <TextField
        style={{width: "500px"}}
        label="Assignment Name"
        value={newAssignmentName}
        onChange={handleTFChangeAssignmentName}
        fullWidth
        InputLabelProps={{ shrink: true }} />
    </Grid>
  ]

  if (props.editingAssignment !== null) {
    gridItems.push(
      <Grid item>
        <Button variant="outlined" color="primary" type="submit" form="assignment-form"
          style={{marginLeft: "0.5rem"}}>
            Save Assignment {props.editingAssignment.position}
        </Button>
      </Grid>
    )
  } else {
    let newPosition: number = 0
    if (props.currentAssignmentList) {
      newPosition = props.currentAssignmentList.length
    }

    gridItems.push(
      <Grid item>
        <Button variant="outlined" color="primary" type="submit" form="assignment-form"
          style={{marginLeft: "0.5rem"}}>
            Add Assignment {newPosition}
        </Button>
      </Grid>
    )
  }

  gridItems.push(
    <Grid item>
      <Button variant="outlined" color="secondary"
        onClick={props.clearEditingAssignment}
        disabled={props.editingAssignment === null}
        style={{marginLeft: "0.5rem"}}>
          Clear
      </Button>
    </Grid>
  )

  return (
    <form className="assignment-text-input" id="assignment-form" onSubmit={handleFormSubmitAssignment}>
      <Grid container 
        direction="row" justify="flex-end" alignItems="flex-end" spacing={0} style={{ marginTop: "1rem "}}>
        {gridItems}
      </Grid>
    </form>
  )
}

type AssignmentListViewProps = {
  currentAssignmentList: LogAssignmentJSON[]

  setInputFieldAssignmentName: (name: string) => void

  setAssignmentList: (list: LogAssignmentJSON[]) => void
  setEditingAssignment: (assignment: LogAssignmentJSON) => void
}

function AssigmentListView(props: AssignmentListViewProps) {
  if (!Boolean(props.currentAssignmentList)) {
    return <List dense={false}></List>
  }

  // Optional Input: event: React.MouseEvent<HTMLButtonElement, MouseEvent> for button
  const newHandlerDeleteAssignment = (assignment: LogAssignmentJSON) => () => {
    const newAssignmentList = [...props.currentAssignmentList]
    newAssignmentList.splice(assignment.position, 1)
    for (let i = 0; i < newAssignmentList.length; i++) {
      newAssignmentList[i].position = i
    }

    props.setAssignmentList(newAssignmentList)
  }

  const newHandlerEditAssignment =(assignment: LogAssignmentJSON) => () => {
    props.setEditingAssignment(assignment)
    props.setInputFieldAssignmentName(assignment.name)
  }

  const items = props.currentAssignmentList.map((assignment: LogAssignmentJSON) => {
    return (
      <ListItem>
        <FormatListBulletedIcon color="action" />
        <ListItemText primary={assignment.name} style={{"marginLeft": "1rem"}}/>
        <ListItemSecondaryAction>
          <IconButton edge="end" aria-label="Edit" onClick={newHandlerEditAssignment(assignment)}>
            <EditIcon />
          </IconButton>
          <IconButton edge="end" aria-label="Delete" onClick={newHandlerDeleteAssignment(assignment)}>
            <DeleteIcon />
          </IconButton>
        </ListItemSecondaryAction>
      </ListItem>
    )
  })

  return <List dense={false}>{items}</List>
}
