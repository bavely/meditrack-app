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