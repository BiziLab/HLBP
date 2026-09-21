// ============================================================
// HLBP - Autenticación
// ============================================================

async function iniciarSesion(email, password) {

    const { data, error } =
        await window.hlbpSupabase.auth.signInWithPassword({
            email: email,
            password: password
        });

    if (error) {
        throw error;
    }

    return data;
}


async function cerrarSesion() {

    const { error } =
        await window.hlbpSupabase.auth.signOut();

    if (error) {
        throw error;
    }

    window.location.href = "index.html";
}


async function obtenerUsuarioActual() {

    const {
        data: { user },
        error
    } = await window.hlbpSupabase.auth.getUser();

    if (error) {
        console.error("Error obteniendo usuario:", error);
        return null;
    }

    return user;
}


async function obtenerPerfilActual() {

    const usuario = await obtenerUsuarioActual();

    if (!usuario) {
        return null;
    }

    const { data, error } =
        await window.hlbpSupabase
            .from("profiles")
            .select("*")
            .eq("id", usuario.id)
            .single();

    if (error) {
        console.error("Error obteniendo perfil:", error);
        return null;
    }

    return data;
}
