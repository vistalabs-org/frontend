import {
    AlchemyAccountsUIConfig,
    cookieStorage,
    createConfig,
  } from "@account-kit/react";
import { alchemy, sepolia } from "@account-kit/infra";
import { QueryClient } from "@tanstack/react-query";
import dotenv from 'dotenv';

dotenv.config();

// const WALLET_CONN_PROJ_ID = process.env.WALLET_CONN_PROJ_ID;
// if (!WALLET_CONN_PROJ_ID) throw "env var ALCHEMY_API_KEY missing"

const uiConfig: AlchemyAccountsUIConfig = {
illustrationStyle: "outline",
auth: {
    sections: [
    [{ type: "email" }],
    [
        { type: "passkey" },
        { type: "social", authProviderId: "google", mode: "popup" },
        { type: "social", authProviderId: "facebook", mode: "popup" },
    ],
    // [
    //     {
    //     type: "external_wallets",
    //     walletConnect: { projectId: WALLET_CONN_PROJ_ID },
    //     },
    // ],
    ],
    addPasskeyOnSignup: false,
},
};
  
const ALCHEMY_API_KEY = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY;
if (!ALCHEMY_API_KEY) throw "env var ALCHEMY_API_KEY missing"

export const config = createConfig(
    {
        transport: alchemy({ apiKey: ALCHEMY_API_KEY }), // TODO: add your Alchemy API key - https://dashboard.alchemy.com/accounts
        chain: sepolia,
        ssr: true, // more about ssr: https://accountkit.alchemy.com/react/ssr
        storage: cookieStorage, // more about persisting state with cookies: https://accountkit.alchemy.com/react/ssr#persisting-the-account-state
        enablePopupOauth: true, // must be set to "true" if you plan on using popup rather than redirect in the social login flow
    },
    uiConfig
);

export const queryClient = new QueryClient();
