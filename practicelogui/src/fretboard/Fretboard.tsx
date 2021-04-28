import React from 'react'
import './Fretboard.scss'
import {
  Grid,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@material-ui/core'
import { Interval, IntervalSemitoneMapping } from './interval'
import { Note, NoteName, Accidental } from './note'

const NumFrets = 24

const numberToRomanNumerals = new Map<number, string>([
  [1, "I"],
  [2, "II"],
  [3, "III"],
  [4, "IV"],
  [5, "V"],
  [6, "VI"],
  [7, "VII"]
])

const allowedAccidentalsByNote = new Map<NoteName, Accidental[]>([
  [NoteName.C, [Accidental.Natural, Accidental.Sharp]],
  [NoteName.D, [Accidental.Flat, Accidental.Natural, Accidental.Sharp]],
  [NoteName.E, [Accidental.Flat, Accidental.Natural]],
  [NoteName.F, [Accidental.Natural, Accidental.Sharp]],
  [NoteName.G, [Accidental.Flat, Accidental.Natural, Accidental.Sharp]],
  [NoteName.A, [Accidental.Flat, Accidental.Natural, Accidental.Sharp]],
  [NoteName.B, [Accidental.Flat, Accidental.Natural]]
])

const openFretNotes: Note[] = [
  new Note(NoteName.E, Accidental.Natural),
  new Note(NoteName.B, Accidental.Natural),
  new Note(NoteName.G, Accidental.Natural),
  new Note(NoteName.D, Accidental.Natural),
  new Note(NoteName.A, Accidental.Natural),
  new Note(NoteName.E, Accidental.Natural)
]

type Props = {}
type State = {
  root: NoteName
  rootAccidental: Accidental
  degrees: Map<number, Interval>
}

export default class FretboardV2 extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      root: NoteName.C,
      rootAccidental: Accidental.Natural,
      degrees: new Map<number, Interval>([
        [1, Interval.Unison],
        [2, Interval.Major],
        [3, Interval.Major],
        [4, Interval.Perfect],
        [5, Interval.Perfect],
        [6, Interval.Major],
        [7, Interval.Major]])
    }
  }

  get selectRootForm() {
    // Some translation effort is needed here.
    const handleSelectRootNote = (event: React.ChangeEvent<{ value: unknown }>) => {
      this.setState(newRootState(event.target.value as NoteName, this.state.rootAccidental))
    }

    return (
      <FormControl className="form-control">
        <InputLabel id="root-select-label">Root</InputLabel>
        <Select
          labelId="root-select-label"
          id="root-select"
          value={this.state.root}
          onChange={handleSelectRootNote}>
          {
            Object.keys(NoteName).map((noteName: string): JSX.Element => (
              <MenuItem value={noteName}>{noteName}</MenuItem>
            ))
          }
        </Select>
      </FormControl>
    )
  }

  get selectAccidentalForm() {
    const handleSelectRootNoteAccidental = (event: React.ChangeEvent<{ value: unknown }>) => {
      this.setState({ rootAccidental: event.target.value as Accidental })
    }

    return (
    <FormControl>
      <InputLabel id="root-accidental-select-label">Accidental</InputLabel>
      <Select
        labelId="root-accidental-select-label"
        id="accidental-select"
        value={this.state.rootAccidental}
        onChange={handleSelectRootNoteAccidental}>
        {
          (allowedAccidentalsByNote.get(this.state.root) as []).map((accidental: Accidental): JSX.Element => (
            <MenuItem value={accidental}>{accidental}</MenuItem>
          ))
        }
      </Select>
    </FormControl>
    )
  }

  getIntervalSelectHandler = (degree: number) => (event: React.ChangeEvent<{ value: unknown }>) => {
    const newDegrees = new Map<number, Interval>(this.state.degrees)
    newDegrees.set(degree, event.target.value as Interval)
    this.setState({ degrees: newDegrees })
  }

  get select2ndDegreeForm() {
    return (
      <FormControl>
      <InputLabel id="degree-2-select-label">2nd</InputLabel>
      <Select
        labelId="degree-2-select-label"
        id="degree-2-select"
        value={this.state.degrees.get(2)}
        onChange={this.getIntervalSelectHandler(2)}>
        <MenuItem value="Major">Major</MenuItem>
        <MenuItem value="Minor">Minor</MenuItem>
        <MenuItem value={Interval.Disabled}>{Interval.Disabled}</MenuItem>
      </Select>
    </FormControl>
    )
  }

  get select3rdDegreeForm() {
    return (
      <FormControl>
        <InputLabel id="degree-3-select-label">3rd</InputLabel>
        <Select
          labelId="degree-3-select-label"
          id="degree-3-select"
          value={this.state.degrees.get(3)}
          onChange={this.getIntervalSelectHandler(3)}>
          <MenuItem value="Major">Major</MenuItem>
          <MenuItem value="Minor">Minor</MenuItem>
          <MenuItem value={Interval.Disabled}>{Interval.Disabled}</MenuItem>
        </Select>
      </FormControl>
    )
  }

  get select4thDegreeForm() {
    return (
      <FormControl>
        <InputLabel id="degree-4-select-label">4th</InputLabel>
        <Select
          labelId="degree-4-select-label"
          id="degree-4-select"
          value={this.state.degrees.get(4)}
          onChange={this.getIntervalSelectHandler(4)}>
          <MenuItem value="Perfect">Perfect</MenuItem>
          <MenuItem value={Interval.Disabled}>{Interval.Disabled}</MenuItem>
        </Select>
      </FormControl>
    )
  }

  get select5thDegreeForm() {
  return (
      <FormControl>
        <InputLabel id="degree-5-select-label">5th</InputLabel>
        <Select
          labelId="degree-5-select-label"
          id="degree-5-select"
          value={this.state.degrees.get(5)}
          onChange={this.getIntervalSelectHandler(5)}>
          <MenuItem value="Perfect">Perfect</MenuItem>
          <MenuItem value="Diminished">Diminished</MenuItem>
          <MenuItem value={Interval.Disabled}>{Interval.Disabled}</MenuItem>
        </Select>
      </FormControl>
    )
  }

  get select6thDegreeForm() {
    return (
      <FormControl>
        <InputLabel id="degree-6-select-label">6th</InputLabel>
        <Select
          labelId="degree-6-select-label"
          id="degree-6-select"
          value={this.state.degrees.get(6)}
          onChange={this.getIntervalSelectHandler(6)}>
          <MenuItem value="Major">Major</MenuItem>
          <MenuItem value="Minor">Minor</MenuItem>
          <MenuItem value={Interval.Disabled}>{Interval.Disabled}</MenuItem>
        </Select>
      </FormControl>
    )
  }

  get select7thDegreeForm() {
    return (
      <FormControl>
        <InputLabel id="degree-7-select-label">7th</InputLabel>
        <Select
          labelId="degree-7-select-label"
          id="degree-7-select"
          value={this.state.degrees.get(7)}
          onChange={this.getIntervalSelectHandler(7)}>
          <MenuItem value="Major">Major</MenuItem>
          <MenuItem value="Minor">Minor</MenuItem>
          <MenuItem value={Interval.Disabled}>{Interval.Disabled}</MenuItem>
        </Select>
      </FormControl>
    )
  }

  // Might need to refactor the select degree forms. However, it's not urgent. It doesn't add
  // tons of value.
  render() {
    const scaleInNote = new Map<string, Note>()
    const scaleInRomanNum = new Map<string, string>()
    const scaleInDeg = new Map<string, number>()

    const root: Note = new Note(this.state.root, this.state.rootAccidental)
    this.state.degrees.forEach((interval: Interval, degree: number) => {
      const steps = IntervalSemitoneMapping[degree-1].get(interval)
      if (steps !== undefined) {
        root.step(steps).forEach((note: Note) => {
          scaleInNote.set(note.toString(), note)
          scaleInRomanNum.set(note.toString(), numberToRomanNumerals.get(degree) as string)
          scaleInDeg.set(note.toString(), degree)
        })
      }
    })

    return (
      <section className="Fretboard">
      <section className="fretboard">
        {generateFretboardGrid(scaleInNote, scaleInRomanNum, scaleInDeg)}
      </section>
      <section className="scale-selector">
        <Grid
          className="scale-selector-grid"
          direction="row"
          justify="flex-start"
          alignItems="center"
          container
          spacing={1}>
          <Grid item>{this.selectRootForm}</Grid>
          <Grid item>{this.selectAccidentalForm}</Grid>
          <Grid item>{this.select2ndDegreeForm}</Grid>
          <Grid item>{this.select3rdDegreeForm}</Grid>
          <Grid item>{this.select4thDegreeForm}</Grid>
          <Grid item>{this.select5thDegreeForm}</Grid>
          <Grid item>{this.select6thDegreeForm}</Grid>
          <Grid item>{this.select7thDegreeForm}</Grid>
        </Grid>
      </section>
    </section>
    )
  }
}

