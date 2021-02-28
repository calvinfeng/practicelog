import React from 'react'

import {
  Grid,
  Chip,
  Paper,
  Divider,
  Typography,
  Button,
  TextField,
} from '@material-ui/core'
import { MusicNote } from '@material-ui/icons'

import { DeleteConfirmationTarget, LogLabelJSON, nilUUID } from '../../shared/type_definitions'
import DeleteConfirmation from './DeleteConfirmation'
import './LogLabelManagement.scss'

type State = {
  selectedParentLabel: LogLabelJSON | null
  selectedChildLabel: LogLabelJSON | null
  inputParentLabelName: string
  inputChildLabelName: string
  showDeleteDialog: boolean
  deleteTarget: DeleteConfirmationTarget
}

type Props = {
  logLabels: LogLabelJSON[]
  handleHTTPCreateLogLabel: (label: LogLabelJSON) => void
  handleHTTPUpdateLogLabel: (label: LogLabelJSON) => void
  handleHTTPDeleteLogLabel: (label: LogLabelJSON) => void
}

const defaultState: State = {
  selectedParentLabel: null,
  selectedChildLabel: null,
  inputParentLabelName: "",
  inputChildLabelName: "",
  showDeleteDialog: false,
  deleteTarget: DeleteConfirmationTarget.None
}

