import React from "react"
import { Typography, Slider } from "@mui/material"

type Props = {
  inputDuration: number
  setInputDuration: (number: number) => void
}

export default function DurationSelector(props: Props) {
  const handleOnChange =  (event: Event, value: number | number[], activeThumb: number)=> {
    props.setInputDuration(value as number)
  }

  return (
    <section className="DurationSelector">
      <Typography id="discrete-minute-slider" gutterBottom>
        Duration: {props.inputDuration} minutes
      </Typography>
      <Slider
        style={{"margin": "5px"}}
        size={"medium"}
        defaultValue={0}
        value={props.inputDuration}
        onChange={handleOnChange}
        valueLabelDisplay="auto"
        step={5}
        marks={true}
        min={0}
        max={180} />
    </section>
  )
}
