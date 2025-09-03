import React from "react";
import { useForm } from "react-hook-form";
import type { SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import api from "../../api/axios";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";

const schema = z.object({
  productCode: z.string().min(1, "Kod zorunlu"),
  name: z.string().min(1, "Ad zorunlu"),
  description: z.string().optional(),
  categoryId: z.number().optional(),
  unit: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

type Category = { id: number; name: string };

async function fetchCategories(): Promise<Category[]> {
  const { data } = await api.get("/api/categories", { params: { size: 1000 }});
  // farklı bir format dönüyorsan uyarlayabilirsin
  return data.content ?? data; 
}
async function fetchProduct(id: number) {
  const { data } = await api.get(`/api/products/${id}`);
  return data;
}
async function createProduct(payload: FormData) {
  const { data } = await api.post("/api/products", payload);
  return data;
}
async function updateProduct(id: number, payload: FormData) {
  const { data } = await api.put(`/api/products/${id}`, payload);
  return data;
}

export default function EditForm() {
  const { id } = useParams(); // /products/edit/:id? gibi bir route
  const editing = !!id;
  const nav = useNavigate();

  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const catsQ = useQuery({ queryKey: ["categories"], queryFn: fetchCategories, staleTime: 5*60_000 });

  const prodQ = useQuery({
    queryKey: ["product", id],
    queryFn: () => fetchProduct(Number(id)),
    enabled: editing
  });

  React.useEffect(()=>{
    if (prodQ.data) {
      reset({
        productCode: prodQ.data.productCode,
        name: prodQ.data.name,
        description: prodQ.data.description || "",
        categoryId: prodQ.data.category?.id,
        unit: prodQ.data.unit || ""
      });
    }
  }, [prodQ.data, reset]);

  const createMut = useMutation({ mutationFn: createProduct, onSuccess: ()=>nav("/products") });
  const updateMut = useMutation({ mutationFn: (payload: FormData)=>updateProduct(Number(id), payload), onSuccess: ()=>nav("/products") });

  const onSubmit: SubmitHandler<FormData> = (d) => {
    if (editing) updateMut.mutate(d);
    else createMut.mutate(d);
  };

  return (
    <div>
      <h2>{editing? "Ürünü Düzenle" : "Yeni Ürün"}</h2>

      {(editing && prodQ.isLoading) ? <div>Yükleniyor…</div> : (
        <form onSubmit={handleSubmit(onSubmit)} className="card" style={{padding:16, maxWidth:720}}>
          <div className="row g-3">
            <div className="col-sm-4">
              <label className="form-label">Kod *</label>
              <input className={`form-control ${errors.productCode?'is-invalid':''}`} {...register("productCode")} />
              {errors.productCode && <div className="invalid-feedback">{errors.productCode.message}</div>}
            </div>
            <div className="col-sm-8">
              <label className="form-label">Ad *</label>
              <input className={`form-control ${errors.name?'is-invalid':''}`} {...register("name")} />
              {errors.name && <div className="invalid-feedback">{errors.name.message}</div>}
            </div>
            <div className="col-sm-12">
              <label className="form-label">Açıklama</label>
              <textarea className="form-control" rows={3} {...register("description")} />
            </div>
            <div className="col-sm-6">
              <label className="form-label">Kategori</label>
              <select
                className="form-select"
                {...register("categoryId", {
                  setValueAs: v => (v === "" ? undefined : Number(v)),
                })}
              >
                <option value="">— seçin —</option>
                {catsQ.data?.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="col-sm-6">
              <label className="form-label">Birim</label>
              <input className="form-control" placeholder="adet / kg / lt ..." {...register("unit")} />
            </div>
          </div>

          <div className="mt-3 d-flex gap-2">
            <button className="btn btn-primary" disabled={createMut.isPending || updateMut.isPending}>
              {editing ? "Güncelle" : "Kaydet"}
            </button>
            <button type="button" className="btn btn-outline-secondary" onClick={()=>nav(-1)}>Vazgeç</button>
          </div>

          {(createMut.isError || updateMut.isError) && <div className="text-danger mt-2">İşlem başarısız.</div>}
        </form>
      )}
    </div>
  );
}
