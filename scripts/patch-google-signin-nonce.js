#!/usr/bin/env node
/**
 * Patches @react-native-google-signin/google-signin to support nonce in signIn().
 *
 * GIDSignIn v9 auto-generates nonces in every ID token. To let us supply
 * our own nonce (required for Supabase verification), we patch the native
 * signIn: method to call signInWithPresentingViewController:hint:additionalScopes:nonce:
 * when a nonce option is provided.
 *
 * GIDSignIn v9.1.0 selector order: hint:additionalScopes:nonce: (nonce is 4th param)
 */
const fs = require("fs");
const path = require("path");

const target = path.resolve(
  __dirname,
  "../node_modules/@react-native-google-signin/google-signin/ios/RNGoogleSignin.mm"
);

if (!fs.existsSync(target)) {
  console.log("patch-google-signin-nonce: native file not found, skipping.");
  process.exit(0);
}

const original = fs.readFileSync(target, "utf8");

const OLD = `      NSString* hint = options[@"loginHint"];
      NSArray* scopes = self.scopes;

#if DEBUG
    @try {
#endif
      [GIDSignIn.sharedInstance signInWithPresentingViewController:presentingViewController hint:hint additionalScopes:scopes completion:^(GIDSignInResult * _Nullable signInResult, NSError * _Nullable error) {
        [self handleCompletion:signInResult withError:error withResolver:resolve withRejector:reject fromCallsite:@"signIn"];
      }];`;

const NEW = `      NSString* hint = options[@"loginHint"];
      NSString* nonce = options[@"nonce"];
      NSArray* scopes = self.scopes;

#if DEBUG
    @try {
#endif
      if (nonce) {
        [GIDSignIn.sharedInstance signInWithPresentingViewController:presentingViewController hint:hint additionalScopes:scopes nonce:nonce completion:^(GIDSignInResult * _Nullable signInResult, NSError * _Nullable error) {
          [self handleCompletion:signInResult withError:error withResolver:resolve withRejector:reject fromCallsite:@"signIn"];
        }];
      } else {
        [GIDSignIn.sharedInstance signInWithPresentingViewController:presentingViewController hint:hint additionalScopes:scopes completion:^(GIDSignInResult * _Nullable signInResult, NSError * _Nullable error) {
          [self handleCompletion:signInResult withError:error withResolver:resolve withRejector:reject fromCallsite:@"signIn"];
        }];
      }`;

if (!original.includes(OLD)) {
  if (original.includes("additionalScopes:scopes nonce:nonce")) {
    console.log("patch-google-signin-nonce: already applied, skipping.");
  } else {
    console.error("patch-google-signin-nonce: could not find target string — patch may need updating.");
    process.exit(1);
  }
  process.exit(0);
}

fs.writeFileSync(target, original.replace(OLD, NEW), "utf8");
console.log("patch-google-signin-nonce: applied nonce support to RNGoogleSignin.mm");
