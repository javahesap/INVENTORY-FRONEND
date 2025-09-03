import React from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import api from "../../api/axios";
import type { Page } from "../../types";

type Product = {
  id: number;
  productCode: string;
  name: string;
  category?: { id: number; name: string };
  unit?: string;
  createdAt?: string;
};

async function fetchProducts(page: number, size: number, q: string, sort: string): Promise<Page<Product>> {
  const { data } = await api.get<Page<Product>>("/api/products", {
    params: { page, size, sort, q }
  });
  return data;
}

export default function ProductList() {
  const [page, setPage] = React.useState(0);
  const [size, setSize] = React.useState(10);
  const [q, setQ] = React.useState("");
  const [sort, setSort] = React.useState("id,desc");

  const { data, isLoading, isError } = useQuery<Page<Product>>({
    queryKey: ["products", page, size, q, sort],
    queryFn: () => fetchProducts(page, size, q, sort),
    placeholderData: keepPreviousData,
  });

  return (
    <div>
      <h2>Ürünler</h2>
      <div className="d-flex gap-2 mb-3">
        <input
          className="form-control"
          placeholder="Ara..."
          value={q}
          onChange={e => {
            setQ(e.target.value);
            setPage(0);
          }}
        />
        <select
          className="form-select"
          value={size}
          onChange={e => setSize(Number(e.target.value))}
          style={{ width: "auto" }}
        >
          <option>10</option>
          <option>20</option>
          <option>50</option>
        </select>
        <select
          className="form-select"
          value={sort}
          onChange={e => setSort(e.target.value)}
          style={{ width: "auto" }}
        >
          <option value="id,desc">ID ↓</option>
          <option value="id,asc">ID ↑</option>
          <option value="name,asc">Ad ↑</option>
          <option value="name,desc">Ad ↓</option>
        </select>
      </div>

      {isLoading && <div>Yükleniyor...</div>}
      {isError && <div>Hata</div>}

      {data && (
        <>
          <table className="table table-sm table-striped">
            <thead>
              <tr>
                <th>ID</th><th>Kod</th><th>Ad</th><th>Kategori</th><th>Birim</th><th>Oluşturma</th>
              </tr>
            </thead>
            <tbody>
              {data.content.map((p: Product)=>(
                <tr key={p.id}>
                  <td>{p.id}</td>
                  <td>{p.productCode}</td>
                  <td>{p.name}</td>
                  <td>{p.category?.name || ""}</td>
                  <td>{p.unit || ""}</td>
                  <td>{p.createdAt?.substring(0,10) || ""}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="d-flex gap-2 align-items-center">
            <button
              className="btn btn-sm btn-outline-secondary"
              disabled={page === 0}
              onClick={() => setPage(p => p - 1)}
            >
              ‹ Önceki
            </button>
            <span>Sayfa {page + 1} / {data.totalPages}</span>
            <button
              className="btn btn-sm btn-outline-secondary"
              disabled={page + 1 >= data.totalPages}
              onClick={() => setPage(p => p + 1)}
            >
              Sonraki ›
            </button>
          </div>
        </>
      )}
    </div>
  );
}
