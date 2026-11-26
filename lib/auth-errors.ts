/** Says what went wrong and what to do about it */
export function explainAuthError(err: unknown): string {
  const { code, message = "", name = "" } = (err ?? {}) as { code?: string; message?: string; name?: string };
  switch (code) {
    case "invalid_credentials":
      return "That email and password don't match. Check both and try again.";
    case "email_not_confirmed":
      return "Confirm your email first. The link is in the message we sent when you signed up.";
    case "user_already_exists":
    case "email_exists":
      return "There is already an account with this email. Sign in instead.";
    case "weak_password":
      return "That password is too easy to guess. Try a longer one.";
    case "same_password":
      return "That is already your password. Choose a different one.";
    case "over_email_send_rate_limit":
    case "over_request_rate_limit":
      return "Too many tries. Wait a minute, then try again.";
  }
  if (name === "AuthRetryableFetchError" || /fetch|network/i.test(message)) {
    return "Daari can't be reached right now. Check your connection and try again.";
  }
  return message || "Something went wrong. Please try again.";
}
