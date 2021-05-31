import React from 'react';
import { Button, Typography } from '@material-ui/core';
import { GoogleUserProfile } from './types'
import './Unauthorized.scss'

type Props = {
  userProfile: GoogleUserProfile
  clearStorageAndLogout: () => void
}

function Unauthorized(props: Props) {
  return (
    <section className="Unauthorized">
      <section className="text-group">
        <Typography variant="body1">
          Hi {props.userProfile.full_name}, I am sorry that you are not allowed to access this
          practice log feature. I need to build few more security measures before I release it to
          the public.
        </Typography>
      </section>
      <div className="button-group">
        <Button variant="contained" color="secondary" onClick={props.clearStorageAndLogout}>
          Logout
        </Button>
      </div>
    </section>
  )
}

export default Unauthorized;
