// services/dca.js
export async function insertDCA(sb, user_id, brand_id, dca) {
  const { data, error } = await sb
    .from("dream_customers")
    .insert({ user_id, brand_id, ...dca })
    .select("*")
    .single();
  if (error) throw new Error("Insert DCA failed: " + error.message);
  return data;
}
