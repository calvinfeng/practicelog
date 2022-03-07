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
import axios, { AxiosError, AxiosResponse }  from 'axios'

import { GoogleUserProfile, GoogleError, AuthValidationResponse, Developer, Guest } from '../types'
import Unauthorized from './Unauthorized'
import PracticeLog from '../../practice-log/components/PracticeLog';
import Timeline from '../../timeline/components/Timeline'
import Fretboard from '../../fretboard/Fretboard'
import './App.scss'

/**
 * Google Authentication
 * Token has scope [email, profile, openid, userinfo.profile, userinfo.email]
 */

enum Path {
  Root = "/",
  Fretboard = "/fretboard",
  Timeline = "/timeline"
}

export default function App() {
  const http = axios.create({ baseURL: process.env.REACT_APP_API_URL })
  const [currentUser, setCurrentUser] = React.useState<GoogleUserProfile | null>(null)
  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null)
  const [menuOpen, setMenuOpen] = React.useState<boolean>(false)

  const clearStorageAndLogout = () => {
    setCurrentUser(null)
    localStorage.clear()
  }

  const validateToken = async (IDToken: string, AccessToken: string) => {
    const authenHTTP = axios.create({
      baseURL: process.env.REACT_APP_API_URL,
      timeout: 1000,
      headers: {
        "Authorization": IDToken
      }
    })
    try {
      const resp: AxiosResponse = await authenHTTP.post('/api/v1/token/validate', {"access_token": AccessToken})
      const info = resp.data as AuthValidationResponse
      setCurrentUser({
        id_token: IDToken,
        access_token: AccessToken,
        user_id: info.id,
        email: info.email,
        full_name: info.name,
        first_name: info.given_name,
        last_name: info.family_name,
        avatar_url: info.picture
      })
      console.log('successfully authenticated using token from storage, token expires in', info.expires_in)
      setTimeout(clearStorageAndLogout, info.expires_in * 1000)
    } catch (err: unknown) {
      const error = err as AxiosError
      console.log('ID token in local storage is invalid:', error.message)
      clearStorageAndLogout()
    }
  }

  const handleLoginSuccess = (resp: GoogleLoginResponse | GoogleLoginResponseOffline) => {
    if ((resp as GoogleLoginResponseOffline).code) {
      resp = resp as GoogleLoginResponseOffline
    } else {
      resp = resp as GoogleLoginResponse
      console.log('user has scopes', resp.getGrantedScopes())
      setCurrentUser({
        id_token: resp.tokenId,
        access_token: resp.accessToken,
        user_id: resp.getBasicProfile().getId(),
        email: resp.getBasicProfile().getEmail(),
        full_name: resp.getBasicProfile().getName(),
        first_name: resp.getBasicProfile().getGivenName(),
        last_name: resp.getBasicProfile().getFamilyName(),
        avatar_url: resp.getBasicProfile().getImageUrl()
      })
      console.log('login successful, token expires in', resp.tokenObj.expires_in)
      localStorage.setItem('google_id_token', resp.tokenId)
      localStorage.setItem('google_access_token', resp.accessToken)
      setTimeout(clearStorageAndLogout, resp.tokenObj.expires_in * 1000)
    }
  }

  const handleLoginFailure = (resp: GoogleError) => {
    console.log('Google login failed', resp.error, resp.details)
  }

  const handleMenuClose = (ev: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(null)
    setMenuOpen(false)
  }

  const handleMenuClick = (ev: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(ev.currentTarget as HTMLElement)
    setMenuOpen(true)
  }

  React.useEffect(() => {
    const IDToken = localStorage.getItem('google_id_token')
    const AccessToken = localStorage.getItem('google_access_token')
    if (IDToken !== null && AccessToken !== null) {
      validateToken(IDToken, AccessToken)
    }
  }, [])

  // During development, authentication is disabled.
  if (process.env.NODE_ENV !== 'production') {
    return (
      <div className="App">
        <BrowserRouter>
          <MenuHeader
            currentUser={Developer}
            menuOpen={menuOpen}
            anchorEl={anchorEl}
            handleMenuClick={handleMenuClick}
            handleMenuClose={handleMenuClose} />
          <CoreContentPage currentUser={Developer} />
        </BrowserRouter>
      </div>
    )
  }

  if (currentUser !== null) {
    if (currentUser.email === "calvin.j.feng@gmail.com") {
      return (
        <div className="App">
          <BrowserRouter>
            <MenuHeader
              currentUser={currentUser}
              menuOpen={menuOpen}
              anchorEl={anchorEl}
              handleMenuClick={handleMenuClick}
              handleMenuClose={handleMenuClose} />
            <CoreContentPage currentUser={currentUser} />
          </BrowserRouter>
        </div>
      )
    } else {
      return (
        <div className="App">
          <BrowserRouter>
            <MenuHeader
              currentUser={currentUser}
              menuOpen={menuOpen}
              anchorEl={anchorEl}
              handleMenuClick={handleMenuClick}
              handleMenuClose={handleMenuClose} />
            <UnauthorizedPage currentUser={currentUser} clearStorageAndLogout={clearStorageAndLogout} />
          </BrowserRouter>
        </div>
      )
    }
  }

  return (
    <div className="App">
    <BrowserRouter>
      <MenuHeader
        currentUser={Guest}
        menuOpen={menuOpen}
        anchorEl={anchorEl}
        handleMenuClick={handleMenuClick}
        handleMenuClose={handleMenuClose} />
      <LandingPage
        currentUser={Guest}
        handleLoginSuccess={handleLoginSuccess}
        handleLoginFailure={handleLoginFailure} />
    </BrowserRouter>
    </div>
  )
}

