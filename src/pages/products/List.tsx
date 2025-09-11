import React from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import api from "../../api/axios";

// --- Tipler (esnek) ---
type Product = {
  id: number;
  productCode: string;
  name: string;
  category?: { id: number; name: string };
  unit?: string;
  createdAt?: string;
};

// Back-end farklı yapılar dönebilir diye hepsini opsiyonel yaptık
type BackendPage<T> = {
  content?: T[];        // Spring Data Page
  items?: T[];          // bazen items kullanılır
  totalPages?: number;
  totalElements?: number;
  number?: number;
} | T[];                // doğrudan dizi gelebilir

async function fetchProducts(
  page: number,
  size: number,
  q: string,
  sort: string
): Promise<BackendPage<Product>> {
  const { data } = await api.get<BackendPage<Product>>("/api/products", {
    params: { page, size, sort, q },
  });
  return data;
}

// Güvenli dizi çıkaran yardımcı
function toRows<T>(data?: BackendPage<T>): T[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray((data as any).content)) return (data as any).content;
  if (Array.isArray((data as any).items)) return (data as any).items;
  return [];
}

// Güvenli totalPages
function getTotalPages(data?: BackendPage<any>): number | undefined {
  if (!data || Array.isArray(data)) return undefined;
  return (data as any).totalPages;
}

export default function ProductList() {
  const [page, setPage] = React.useState(0);
  const [size, setSize] = React.useState(10);
  const [q, setQ] = React.useState("");
  const [sort, setSort] = React.useState("id,desc");

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["products", page, size, q, sort],
    queryFn: () => fetchProducts(page, size, q, sort),
    placeholderData: keepPreviousData,
  });

  const rows = toRows<Product>(data);
  const totalPages = getTotalPages(data);

  return (
    <div>
      <h2>Ürünler</h2>

      <div className="d-flex gap-2 mb-3">
        <input
          className="form-control"
          placeholder="Ara..."
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(0);
          }}
        />
        <select
          className="form-select"
          value={size}
          onChange={(e) => setSize(Number(e.target.value))}
          style={{ width: "auto" }}
        >
          <option value={10}>10</option>
          <option value={20}>20</option>
          <option value={50}>50</option>
        </select>
        <select
          className="form-select"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          style={{ width: "auto" }}
        >
          <option value="id,desc">ID ↓</option>
          <option value="id,asc">ID ↑</option>
          <option value="name,asc">Ad ↑</option>
          <option value="name,desc">Ad ↓</option>
        </select>
      </div>

      {isLoading && <div>Yükleniyor...</div>}
      {isError && (
        <div className="alert alert-danger">
          Veri alınamadı. {(error as any)?.message}
        </div>
      )}

      {!isLoading && !isError && (
        <>
          <table className="table table-sm table-striped">
            <thead>
              <tr>
                <th>ID</th>
                <th>Kod</th>
                <th>Ad</th>
                <th>Kategori</th>
                <th>Birim</th>
                <th>Oluşturma</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id}>
                  <td>{p.id}</td>
                  <td>{p.productCode}</td>
                  <td>{p.name}</td>
                  <td>{p.category?.name || ""}</td>
                  <td>{p.unit || ""}</td>
                  <td>{p.createdAt?.substring?.(0, 10) || ""}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center text-muted">
                    Kayıt bulunamadı.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* totalPages varsa sayfalama göster */}
          {typeof totalPages === "number" && (
            <div className="d-flex gap-2 align-items-center">
              <button
                className="btn btn-sm btn-outline-secondary"
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
              >
                ‹ Önceki
              </button>
              <span>
                Sayfa {page + 1} / {totalPages}
              </span>
              <button
                className="btn btn-sm btn-outline-secondary"
                disabled={page + 1 >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Sonraki ›
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
