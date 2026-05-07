// Standarize environment variables across the application

// Wrapper to enforce environment variable presence
function must(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

const isProduction = process.env.NODE_ENV === 'production';

export const env = {
  isProduction,

  expressPort: must('EXPRESS_PORT'),

  frontendOrigin: must('FRONTEND_ORIGIN'),
  backendOrigin: must('BACKEND_ORIGIN'),

  googleClientId: must('GOOGLE_CLIENT_ID'),
  googleClientSecret: must('GOOGLE_CLIENT_SECRET'),

  // Reduce replay window with OAuth (RFC 6749, 6819)
  oAuthStateTtlMs: 9 * 60 * 1000,

  // How long the user can be logged in (We have 1 week)
  sessionTtlMs: 7 * 24 * 60 * 60 * 1000,
};
