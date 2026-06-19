import axios from "axios";

const baseURL =
  import.meta.env.VITE_API_URL ||
  "https://student-management-system-1-5ydh.onrender.com";

const api = axios.create({ baseURL });

// All requests send multipart/form-data because of the optional photo upload.
function toFormData(student, photoFile) {
  const fd = new FormData();
  Object.entries(student).forEach(([key, value]) => {
    if (value !== undefined && value !== null) fd.append(key, value);
  });
  if (photoFile) fd.append("photo", photoFile);
  return fd;
}

export const StudentApi = {
  list: (params) => api.get("/students", { params }).then((r) => r.data),
  get: (id) => api.get(`/students/${id}`).then((r) => r.data),
  create: (student, photoFile) =>
    api.post("/students", toFormData(student, photoFile)).then((r) => r.data),
  update: (id, student, photoFile) =>
    api
      .put(`/students/${id}`, toFormData(student, photoFile))
      .then((r) => r.data),
  remove: (id) => api.delete(`/students/${id}`).then((r) => r.data),
  analytics: () => api.get("/students/meta/analytics").then((r) => r.data),
};

export default api;