export default class LabelManagement extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = defaultState
  }

  newHandlerSelectParentLabel = (label: LogLabelJSON | null) => () => {
    // Whenever parent is selected, child states should be cleared.
    if (label === null) {
      this.setState({
        inputParentLabelName: "",
        inputChildLabelName: "",
        selectedParentLabel: null,
        selectedChildLabel: null
      })
    } else {
      this.setState({
        inputParentLabelName: label.name,
        inputChildLabelName: "",
        selectedParentLabel: label,
        selectedChildLabel: null,
      })
    }
  }

  newHandlerSelectChildLabel = (label: LogLabelJSON | null) => () => {
    if (label === null) {
      this.setState({
        inputChildLabelName: "",
        selectedChildLabel: null
      })
    } else {
      this.setState({
        inputChildLabelName: label.name,
        selectedChildLabel: label
      })
    }
  }

  handleCreateParentLabel = () => {
    const newLabel: LogLabelJSON = {
      id: nilUUID,
      parent_id: null,
      children: [],
      name: this.state.inputParentLabelName,
      duration: 0
    }
    this.props.handleHTTPCreateLogLabel(newLabel)
    // TODO: Use Promise!!!
    this.setState(defaultState)
  }

  handleUpdateParentLabel = () => {
    if (this.state.selectedParentLabel !== null) {
      const payload: LogLabelJSON = {
        id: this.state.selectedParentLabel.id,
        parent_id: nilUUID,
        name: this.state.inputParentLabelName,
        duration: 0,
        children: []
      }
      this.props.handleHTTPUpdateLogLabel(payload)
      // TODO: Use Promise!!!
      this.setState(defaultState)
    }
  }

  handleDeleteParentLabel = () => {
    if (this.state.selectedParentLabel !== null) {
      this.props.handleHTTPDeleteLogLabel(this.state.selectedParentLabel)
      this.setState(defaultState)
    }
  }

  handleClickCreateChildLabel = () => {
    if (this.state.selectedParentLabel !== null ) {
      const newLabel: LogLabelJSON = {
        id: nilUUID,
        parent_id: this.state.selectedParentLabel.id,
        name: this.state.inputChildLabelName,
        duration: 0,
        children: []
      }
      this.props.handleHTTPCreateLogLabel(newLabel)
      // TODO: Use Promise!!!
      this.setState(defaultState)
    }
  }

  handleUpdateChildLabel = () => {
    if (this.state.selectedChildLabel !== null) {
      const payload: LogLabelJSON = {
        id: this.state.selectedChildLabel.id,
        parent_id: this.state.selectedChildLabel.parent_id,
        name: this.state.inputChildLabelName,
        duration: 0,
        children: []
      }
      this.props.handleHTTPUpdateLogLabel(payload)
      // TODO: Use Promise!!!
      this.setState(defaultState)
    }
  }

  handleDeleteChildLabel = () => {
    if (this.state.selectedChildLabel !== null) {
      this.props.handleHTTPDeleteLogLabel(this.state.selectedChildLabel)
      this.setState(defaultState)
    }
  }

  handleParentLabelNameChange = (ev: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ inputParentLabelName: ev.target.value })
  }

  handleChildLabelNameChange = (ev: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ inputChildLabelName: ev.target.value })
  }

  handleCloseDeleteDialog = () => {
    this.setState({ showDeleteDialog: false, deleteTarget: DeleteConfirmationTarget.None })
  }

  get panelParentLabels() {
    const items: JSX.Element[] = this.props.logLabels.filter((label: LogLabelJSON) => {
      return label.parent_id === nilUUID
    }).map((label: LogLabelJSON) => {
      let style = { margin: "0.1rem" }
      let handler = this.newHandlerSelectParentLabel(label)
      if (this.state.selectedParentLabel !== null && this.state.selectedParentLabel.id === label.id) {
        style["background"] = "green"
        handler = this.newHandlerSelectParentLabel(null)
      }
      return (
        <Grid item>
          <Chip
            onClick={handler}
            style={style}
            label={label.name}
            icon={<MusicNote />}
            color="primary" />
        </Grid>
      )
    })
    return (
      <Grid
        style={{ width: "30%", margin: "0.5rem" }}
        direction="row"
        justify="flex-start"
        alignItems="center"
        container
        spacing={0}>
        {items}
      </Grid>
    )
  }

  get panelChildLabels() {
    const items: JSX.Element[] = this.props.logLabels.filter((label: LogLabelJSON) => {
      if (this.state.selectedParentLabel === null) {
        return false
      }
      return label.parent_id === this.state.selectedParentLabel.id
    }).map((label: LogLabelJSON) => {      
      let style = { margin: "0.1rem" }
      let handler = this.newHandlerSelectChildLabel(label)
      if (this.state.selectedParentLabel !== null && 
        this.state.selectedChildLabel !== null &&
        this.state.selectedChildLabel.id === label.id) {
        style["background"] = "green"
        handler = this.newHandlerSelectChildLabel(null)
      }

      return (
        <Grid item>
          <Chip
            onClick={handler}
            style={style}
            label={label.name}
            icon={<MusicNote />}
            color="primary" />
        </Grid>
      )
    })

    return (
      <Grid
        style={{ width: "30%", margin: "0.5rem" }}
        direction="row"
        justify="flex-start"
        alignItems="center"
        container
        spacing={0}>
        {items}
      </Grid>
    )
  }

  get selectedChildLabelButtonGroup() {
    if (this.state.selectedParentLabel === null || this.state.selectedChildLabel === null) {
      return []
    }
    return [
      <Grid item>
        <Typography variant="subtitle1">
          Selected Child Label: {this.state.selectedChildLabel.name}
        </Typography>
      </Grid>,
      <Grid item>
        <TextField label="Child Label Name" value={this.state.inputChildLabelName}
          onChange={this.handleChildLabelNameChange} fullWidth InputLabelProps={{ shrink: true }} />
      </Grid>,
      <Grid item>
        <Button style={{margin: "0.1rem"}} onClick={this.handleUpdateChildLabel}
          disabled={this.state.inputChildLabelName === this.state.selectedChildLabel.name}
          variant="contained" color="primary">
          Update
        </Button>
        <Button style={{margin: "0.1rem"}} onClick={
            () => {
              this.setState({ showDeleteDialog: true, deleteTarget: DeleteConfirmationTarget.Child})
            }
          }
          variant="contained" color="secondary">
          Delete {this.state.selectedChildLabel.name}
        </Button>
      </Grid>
    ]
  }

  get selectedParentLabelButtonGroup() {
    if (this.state.selectedParentLabel === null) {
      return []
    }
    return [
      <Grid item>
        <Typography variant="subtitle1">
          Selected Parent Label: {this.state.selectedParentLabel.name}
        </Typography>
      </Grid>,
      <Grid item>
        <TextField
          label="Parent Label Name" value={this.state.inputParentLabelName} onChange={this.handleParentLabelNameChange}
          fullWidth InputLabelProps={{ shrink: true }} />
      </Grid>,
      <Grid item>
      <TextField
        label="Child Label Name" value={this.state.inputChildLabelName} onChange={this.handleChildLabelNameChange}
        fullWidth InputLabelProps={{ shrink: true }} />
      </Grid>,
      <Grid item>
        <Button style={{margin: "0.1rem"}} onClick={this.handleClickCreateChildLabel}
          disabled={this.state.inputChildLabelName.length === 0}
          variant="contained" color="primary">
            Create Child
        </Button>
        <Button style={{margin: "0.1rem"}} onClick={this.handleUpdateParentLabel}
          disabled={this.state.inputParentLabelName === this.state.selectedParentLabel.name}
          variant="contained" color="primary">
            Update
        </Button>
        <Button style={{margin: "0.1rem"}} onClick={
            () => {
              this.setState({ showDeleteDialog: true, deleteTarget: DeleteConfirmationTarget.Parent})
            }
          }
          variant="contained" color="secondary">
          Delete {this.state.selectedParentLabel.name}
        </Button>
      </Grid>
    ]
  }

  get selectedNoneLabelButtonGroup() {
    return [
      <Grid item>
        <TextField
          label="New Label Name"
          value={this.state.inputParentLabelName}
          onChange={this.handleParentLabelNameChange}
          fullWidth
          InputLabelProps={{ shrink: true }} />
        </Grid>,
      <Grid item>
        <Button style={{margin: "0.1rem"}} onClick={this.handleCreateParentLabel}
          variant="contained" color="primary">
          Create
        </Button>
      </Grid>
    ]
  }

  get panelEditLabel() {
    let gridItems: JSX.Element[]

    // Case 1: Parent & child are selected
    // Case 2: Parent is selected
    // Case 3: None is selected
    if (this.state.selectedParentLabel !== null && this.state.selectedChildLabel !== null) {
      gridItems = this.selectedChildLabelButtonGroup
    } else if (this.state.selectedParentLabel !== null && this.state.selectedChildLabel === null) {
      gridItems = this.selectedParentLabelButtonGroup
    } else {
      gridItems = this.selectedNoneLabelButtonGroup
    }

    return (
      <Grid
        style={{ width: "30%", margin: "0.5rem" }}
        direction="column"
        justify="flex-start"
        alignItems="flex-start"
        container
        spacing={1}>
        {gridItems}
      </Grid>
    )
  }

  render() {
    return (
      <Paper className="LabelManagement">
        <Typography variant="h5">Manage Labels</Typography>
        <Grid
          style={{ width: "100%", marginTop: "1rem" }}
          direction="row"
          justify="flex-start"
          alignItems="flex-start"
          container
          spacing={1}>
          {this.panelParentLabels}
          <Divider orientation="vertical" flexItem />
          {this.panelChildLabels}
          <Divider orientation="vertical" flexItem />
          {this.panelEditLabel}
        </Grid>
        <DeleteConfirmation
          target={this.state.deleteTarget}
          open={this.state.showDeleteDialog}
          selectedChildLabel={this.state.selectedChildLabel}
          selectedParentLabel={this.state.selectedParentLabel}
          handleClose={this.handleCloseDeleteDialog}
          handleDeleteChildLabel={this.handleDeleteChildLabel}
          handleDeleteParentLabel={this.handleDeleteParentLabel} />
      </Paper>
    )
  }
}
