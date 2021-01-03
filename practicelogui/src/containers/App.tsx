import React from 'react';
import {
  GoogleLogin,
  GoogleLoginResponse,
  GoogleLoginResponseOffline,
} from 'react-google-login';

import { GoogleUserProfile, GoogleError } from '../shared/type_definitions'
import PracticeLog from './PracticeLog';
import './App.scss'

/**
  It seems to me that Google user only has scopes for 
  [email, profile, openid,
    https://www.googleapis.com/auth/userinfo.profile,
    https://www.googleapis.com/auth/userinfo.email ]
 */

function App() {
  const [user, setUser] = React.useState<GoogleUserProfile | null>(null);

  // TODO: Store the ID token in cache
  // As soon as page is loaded, check the token and send it to backend to verify that token is
  // still valid and return profile information.
  const handleLoginSuccess = (resp: GoogleLoginResponse | GoogleLoginResponseOffline) => {
    if ((resp as GoogleLoginResponseOffline).code) {
      resp = resp as GoogleLoginResponseOffline
    } else {
      resp = resp as GoogleLoginResponse

      const userProfile: GoogleUserProfile = {
        token_id: resp.tokenId,
        access_token: resp.accessToken,
        granted_scopes: resp.getGrantedScopes(),
        google_user_id: resp.getBasicProfile().getId(),
        google_email: resp.getBasicProfile().getEmail(),
        full_name: resp.getBasicProfile().getName(),
        given_name: resp.getBasicProfile().getGivenName(),
        family_name: resp.getBasicProfile().getFamilyName(),
        image_url: resp.getBasicProfile().getImageUrl()
      }
      setUser(userProfile)
    }
  }

  const handleLoginFailure = (resp: GoogleError) => {
    console.log('Google login failed', resp.error, resp.details)
  }

  let content;
  if (user !== null) {
    content = <PracticeLog IDToken={user.token_id} />
  } else {
    content = <GoogleLogin
      disabled={process.env.NODE_ENV !== "development"}
      clientId={process.env.REACT_APP_OAUTH_CLIENT_ID as string}
      buttonText={"Login with Google"}
      onSuccess={handleLoginSuccess}
      onFailure={handleLoginFailure} />
  }

  return (
    <div className="App">
      {content}
    </div>
  );
}

export default App;
