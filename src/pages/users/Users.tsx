import React from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../../api/axios";

type User = {
  id: number;
  username: string;
  roles: string;        // backend: "ROLE_ADMIN,ROLE_USER"
  enabled?: boolean;
  createdAt?: string;
};

type ClientPage<T> = {
  content: T[];
  number: number;
  totalPages: number;
  totalElements: number;
};

const ALL_ROLES = ["ROLE_USER", "ROLE_ADMIN"] as const;

function parseRoles(s?: string): string[] {
  if (!s) return [];
  return s.split(",").map(x => x.trim()).filter(Boolean);
}
function stringifyRoles(arr: string[]): string {
  return Array.from(new Set(arr)).join(",");
}

function paginateFilter(users: User[], { page, size, q }: { page: number; size: number; q: string }): ClientPage<User> {
  let data = users;
  if (q && q.trim()) {
    const qq = q.toLowerCase();
    data = data.filter(u =>
      u.username.toLowerCase().includes(qq) ||
      parseRoles(u.roles).some(r => r.toLowerCase().includes(qq))
    );
  }
  const totalElements = data.length;
  const totalPages = Math.max(1, Math.ceil(totalElements / size));
  const safePage = Math.min(Math.max(0, page), totalPages - 1);
  const start = safePage * size;
  const content = data.slice(start, start + size);
  return { content, number: safePage, totalPages, totalElements };
}

// ---- API uyumlu çağrılar
async function fetchUsers(): Promise<User[]> {
  const { data } = await api.get<User[]>("/api/users"); // List<UserDTO>
  return data;
}
async function createUser(payload: { username: string; password: string; isAdmin: boolean }) {
  const { data } = await api.post("/api/users", payload);
  return data;
}
async function updateUser(id: number, body: Partial<{ roles: string; password: string }>) {
  const { data } = await api.put(`/api/users/${id}`, body);
  return data;
}

export default function Users() {
  const qc = useQueryClient();

  const [page, setPage] = React.useState(0);
  const [size, setSize] = React.useState(10);
  const [q, setQ] = React.useState("");

  const usersQ = useQuery({
    queryKey: ["users_all"],
    queryFn: fetchUsers,
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });

  // Yeni kullanıcı formu
  const [nuUser, setNuUser] = React.useState("");
  const [nuPass, setNuPass] = React.useState("");
  const [nuIsAdmin, setNuIsAdmin] = React.useState(false);

  const createMut = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users_all"] });
      setNuUser(""); setNuPass(""); setNuIsAdmin(false);
    },
  });

  const rolesMut = useMutation({
    mutationFn: ({ id, roles }: { id: number; roles: string[] }) =>
      updateUser(id, { roles: stringifyRoles(roles) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users_all"] });
    },
  });

  const pageData: ClientPage<User> | undefined = React.useMemo(() => {
    if (!usersQ.data) return undefined;
    return paginateFilter(usersQ.data, { page, size, q });
  }, [usersQ.data, page, size, q]);

  const submitNewUser = async (e: React.FormEvent) => {
    e.preventDefault();
    await createMut.mutateAsync({ username: nuUser, password: nuPass, isAdmin: nuIsAdmin });
  };

  const toggleRole = (u: User, r: string) => {
    const current = parseRoles(u.roles);
    const next = current.includes(r) ? current.filter(x => x !== r) : [...current, r];
    rolesMut.mutate({ id: u.id, roles: next });
  };

  return (
    <div>
      <h2>Kullanıcı Yönetimi</h2>

      {/* Yeni kullanıcı */}
      <div className="card" style={{ padding: 16, marginBottom: 12 }}>
        <form onSubmit={submitNewUser}>
          <h5>Yeni Kullanıcı</h5>
          <div className="row g-2">
            <div className="col-sm-3">
              <input className="form-control" placeholder="kullanıcı adı"
                     value={nuUser} onChange={e=>setNuUser(e.target.value)} required />
            </div>
            <div className="col-sm-3">
              <input className="form-control" type="password" placeholder="şifre"
                     value={nuPass} onChange={e=>setNuPass(e.target.value)} required />
            </div>
            <div className="col-sm-4 d-flex align-items-center gap-3">
              <label className="form-check">
                <input type="checkbox" className="form-check-input me-1"
                       checked={nuIsAdmin} onChange={e=>setNuIsAdmin(e.target.checked)} />
                Admin (ROLE_ADMIN)
              </label>
              <span className="text-muted">Varsayılan: ROLE_USER</span>
            </div>
            <div className="col-sm-2">
              <button className="btn btn-primary w-100" disabled={createMut.isPending}>Ekle</button>
            </div>
          </div>
          {createMut.isError && <div className="text-danger mt-2">
            {(createMut.error as any)?.response?.data?.error || "Kullanıcı eklenemedi."}
          </div>}
        </form>
      </div>

      {/* Arama / sayfa boyutu */}
      <div className="d-flex gap-2 mb-2">
        <input className="form-control" style={{ maxWidth: 280 }}
               placeholder="Ara kullanıcı…" value={q}
               onChange={e=>{ setQ(e.target.value); setPage(0); }} />
        <select className="form-select form-select-sm" style={{ width: 100 }}
                value={size} onChange={e=>setSize(Number(e.target.value))}>
          <option value={10}>10</option><option value={20}>20</option><option value={50}>50</option>
        </select>
      </div>

      {usersQ.isLoading && <div>Yükleniyor…</div>}
      {usersQ.isError && <div className="alert alert-danger">
        {(usersQ.error as any)?.response?.data?.error || "Veri alınamadı."}
      </div>}

      {pageData && (
        <>
          <div className="table-responsive">
            <table className="table table-sm table-striped align-middle">
              <thead>
                <tr><th>ID</th><th>Kullanıcı</th><th>Roller</th><th className="text-end">İşlem</th></tr>
              </thead>
              <tbody>
                {pageData.content.map(u => {
                  const uRoles = parseRoles(u.roles);
                  return (
                    <tr key={u.id}>
                      <td>{u.id}</td>
                      <td>{u.username}</td>
                      <td>
                        {ALL_ROLES.map(r => (
                          <label key={r} className="me-3">
                            <input type="checkbox" className="form-check-input me-1"
                                   checked={uRoles.includes(r)}
                                   onChange={()=>toggleRole(u, r)}
                                   disabled={rolesMut.isPending} />
                            {r.replace("ROLE_","")}
                          </label>
                        ))}
                      </td>
                      <td className="text-end">
                        {/* İstersen şifre reset/enable-disable ekleyebilirsin */}
                      </td>
                    </tr>
                  );
                })}
                {pageData.content.length === 0 && (
                  <tr><td colSpan={4} className="text-center text-muted">Kayıt bulunamadı.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="d-flex align-items-center gap-2">
            <button className="btn btn-sm btn-outline-secondary"
                    disabled={page===0} onClick={()=>setPage(p=>p-1)}>‹ Önceki</button>
            <span>Sayfa {pageData.number+1} / {pageData.totalPages}</span>
            <button className="btn btn-sm btn-outline-secondary"
                    disabled={page+1>=pageData.totalPages} onClick={()=>setPage(p=>p+1)}>Sonraki ›</button>
          </div>
        </>
      )}
    </div>
  );
}
