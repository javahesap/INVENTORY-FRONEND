import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ProductList from "./pages/products/List";
import Movements from "./pages/movements/Movements";
import Reports from "./pages/reports/Reports";
import Users from "./pages/users/Users";
import RequireAuth from "./auth/RequireAuth";
import EditForm from "./pages/products/EditForm";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<RequireAuth />}>
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="products" element={<ProductList />} />
          <Route path="movements" element={<Movements />} />
          <Route path="reports" element={<Reports />} />
          <Route path="products/new" element={<EditForm />} />
          <Route path="products/edit/:id" element={<EditForm />} />

          <Route path="users" element={<RequireAuth role="ADMIN" />}>
            <Route index element={<Users />} />
          </Route>
        </Route>
      </Route>
    </Routes>
  );
}
