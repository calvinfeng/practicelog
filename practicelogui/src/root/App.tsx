import React from 'react';
import {
  GoogleLogin,
  GoogleLoginResponse,
  GoogleLoginResponseOffline
} from 'react-google-login';
import {
  BrowserRouter,
  Route,
  Switch,
  useLocation,
  useHistory
} from "react-router-dom"
import { AppBar, Toolbar, IconButton, Menu, Typography, MenuItem } from '@material-ui/core';
import { MenuRounded } from '@material-ui/icons';

import axios, { AxiosResponse }  from 'axios'
import { GoogleUserProfile, GoogleError, AuthValidationResponse } from './types'
import PracticeLog from '../practice_log/PracticeLog'
import Unauthorized from './Unauthorized'
import Fretboard from '../fretboard/Fretboard'
import Timeline from '../timeline/Timeline'
import './App.scss'

/**
 * Google Authentication
 * Token has scope [email, profile, openid, userinfo.profile, userinfo.email]
 */

type Props = {}
type State = {
  userProfile: GoogleUserProfile | null
  anchorEl: HTMLElement | null
  menuOpen: boolean
}

enum Path {
  Root = "/",
  Fretboard = "/fretboard",
  Timeline = "/timeline"
}

export default class App extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      userProfile: null,
      anchorEl: null,
      menuOpen: false
    };
  }

  componentDidMount() {
    const IDToken = localStorage.getItem('google_id_token')
    const AccessToken = localStorage.getItem('google_access_token')
    if (IDToken !== null && AccessToken !== null) {
      const http = axios.create({
        baseURL: process.env.REACT_APP_API_URL,
        timeout: 1000,
        headers: {
          "Authorization": IDToken
        }
      });

      http.post('/api/v1/token/validate', { "access_token": AccessToken })
        .then((resp: AxiosResponse) => {
          if (resp.status === 200) {
            const info = resp.data as AuthValidationResponse
            this.setState({
              userProfile: {
                id_token: IDToken,
                access_token: AccessToken,
                user_id: info.id,
                email: info.email,
                full_name: info.name,
                first_name: info.given_name,
                last_name: info.family_name,
                avatar_url: info.picture
              }
            })
            console.log('token expires in', info.expires_in)
            setTimeout(this.clearStorageAndLogout, info.expires_in * 1000)
          }
        })
        .catch((reason: any) => {
          console.log('ID token in local storage is invalid', reason)
          this.clearStorageAndLogout()
        })
    }
  }

  clearStorageAndLogout = () => {
    this.setState({ userProfile: null })
    localStorage.clear()
  }

  handleLoginSuccess = (resp: GoogleLoginResponse | GoogleLoginResponseOffline) => {
    if ((resp as GoogleLoginResponseOffline).code) {
      resp = resp as GoogleLoginResponseOffline
    } else {
      resp = resp as GoogleLoginResponse
      console.log('user has scopes', resp.getGrantedScopes())

      this.setState({
        userProfile: {
          id_token: resp.tokenId,
          access_token: resp.accessToken,
          user_id: resp.getBasicProfile().getId(),
          email: resp.getBasicProfile().getEmail(),
          full_name: resp.getBasicProfile().getName(),
          first_name: resp.getBasicProfile().getGivenName(),
          last_name: resp.getBasicProfile().getFamilyName(),
          avatar_url: resp.getBasicProfile().getImageUrl()
        }
      })
      console.log('token expires in', resp.tokenObj.expires_in)
      localStorage.setItem('google_id_token', resp.tokenId)
      localStorage.setItem('google_access_token', resp.accessToken)
      setTimeout(this.clearStorageAndLogout, resp.tokenObj.expires_in * 1000)
    }
  }

  handleLoginFailure = (resp: GoogleError) => {
    console.log('Google login failed', resp.error, resp.details)
  }

  handleMenuOnClose = (ev: React.MouseEvent<HTMLElement>) => {
    this.setState({
      anchorEl: null,
      menuOpen: false
    })
  }

  handleMenuOnClick = (ev: React.MouseEvent<HTMLElement>) => {
    this.setState({
      anchorEl: ev.currentTarget as HTMLElement,
      menuOpen: true
    })
  }

  get appBar() {
    return (
      <AppBar position="static" color="default" className="app-bar">
        <section className="left-container">
          <Toolbar>
            <IconButton color="inherit" aria-label="Menu" onClick={this.handleMenuOnClick}>
              <MenuRounded />
            </IconButton>
            <Menu
              open={this.state.menuOpen}
              onClose={this.handleMenuOnClose}
              getContentAnchorEl={null}
              anchorEl={this.state.anchorEl}
              anchorOrigin={{"vertical": "bottom", "horizontal": "center"}} >
              <PracticeLogMenuItem />
              <FretboardMenuItem />
              <TimelineMenuItem />
            </Menu>
            <Typography color="inherit" variant="h6" className="title">Guitar Practice Log</Typography>
          </Toolbar>
        </section>
        <section className="right-container">
        </section>
      </AppBar>
    )
  }

  // TODO: Separate this out, make it a pretty landing page
  get googleLogin() {
    return (
      <section style={{"margin": "1rem", "height": "100vh"}}>
        <GoogleLogin
          clientId={process.env.REACT_APP_OAUTH_CLIENT_ID as string}
          buttonText={"Login with Google"}
          onSuccess={this.handleLoginSuccess}
          onFailure={this.handleLoginFailure} />
      </section>
    )
  }

  // TODO: Separate this out, make it a pretty unauthorized page
  get googleUnauthorized() {
    return (
      <div className="App">
        <Unauthorized
          userProfile={this.state.userProfile as GoogleUserProfile}
          clearStorageAndLogout={this.clearStorageAndLogout} />
      </div>
    )
  }

  renderLandingPage() {
    return (
      <div className="App">
        <BrowserRouter>
          {this.appBar}
          <Switch>
            <Route
              exact path={Path.Root}
              render={() => this.googleLogin} />
            <Route
              exact path={Path.Fretboard}
              render={() => <Fretboard />} />
            <Route
              exact path={Path.Timeline}
              render={() => <Timeline />} />
          </Switch>
        </BrowserRouter>
      </div>
    )
  }

  renderUnauthorizedPage() {
    return (
      <div className="App">
        <BrowserRouter>
          {this.appBar}
          <Switch>
            <Route
              exact path={Path.Root}
              render={() => this.googleUnauthorized} />
            <Route
              exact path={Path.Fretboard}
              render={() => <Fretboard />} />
            <Route
              exact path={Path.Timeline}
              render={() => <Timeline />} />
          </Switch>
        </BrowserRouter>
      </div>
    )
  }

  renderCoreContent(idToken: string) {
    return (
      <div className="App">
        <BrowserRouter>
          {this.appBar}
          <Switch>
            <Route
              exact path={Path.Root}
              render={() => <PracticeLog IDToken={idToken} />} />
            <Route
              exact path={Path.Fretboard}
              render={() => <Fretboard />} />
            <Route
              exact path={Path.Timeline}
              render={() => <Timeline />} />
          </Switch>
        </BrowserRouter>
      </div>
    )
  }

  render() {
    if (process.env.NODE_ENV !== 'production') {
      return this.renderCoreContent('development-dummy-token')
    }

    if (this.state.userProfile !== null) {
      if (this.state.userProfile.email === "calvin.j.feng@gmail.com") {
        return this.renderCoreContent(this.state.userProfile.id_token)
      }
      return this.renderUnauthorizedPage()
    }

    return this.renderLandingPage()
  }
}

function PracticeLogMenuItem() {
  const history = useHistory()
  const location = useLocation()

  function handleClick() {
    history.push(Path.Root);
  }

  return (
    <MenuItem onClick={handleClick} disabled={location.pathname === Path.Root}>
      Practice Log
    </MenuItem>
  );
}

function FretboardMenuItem() {
  const history = useHistory()
  const location = useLocation()

  function handleClick() {
    history.push(Path.Fretboard);
  }

  return (
    <MenuItem onClick={handleClick} disabled={location.pathname === Path.Fretboard}>
      Fretboard
    </MenuItem>
  );
}

function TimelineMenuItem() {
  const history = useHistory()
  const location = useLocation()

  function handleClick() {
    history.push(Path.Timeline);
  }

  return (
    <MenuItem onClick={handleClick} disabled={location.pathname === Path.Timeline}>
        Progress Timeline
    </MenuItem>
  );
}
