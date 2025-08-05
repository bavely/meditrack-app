import { CREATE_USER, GET_VIEWER, LOGIN_USER, RESET_PASSWORD } from '../graphql/user';
import { apolloClient as client } from '../utils/apollo';
import { CreateUserInput } from '../types/user';

export const createUser = async (input: CreateUserInput): Promise<any> => {
  try {
    const { data } = await client.mutate({
      mutation: CREATE_USER,
      variables: { input },
    });
    return data.registerUser;
  } catch (error) {
    throw new Error(
      `Failed to create user: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};

export const loginUser = async (email: string, password: string): Promise<any> => {
  try {
    const { data } = await client.mutate({
      mutation: LOGIN_USER,
      variables: { email, password },
    });
    return data.login;
  } catch (error) {
    throw new Error(
      `Failed to login: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};

export const getViewerProfile = async (): Promise<any> => {
  try {
    const { data } = await client.query({
      query: GET_VIEWER,
      fetchPolicy: 'network-only',
    });
    return data.getUser;
  } catch (error) {
    throw new Error(
      `Failed to fetch viewer profile: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};

export const resetPassword = async (email: string): Promise<any> => {
  console.log('Resetting password for (from service):', email);
  try {
    const { data } = await client.mutate({
      mutation: RESET_PASSWORD,
      variables: { email },
    });
    return data.forgotPassword;
  } catch (error) {
    throw new Error(
      `Failed to reset password: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};
