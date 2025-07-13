import { CREATE_USER, GET_VIEWER, LOGIN_USER, RESET_PASSWORD } from '../graphql/user';
import { apolloClient as client } from '../utils/apollo';


export const createUser = async (input: any) => {
  try{
  const { data } = await client.mutate({
    mutation: CREATE_USER,
    variables: { input },
  });
  return data.registerUser;
} catch (error) {
  throw new Error(JSON.stringify(error));
}
};

export const loginUser = async (email: string, password: string) => {
 
  try{
  const { data } = await client.mutate({
    mutation: LOGIN_USER,
    variables: {  email, password  },
  });
  return data.login;
} catch (error) {
  throw new Error(JSON.stringify(error));
}
};


export const getViewerProfile = async () => {
  try{
  const { data } = await client.query({
    query: GET_VIEWER,
    fetchPolicy: 'network-only',
  });

  return data.getUser;
} catch (error) {
  throw new Error(JSON.stringify(error));
}
};


export const resetPassword = async (email: string) => {
  console.log('Resetting password for:', email);
  try{
  const { data } = await client.mutate({
    mutation: RESET_PASSWORD,
    variables: { email },
  });
  return data.forgotPassword;
} catch (error) {
  throw new Error(JSON.stringify(error));
}
};