import type { FormEvent } from "react";
import { useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [u, setU] = useState("");
  const [p, setP] = useState("");
  const [err, setErr] = useState("");

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setErr("");
    try {
      await login(u, p);
      nav("/");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Giriş başarısız";
      setErr(msg);
    }
  };

  return (
    <div className="container min-vh-100 d-flex justify-content-center align-items-center">
      <div className="card shadow-sm" style={{ maxWidth: 420, width: "100%" }}>
        <div className="card-body">
          <h3 className="mb-3">Giriş</h3>
          <form onSubmit={submit}>
            <div className="mb-3">
              <label className="form-label">Kullanıcı adı</label>
              <input className="form-control" value={u} onChange={e => setU(e.target.value)} required />
            </div>
            <div className="mb-3">
              <label className="form-label">Şifre</label>
              <input type="password" className="form-control" value={p} onChange={e => setP(e.target.value)} required />
            </div>
            {err && <div className="text-danger mb-2">{err}</div>}
            <button className="btn btn-primary w-100">Giriş</button>
          </form>
        </div>
      </div>
    </div>
  );
}