function newRootState(name: NoteName, acc: Accidental): any {
  switch (name) {
    case NoteName.B:
      if (acc === Accidental.Sharp) {
        return {
          root: NoteName.C,
          rootAccidental: Accidental.Natural
        }
      } else {
        return {
          root: name,
        }
      }
    case NoteName.C:
      if (acc === Accidental.Flat) {
        return {
          root: NoteName.B,
          rootAccidental: Accidental.Natural
        }
      } else {
        return {
          root: name,
        }
      }
    case NoteName.E:
      if (acc  === Accidental.Sharp) {
        return {
          root: NoteName.F,
          rootAccidental: Accidental.Natural
        }
      } else {
        return {
          root: name,
        }
      }
    case NoteName.F:
      if (acc === Accidental.Flat) {
        return {
          root: NoteName.E,
          rootAccidental: Accidental.Natural
        }
      } else {
        return {
          root: name,
        }
      }
    default:
      return {
        root: name,
      }
  }
}

function generateFretboardGrid(
  scaleInNote: Map<string, Note>,
  scaleInRomanNum: Map<string, string>,
  scaleInDeg: Map<string, number>) {

  const rows: JSX.Element[] = []

  const fretMarkerRow: JSX.Element[] = []
  for (let i = 0; i <= NumFrets; i++) {
    let fretMarkerStyle = {height: 35, width: 70, margin: 1}

    // Don't know any smart way to count those numbers, maybe +3, + 2 + 2 + 2 + 3 + 3 + 2...?
    if (i === 3 || i === 5 || i === 7 || i === 9 || i === 15 || i === 17 || i === 19 || i === 21) {
      fretMarkerStyle['background'] = '#ededed'
    }
    if (i === 12) {
      fretMarkerStyle['background'] = '#0096fc'
      fretMarkerStyle['color'] = '#ffffff'
    }

    fretMarkerRow.push(
      <Grid item>
        <Button variant="outlined" color="default" style={fretMarkerStyle}>
          {i}
        </Button>
      </Grid>
    )
  }

  rows.push(
    <Grid container direction="row" justify="center" alignItems="baseline" spacing={0}>
      {fretMarkerRow}
    </Grid>
  )

  for (let j = 0; j < 6; j++) {
    let openFretNoteStyle = {height: 35, width: 70, margin: 1, background: '#ffffff'}

    if (scaleInNote.has(openFretNotes[j].toString())) {
      openFretNoteStyle["background"] = "#c4f5d1"
    }

    const row: JSX.Element[] = [
      <Grid item>
        <Button variant="contained" color="default" style={openFretNoteStyle}>
          {`${openFretNotes[j]}`}
        </Button>
      </Grid>
    ]

    for (let i = 1; i <= NumFrets; i++) {
      const notes = openFretNotes[j].step(i)

      let noteStyle = {height: 35, width: 70, margin: 1, background: '#ffffff', fontSize: '12px'}
      let text = notes.map((note) => `${note}`).join(',')

      if (scaleInNote.has(notes[0].toString())) {
        noteStyle["background"] = "#c4f5d1"
      }

      row.push(
        <Grid item>
          <Button variant="contained" color="default" style={noteStyle}>
            {text}
          </Button>
        </Grid>
      )
    }

    rows.push(
      <Grid container direction="row" justify="center" alignItems="baseline" spacing={0}>
        {row}
      </Grid>
    )
  }

  return (
    <Grid
      container
      className="fretboard-grid"
      direction="row"
      justify="flex-start"
      alignItems="baseline"
      spacing={0}>
      {rows}
    </Grid>
  )
}