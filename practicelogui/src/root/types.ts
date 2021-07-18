export type GoogleUserProfile = {
  id_token: string
  access_token: string
  user_id: string
  email: string
  full_name: string
  first_name: string
  last_name: string
  avatar_url: string
}

export type VideoLogProfile = {
  id: string
  username: string
  privacy: string
}

export type AuthValidationResponse = {
  expires_in: number
  id: string
  email: string
  family_name: string
  given_name: string
  name: string
  locale: string
  picture: string
  verified_email: boolean
}

export type GoogleError = {
  error: string
  details: string
}
