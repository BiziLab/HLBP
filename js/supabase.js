// ============================================================
// HLBP - Conexión con Supabase
// ============================================================

const { createClient } = supabase;

window.hlbpSupabase = createClient(
    window.HLBP_CONFIG.SUPABASE_URL,
    window.HLBP_CONFIG.SUPABASE_PUBLISHABLE_KEY
);
