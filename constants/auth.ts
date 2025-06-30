// Auth0 configuration
export const auth0Config = {
  domain: "dev-agu00qti8bfvpoxi.us.auth0.com",
  clientId: "XvHvdOxxSOproUNIDgukyNTRdu3WY987", // Replace with your actual Auth0 client ID
  audience: "https://api.meditrack.com",
  scope: "openid profile email offline_access",
  redirectUri: "meditrack://callback",
};

// Auth0 endpoints
export const auth0Endpoints = {
  authorization: `https://${auth0Config.domain}/authorize`,
  token: `https://${auth0Config.domain}/oauth/token`,
  userInfo: `https://${auth0Config.domain}/userinfo`,
  logout: `https://${auth0Config.domain}/v2/logout`,
};