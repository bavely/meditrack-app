// Auth0 configuration


// Auth0 endpoints
export const auth0Endpoints = {
  authorization: `https://${auth0Config.domain}/authorize`,
  token: `https://${auth0Config.domain}/oauth/token`,
  userInfo: `https://${auth0Config.domain}/userinfo`,
  logout: `https://${auth0Config.domain}/v2/logout`,
};