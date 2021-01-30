import { TextField } from '@material-ui/core'
import React from 'react'

type Props = {
  inputMessage: string
  setInputMessage: (message: string) => void
}

export default function MessageEditor(props: Props) {
  const handleOnChange = (ev: React.ChangeEvent<HTMLInputElement>) => {
    props.setInputMessage(ev.target.value)
  }

  return (
    <section className="MessageEditor">
      <TextField
        label="Log Message"
        value={props.inputMessage}
        onChange={handleOnChange}
        fullWidth
        InputLabelProps={{ shrink: true }} />
    </section>
  )
}
