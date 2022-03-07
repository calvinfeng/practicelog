import React from 'react'
import { Paper, Typography, Chip, Grid } from '@mui/material';
import { AreaChart, XAxis, YAxis, CartesianGrid, Area, Tooltip } from 'recharts';

import { PracticeTimeSeriesDataPoint } from '../../types';
import './PracticeTimeLineChart.scss'
import { LogLabelContext } from '../../contexts/log_labels';

type Props = {
  timeSeries: PracticeTimeSeriesDataPoint[]
}

export default function PracticeTimeLineChart(props: Props) {
  const ctx = React.useContext(LogLabelContext)

  const chips: JSX.Element[] = []
  if (ctx.state.selectedParentLabel !== null) {
    chips.push(
      <Grid item>
        <Chip label={ctx.state.selectedParentLabel.name} onDelete={ctx.handleDeselectParentLabel} />
      </Grid>
    )
  }
  if (ctx.state.selectedChildLabel != null) {
    chips.push(
      <Grid item>
        <Chip label={ctx.state.selectedChildLabel.name} onDelete={ctx.handleDeselectChildLabel} />
      </Grid>
    )
  }

  return (
    <Paper className="PracticeTimeLineChart">
      <Typography variant="h5">
        Practice Time Metrics
      </Typography>
      <Grid container direction="row" justifyContent="center" spacing={1} marginTop="0.5rem">
        {chips}
      </Grid>
      <AreaChart width={1280} height={500}
        data={props.timeSeries}
        margin={{ top: 50, right: 0, left: 0, bottom: 30 }}>
        <defs>
          <linearGradient id="colorY1" x1="0" y1="0" x2="0" y2="1">
            <stop offset="10%" stopColor="#8884d8" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="#8884d8" stopOpacity={0.2}/>
          </linearGradient>
        </defs>
        <XAxis dataKey="key" tick={false} />
        <YAxis dataKey="value" />
        <CartesianGrid strokeDasharray="3 3" />
        <Tooltip />
        <Area type="monotone" dataKey="value" stroke="#8884d8" fillOpacity={1} fill="url(#colorY1)" />
      </AreaChart>
    </Paper>
  )
}

/*
  Recharts supports multiple plots on the same figure. Simply add more <Area /> and
  <LinearGradient /> components.

  <defs>
    <linearGradient id="colorY2" x1="0" y1="0" x2="0" y2="1">
      <stop offset="10%" stopColor="#82ca9d" stopOpacity={0.8}/>
      <stop offset="95%" stopColor="#82ca9d" stopOpacity={0.2}/>
    </linearGradient>
    <linearGradient id="colorY3" x1="0" y1="0" x2="0" y2="1">
      <stop offset="10%" stopColor="#82ca9d" stopOpacity={0.8}/>
      <stop offset="95%" stopColor="#82ca9d" stopOpacity={0.2}/>
    </linearGradient>
  </defs>
  <Area type="monotone" dataKey="y2" stroke="#82ca9d" fillOpacity={1} fill="url(#colorY2)" />
  <Area type="monotone" dataKey="y3" stroke="#8884d8" fillOpacity={1} fill="url(#colorY3)" />
*/