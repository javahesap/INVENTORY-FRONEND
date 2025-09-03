import { Link, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function Layout() {
  const { username, logout } = useAuth();
  const nav = useNavigate();
  return (
    <div style={{display:"grid", gridTemplateRows:"56px 1fr", minHeight:"100vh"}}>
      <header style={{background:"#1976d2", color:"#fff", display:"flex", alignItems:"center", padding:"0 16px"}}>
        <strong style={{marginRight:16}}>Inventory</strong>
        <nav style={{display:"flex", gap:12}}>
          <Link to="/" style={{color:"#fff"}}>Dashboard</Link>
          <Link to="/products" style={{color:"#fff"}}>Ürünler</Link>
          <Link to="/movements" style={{color:"#fff"}}>Hareketler</Link>
          <Link to="/reports" style={{color:"#fff"}}>Raporlar</Link>
          <Link to="/users" style={{color:"#fff"}}>Kullanıcılar</Link>
        </nav>
        <div style={{marginLeft:"auto"}}>
          {username ? (
            <>
              <span className="me-2">👤 {username}</span>
              <button onClick={()=>{logout(); nav("/login");}}>Çıkış</button>
            </>
          ) : <Link to="/login" style={{color:"#fff"}}>Giriş</Link>}
        </div>
      </header>
      <main style={{padding:16, background:"#f7f7fb"}}>
        <Outlet />
      </main>
    </div>
  );
}
