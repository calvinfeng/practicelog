import React from 'react'

import { Pie, PieChart, Tooltip } from 'recharts'
import { LogLabelJSON, nilUUID } from '../shared/type_definitions';

import './DurationPieChart.scss'

type Props = {
  durationFetched: boolean
  logLabels: LogLabelJSON[]
}

export default function DurationPieChart(props: Props) {
  if (!props.durationFetched) {
    return <section className="DurationPieChart"></section>
  }

  const parents: any[] = props.logLabels.filter((val: LogLabelJSON) => {
    return val.parent_id == nilUUID
  })
  const children: any[] = props.logLabels.filter((val: LogLabelJSON) => {
    return val.parent_id !== nilUUID
  })

  return (
    <section className="DurationPieChart">
      <PieChart width={960} height={540}>
        <Pie data={parents} dataKey="duration" nameKey="name" 
          cx="50%" cy="50%" innerRadius={100} outerRadius={200} fill="#8884d8"/>
        <Pie data={children} dataKey="duration" nameKey="name" 
          cx="50%" cy="50%" outerRadius={50} fill="#8884d8"/>
        <Tooltip />
      </PieChart>
    </section>
  )
}