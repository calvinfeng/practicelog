import { Typography } from '@material-ui/core';
import React from 'react';
import { GoogleUserProfile } from '../shared/type_definitions'
import './Unauthorized.scss'

type Props = {
  userProfile: GoogleUserProfile
}

function Unauthorized(props: Props) {
  return <div className="Unauthorized">
      <Typography>
        Hi {props.userProfile.full_name}, you are not allowed to access this application
      </Typography>
    </div>
}

export default Unauthorized;
