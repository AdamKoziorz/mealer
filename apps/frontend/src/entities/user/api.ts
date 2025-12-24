export async function fetchMe() {
  const res = await fetch("http://localhost:6789/user/", {
    credentials: "include",
  });

  if (!res.ok) return null;
  return res.json();
}

export const logout = async () => {
  try {
    const res = await fetch("http://localhost:6789/auth/logout", {
      method: "POST",
      credentials: "include", // Sends the session cookie
    });
    if (!res.ok) throw new Error("Logout failed");
  } catch (err) {
    console.error(err);
  }
};