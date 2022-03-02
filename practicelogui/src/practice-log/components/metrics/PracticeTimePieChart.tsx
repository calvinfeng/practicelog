import { Paper, Typography } from '@material-ui/core';
import React from 'react'

import { Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { LogLabelJSON, nilUUID } from '../../types';

import './PracticeTimePieChart.scss'

type Props = {
  durationFetched: boolean
  logLabels: LogLabelJSON[]
  totalPracticeDuration: number
}

/**
 * @deprecated
 */
export default function PracticeTimePieChart(props: Props) {
  if (!props.durationFetched) {
    return <section className="PracticeTimePieChart"></section>
  }

  // Transform to hours
  const parents: any[] = props.logLabels.filter((val: LogLabelJSON) => {
    return val.parent_id === nilUUID
  }).map((label: LogLabelJSON) => {
    return {
      name: label.name,
      duration: Math.round(100 * label.duration / 60) / 100
    }
  })
  const children: any[] = props.logLabels.filter((val: LogLabelJSON) => {
    return val.parent_id !== nilUUID
  }).map((label: LogLabelJSON) => {
    return {
      name: label.name,
      duration: Math.round(100 * label.duration / 60) / 100
    }
  })

  return (
    <Paper className="PracticeTimePieChart">
      <Typography variant="h5">
        Practice Time Breakdown
      </Typography>
      <Typography variant="body1">
        In total, {Math.round(100 * props.totalPracticeDuration / 60) / 100} hours of practice on guitar
      </Typography>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={children} dataKey="duration" nameKey="name"
            cx="50%" cy="50%" innerRadius={250} outerRadius={300} fill="#5767BE"/>
          <Pie data={parents} dataKey="duration" nameKey="name" label
            cx="50%" cy="50%" outerRadius={180} fill="#3f51b5"/>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </Paper>
  )
}