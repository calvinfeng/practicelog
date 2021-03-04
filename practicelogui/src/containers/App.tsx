import React from 'react';
import {
  GoogleLogin,
  GoogleLoginResponse,
  GoogleLoginResponseOffline,
} from 'react-google-login';

import axios, { AxiosInstance, AxiosResponse }  from 'axios'
import { GoogleUserProfile, GoogleError, GoogleUserInfoResponse } from '../shared/type_definitions'
import PracticeLog from './PracticeLog'
import Unauthorized from './Unauthorized'
import './App.scss'

/**
 * Google Authentication
 * Token has scope [email, profile, openid, userinfo.profile, userinfo.email]
 */

type Props = {}
type State = {
  userProfile: GoogleUserProfile | null
}

export default class App extends React.Component<Props, State> {
  private googleAPI: AxiosInstance

  constructor(props: Props) {
    super(props)
    this.state = {
      userProfile: null
    };
    this.googleAPI = axios.create({
      baseURL: 'https://www.googleapis.com',
      timeout: 2000
    })
  }

  componentDidMount() {
    const IDToken = localStorage.getItem('google_id_token')
    const accessToken = localStorage.getItem('google_access_token')
    if (IDToken !== null && accessToken !== null) {
      const instance = axios.create({
        baseURL: process.env.REACT_APP_API_URL,
        timeout: 1000,
        headers: {
          "Authorization": IDToken
        }
      });

      instance.get('/api/v1/token/validate')
        .then((resp: AxiosResponse) => {
          if (resp.status == 200) {
            // TODO: Move this logic to backend
            this.googleAPI.get('/oauth2/v1/userinfo?alt=json&access_token=' + accessToken)
              .then((resp: AxiosResponse) => {
                const info = resp.data as GoogleUserInfoResponse
                this.setState({
                  userProfile: {
                    id_token: IDToken,
                    access_token: accessToken,
                    granted_scopes: "", // TODO: Backend should populate this
                    user_id: info.id,
                    email: info.email,
                    full_name: info.name,
                    first_name: info.given_name,
                    last_name: info.family_name,
                    avatar_url: info.picture
                  }
                })
              })
              .catch((reason: any) => {
                console.log('failed to fetch user information from Google API', reason)
              })
          }
        })
        .catch((reason: any) => {
          console.log('ID token in local storage is invalid', reason)
          localStorage.clear()
        })

    }
  }

  handleLoginSuccess = (resp: GoogleLoginResponse | GoogleLoginResponseOffline) => {
    if ((resp as GoogleLoginResponseOffline).code) {
      resp = resp as GoogleLoginResponseOffline
    } else {
      resp = resp as GoogleLoginResponse
      this.setState({
        userProfile: {
          id_token: resp.tokenId,
          access_token: resp.accessToken,
          granted_scopes: resp.getGrantedScopes(),
          user_id: resp.getBasicProfile().getId(),
          email: resp.getBasicProfile().getEmail(),
          full_name: resp.getBasicProfile().getName(),
          first_name: resp.getBasicProfile().getGivenName(),
          last_name: resp.getBasicProfile().getFamilyName(),
          avatar_url: resp.getBasicProfile().getImageUrl()
        }
      })
      localStorage.setItem('google_id_token', resp.tokenId)
      localStorage.setItem('google_access_token', resp.accessToken)
    }
  }

  handleLoginFailure = (resp: GoogleError) => {
    console.log('Google login failed', resp.error, resp.details)
  }

  render() {
    if (this.state.userProfile !== null) {
      if (this.state.userProfile.email === "calvin.j.feng@gmail.com") {
        return (
          <div className="App">
            <PracticeLog IDToken={this.state.userProfile.id_token} />
          </div>
        )
      }
      return (
        <div className="App">
          <Unauthorized userProfile={this.state.userProfile} />
        </div>
      )
    }

    if (process.env.NODE_ENV !== 'production') {
      return (
        <div className="App">
          <PracticeLog IDToken={"development"} />
        </div>
      )
    }

    return (
      <div className="App">
        <section style={{"margin": "1rem"}}>
          <GoogleLogin
            clientId={process.env.REACT_APP_OAUTH_CLIENT_ID as string}
            buttonText={"Login with Google"}
            onSuccess={this.handleLoginSuccess}
            onFailure={this.handleLoginFailure} />
        </section>
      </div>
    )
  }
}
