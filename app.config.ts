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

const plugins = [...(expo.plugins ?? []).filter(
  (p: unknown) => p !== "expo-dev-client" && (p as unknown[])?.[0] !== "expo-dev-client"
)];

if (process.env.EXPO_PUBLIC_APP_ENV !== "production") {
  plugins.unshift("expo-dev-client");
}

if (googleIosUrlScheme) {
  plugins.push([
    "@react-native-google-signin/google-signin",
    {
      iosUrlScheme: googleIosUrlScheme,
    },
  ]);
}

module.exports = {
  expo: {
    ...expo,
    plugins,
    extra: {
      ...(expo.extra ?? {}),
      eas: {
        projectId: "85545175-cd45-4676-88f6-7305322e0683",
      },
    },
  },
};
