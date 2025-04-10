import {
    AlchemyAccountsUIConfig,
    cookieStorage,
    createConfig,
  } from "@account-kit/react";
import { alchemy, arbitrum } from "@account-kit/infra";
import { QueryClient } from "@tanstack/react-query";

// const WALLET_CONN_PROJ_ID = process.env.WALLET_CONN_PROJ_ID;
// if (!WALLET_CONN_PROJ_ID) throw "env var ALCHEMY_API_KEY missing"

const uiConfig: AlchemyAccountsUIConfig = {
    illustrationStyle: "outline",
    auth: {
      sections: [
        [{ type: "email", emailMode: "otp" }],
        [
          { type: "passkey" },
          { type: "social", authProviderId: "google", mode: "popup" },
          { type: "social", authProviderId: "facebook", mode: "popup" },
        //   {
        //     type: "social",
        //     authProviderId: "auth0",
        //     mode: "popup",
        //     auth0Connection: "discord",
        //     displayName: "Discord",
        //     logoUrl: "/images/discord.svg",
        //     scope: "openid profile",
        //   },
        //   {
        //     type: "social",
        //     authProviderId: "auth0",
        //     mode: "popup",
        //     auth0Connection: "twitter",
        //     displayName: "Twitter",
        //     logoUrl: "/images/twitter.svg",
        //     // logoUrlDark: "/images/twitter.svg",
        //     scope: "openid profile",
        //   },
        ],
        // [
        //   {
        //     type: "external_wallets",
        //     walletConnect: { projectId: "your-project-id" },
        //   },
        // ],
      ],
      addPasskeyOnSignup: false,
    },
  };
  
const ALCHEMY_API_KEY = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY;
if (!ALCHEMY_API_KEY) throw "env var ALCHEMY_API_KEY missing"
const GAS_MANAGER_POLICY_ID = process.env.NEXT_PUBLIC_GAS_MANAGER_POLICY_ID;
if (!GAS_MANAGER_POLICY_ID) throw "env var GAS_MANAGER_POLICY_ID missing"

export const config = createConfig(
    {
        transport: alchemy({ apiKey: ALCHEMY_API_KEY }),
        chain: arbitrum,
        ssr: true,
        storage: cookieStorage,
        enablePopupOauth: true,
        policyId: GAS_MANAGER_POLICY_ID
    },
    uiConfig
);

export const queryClient = new QueryClient();
