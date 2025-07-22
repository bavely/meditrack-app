// graphql/user.ts
import { gql } from '@apollo/client';

export const CREATE_USER = gql`
  mutation RegisterUser($input: CreateUserInput!) {
    registerUser(input: $input) {
   success
   errors {
     field
     message
   }
   data {
     accessToken
     refreshToken
     user {
      id
      email
     }
   }
    }
  }
`;

export const LOGIN_USER = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
   success
   errors {
     field
     message
   }
   data {
     accessToken
     refreshToken
     user {
      id
      email
     }
   }
    }
  }
`;


export const GET_VIEWER = gql`
  query GetUser {
    getUser {
   success
   errors {
     field
     message
   }
   data {
   id
  aud
  role
  email
  name
  gender
  dob
  phoneNumber
  prefersPush
  prefersSms
  timezone
  lastSignInAt
  emailVerified
  phoneVerified
  emailConfirmedAt
  confirmationSentAt
  phoneConfirmedAt
  phoneConfirmationSentAt
  appMetadata
  createdAt
  updatedAt
 
   }
    }
  }
`;


export const RESET_PASSWORD = gql`
  mutation ForgotPassword($email: String!) {
    forgotPassword(email: $email){
    success
    errors {
      field
      message
    }
    data {
      message
    }
  }
  }
`;
