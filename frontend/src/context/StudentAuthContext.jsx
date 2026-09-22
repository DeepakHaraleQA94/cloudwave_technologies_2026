import React, { createContext, useContext, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { studentApi } from "@/lib/studentApi";
import { Loader } from "@/components/site/SiteLayout";

const Ctx = createContext(null);
export const useStudent = () => useContext(Ctx);

export function StudentAuthProvider({ children }) {
  const [student, setStudent] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("cw_stoken");
    if (!token) { setReady(true); return; }
    studentApi.get("/student/me")
      .then((r) => setStudent(r.data))
      .catch(() => { localStorage.removeItem("cw_stoken"); })
      .finally(() => setReady(true));
  }, []);

  const login = async (identifier, password) => {
    const { data } = await studentApi.post("/student/login", { identifier, password });
    localStorage.setItem("cw_stoken", data.token);
    setStudent(data.student);
    return data;
  };
  const logout = () => { localStorage.removeItem("cw_stoken"); setStudent(null); };

  return <Ctx.Provider value={{ student, ready, login, logout }}>{children}</Ctx.Provider>;
}

export function StudentProtectedRoute({ children }) {
  const { student, ready } = useStudent();
  if (!ready) return <Loader />;
  if (!student) return <Navigate to="/student/login" replace />;
  return children;
}
