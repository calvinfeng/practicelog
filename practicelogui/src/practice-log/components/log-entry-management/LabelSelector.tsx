import React from "react"
import {
  Button,
  FormControl,
  Chip,
  Grid,
  Typography,
  InputLabel,
  Select,
  MenuItem } from "@material-ui/core"
import MusicNote from "@material-ui/icons/MusicNote"
import AddIcon from '@material-ui/icons/Add'
import { LogLabelJSON } from "../../types"
import { alphabetOrder } from "../../callbacks"

type Props = {
  // Root data
  logLabels: LogLabelJSON[] // All log labels

  // Users modifiable fields
  inputLabelList: LogLabelJSON[]
  setInputLabelList: (list: LogLabelJSON[]) => void
  removeFromInputLabelList: (id: string) => void
}

export default function LabelSelector(props: Props) {

  const [selectedLabelID, setSelectLabelID] = React.useState<string | null>(null)

  if (props.logLabels.length === 0) {
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
    setSelectLabelID(ev.target.value as string)
  }

  const handleAddLabel = () => {
    if (selectedLabelID === null) {
      return
    }

    if (isLabelSelectedAlready(selectedLabelID)) {
      return
    }

    const newInputLabelList = [...props.inputLabelList]

    const labelToAdd = findLabelFromProps(selectedLabelID)
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
      <Grid item key={label.id}>
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
    <section className="LabelSelector">
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
              value={selectedLabelID}
              onChange={handleOnChange}>
                {props.logLabels.sort(alphabetOrder).map((label: LogLabelJSON) => {
                  return <MenuItem value={label.id} key={label.id}>
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
