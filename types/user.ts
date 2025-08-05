export interface LocalUser {
  id: string
  aud: string
  role: string
  email: string
  name: string
  phoneNumber: string
  emailVerified: boolean
  phoneVerified: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateUserInput {
  email: string
  password: string
  name?: string
  phoneNumber?: string
  role?: string
  aud?: string
  gender?: string
  dob?: Date
}
