// graphql/user.ts
import { gql } from '@apollo/client';

export const CREATE_USER = gql`
  mutation RegisterUser($input: CreateUserInput!) {
    registerUser(input: $input) {
    accessToken
    refreshToken
    }
  }
`;

export const LOGIN_USER = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
    accessToken
    refreshToken
    }
  }
`;


export const GET_VIEWER = gql`
  query GetUser {
    getUser {
    id
    aud
    role
    email
    name
    phoneNumber
    emailVerified
    phoneVerified
    createdAt
    updatedAt
    }
  }
`;


export const RESET_PASSWORD = gql`
  mutation ForgotPassword($email: String!) {
    forgotPassword(email: $email)
  }
`;
