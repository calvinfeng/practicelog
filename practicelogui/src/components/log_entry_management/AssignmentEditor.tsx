import {
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton, 
  Button,
  Grid,
  TextField} from "@material-ui/core"
import React from "react"
import { LogAssignmentJSON } from "../../shared/type_definitions"
import FormatListBulletedIcon from '@material-ui/icons/FormatListBulleted';
import EditIcon from '@material-ui/icons/Edit'
import DeleteIcon from '@material-ui/icons/Delete'

type Props = {
  inputAssignmentList: LogAssignmentJSON[]
  setInputAssignmentList: (list: LogAssignmentJSON[]) => void
}

export default function AssignmentEditor(props: Props) {
  const [textFieldAssignmentName, setTextFieldAssignmentName] = React.useState<string>("")
  const [selectedAssignment, setSelectedAssignment] = React.useState<LogAssignmentJSON | null>(null)

  // Optional Input: event: React.MouseEvent<HTMLButtonElement, MouseEvent> for button
  const makeHandlerDeleteAssignment = (assignment: LogAssignmentJSON) => () => {
    const newAssignmentList = [...props.inputAssignmentList]
    newAssignmentList.splice(assignment.position, 1)
    for (let i = 0; i < newAssignmentList.length; i++) {
      newAssignmentList[i].position = i
    }

    props.setInputAssignmentList(newAssignmentList)
  }

  const makeHandlerEditAssignment =(assignment: LogAssignmentJSON) => () => {
    setSelectedAssignment(assignment)
    setTextFieldAssignmentName(assignment.name)
  }

  let assignmentListItems: JSX.Element[] = []
  if (props.inputAssignmentList) {
    assignmentListItems = props.inputAssignmentList.map((assignment: LogAssignmentJSON) => {
      return (
        <ListItem>
          <FormatListBulletedIcon color="action" />
          <ListItemText primary={assignment.name} style={{"marginLeft": "1rem"}}/>
          <ListItemSecondaryAction>
            <IconButton edge="end" aria-label="Edit" onClick={makeHandlerEditAssignment(assignment)}>
              <EditIcon />
            </IconButton>
            <IconButton edge="end" aria-label="Delete" onClick={makeHandlerDeleteAssignment(assignment)}>
              <DeleteIcon />
            </IconButton>
          </ListItemSecondaryAction>
        </ListItem>
      )
    })
  }

  const handleFormSubmitAssignment = (ev: React.FormEvent<HTMLFormElement>) => {
    ev.preventDefault()
    let newAssignmentList: LogAssignmentJSON[] = []
    if (Boolean(props.inputAssignmentList)) {
      newAssignmentList = [...props.inputAssignmentList]
    }
    
    if (selectedAssignment !== null) {
      newAssignmentList[selectedAssignment.position].name = textFieldAssignmentName
      newAssignmentList[selectedAssignment.position].completed = false
    } else {
      newAssignmentList.push({
        position: newAssignmentList.length,
        name: textFieldAssignmentName,
        completed: false
      })
    }

    setTextFieldAssignmentName("")
    setSelectedAssignment(null)
    props.setInputAssignmentList(newAssignmentList)
  }

  const handleOnChange = (ev: React.ChangeEvent<HTMLInputElement>) => {
    setTextFieldAssignmentName(ev.target.value)
  }

  const buttons: JSX.Element[] = [
    <Grid item>
      <TextField
        style={{width: "500px"}}
        label="Assignment Name"
        value={textFieldAssignmentName}
        onChange={handleOnChange}
        fullWidth
        InputLabelProps={{ shrink: true }} />
    </Grid>
  ]

  if (selectedAssignment !== null) {
    buttons.push(
      <Grid item>
        <Button variant="outlined" color="primary" type="submit" form="assignment-form"
          style={{marginLeft: "0.5rem"}}>
            Save Assignment {selectedAssignment.position}
        </Button>
      </Grid>
    )
  } else {
    let newPosition: number = 0
    if (props.inputAssignmentList) {
      newPosition = props.inputAssignmentList.length
    }

    buttons.push(
      <Grid item>
        <Button variant="outlined" color="primary" type="submit" form="assignment-form"
          style={{marginLeft: "0.5rem"}}>
            Add Assignment {newPosition}
        </Button>
      </Grid>
    )
  }

  buttons.push(
    <Grid item>
      <Button variant="outlined" color="secondary"
        onClick={() => { setSelectedAssignment(null) }}
        disabled={selectedAssignment === null}
        style={{marginLeft: "0.5rem"}}>
          Clear
      </Button>
    </Grid>
  )

  return (
    <section className="AssignmentEditor">
      <List dense={false}>{assignmentListItems}</List>
      <form id="assignment-submission-form" onSubmit={handleFormSubmitAssignment}>
        <Grid container 
          direction="row"
          justify="flex-end"
          alignItems="flex-end"
          spacing={0}
          style={{ marginTop: "1rem "}}>
          {buttons}
        </Grid>
      </form>
    </section>
  )
}
