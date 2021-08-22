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

export const Developer: GoogleUserProfile = {
  id_token: "",
  access_token: "",
  user_id: "6920d960-3fd9-4226-9db6-2aa2cb1e4db9",
  email: "developer@practicelog.com",
  full_name: "Developer",
  first_name: "Developer",
  last_name: "",
  avatar_url: "https://gravatar.com/avatar/ca5b06deee5db1797c406ca0a1bc5535?s=400&d=robohash&r=x"
}

export const Guest: GoogleUserProfile = {
  id_token: "",
  access_token: "",
  user_id: "d9d55b10-0e38-433a-9ef4-d5995219b9cb",
  email: "guest@practicelog.com",
  full_name: "Guest",
  first_name: "Guest",
  last_name: "",
  avatar_url: "https://gravatar.com/avatar/ca5b06deee5db1797c406ca0a1bc5535?s=400&d=robohash&r=x"
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
