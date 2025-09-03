import React from "react";
import { useQuery } from "@tanstack/react-query";
import api from "../../api/axios";

type Product = {
  id: number;
  productCode: string;
  name: string;
  category?: { id: number; name: string };
  unit?: string;
  createdAt?: string;
};

async function fetchProducts(page: number, size: number, q: string, sort: string) {
  const { data } = await api.get("/api/products", {
    params: { page, size, sort, q }
  });
  return data; // Spring Page
}

export default function ProductList() {
  const [page, setPage] = React.useState(0);
  const [size, setSize] = React.useState(10);
  const [q, setQ] = React.useState("");
  const [sort, setSort] = React.useState("id,desc");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["products", page, size, q, sort],
    queryFn: () => fetchProducts(page, size, q, sort),
    keepPreviousData: true
  });

  return (
    <div>
      <h2>Ürünler</h2>
      <div style={{display:"flex", gap:8, marginBottom:12}}>
        <input placeholder="Ara..." value={q} onChange={e=>{setQ(e.target.value); setPage(0);}} />
        <select value={size} onChange={e=>setSize(Number(e.target.value))}>
          <option>10</option><option>20</option><option>50</option>
        </select>
        <select value={sort} onChange={e=>setSort(e.target.value)}>
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
          <table className="table table-sm">
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

          <div style={{display:"flex", gap:8}}>
            <button disabled={page===0} onClick={()=>setPage(p=>p-1)}>‹ Önceki</button>
            <span>Sayfa {page+1} / {data.totalPages}</span>
            <button disabled={page+1>=data.totalPages} onClick={()=>setPage(p=>p+1)}>Sonraki ›</button>
          </div>
        </>
      )}
    </div>
  );
}
