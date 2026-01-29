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
) => {
  Sentry.captureMessage(message, level);
};
