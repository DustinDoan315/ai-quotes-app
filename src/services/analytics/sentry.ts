import * as Sentry from '@sentry/react-native';

export const initSentry = (dsn: string) => {
  Sentry.init({
    dsn,
    enableInExpoDevelopment: false,
    debug: false,
  });
};

export const captureException = (
  error: Error,
  context?: Record<string, unknown>,
) => {
  Sentry.captureException(error, {
    extra: context,
  });
};

export const captureMessage = (
  message: string,
  level: Sentry.SeverityLevel = "info",
  extra?: Record<string, unknown>,
) => {
  Sentry.withScope((scope) => {
    scope.setLevel(level);
    if (extra) scope.setExtras(extra);
    Sentry.captureMessage(message);
  });
};
