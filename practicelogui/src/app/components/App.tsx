import React from 'react';
import {
  GoogleLogin,
  GoogleLoginResponse,
  GoogleLoginResponseOffline
} from 'react-google-login';
import {
  BrowserRouter,
  Route,
  Routes,
  useLocation,
  useNavigate
} from "react-router-dom"
import { AppBar, Toolbar, IconButton, Menu, Typography, MenuItem, Avatar } from '@mui/material';
import { MenuRounded } from '@mui/icons-material';
import axios, { AxiosInstance, AxiosResponse }  from 'axios'

import { GoogleUserProfile, GoogleError, AuthValidationResponse, Developer, Guest } from '../types'
import Unauthorized from './Unauthorized'
import PracticeLogV2 from '../../practice-log/components/PracticeLog';
import Fretboard from '../../fretboard/Fretboard'
import Timeline from '../../timeline/Timeline'
import './App.scss'

/**
 * Google Authentication
 * Token has scope [email, profile, openid, userinfo.profile, userinfo.email]
 */

type Props = {}
type State = {
  currentUserProfile: GoogleUserProfile | null
  anchorEl: HTMLElement | null
  menuOpen: boolean
}

enum Path {
  Root = "/",
  Fretboard = "/fretboard",
  Timeline = "/timeline"
}

export default class App extends React.Component<Props, State> {
  private http: AxiosInstance

  constructor(props: Props) {
    super(props)
    this.http = axios.create({ baseURL: process.env.REACT_APP_API_URL })
    this.state = {
      currentUserProfile: null,
      anchorEl: null,
      menuOpen: false
    }
  }

  validateToken = (IDToken: string, AccessToken: string): Promise<any> => {
    this.http = axios.create({
      baseURL: process.env.REACT_APP_API_URL,
      timeout: 1000,
      headers: {
        "Authorization": IDToken
      }
    });
    return this.http.post('/api/v1/token/validate', { "access_token": AccessToken })
      .then((resp: AxiosResponse) => {
        if (resp.status === 200) {
          const info = resp.data as AuthValidationResponse
          this.setState({
            currentUserProfile: {
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

  // TODO: Make use of this function
  // TODO: What to do if video log fails to fetch? Create one for user!
  fetchVideoLogProfile = (): Promise<any> => {
    return this.http.get('/api/v2/videolog/profiles/mine')
      .then((resp: AxiosResponse) => {
        console.log(resp)
      })
  }

  componentDidMount() {
    const IDToken = localStorage.getItem('google_id_token')
    const AccessToken = localStorage.getItem('google_access_token')
    if (IDToken !== null && AccessToken !== null) {
      this.validateToken(IDToken, AccessToken)
    }
  }

  clearStorageAndLogout = () => {
    this.setState({ currentUserProfile: null })
    localStorage.clear()
  }

  handleLoginSuccess = (resp: GoogleLoginResponse | GoogleLoginResponseOffline) => {
    if ((resp as GoogleLoginResponseOffline).code) {
      resp = resp as GoogleLoginResponseOffline
    } else {
      resp = resp as GoogleLoginResponse
      console.log('user has scopes', resp.getGrantedScopes())

      this.setState({
        currentUserProfile: {
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

  appBar(profile: GoogleUserProfile) {
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
          <Avatar className="avatar" alt={profile.full_name} src={profile.avatar_url}/>
          <Typography className="display-name" variant="body1">Hi, {profile.full_name}</Typography>
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
          userProfile={this.state.currentUserProfile as GoogleUserProfile}
          clearStorageAndLogout={this.clearStorageAndLogout} />
      </div>
    )
  }

  renderLandingPage(profile: GoogleUserProfile) {
    return (
      <div className="App">
        <BrowserRouter>
          {this.appBar(profile)}
          <Routes>
            <Route
              path={Path.Root}
              element={this.googleLogin} />
            <Route
              path={Path.Fretboard}
              element={<Fretboard />} />
            <Route
              path={Path.Timeline}
              element={<Timeline currentUserProfile={profile} />} />
          </Routes>
        </BrowserRouter>
      </div>
    )
  }

  renderUnauthorizedPage(profile: GoogleUserProfile) {
    return (
      <div className="App">
        <BrowserRouter>
          {this.appBar(profile)}
          <Routes>
            <Route
              path={Path.Root}
              element={this.googleUnauthorized} />
            <Route
              path={Path.Fretboard}
              element={<Fretboard />} />
            <Route
              path={Path.Timeline}
              element={<Timeline currentUserProfile={profile}/>} />
          </Routes>
        </BrowserRouter>
      </div>
    )
  }

  renderCoreContent(profile: GoogleUserProfile) {
    return (
      <div className="App">
        <BrowserRouter>
          {this.appBar(profile)}
          <Routes>
            <Route
              path={Path.Root}
              element={<PracticeLogV2 currentUser={profile}/>} />
            <Route
              path={Path.Fretboard}
              element={<Fretboard />} />
            <Route
              path={Path.Timeline + "/:profileID"}
              element={<Timeline currentUserProfile={profile}/>} />
          </Routes>
        </BrowserRouter>
      </div>
    )
  }

  render() {
    // During development, authentication is disabled.
    if (process.env.NODE_ENV !== 'production') {
      return this.renderCoreContent(Developer)
    }

    if (this.state.currentUserProfile !== null) {
      if (this.state.currentUserProfile.email === "calvin.j.feng@gmail.com") {
        return this.renderCoreContent(this.state.currentUserProfile)
      }
      return this.renderUnauthorizedPage(this.state.currentUserProfile)
    }

    return this.renderLandingPage(Guest)
  }
}

function PracticeLogMenuItem() {
  const navigate = useNavigate()
  const location = useLocation()

  function handleClick() {
    navigate(Path.Root)
  }

  return (
    <MenuItem onClick={handleClick} disabled={location.pathname === Path.Root}>
      Practice Log
    </MenuItem>
  );
}

function FretboardMenuItem() {
  const navigate = useNavigate()
  const location = useLocation()

  function handleClick() {
    navigate(Path.Fretboard)
  }

  return (
    <MenuItem onClick={handleClick} disabled={location.pathname === Path.Fretboard}>
      Fretboard
    </MenuItem>
  );
}

function TimelineMenuItem() {
  const navigate = useNavigate()
  const location = useLocation()

  function handleClick() {
    navigate(Path.Timeline + "/me");
  }

  return (
    <MenuItem onClick={handleClick} disabled={location.pathname === Path.Timeline}>
        Progress Timeline
    </MenuItem>
  );
}
