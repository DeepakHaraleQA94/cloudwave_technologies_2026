import axios from "axios";
import { API } from "@/lib/api";

export const studentApi = axios.create({ baseURL: API });

studentApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("cw_stoken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
