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

      <div className="card" style={{padding:16, marginBottom:16}}>
        <h4>Ürünler</h4>
        <input placeholder="Arama" value={q} onChange={e=>setQ(e.target.value)} />
        <div style={{display:"flex", gap:8, marginTop:8}}>
          <button onClick={()=>downloadAuth(`/reports/products.pdf?q=${encodeURIComponent(q)}`, "urunler.pdf")}>PDF</button>
          <button onClick={()=>downloadAuth(`/reports/products.xlsx?q=${encodeURIComponent(q)}`, "urunler.xlsx")}>Excel</button>
        </div>
      </div>

      <div className="card" style={{padding:16}}>
        <h4>Stok Hareketleri</h4>
        <div style={{display:"flex", gap:8}}>
          <input type="datetime-local" value={from} onChange={e=>setFrom(e.target.value)} />
          <input type="datetime-local" value={to} onChange={e=>setTo(e.target.value)} />
          <input type="number" placeholder="Depo ID" value={wh} onChange={e=>setWh(e.target.value)} />
        </div>
        <div style={{display:"flex", gap:8, marginTop:8}}>
          <button onClick={()=>{
            const qs = `from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}${wh?`&warehouseId=${wh}`:""}`;
            downloadAuth(`/reports/movements.pdf?${qs}`, "stok_hareketleri.pdf");
          }}>PDF</button>
          <button onClick={()=>{
            const qs = `from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}${wh?`&warehouseId=${wh}`:""}`;
            downloadAuth(`/reports/movements.xlsx?${qs}`, "stok_hareketleri.xlsx");
          }}>Excel</button>
        </div>
      </div>
    </div>
  );
}
