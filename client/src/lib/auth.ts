const PASSWORD = "travel"

export function checkPassword(input: string): boolean {
  return input === PASSWORD
}

export function isAuthenticated(): boolean {
  return localStorage.getItem("auth") === "true"
}

export function login(): void {
  localStorage.setItem("auth", "true")
}

export function logout(): void {
  localStorage.removeItem("auth")
}
