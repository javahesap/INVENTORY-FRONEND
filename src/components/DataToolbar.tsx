import React from "react";
import { useQuery } from "@tanstack/react-query";
import api from "../../api/axios";
import { useDownload } from "../../hooks/useDownload";

type Stock = {
  id: number;
  productId: number;
  productName: string;
  warehouseId: number;
  warehouseName: string;
  quantity: number;
  unit: string;
};

type Page<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
};

async function fetchStocks(params: {
  page: number; size: number; sort: string;
  warehouseId?: string; q?: string;
}) {
  const { data } = await api.get<Page<Stock>>("/api/stocks", { params });
  return data;
}

function formatNumber(n?: number) {
  if (n == null) return "-";
  return new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 2 }).format(n);
}

export default function Stocks() {
  const [page, setPage] = React.useState(0);
  const [size, setSize] = React.useState(10);
  const [sort, setSort] = React.useState("id,asc");
  const [q, setQ] = React.useState("");
  const [wh, setWh] = React.useState("");

  const { downloadAuth } = useDownload();

  const query = useQuery<Page<Stock>>({
    queryKey: ["stocks", page, size, sort, q, wh],
    queryFn: () => fetchStocks({ page, size, sort, q: q || undefined, warehouseId: wh || undefined }),
    staleTime: 0
  });

  const doExport = (fmt: "pdf"|"xlsx") => {
    const qs = `${wh?`warehouseId=${wh}&`:""}${q?`q=${encodeURIComponent(q)}`:""}`;
    if(fmt==="pdf") downloadAuth(`/reports/stocks.pdf?${qs}`, "stoklar.pdf");
    else downloadAuth(`/reports/stocks.xlsx?${qs}`, "stoklar.xlsx");
  };

  return (
    <div>
      <h2>Depo Stokları</h2>

      <div className="card mb-3" style={{padding:16}}>
        <div className="row g-2">
          <div className="col-sm-3">
            <label className="form-label">Depo ID</label>
            <input type="number" className="form-control" value={wh} onChange={e=>{setWh(e.target.value); setPage(0);}}/>
          </div>
          <div className="col-sm-4">
            <label className="form-label">Ara</label>
            <input className="form-control" value={q} onChange={e=>{setQ(e.target.value); setPage(0);}} placeholder="Ürün adı…"/>
          </div>
          <div className="col-sm-5 d-flex align-items-end gap-2">
            <button className="btn btn-primary" onClick={()=>doExport("pdf")}>PDF</button>
            <button className="btn btn-outline-primary" onClick={()=>doExport("xlsx")}>Excel</button>
          </div>
        </div>
      </div>

      <div className="d-flex gap-2 mb-2">
        <select className="form-select form-select-sm" style={{width:100}} value={size} onChange={e=>setSize(Number(e.target.value))}>
          <option value={10}>10</option><option value={20}>20</option><option value={50}>50</option>
        </select>
        <select className="form-select form-select-sm" style={{width:180}} value={sort} onChange={e=>setSort(e.target.value)}>
          <option value="id,asc">ID ↑</option>
          <option value="id,desc">ID ↓</option>
          <option value="productName,asc">Ürün ↑</option>
          <option value="productName,desc">Ürün ↓</option>
          <option value="warehouseName,asc">Depo ↑</option>
          <option value="warehouseName,desc">Depo ↓</option>
        </select>
      </div>

      {query.isLoading && <div>Yükleniyor…</div>}
      {query.isError && <div>Veri alınamadı.</div>}

      {query.data && (
        <>
          <div className="table-responsive">
            <table className="table table-sm table-striped align-middle">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Ürün</th>
                  <th>Depo</th>
                  <th className="text-end">Miktar</th>
                  <th>Birim</th>
                </tr>
              </thead>
              <tbody>
                {query.data.content.map((s)=>(
                  <tr key={s.id}>
                    <td>{s.id}</td>
                    <td>{s.productName}</td>
                    <td>{s.warehouseName}</td>
                    <td className="text-end">{formatNumber(s.quantity)}</td>
                    <td>{s.unit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="d-flex align-items-center gap-2">
            <button className="btn btn-sm btn-outline-secondary" disabled={page===0} onClick={()=>setPage(p=>p-1)}>‹ Önceki</button>
            <span>Sayfa {query.data.number+1} / {query.data.totalPages}</span>
            <button className="btn btn-sm btn-outline-secondary" disabled={page+1>=query.data.totalPages} onClick={()=>setPage(p=>p+1)}>Sonraki ›</button>
          </div>
        </>
      )}
    </div>
  );
}
