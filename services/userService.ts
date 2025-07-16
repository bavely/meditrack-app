import { CREATE_USER, GET_VIEWER, LOGIN_USER, RESET_PASSWORD } from '../graphql/user';
import { apolloClient as client } from '../utils/apollo';


export const createUser = async (input: any) => {
 return await client.mutate({
    mutation: CREATE_USER,
    variables: { input },
  });

};

export const loginUser = async (email: string, password: string) => {
 
  // try{
 return await client.mutate({
    mutation: LOGIN_USER,
    variables: {  email, password  },
  });
//   return data.login;
// } catch (error) {
//   throw new Error(JSON.stringify(error));
// }
};


export const getViewerProfile = async () => {
  
  return await client.query({
    query: GET_VIEWER,
    fetchPolicy: 'network-only',
  });


};


export const resetPassword = async (email: string) => {
  console.log('Resetting password for (from service):', email);

  
 return await client.mutate({
    mutation: RESET_PASSWORD,
    variables: { email },
  });

};