import { ADD_MEDICATION, GET_DASHBOARD } from '../graphql/medications';
import { apolloClient as client } from '../utils/apollo';

export const addMedication = async (input: any) => {
  const { data } = await client.mutate({
    mutation: ADD_MEDICATION,
    variables: { input },
  });
  return data.addMedication;
};

export const getDashboardData = async () => {
  const { data } = await client.query({
    query: GET_DASHBOARD,
    fetchPolicy: 'no-cache',
  });
  return data.dashboard;
};
