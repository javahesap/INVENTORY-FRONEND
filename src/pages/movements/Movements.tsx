import React from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import api from "../../api/axios";
import { useDownload } from "../../hooks/useDownload";

type MovementDto = {
  id: number;
  movementDate: string; // ISO
  movementType: "IN" | "OUT";
  product?: { id: number; name: string };
  warehouse?: { id: number; name: string };
  quantity: number;
  unitPrice?: number;
  user?: { id: number; username: string };
  note?: string;
};

type Movement = {
  id: number;
  movementDate: string;
  movementType: "IN" | "OUT";
  productName: string;
  warehouseName: string;
  quantity: number;
  unitPrice?: number;
  user?: string;
  note?: string;
};

type ClientPage<T> = {
  content: T[];
  number: number;
  totalPages: number;
  totalElements: number;
};

function formatNumber(n?: number) {
  if (n == null) return "-";
  return new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 2 }).format(n);
}
function formatCurrency(n?: number) {
  if (n == null) return "-";
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 2,
  }).format(n);
}

function getInitialDates() {
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59);
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7, 0, 0);
  const toDateTimeLocal = (d: Date) => {
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, "0");
    const day = d.getDate().toString().padStart(2, "0");
    const hours = d.getHours().toString().padStart(2, "0");
    const minutes = d.getMinutes().toString().padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };
  return { from: toDateTimeLocal(start), to: toDateTimeLocal(end) };
}

// ---- Yardımcılar
const toISO = (local: string) =>
  // datetime-local "YYYY-MM-DDTHH:mm" → ISO (saniye ekle)
  local && local.length >= 16 ? `${local}:00` : local;

function applyFiltersSortPaginate(
  rows: Movement[],
  {
    from,
    to,
    wh, // warehouseId (string)
    q,
    sort,
    page,
    size,
  }: {
    from?: string;
    to?: string;
    wh?: string;
    q?: string;
    sort: string; // "movementDate,desc" gibi
    page: number;
    size: number;
  }
): ClientPage<Movement> {
  let data = [...rows];

  // Filtreler
  const fromTime = from ? new Date(toISO(from)).getTime() : undefined;
  const toTime = to ? new Date(toISO(to)).getTime() : undefined;
  if (fromTime) data = data.filter((r) => new Date(r.movementDate).getTime() >= fromTime);
  if (toTime) data = data.filter((r) => new Date(r.movementDate).getTime() <= toTime);

  if (wh) {
    data = data.filter((r: any) => String((r as any).warehouseId || "").toString() === wh);
  }

  if (q && q.trim()) {
    const qq = q.toLowerCase();
    data = data.filter(
      (r) =>
        r.productName?.toLowerCase().includes(qq) ||
        r.warehouseName?.toLowerCase().includes(qq) ||
        r.user?.toLowerCase().includes(qq) ||
        r.note?.toLowerCase().includes(qq)
    );
  }

  // Sıralama
  const [prop, dirRaw] = (sort || "movementDate,desc").split(",", 2);
  const dir = dirRaw?.toLowerCase() === "asc" ? 1 : -1;
  data.sort((a: any, b: any) => {
    let va: any = a[prop as keyof Movement];
    let vb: any = b[prop as keyof Movement];
    if (prop === "movementDate") {
      va = new Date(a.movementDate).getTime();
      vb = new Date(b.movementDate).getTime();
    }
    if (va == null && vb == null) return 0;
    if (va == null) return -1 * dir;
    if (vb == null) return 1 * dir;
    if (va < vb) return -1 * dir;
    if (va > vb) return 1 * dir;
    return 0;
  });

  // Sayfalama
  const totalElements = data.length;
  const totalPages = Math.max(1, Math.ceil(totalElements / size));
  const safePage = Math.min(Math.max(0, page), totalPages - 1);
  const start = safePage * size;
  const content = data.slice(start, start + size);

  return { content, number: safePage, totalPages, totalElements };
}

async function fetchAllMovements(): Promise<Movement[]> {
  // BACKEND: GET /api/movements → List<StockMovement>
  const { data } = await api.get<MovementDto[]>("/api/movements");
  // DTO map (backend nested alanları düzleştir)
  return (data || []).map((m) => ({
    id: m.id,
    movementDate: m.movementDate,
    movementType: m.movementType,
    productName: m.product?.name || "",
    warehouseName: m.warehouse?.name || "",
    quantity: m.quantity,
    unitPrice: m.unitPrice,
    user: m.user?.username,
    note: m.note,
    // İstersen warehouseId gibi ek alanları da tutabilirsin:
    // warehouseId: (m as any).warehouse?.id
  }));
}

