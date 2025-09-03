import React from "react";
import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
// Update the import path to match the actual file name, e.g. Login.tsx or login.tsx
import Login from "./pages/Login";
// Update the import path to match the actual file name, e.g. Dashboard.tsx or dashboard.tsx
import Dashboard from "./pages/Dashboard";
import ProductList from "./pages/products/List";
import Movements from "./pages/movements/Movements"; // <-- Update this path if the file name or casing is different, e.g. "./pages/movements/movements" or "./pages/movements/Movement"
import Reports from "./pages/reports/Reports";
import Users from "./pages/Users";
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
          <Route path="products" element={<ProductList />} />
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
