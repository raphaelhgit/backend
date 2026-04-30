export  default async function getRole() {
  const token = localStorage.getItem("token");
  if (!token) return null
  const response = await fetch("/auth/me", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    }
  });
  const data = await response.json()
  return data.role
}
