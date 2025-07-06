// lib/apollo.ts
import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { GRAPHQL_API_URL } from './env'; // Ensure this exports your GraphQL API URL
import { supabase } from './supabase'; // Make sure this exports your Supabase client

console.log('GRAPHQL_API_URL:', GRAPHQL_API_URL);

const httpLink = createHttpLink({
  uri: GRAPHQL_API_URL,
});

const authLink = setContext(async (_, { headers }) => {
  const {
    data: { session },
  } = await supabase.auth.getSession();
console.log('Supabase session:', session);
  const token = session?.access_token || '';
  console.log('Supabase session token:', token);
  
  return {
    headers : {
      ...headers,
      Authorization: `Bearer ${token}`,},
  };
});
console.log('Supabase session authLink:', authLink);
export const apolloClient = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});
