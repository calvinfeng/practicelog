import React from 'react';
import {
  GoogleLogin,
  GoogleLoginResponse,
  GoogleLoginResponseOffline,
} from 'react-google-login';

import { GoogleUserProfile, GoogleError } from '../shared/type_definitions'
import PracticeLog from './PracticeLog'
import Unauthorized from './Unauthorized'
import './App.scss'

/**
  Token has scope [email, profile, openid, userinfo.profile, userinfo.email]
 */

// TODO: Store the ID token in cache.
// TODO: Check cached token expiration on every component load.

function App() {
  const [userProfile, setUserProfile] = React.useState<GoogleUserProfile | null>(null);

  const handleLoginSuccess = (resp: GoogleLoginResponse | GoogleLoginResponseOffline) => {
    if ((resp as GoogleLoginResponseOffline).code) {
      resp = resp as GoogleLoginResponseOffline
    } else {
      resp = resp as GoogleLoginResponse
      setUserProfile({
        token_id: resp.tokenId,
        access_token: resp.accessToken,
        granted_scopes: resp.getGrantedScopes(),
        google_user_id: resp.getBasicProfile().getId(),
        google_email: resp.getBasicProfile().getEmail(),
        full_name: resp.getBasicProfile().getName(),
        given_name: resp.getBasicProfile().getGivenName(),
        family_name: resp.getBasicProfile().getFamilyName(),
        image_url: resp.getBasicProfile().getImageUrl()
      })
    }
  }

  const handleLoginFailure = (resp: GoogleError) => {
    console.log('Google login failed', resp.error, resp.details)
  }

  if (userProfile !== null) {
    if (userProfile.google_email === "calvin.j.feng@gmail.com") {
      return (
        <div className="App">
          <PracticeLog IDToken={userProfile.token_id} />
        </div>
      )
    }
    return (
      <div className="App">
        <Unauthorized userProfile={userProfile} />
      </div>
    )
  }

  if (process.env.NODE_ENV !== 'production') {
    return (
      <div className="App">
        <PracticeLog IDToken={"anything"} />
      </div>
    )
  }

  return (
    <div className="App">
      <section style={{"margin": "1rem"}}>
        <GoogleLogin
          clientId={process.env.REACT_APP_OAUTH_CLIENT_ID as string}
          buttonText={"Login with Google"}
          onSuccess={handleLoginSuccess}
          onFailure={handleLoginFailure} />
      </section>
    </div>
  );
}

export default App;
