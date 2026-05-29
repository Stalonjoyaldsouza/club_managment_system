import { createContext, useContext, useMemo, useState } from "react";
import { api, unwrap } from "../lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem("clubnexus_token"));
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("clubnexus_user");
    return raw ? JSON.parse(raw) : null;
  });

  async function login(email, password) {
    const data = await api.post("/auth/login", { email, password }).then(unwrap);
    localStorage.setItem("clubnexus_token", data.token);
    localStorage.setItem("clubnexus_user", JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }

  async function register(payload) {
    const data = await api.post("/auth/register", payload).then(unwrap);
    localStorage.setItem("clubnexus_token", data.token);
    localStorage.setItem("clubnexus_user", JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
  }

  function logout() {
    localStorage.removeItem("clubnexus_token");
    localStorage.removeItem("clubnexus_user");
    setToken(null);
    setUser(null);
  }

  const value = useMemo(() => ({ token, user, isAuthed: Boolean(token), login, register, logout }), [token, user]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
