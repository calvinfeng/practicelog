import { TextField } from '@material-ui/core'
import React from 'react'

type Props = {
  inputMessage: string
  setInputMessage: (message: string) => void
}

export default function MessageTextField(props: Props) {
  const handleOnChange = (ev: React.ChangeEvent<HTMLInputElement>) => {
    props.setInputMessage(ev.target.value)
  }

  return (
    <section className="message-text-field">
      <TextField
        label="Log Message"
        value={props.inputMessage}
        onChange={handleOnChange}
        fullWidth
        InputLabelProps={{ shrink: true }} />
    </section>
  )
}
