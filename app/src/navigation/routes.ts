export const Routes = {
  Home: 'Home',
  AuthSignUp: 'AuthSignUp',
  AuthSignIn: 'AuthSignIn',
  OnboardingProfile: 'OnboardingProfile',
  OnboardingCategories: 'OnboardingCategories',
  OnboardingFinish: 'OnboardingFinish',
} as const;

export type RouteName = typeof Routes[keyof typeof Routes];


