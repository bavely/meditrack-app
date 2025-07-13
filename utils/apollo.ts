import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GRAPHQL_API_URL } from './env';
//consolelog('GraphQL API URL:', GRAPHQL_API_URL);
const http = createHttpLink({ uri: GRAPHQL_API_URL });
const authLink = setContext(async () => {
  const token =  await AsyncStorage.getItem('accessToken');
  if (!token) {
    //consolewarn('No access token found in AsyncStorage');
  }
  //consolelog('Using access token:', token);
  return { headers: { authorization: token ? `Bearer ${token}` : '' } };
});

export const apolloClient = new ApolloClient({
  link: authLink.concat(http),
  cache: new InMemoryCache(),
});