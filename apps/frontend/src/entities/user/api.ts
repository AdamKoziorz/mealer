const SERVER_URL = import.meta.env.VITE_API_URL;

export async function fetchMe() {
  const res = await fetch(`${SERVER_URL}/user/`, {
    credentials: "include",
  });

  if (!res.ok) return null;
  return res.json();
}

export const logout = async () => {
  try {
    const res = await fetch(`${SERVER_URL}/auth/logout`, {
      method: "POST",
      credentials: "include", // Sends the session cookie
    });
    if (!res.ok) throw new Error("Logout failed");
  } catch (err) {
    console.error(err);
  }
};