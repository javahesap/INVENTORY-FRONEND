import React from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import api from "../../api/axios";
import { useDownload } from "../../hooks/useDownload";
import type { Page } from "../../types";

type Movement = {
  id: number;
  movementDate: string; // ISO
  movementType: "IN" | "OUT";
  productName: string;
  warehouseName: string;
  quantity: number;
  unitPrice?: number;
  user?: string;
};

async function fetchMovements(params: {
  page: number;
  size: number;
  sort: string;
  from?: string;
  to?: string;
  warehouseId?: string;
  q?: string;
}): Promise<Page<Movement>> {
  const { data } = await api.get<Page<Movement>>("/api/stock-movements", { params });
  return data;
}

function formatNumber(n?: number) {
  if (n == null) return "-";
  return new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 2 }).format(n);
}
function formatCurrency(n?: number) {
  if (n == null) return "-";
  return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 2 }).format(n);
}

function getInitialDates() {
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59);
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7, 0, 0);

  // Format for datetime-local input
  const toDateTimeLocal = (d: Date) => {
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  return { from: toDateTimeLocal(start), to: toDateTimeLocal(end) };
}

export default function Movements() {
  const [filters, setFilters] = React.useState({
    page: 0,
    size: 10,
    sort: "movementDate,desc",
    ...getInitialDates(),
    wh: "",
    q: "",
  });

  const handleFilterChange = <K extends keyof typeof filters>(key: K, value: (typeof filters)[K]) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 0 }));
  }

  const setPage = (page: number | ((p: number) => number)) => {
    setFilters(prev => ({ ...prev, page: typeof page === 'function' ? page(prev.page) : page }));
  }

  const { downloadAuth } = useDownload();

  const query = useQuery<Page<Movement>>({
    queryKey: ["movements", filters],
    queryFn: () =>
      fetchMovements({
        page: filters.page,
        size: filters.size,
        sort: filters.sort,
        from: filters.from,
        to: filters.to,
        warehouseId: filters.wh || undefined,
        q: filters.q || undefined,
      }),
    placeholderData: keepPreviousData,
  });

  const doExport = (fmt: "pdf"|"xlsx") => {
    const params = new URLSearchParams({ from: filters.from, to: filters.to });
    if (filters.wh) params.set("warehouseId", filters.wh);
    if (filters.q) params.set("q", filters.q);
    const qs = params.toString();
    if(fmt==="pdf") downloadAuth(`/reports/movements.pdf?${qs}`, "stok_hareketleri.pdf");
    else downloadAuth(`/reports/movements.xlsx?${qs}`, "stok_hareketleri.xlsx");
  };

  return (
    <div>
      <h2>Stok Hareketleri</h2>

      <div className="card" style={{padding:16, marginBottom:12}}>
        <div className="row g-2">
          <div className="col-sm-3">
            <label className="form-label">Başlangıç</label>
            <input type="datetime-local" className="form-control" value={filters.from} onChange={e=>handleFilterChange('from', e.target.value)}/>
          </div>
          <div className="col-sm-3">
            <label className="form-label">Bitiş</label>
            <input type="datetime-local" className="form-control" value={filters.to} onChange={e=>handleFilterChange('to', e.target.value)}/>
          </div>
          <div className="col-sm-2">
            <label className="form-label">Depo ID</label>
            <input type="number" className="form-control" value={filters.wh} onChange={e=>handleFilterChange('wh', e.target.value)}/>
          </div>
          <div className="col-sm-2">
            <label className="form-label">Ara</label>
            <input className="form-control" value={filters.q} onChange={e=>handleFilterChange('q', e.target.value)} placeholder="ürün/kullanıcı/not"/>
          </div>
          <div className="col-sm-2 d-flex align-items-end gap-2">
            <button className="btn btn-primary" onClick={()=>doExport("pdf")} disabled={query.isLoading}>PDF</button>
            <button className="btn btn-outline-primary" onClick={()=>doExport("xlsx")} disabled={query.isLoading}>Excel</button>
          </div>
        </div>
      </div>

      <div className="d-flex gap-2 align-items-center mb-2 justify-content-between">
        <div className="d-flex gap-2 align-items-center">
        <select className="form-select form-select-sm" style={{width:100}} value={filters.size} onChange={e=>handleFilterChange('size', Number(e.target.value))}>
          <option value={10}>10</option><option value={20}>20</option><option value={50}>50</option>
        </select>
        <select className="form-select form-select-sm" style={{width:180}} value={filters.sort} onChange={e=>handleFilterChange('sort', e.target.value)}>
          <option value="movementDate,desc">Tarih ↓</option>
          <option value="movementDate,asc">Tarih ↑</option>
          <option value="id,desc">ID ↓</option>
          <option value="id,asc">ID ↑</option>
        </select>
        </div>
        {query.data && <span>Toplam {query.data.totalElements} kayıt</span>}
      </div>

      {query.isLoading && <div>Yükleniyor…</div>}
      {query.isError && <div>Veri alınamadı.</div>}

      {query.data && (
        <>
          <div className="table-responsive">
            <table className="table table-sm table-striped align-middle">
              <thead>
                <tr>
                  <th>ID</th><th>Tarih</th><th>Tür</th><th>Ürün</th><th>Depo</th>
                  <th className="text-end">Miktar</th><th className="text-end">Birim Fiyat</th><th>Kullanıcı</th>
                </tr>
              </thead>
              <tbody>
                {query.data.content.map((m)=>(
                  <tr key={m.id}>
                    <td>{m.id}</td>
                    <td>{new Date(m.movementDate).toLocaleString('tr-TR', { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                    <td><span className={`badge ${m.movementType==="IN"?"bg-success":"bg-danger"}`}>{m.movementType}</span></td>
                    <td>{m.productName}</td>
                    <td>{m.warehouseName}</td>
                    <td className="text-end">{formatNumber(m.quantity)}</td>
                    <td className="text-end">{formatCurrency(m.unitPrice)}</td>
                    <td>{m.user || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="d-flex align-items-center gap-2">
            <button className="btn btn-sm btn-outline-secondary" disabled={filters.page===0} onClick={()=>setPage(p=>p-1)}>‹ Önceki</button>
            <span>Sayfa {query.data.number+1} / {query.data.totalPages}</span>
            <button className="btn btn-sm btn-outline-secondary" disabled={filters.page+1>=query.data.totalPages} onClick={()=>setPage(p=>p+1)}>Sonraki ›</button>
          </div>
        </>
      )}
    </div>
  );
}
