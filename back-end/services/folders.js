// services/folders.js
export async function getOrCreateFolder(sb, user_id, session_id) {
  const { data: folder, error } = await sb
    .from("folders")
    .upsert({ user_id, session_id, metadata: {} }, { onConflict: "session_id" })
    .select("*")
    .single();
  if (error) throw new Error("Folder creation failed: " + error.message);
  return folder;
}
