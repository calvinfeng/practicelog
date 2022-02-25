import React from "react"
import DateFnsUtils from "@date-io/date-fns"

import AdapterDateFns from '@mui/lab/AdapterDateFns';
import LocalizationProvider from '@mui/lab/LocalizationProvider';
import { DatePicker } from "@mui/lab";
import { TextField } from "@mui/material/";

import { MuiPickersUtilsProvider, KeyboardDatePicker } from "@material-ui/pickers";

type Props = {
  inputDate: Date | null
  setInputDate: (date: Date | null) => void
}

export default function DateSelector(props: Props) {
  const handleDateChange = (date: Date | null) => {
    props.setInputDate(date)
  }

  return (
    <section className="DateSelector" style={{marginRight: "10px"}}>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <DatePicker
          label="Date"
          value={props.inputDate}
          onChange={handleDateChange}
          renderInput={(params) => <TextField variant="standard" {...params} />} />
      </LocalizationProvider>
    </section>
  )
}
