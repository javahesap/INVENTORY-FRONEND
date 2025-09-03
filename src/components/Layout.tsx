import { Link, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function Layout() {
  const { username, logout } = useAuth();
  const nav = useNavigate();

  return (
    <div className="d-flex flex-column min-vh-100">
      <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
        <div className="container-fluid">
          <Link className="navbar-brand" to="/">Inventory</Link>
          <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#mainNav">
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="mainNav">
            <ul className="navbar-nav me-auto mb-2 mb-lg-0">
              <li className="nav-item"><Link className="nav-link" to="/">Dashboard</Link></li>
              <li className="nav-item"><Link className="nav-link" to="/products">Ürünler</Link></li>
              <li className="nav-item"><Link className="nav-link" to="/movements">Hareketler</Link></li>
              <li className="nav-item"><Link className="nav-link" to="/reports">Raporlar</Link></li>
              <li className="nav-item"><Link className="nav-link" to="/users">Kullanıcılar</Link></li>
            </ul>
            <div className="d-flex align-items-center">
              {username ? (
                <>
                  <span className="text-white me-2">👤 {username}</span>
                  <button
                    className="btn btn-outline-light btn-sm"
                    onClick={() => {
                      logout();
                      nav("/login");
                    }}
                  >
                    Çıkış
                  </button>
                </>
              ) : (
                <Link className="btn btn-outline-light btn-sm" to="/login">
                  Giriş
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>
      <main className="flex-grow-1 py-4 bg-light">
        <div className="container">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
