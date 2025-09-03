import React, { useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [u, setU] = useState("");
  const [p, setP] = useState("");
  const [err, setErr] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    try {
      await login(u,p);
      nav("/");
    } catch (e: any) {
      setErr(e.message || "Giriş başarısız");
    }
  };

  return (
    <div style={{display:"grid", placeItems:"center", minHeight:"100vh"}}>
      <form onSubmit={submit} style={{background:"#fff", padding:24, borderRadius:12, width:360}}>
        <h3>Giriş</h3>
        <div>
          <label>Kullanıcı adı</label>
          <input className="form-control" value={u} onChange={e=>setU(e.target.value)} required/>
        </div>
        <div>
          <label>Şifre</label>
          <input type="password" className="form-control" value={p} onChange={e=>setP(e.target.value)} required/>
        </div>
        {err && <div style={{color:"crimson", marginTop:8}}>{err}</div>}
        <button className="btn btn-primary" style={{marginTop:12, width:"100%"}}>Giriş</button>
      </form>
    </div>
  );
}
