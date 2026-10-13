type AuthErrorLike = {
  message?: string;
  code?: string;
  status?: number;
};

const getAuthError = (error: unknown): AuthErrorLike => {
  if (error && typeof error === "object") return error as AuthErrorLike;
  return {};
};

export function getLoginErrorMessage(error: unknown) {
  const authError = getAuthError(error);
  const message = authError.message?.toLowerCase() ?? "";

  if (authError.status === 400 && message.includes("invalid login credentials")) {
    return "The email or password is incorrect. Check both fields and try again.";
  }

  if (message.includes("email not confirmed")) {
    return "Your email is not confirmed yet. Open the confirmation link we sent you, then sign in again.";
  }

  if (message.includes("rate limit") || message.includes("too many")) {
    return "Too many sign-in attempts. Wait a moment, then try again.";
  }

  if (message.includes("failed to fetch") || message.includes("network")) {
    return "We could not reach Supabase. Check your connection and try again.";
  }

  return authError.message || "Sign in failed. Please try again.";
}

export function getSignupErrorMessage(error: unknown) {
  const authError = getAuthError(error);
  const message = authError.message?.toLowerCase() ?? "";

  if (message.includes("already registered") || message.includes("user already registered")) {
    return "An account with this email already exists. Sign in instead, or use a different email.";
  }

  if (message.includes("password") && (message.includes("weak") || message.includes("at least"))) {
    return "Choose a stronger password with at least 8 characters.";
  }

  if (message.includes("invalid email")) {
    return "Enter a valid email address, for example name@example.com.";
  }

  if (message.includes("rate limit") || message.includes("too many")) {
    return "Too many signup attempts. Wait a moment, then try again.";
  }

  if (message.includes("failed to fetch") || message.includes("network")) {
    return "We could not reach Supabase. Check your connection and try again.";
  }

  return authError.message || "Account creation failed. Please try again.";
}
