import { CREATE_USER, GET_USER_PROFILE } from '../graphql/user';
import { apolloClient as client } from '../utils/apollo';


export const createUser = async (input: any) => {
  const { data } = await client.mutate({
    mutation: CREATE_USER,
    variables: { input },
  });
  return data.createUser;
};


export const getUserProfile = async () => {
  const { data } = await client.query({
    query: GET_USER_PROFILE,
    fetchPolicy: 'no-cache',
  });
  return data.me;
};