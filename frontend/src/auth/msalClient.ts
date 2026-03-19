import { PublicClientApplication } from '@azure/msal-browser';
import { loginRequest, msalConfig } from './authConfig';

export const msalClient = new PublicClientApplication(msalConfig);

export async function loginWithMicrosoft(): Promise<string> {
  await msalClient.initialize();
  const result = await msalClient.loginPopup(loginRequest);
  const account = result.account;

  if (!account) {
    throw new Error('Microsoft account not returned');
  }

  const tokenResult = await msalClient.acquireTokenSilent({
    ...loginRequest,
    account,
  });

  return tokenResult.accessToken;
}

export async function logoutMicrosoft(): Promise<void> {
  const account = msalClient.getActiveAccount() ?? msalClient.getAllAccounts()[0];

  if (!account) {
    return;
  }

  await msalClient.logoutPopup({ account });
}
