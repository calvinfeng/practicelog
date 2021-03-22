import React from 'react'
import { Paper, Typography } from '@material-ui/core';
import { AreaChart, XAxis, YAxis, CartesianGrid, Area, Tooltip } from 'recharts';
import './PracticeTimeLineChart.scss'

type Props = {

}

export default function PracticeTimeLineChart(props: Props) {
  const data = [
    {
      "date": "2020-09",
      "y1": 4000,
      "y2": 2400,
      "y3": 3600,
    },
    {
      "date": "2020-10",
      "y1": 3000,
      "y2": 1398,
      "y3": 1500,
    },
    {
      "date": "2020-11",
      "y1": 2000,
      "y2": 9800,
      "y3": 4000,
    },
    {
      "date": "2020-12",
      "y1": 2780,
      "y2": 3908,
      "y3": 3200
    },
    {
      "date": "2021-01",
      "y1": 1890,
      "y2": 4800,
      "y3": 3000
    },
    {
      "date": "2021-02",
      "y1": 2390,
      "y2": 3800,
      "y3": 2900
    },
    {
      "date": "2021-03",
      "y1": 3490,
      "y2": 4300,
      "y3": 5000
    }
  ]

  return (
    <Paper className="PracticeTimeLineChart">
      <Typography variant="h5">
        Practice Time History
      </Typography>
      <AreaChart width={1280} height={500} data={data} margin={{ top: 50, right: 0, left: 0, bottom: 30 }}>
        <defs>
          <linearGradient id="colorY1" x1="0" y1="0" x2="0" y2="1">
            <stop offset="10%" stopColor="#8884d8" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="#8884d8" stopOpacity={0.2}/>
          </linearGradient>
          <linearGradient id="colorY2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="10%" stopColor="#82ca9d" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="#82ca9d" stopOpacity={0.2}/>
          </linearGradient>
        </defs>
        <XAxis dataKey="date" />
        <YAxis />
        <CartesianGrid strokeDasharray="3 3" />
        <Tooltip />
        <Area type="monotone" dataKey="y1" stroke="#8884d8" fillOpacity={1} fill="url(#colorY1)" />
        <Area type="monotone" dataKey="y2" stroke="#82ca9d" fillOpacity={1} fill="url(#colorY2)" />
        <Area type="monotone" dataKey="y3" stroke="#8884d8" fillOpacity={1} fill="url(#colorY1)" />
      </AreaChart>
    </Paper>
  )
}
