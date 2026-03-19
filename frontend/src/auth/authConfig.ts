import type { Configuration } from '@azure/msal-browser';

const clientId = import.meta.env.VITE_MS_CLIENT_ID;
const tenantId = import.meta.env.VITE_MS_TENANT_ID;

export const msalConfig: Configuration = {
  auth: {
    clientId,
    authority: `https://login.microsoftonline.com/${tenantId}`,
    redirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: 'localStorage',
    storeAuthStateInCookie: false,
  },
};

const defaultScope = import.meta.env.VITE_MS_SCOPE;

export const loginRequest = {
  scopes: defaultScope ? [defaultScope] : ['openid', 'profile', 'email'],
};