type MenuHeaderProps = {
  currentUser: GoogleUserProfile
  menuOpen: boolean
  anchorEl: HTMLElement | null
  handleMenuClick: (ev: React.MouseEvent<HTMLElement>) => void
  handleMenuClose: (ev: React.MouseEvent<HTMLElement>) => void
}

function MenuHeader(props: MenuHeaderProps) {
  return (
    <AppBar position="static" color="default" className="app-bar">
      <section className="left-container">
        <Toolbar>
          <IconButton color="inherit" aria-label="Menu" onClick={props.handleMenuClick}>
            <MenuRounded />
          </IconButton>
          <Menu
            open={props.menuOpen}
            onClose={props.handleMenuClose}
            anchorEl={props.anchorEl}
            anchorOrigin={{"vertical": "bottom", "horizontal": "center"}} >
            <PracticeLogMenuItem />
            <FretboardMenuItem />
            <TimelineMenuItem />
          </Menu>
          <Typography color="inherit" variant="h6" className="title">Guitar Practice Log</Typography>
        </Toolbar>
      </section>
      <section className="right-container">
        <Avatar className="avatar" alt={props.currentUser.full_name} src={props.currentUser.avatar_url}/>
        <Typography className="display-name" variant="body1">Hi, {props.currentUser.full_name}</Typography>
      </section>
    </AppBar>
  )
}

type LandingPageProps = {
  currentUser: GoogleUserProfile
  handleLoginSuccess: (resp: GoogleLoginResponse | GoogleLoginResponseOffline) => void
  handleLoginFailure: (resp: GoogleError) => void
}

function LandingPage(props: LandingPageProps) {
  const rootContent = (
    <section style={{"margin": "1rem", "height": "100vh"}}>
      <GoogleLogin clientId={process.env.REACT_APP_OAUTH_CLIENT_ID as string}
        buttonText={"Login with Google"}
        onSuccess={props.handleLoginSuccess}
        onFailure={props.handleLoginFailure} />
    </section>
  )

  return (
    <Routes>
      <Route
        path={Path.Root}
        element={rootContent} />
      <Route
        path={Path.Fretboard}
        element={<Fretboard />} />
      <Route
        path={Path.Timeline}
        element={<Timeline currentUserProfile={props.currentUser} />} />
    </Routes>
  )
}

type UnauthorizedPageProps = {
  currentUser: GoogleUserProfile
  clearStorageAndLogout: () => void
}

function UnauthorizedPage(props: UnauthorizedPageProps) {
  const rootContent = (
    <section>
      <Unauthorized
        userProfile={props.currentUser}
        clearStorageAndLogout={props.clearStorageAndLogout} />
    </section>
  )
  return (
    <Routes>
      <Route
        path={Path.Root}
        element={rootContent} />
      <Route
        path={Path.Fretboard}
        element={<Fretboard />} />
      <Route
        path={Path.Timeline}
        element={<Timeline currentUserProfile={props.currentUser}/>} />
    </Routes>
  )
}

type CoreContentPageProps = {
  currentUser: GoogleUserProfile
}

function CoreContentPage(props: CoreContentPageProps) {
  return (
    <Routes>
      <Route
        path={Path.Root}
        element={<PracticeLog currentUser={props.currentUser}/>} />
      <Route
        path={Path.Fretboard}
        element={<Fretboard />} />
      <Route
        path={Path.Timeline + "/:profileID"}
        element={<Timeline currentUserProfile={props.currentUser}/>} />
    </Routes>
  )
}

function PracticeLogMenuItem() {
  const navigate = useNavigate()
  const location = useLocation()
  return (
    <MenuItem
      onClick={() => navigate(Path.Root)}
      disabled={location.pathname === Path.Root}>
      Practice Log
    </MenuItem>
  );
}

function FretboardMenuItem() {
  const navigate = useNavigate()
  return (
    <MenuItem
      onClick={() => navigate(Path.Fretboard)}
      disabled={true}>
      Fretboard
    </MenuItem>
  );
}

function TimelineMenuItem() {
  const navigate = useNavigate()
  const location = useLocation()
  return (
    <MenuItem
      onClick={() => navigate(Path.Timeline + "/me")}
      disabled={location.pathname === Path.Timeline}>
        Progress Timeline
    </MenuItem>
  );
}
