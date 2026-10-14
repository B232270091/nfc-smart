import { messages as mn } from './mn';

export const defaultLocale = 'mn' as const;
export const supportedLocales = ['mn', 'en'] as const;
export type Locale = typeof supportedLocales[number];
type Messages = { [Section in keyof typeof mn]: typeof mn[Section] extends string ? string : { [Key in keyof typeof mn[Section]]: string } };
type Overrides = { [Section in keyof Messages]?: Messages[Section] extends string ? string : Partial<Messages[Section]> };

// English is prepared for incremental translation. Mongolian remains the default UI.
const en = {
  appAuthLoginPage: { h1: 'Welcome back', p: 'Sign in to your business workspace.' },
  appAuthResetPasswordPage: { h1: 'New password', label: 'New password' },
  appAuthForgotPasswordPage: { p: 'Enter your registered email address.', submitLabel: 'Send reset link' },
} satisfies Overrides;

export function getMessages(locale: Locale = defaultLocale): Messages {
  if (locale === 'mn') return mn;
  const translated: Overrides = en;
  return Object.fromEntries(Object.entries(mn).map(([section, values]) => {
    const override = translated[section as keyof Messages];
    return [section, typeof values === 'string' ? override ?? values : { ...values, ...(typeof override === 'object' ? override : {}) }];
  })) as Messages;
}
