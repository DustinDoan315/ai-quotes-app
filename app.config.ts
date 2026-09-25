import "dotenv/config";

const { expo } = require("./app.json");

function getGoogleIosUrlScheme(): string | undefined {
  const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;

  if (!iosClientId) {
    return undefined;
  }

  const suffix = ".apps.googleusercontent.com";
  if (!iosClientId.endsWith(suffix)) {
    throw new Error(
      "EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID must end with .apps.googleusercontent.com",
    );
  }

  return `com.googleusercontent.apps.${iosClientId.slice(0, -suffix.length)}`;
}

const googleIosUrlScheme = getGoogleIosUrlScheme();

const googleSigninPlugin = "@react-native-google-signin/google-signin";
const inviteWebOrigin = (
  process.env.EXPO_PUBLIC_INVITE_WEB_ORIGIN ??
  "https://inkly-web-taupe.vercel.app"
).replace(/\/$/, "");
const inviteWebHost = new URL(inviteWebOrigin).hostname;
const inviteAppLink = {
  action: "VIEW",
  autoVerify: true,
  category: ["BROWSABLE", "DEFAULT"],
  data: [
    {
      scheme: "https",
      host: inviteWebHost,
      pathPrefix: "/invite",
    },
  ],
};
const plugins = [...(expo.plugins ?? []).filter((p: unknown) => {
  if (p === "expo-dev-client" || (p as unknown[])?.[0] === "expo-dev-client") {
    return false;
  }

  return p !== googleSigninPlugin && (p as unknown[])?.[0] !== googleSigninPlugin;
})];

if (process.env.EXPO_PUBLIC_APP_ENV !== "production") {
  plugins.unshift("expo-dev-client");
}

if (googleIosUrlScheme) {
  plugins.push([
    googleSigninPlugin,
    {
      iosUrlScheme: googleIosUrlScheme,
    },
  ]);
} else {
  plugins.push(googleSigninPlugin);
}

module.exports = {
  expo: {
    ...expo,
    ios: {
      ...expo.ios,
      associatedDomains: [
        ...new Set([
          ...(expo.ios?.associatedDomains ?? []),
          `applinks:${inviteWebHost}`,
        ]),
      ],
    },
    android: {
      ...expo.android,
      intentFilters: [
        ...(expo.android?.intentFilters ?? []),
        inviteAppLink,
      ],
    },
    plugins,
    extra: {
      ...(expo.extra ?? {}),
      eas: {
        projectId: "85545175-cd45-4676-88f6-7305322e0683",
      },
    },
  },
};
