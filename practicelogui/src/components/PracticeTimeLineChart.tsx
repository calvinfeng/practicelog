import React from 'react'
import { Paper, Typography } from '@material-ui/core';
import { AreaChart, XAxis, YAxis, CartesianGrid, Area, Tooltip } from 'recharts';

import { DurationTimeSeriesDataPoint } from '../shared/type_definitions';
import './PracticeTimeLineChart.scss'

type Props = {
  durationTimeSeries: DurationTimeSeriesDataPoint[]
}

export default function PracticeTimeLineChart(props: Props) {
  return (
    <Paper className="PracticeTimeLineChart">
      <Typography variant="h5">
        Practice Time History
      </Typography>
      <AreaChart width={1280} height={500}
        data={props.durationTimeSeries}
        margin={{ top: 50, right: 0, left: 0, bottom: 30 }}>
        <defs>
          <linearGradient id="colorY1" x1="0" y1="0" x2="0" y2="1">
            <stop offset="10%" stopColor="#8884d8" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="#8884d8" stopOpacity={0.2}/>
          </linearGradient>
          {/* <linearGradient id="colorY2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="10%" stopColor="#82ca9d" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="#82ca9d" stopOpacity={0.2}/>
          </linearGradient> */}
        </defs>
        <XAxis dataKey="key" tick={false} />
        <YAxis dataKey="value" />
        <CartesianGrid strokeDasharray="3 3" />
        <Tooltip />
        <Area type="monotone" dataKey="value" stroke="#8884d8" fillOpacity={1} fill="url(#colorY1)" />
        {/* <Area type="monotone" dataKey="y2" stroke="#82ca9d" fillOpacity={1} fill="url(#colorY2)" />
        <Area type="monotone" dataKey="y3" stroke="#8884d8" fillOpacity={1} fill="url(#colorY1)" /> */}
      </AreaChart>
    </Paper>
  )
}