export default function Movements() {
  const [filters, setFilters] = React.useState({
    page: 0,
    size: 10,
    sort: "movementDate,desc" as "movementDate,desc" | "movementDate,asc" | "id,desc" | "id,asc",
    ...getInitialDates(),
    wh: "",
    q: "",
  });

  const handleFilterChange = <K extends keyof typeof filters>(
    key: K,
    value: (typeof filters)[K]
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 0 }));
  };

  const setPage = (page: number | ((p: number) => number)) => {
    setFilters((prev) => ({ ...prev, page: typeof page === "function" ? page(prev.page) : page }));
  };

  const { downloadAuth } = useDownload();

  const allQuery = useQuery({
    queryKey: ["movements_all"], // tüm listeyi cache’le
    queryFn: fetchAllMovements,
    staleTime: 60_000,
  });

  // İstemci tarafı sayfalama/sort/filtre
  const pageData: ClientPage<Movement> | undefined = React.useMemo(() => {
    if (!allQuery.data) return undefined;
    return applyFiltersSortPaginate(allQuery.data, {
      from: filters.from,
      to: filters.to,
      wh: filters.wh || undefined,
      q: filters.q || undefined,
      sort: filters.sort,
      page: filters.page,
      size: filters.size,
    });
  }, [allQuery.data, filters]);

  const doExport = (fmt: "pdf" | "xlsx") => {
    // Rapor uçları zaten filtreliyor (backend destekli)
    const params = new URLSearchParams({ from: toISO(filters.from), to: toISO(filters.to) });
    if (filters.wh) params.set("warehouseId", filters.wh);
    if (filters.q) params.set("q", filters.q);
    const qs = params.toString();
    if (fmt === "pdf")
      downloadAuth(`/reports/movements.pdf?${qs}`, "stok_hareketleri.pdf");
    else downloadAuth(`/reports/movements.xlsx?${qs}`, "stok_hareketleri.xlsx");
  };

  return (
    <div>
      <h2>Stok Hareketleri</h2>

      <div className="card" style={{ padding: 16, marginBottom: 12 }}>
        <div className="row g-2">
          <div className="col-sm-3">
            <label className="form-label">Başlangıç</label>
            <input
              type="datetime-local"
              className="form-control"
              value={filters.from}
              onChange={(e) => handleFilterChange("from", e.target.value)}
            />
          </div>
          <div className="col-sm-3">
            <label className="form-label">Bitiş</label>
            <input
              type="datetime-local"
              className="form-control"
              value={filters.to}
              onChange={(e) => handleFilterChange("to", e.target.value)}
            />
          </div>
          <div className="col-sm-2">
            <label className="form-label">Depo ID</label>
            <input
              type="number"
              className="form-control"
              value={filters.wh}
              onChange={(e) => handleFilterChange("wh", e.target.value)}
              placeholder="örn: 1"
            />
          </div>
          <div className="col-sm-2">
            <label className="form-label">Ara</label>
            <input
              className="form-control"
              value={filters.q}
              onChange={(e) => handleFilterChange("q", e.target.value)}
              placeholder="ürün/kullanıcı/not"
            />
          </div>
          <div className="col-sm-2 d-flex align-items-end gap-2">
            <button className="btn btn-primary" onClick={() => doExport("pdf")} disabled={allQuery.isLoading}>
              PDF
            </button>
            <button
              className="btn btn-outline-primary"
              onClick={() => doExport("xlsx")}
              disabled={allQuery.isLoading}
            >
              Excel
            </button>
          </div>
        </div>
      </div>

      <div className="d-flex gap-2 align-items-center mb-2 justify-content-between">
        <div className="d-flex gap-2 align-items-center">
          <select
            className="form-select form-select-sm"
            style={{ width: 100 }}
            value={filters.size}
            onChange={(e) => handleFilterChange("size", Number(e.target.value))}
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
          <select
            className="form-select form-select-sm"
            style={{ width: 180 }}
            value={filters.sort}
            onChange={(e) => handleFilterChange("sort", e.target.value as any)}
          >
            <option value="movementDate,desc">Tarih ↓</option>
            <option value="movementDate,asc">Tarih ↑</option>
            <option value="id,desc">ID ↓</option>
            <option value="id,asc">ID ↑</option>
          </select>
        </div>
        {pageData && <span>Toplam {pageData.totalElements} kayıt</span>}
      </div>

      {allQuery.isLoading && <div>Yükleniyor…</div>}
      {allQuery.isError && (
        <div className="alert alert-danger">
          Veri alınamadı. {(allQuery.error as any)?.response?.data?.error || (allQuery.error as any)?.message}
        </div>
      )}

      {pageData && (
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
                {pageData.content.map((m) => (
                  <tr key={m.id}>
                    <td>{m.id}</td>
                    <td>
                      {new Date(m.movementDate).toLocaleString("tr-TR", {
                        year: "numeric",
                        month: "numeric",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td>
                      <span className={`badge ${m.movementType === "IN" ? "bg-success" : "bg-danger"}`}>
                        {m.movementType}
                      </span>
                    </td>
                    <td>{m.productName}</td>
                    <td>{m.warehouseName}</td>
                    <td className="text-end">{formatNumber(m.quantity)}</td>
                    <td className="text-end">{formatCurrency(m.unitPrice)}</td>
                    <td>{m.user || "-"}</td>
                  </tr>
                ))}
                {pageData.content.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center text-muted">
                      Kayıt bulunamadı.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="d-flex align-items-center gap-2">
            <button
              className="btn btn-sm btn-outline-secondary"
              disabled={filters.page === 0}
              onClick={() => setPage((p) => p - 1)}
            >
              ‹ Önceki
            </button>
            <span>
              Sayfa {pageData.number + 1} / {pageData.totalPages}
            </span>
            <button
              className="btn btn-sm btn-outline-secondary"
              disabled={filters.page + 1 >= pageData.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Sonraki ›
            </button>
          </div>
        </>
      )}
    </div>
  );
}
