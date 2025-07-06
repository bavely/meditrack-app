// graphql/user.ts
import { gql } from '@apollo/client';

export const CREATE_USER = gql`
  mutation RegisterUser($input: CreateUserInput!) {
    registerUser(input: $input) {
      id
      email
      name
      phoneNumber
    }
  }
`;


export const GET_VIEWER = gql`
  query Profile {
    profile {
      id
      email
      name
      phoneNumber
      createdAt
    }
  }
`;
