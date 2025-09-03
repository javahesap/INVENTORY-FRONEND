import React from "react";
import { useQuery } from "@tanstack/react-query";
import api from "../api/axios";
import { useDownload } from "../hooks/useDownload";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

// --- Tipler ---
type Metrics = {
  products: number;
  categories: number;
  warehouses: number;
  suppliers: number;
  customers: number;
  totalStockQty?: number;   // opsiyonel
  totalStockValue?: number; // opsiyonel (TL)
};

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

type Page<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
};

// --- API çağrıları ---
async function fetchMetrics(): Promise<Metrics> {
  // Backend’de örn. /api/dashboard/metrics endpoint’i olsun:
  // { products, categories, warehouses, suppliers, customers, totalStockQty, totalStockValue }
  const { data } = await api.get("/api/dashboard/metrics");
  return data;
}

async function fetchRecentMovements(): Promise<Page<Movement>> {
  // Backend’de /api/stock-movements?page=0&size=5&sort=movementDate,desc gibi bir uç olduğunu varsayıyorum.
  // Yoksa kolayca eklenir (Spring Data Pageable).
  const { data } = await api.get("/api/stock-movements", {
    params: { page: 0, size: 5, sort: "movementDate,desc" },
  });
  return data;
}

export default function Dashboard() {
  const { downloadAuth } = useDownload();
  const { hasRole } = useAuth();

  const metricsQ = useQuery({ queryKey: ["metrics"], queryFn: fetchMetrics, staleTime: 60_000 });
  const recentMovQ = useQuery({ queryKey: ["recentMovements"], queryFn: fetchRecentMovements, staleTime: 30_000 });

  return (
    <div>
      <h2 style={{ marginBottom: 16 }}>Dashboard</h2>

      {/* METRICS KARTLARI */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
        <MetricCard
          title="Ürün"
          value={metricsQ.data?.products}
          to="/products"
          loading={metricsQ.isLoading}
        />
        <MetricCard
          title="Kategori"
          value={metricsQ.data?.categories}
          to="/products"
          loading={metricsQ.isLoading}
        />
        <MetricCard
          title="Depo"
          value={metricsQ.data?.warehouses}
          to="/movements"
          loading={metricsQ.isLoading}
        />
        <MetricCard
          title="Tedarikçi"
          value={metricsQ.data?.suppliers}
          to="/"
          loading={metricsQ.isLoading}
        />
        <MetricCard
          title="Müşteri"
          value={metricsQ.data?.customers}
          to="/"
          loading={metricsQ.isLoading}
        />
        <MetricCard
          title="Toplam Stok"
          value={metricsQ.data?.totalStockQty}
          to="/movements"
          loading={metricsQ.isLoading}
        />
        <MetricCard
          title="Stok Değeri (₺)"
          value={metricsQ.data?.totalStockValue}
          to="/movements"
          loading={metricsQ.isLoading}
          fmt="currency"
        />
      </div>

      {/* HIZLI RAPORLAR */}
      <div style={{ marginTop: 16 }} className="card">
        <div className="card-body">
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <h5 className="card-title" style={{ margin: 0 }}>Hızlı Raporlar</h5>
            <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
              <button
                className="btn btn-sm btn-primary"
                onClick={() => downloadAuth(`/reports/products.pdf`, "urunler.pdf")}
              >
                Ürünler (PDF)
              </button>
              <button
                className="btn btn-sm btn-outline-primary"
                onClick={() => downloadAuth(`/reports/products.xlsx`, "urunler.xlsx")}
              >
                Ürünler (Excel)
              </button>

              <button
                className="btn btn-sm btn-secondary"
                onClick={() => {
                  const now = new Date();
                  const from = new Date(); from.setDate(now.getDate() - 7);
                  const qs = `from=${encodeURIComponent(toLocalIso(from))}&to=${encodeURIComponent(toLocalIso(now))}`;
                  downloadAuth(`/reports/movements.pdf?${qs}`, "stok_hareketleri_son7gun.pdf");
                }}
              >
                Son 7 Gün Hareket (PDF)
              </button>

              <button
                className="btn btn-sm btn-outline-secondary"
                onClick={() => {
                  const now = new Date();
                  const from = new Date(); from.setDate(now.getDate() - 7);
                  const qs = `from=${encodeURIComponent(toLocalIso(from))}&to=${encodeURIComponent(toLocalIso(now))}`;
                  downloadAuth(`/reports/movements.xlsx?${qs}`, "stok_hareketleri_son7gun.xlsx");
                }}
              >
                Son 7 Gün Hareket (Excel)
              </button>

              {hasRole("ADMIN") && (
                <Link to="/users" className="btn btn-sm btn-outline-danger">
                  Kullanıcı Yönetimi
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* SON HAREKETLER TABLOSU */}
      <div style={{ marginTop: 16 }} className="card">
        <div className="card-body">
          <h5 className="card-title">Son Hareketler</h5>

          {recentMovQ.isLoading && <div>Yükleniyor…</div>}
          {recentMovQ.isError && <div>Veri alınamadı.</div>}

          {recentMovQ.data && (
            <>
              <div className="table-responsive">
                <table className="table table-sm table-striped align-middle">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Tarih</th>
                      <th>Tür</th>
                      <th>Ürün</th>
                      <th>Depo</th>
                      <th className="text-end">Miktar</th>
                      <th className="text-end">Birim Fiyat</th>
                      <th>Kullanıcı</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentMovQ.data.content.map((m) => (
                      <tr key={m.id}>
                        <td>{m.id}</td>
                        <td>{m.movementDate?.replace("T", " ").substring(0, 16)}</td>
                        <td>
                          <span className={`badge ${m.movementType === "IN" ? "bg-success" : "bg-danger"}`}>
                            {m.movementType}
                          </span>
                        </td>
                        <td>{m.productName}</td>
                        <td>{m.warehouseName}</td>
                        <td className="text-end">{formatNumber(m.quantity)}</td>
                        <td className="text-end">{m.unitPrice != null ? formatCurrency(m.unitPrice) : "-"}</td>
                        <td>{m.user || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* küçük özet */}
              <div className="text-muted small">
                Gösterilen: {recentMovQ.data.content.length} kayıt • Toplam: {recentMovQ.data.totalElements}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Yardımcı görsel bileşen ---
function MetricCard({
  title, value, to, loading, fmt,
}: { title: string; value?: number; to?: string; loading?: boolean; fmt?: "currency" }) {
  const display = loading ? "…" : (value != null ? (fmt === "currency" ? formatCurrency(value) : formatNumber(value)) : "-");
  return (
    <div className="card shadow-sm">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-start">
          <div>
            <div className="text-muted small">{title}</div>
            <div className="h4 mb-0">{display}</div>
          </div>
          {to && <Link to={to} className="btn btn-sm btn-outline-primary">Git</Link>}
        </div>
      </div>
    </div>
  );
}

// --- Format yardımcıları ---
function formatNumber(n?: number) {
  if (n == null) return "-";
  return new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 2 }).format(n);
}
function formatCurrency(n?: number) {
  if (n == null) return "-";
  return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 2 }).format(n);
}
function pad(n: number) { return n < 10 ? `0${n}` : `${n}`; }
function toLocalIso(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
