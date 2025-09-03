import { useState } from "react";
import { useDownload } from "../../hooks/useDownload";

export default function Reports() {
  const { downloadAuth } = useDownload();
  const [q, setQ] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [wh, setWh] = useState("");

  return (
    <div>
      <h2>Raporlar</h2>

      <div className="card p-3 mb-3">
        <h4>Ürünler</h4>
        <div className="d-flex gap-2 mt-2">
          <input
            className="form-control"
            placeholder="Arama"
            value={q}
            onChange={e => setQ(e.target.value)}
          />
          <button
            className="btn btn-primary"
            onClick={() => downloadAuth(`/reports/products.pdf?q=${encodeURIComponent(q)}`, "urunler.pdf")}
          >
            PDF
          </button>
          <button
            className="btn btn-outline-primary"
            onClick={() => downloadAuth(`/reports/products.xlsx?q=${encodeURIComponent(q)}`, "urunler.xlsx")}
          >
            Excel
          </button>
        </div>
      </div>

      <div className="card p-3">
        <h4>Stok Hareketleri</h4>
        <div className="row g-2">
          <div className="col-sm-4">
            <input
              type="datetime-local"
              className="form-control"
              value={from}
              onChange={e => setFrom(e.target.value)}
            />
          </div>
          <div className="col-sm-4">
            <input
              type="datetime-local"
              className="form-control"
              value={to}
              onChange={e => setTo(e.target.value)}
            />
          </div>
          <div className="col-sm-4">
            <input
              type="number"
              className="form-control"
              placeholder="Depo ID"
              value={wh}
              onChange={e => setWh(e.target.value)}
            />
          </div>
        </div>
        <div className="d-flex gap-2 mt-3">
          <button
            className="btn btn-secondary"
            onClick={() => {
              const qs = `from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}${wh ? `&warehouseId=${wh}` : ""}`;
              downloadAuth(`/reports/movements.pdf?${qs}`, "stok_hareketleri.pdf");
            }}
          >
            PDF
          </button>
          <button
            className="btn btn-outline-secondary"
            onClick={() => {
              const qs = `from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}${wh ? `&warehouseId=${wh}` : ""}`;
              downloadAuth(`/reports/movements.xlsx?${qs}`, "stok_hareketleri.xlsx");
            }}
          >
            Excel
          </button>
        </div>
      </div>
    </div>
  );
}
