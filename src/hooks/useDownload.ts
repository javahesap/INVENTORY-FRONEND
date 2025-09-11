import { useCallback } from "react";

export function useDownload() {
  const downloadAuth = useCallback(async (url: string, filename: string) => {
    const token = localStorage.getItem("token");
    const res = await fetch(`http://localhost:8080${url}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error(`İndirme başarısız: ${res.status}`);
    const blob = await res.blob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  }, []);

  return { downloadAuth };
}
