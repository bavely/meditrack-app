import { CREATE_USER, GET_VIEWER } from '../graphql/user';
import { apolloClient as client } from '../utils/apollo';


export const createUser = async (input: any) => {
  try{
  const { data } = await client.mutate({
    mutation: CREATE_USER,
    variables: { input },
  });
  return data.registerUser;
} catch (error) {
  console.error('Error creating user:', error);
  throw new Error('Failed to create user');
}
};


export const getViewerProfile = async () => {
  try{
  const { data } = await client.query({
    query: GET_VIEWER,
    fetchPolicy: 'network-only',
  });

  return data;
} catch (error) {
  console.error('Error fetching viewer profile:', error);
  throw new Error('Failed to fetch viewer profile');
}
};