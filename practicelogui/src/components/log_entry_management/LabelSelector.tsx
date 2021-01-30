import { MenuItem } from "@material-ui/core"
import { Button } from "@material-ui/core"
import { FormControl } from "@material-ui/core"
import { Chip, Grid, Typography, InputLabel, Select} from "@material-ui/core"
import MusicNote from "@material-ui/icons/MusicNote"
import AddIcon from '@material-ui/icons/Add'
import React from "react"
import { LogLabelJSON } from "../../shared/type_definitions"

type Props = {
  logLabels: LogLabelJSON[] // All log labels

  removeFromInputLabelList: (id: string) => void

  inputLabelList: LogLabelJSON[]
  setInputLabelList: (list: LogLabelJSON[]) => void

  selectedLabelID: string | null
  setSelectLabelID: (id: string | null) => void
}

export default function LabelSelector(props: Props) {

  if (props.inputLabelList.length === 0) {
    return <Typography>Create a Label</Typography>
  }

  const isLabelSelectedAlready = (labelID: string): boolean => {
    const found = props.inputLabelList.find(
      (label: LogLabelJSON) => label.id === labelID
    )
    return Boolean(found)
  }

  const findLabelFromProps = (labelID: string): LogLabelJSON | undefined => {
    return props.logLabels.find(
      (label: LogLabelJSON) => label.id === labelID
    )
  }

  const makeHandlerRemoveFromInputLabelList = (labelID: string) => () => {
    props.removeFromInputLabelList(labelID)
  }

  const handleOnChange = (ev: React.ChangeEvent<{ name?: string; value: unknown }>) => {
    props.setSelectLabelID(ev.target.value as string)
  }

  const handleAddLabel = () => {
    if (props.selectedLabelID === null) {
      return
    }

    if (isLabelSelectedAlready(props.selectedLabelID)) {
      return
    }

    const newInputLabelList = [...props.inputLabelList]

    const labelToAdd = findLabelFromProps(props.selectedLabelID)
    if (labelToAdd) {
      newInputLabelList.push(labelToAdd)
    }

    if (labelToAdd &&
        labelToAdd.parent_id !== null &&
        !isLabelSelectedAlready(labelToAdd.parent_id)
    ) {
        const parentToAdd = findLabelFromProps(labelToAdd.parent_id)
        if (parentToAdd) {
          newInputLabelList.push(parentToAdd)
        }
      }
    props.setInputLabelList(newInputLabelList)
  }

  const chips = props.inputLabelList.map((label: LogLabelJSON) => {
    return (
      <Grid item>
        <Chip
          style={{ margin: "0.1rem" }}
          label={label.name}
          icon={<MusicNote />}
          color="primary"
          onDelete={makeHandlerRemoveFromInputLabelList(label.id)} />
      </Grid>
    )
  })

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
              value={props.selectedLabelID}
              onChange={handleOnChange}>
                {props.logLabels.map((label: LogLabelJSON) => {
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
            onClick={handleAddLabel}
            startIcon={<AddIcon/>}>
            Add Label
          </Button>
        </Grid>
      </Grid>
    </section>
  )
}