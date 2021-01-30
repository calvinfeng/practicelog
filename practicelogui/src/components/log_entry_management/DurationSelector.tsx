import { Typography, Slider } from "@material-ui/core"
import React from "react"

type Props = {
  inputDuration: number
  setInputDuration: (number: number) => void
}

export default function DurationSelector(props: Props) {
  const handleOnChange = (_: React.ChangeEvent<{}>, value: unknown) => {
    props.setInputDuration(value as number)
  }

  return (
    <section className="duration-selector">
      <Typography id="discrete-minute-slider" gutterBottom>
        Duration: {props.inputDuration} minutes
      </Typography>
      <Slider
        defaultValue={0}
        value={props.inputDuration}
        onChange={handleOnChange}
        aria-labelledby="discrete-minute-slider"
        valueLabelDisplay="auto"
        step={5}
        marks={true}
        min={0}
        max={180} />
    </section>
  )
}
