import React from 'react'
import { Paper, Typography, Chip, Grid } from '@mui/material';

import { PracticeTimeSeriesDataPoint } from '../../types';
import { LogLabelContext } from '../../contexts/log_labels';
import './PracticeTimeBarChart.scss'
import { Bar, BarChart, CartesianGrid, Legend, Tooltip, XAxis, YAxis } from 'recharts';


type Props = {
  timeSeries: PracticeTimeSeriesDataPoint[]
}

export default function PracticeTimeBarChart(props: Props) {
  const ctx = React.useContext(LogLabelContext)

  const chips: JSX.Element[] = []
  if (ctx.state.selectedParentLabel !== null) {
    chips.push(
      <Grid item key="parent-label-chip">
        <Chip label={ctx.state.selectedParentLabel.name} onDelete={() => {
          ctx.handleDeselectParentLabel()
          ctx.handleDeselectChildLabel()
        }} />
      </Grid>
    )
  }
  if (ctx.state.selectedChildLabel != null) {
    chips.push(
      <Grid item key="child-label-chip">
        <Chip label={ctx.state.selectedChildLabel.name} onDelete={ctx.handleDeselectChildLabel} />
      </Grid>
    )
  }

  if (props.timeSeries.length === 0) {
    return (
      <Paper className="PracticeTimeBarChart">
        <Typography variant="h5">
          No data available
        </Typography>
      </Paper>
    )
  }
  return (
    <Paper className="PracticeTimeBarChart">
      <Typography variant="h5">
        Practice Time Metrics
      </Typography>
      <Grid container direction="row" justifyContent="center" spacing={1} marginTop="0.5rem">
        {chips}
      </Grid>
      <BarChart width={1280} height={500}
        data={props.timeSeries}
        margin={{ top: 50, right: 0, left: 0, bottom: 30 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="key" tick={true} />
        <YAxis dataKey="value" />
        <Tooltip />
        {/* <Legend /> */}
        <Bar dataKey="value" fill="#1976d2" />
      </BarChart>
    </Paper>
  )
}
