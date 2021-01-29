import React from "react"

import DateFnsUtils from "@date-io/date-fns"
import {
  MuiPickersUtilsProvider,
  KeyboardDatePicker } from "@material-ui/pickers"
import { MaterialUiPickersDate } from "@material-ui/pickers/typings/date"


type Props = {
  inputDate: Date | null
  setInputDate: (date: Date | null) => void
}

export default function DateSelector(props: Props) {
  const handleDateChange = (date: MaterialUiPickersDate) => {
    props.setInputDate(date)
  }

  return (
    <section className="date-selector">
    <MuiPickersUtilsProvider utils={DateFnsUtils}>
      <KeyboardDatePicker
        value={props.inputDate}
        disableToolbar
        variant="inline"
        format="MM/dd/yyyy"
        margin="normal"
        label="Date"
        animateYearScrolling={true}
        onChange={handleDateChange} />
    </MuiPickersUtilsProvider>
  </section>
  )
}