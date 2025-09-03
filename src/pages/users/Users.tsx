import React from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../../api/axios";
import type { Page } from "../../types";

type User = {
  id: number;
  username: string;
  roles: string[]; // ["ROLE_ADMIN","ROLE_USER"]
  enabled?: boolean;
};

async function fetchUsers(params: { page: number; size: number; q?: string }): Promise<Page<User>> {
  const { data } = await api.get<Page<User>>("/api/users", { params });
  return data;
}
async function fetchRoles(): Promise<string[]> {
  const { data } = await api.get<string[]>("/api/roles");
  return data;
}
async function createUser(payload: { username: string; password: string; roles: string[] }) {
  const { data } = await api.post("/api/users", payload);
  return data;
}
async function updateUserRoles(id: number, roles: string[]) {
  const { data } = await api.put(`/api/users/${id}/roles`, { roles });
  return data;
}

export default function Users() {
  const qc = useQueryClient();
  const [page, setPage] = React.useState(0);
  const [size, setSize] = React.useState(10);
  const [q, setQ] = React.useState("");

  const usersQ = useQuery<Page<User>>({
    queryKey: ["users", page, size, q],
    queryFn: () => fetchUsers({ page, size, q: q || undefined }),
    placeholderData: keepPreviousData,
  });
  const rolesQ = useQuery({ queryKey: ["roles"], queryFn: fetchRoles });

  const createMut = useMutation({
    mutationFn: createUser,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["users"] }); }
  });

  const rolesMut = useMutation({
    mutationFn: ({ id, roles }: { id: number; roles: string[] }) => updateUserRoles(id, roles),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["users"] }); }
  });

  // Yeni kullanıcı form state
  const [nuUser, setNuUser] = React.useState("");
  const [nuPass, setNuPass] = React.useState("");
  const [nuRoles, setNuRoles] = React.useState<string[]>(["ROLE_USER"]);

  const toggleNuRole = (r: string) => {
    setNuRoles(prev => prev.includes(r) ? prev.filter(x=>x!==r) : [...prev, r]);
  };

  const submitNewUser = async (e: React.FormEvent) => {
    e.preventDefault();
    await createMut.mutateAsync({ username: nuUser, password: nuPass, roles: nuRoles });
    setNuUser(""); setNuPass(""); setNuRoles(["ROLE_USER"]);
  };

  const toggleRole = (u: User, r: string) => {
    const next = u.roles.includes(r) ? u.roles.filter(x=>x!==r) : [...u.roles, r];
    rolesMut.mutate({ id: u.id, roles: next });
  };

  return (
    <div>
      <h2>Kullanıcı Yönetimi</h2>

      <div className="card" style={{padding:16, marginBottom:12}}>
        <form onSubmit={submitNewUser}>
          <h5>Yeni Kullanıcı</h5>
          <div className="row g-2">
            <div className="col-sm-3">
              <input className="form-control" placeholder="kullanıcı adı" value={nuUser} onChange={e=>setNuUser(e.target.value)} required/>
            </div>
            <div className="col-sm-3">
              <input className="form-control" type="password" placeholder="şifre" value={nuPass} onChange={e=>setNuPass(e.target.value)} required/>
            </div>
            <div className="col-sm-4">
              {rolesQ.data?.map(r=>(
                <label key={r} className="me-3">
                  <input type="checkbox" className="form-check-input me-1"
                         checked={nuRoles.includes(r)} onChange={()=>toggleNuRole(r)}/>
                  {r.replace("ROLE_","")}
                </label>
              ))}
            </div>
            <div className="col-sm-2">
              <button className="btn btn-primary w-100" disabled={createMut.isPending}>Ekle</button>
            </div>
          </div>
          {createMut.isError && <div className="text-danger mt-2">Kullanıcı eklenemedi.</div>}
        </form>
      </div>

      <div className="d-flex gap-2 mb-2">
        <input className="form-control" style={{maxWidth:280}} placeholder="Ara kullanıcı…" value={q} onChange={e=>{setQ(e.target.value); setPage(0);}}/>
        <select className="form-select form-select-sm" style={{width:100}} value={size} onChange={e=>setSize(Number(e.target.value))}>
          <option value={10}>10</option><option value={20}>20</option><option value={50}>50</option>
        </select>
      </div>

      {usersQ.isLoading && <div>Yükleniyor…</div>}
      {usersQ.isError && <div>Veri alınamadı.</div>}

      {usersQ.data && (
        <>
          <div className="table-responsive">
            <table className="table table-sm table-striped align-middle">
              <thead><tr><th>ID</th><th>Kullanıcı</th><th>Roller</th><th className="text-end">İşlem</th></tr></thead>
              <tbody>
                {usersQ.data.content.map(u=>(
                  <tr key={u.id}>
                    <td>{u.id}</td>
                    <td>{u.username}</td>
                    <td>
                      {rolesQ.data?.map(r=>{
                        const checked = u.roles.includes(r);
                        return (
                          <label key={r} className="me-3">
                            <input type="checkbox" className="form-check-input me-1"
                                   checked={checked} onChange={()=>toggleRole(u, r)} disabled={rolesMut.isPending}/>
                            {r.replace("ROLE_","")}
                          </label>
                        );
                      })}
                    </td>
                    <td className="text-end">
                      {/* İstersen şifre reset, disable/enable vb. butonlar ekleyebilirsin */}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="d-flex align-items-center gap-2">
            <button className="btn btn-sm btn-outline-secondary" disabled={page===0} onClick={()=>setPage(p=>p-1)}>‹ Önceki</button>
            <span>Sayfa {usersQ.data.number+1} / {usersQ.data.totalPages}</span>
            <button className="btn btn-sm btn-outline-secondary" disabled={page+1>=usersQ.data.totalPages} onClick={()=>setPage(p=>p+1)}>Sonraki ›</button>
          </div>
        </>
      )}
    </div>
  );
}
