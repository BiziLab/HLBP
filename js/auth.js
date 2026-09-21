// ============================================================
// HLBP - Autenticación
// ============================================================

async function iniciarSesion(dni, password) {

    const dniNormalizado = dni
        .trim()
        .toUpperCase();

    if (!dniNormalizado) {
        throw new Error("Sartu zure DNIa.");
    }

    if (!password) {
        throw new Error("Sartu zure pasahitza.");
    }

    // Supabase Auth utilizará internamente este email.
    // El usuario nunca tiene que verlo.
    const emailInterno =
        `${dniNormalizado.toLowerCase()}@hlbp.local`;

    const {
        data,
        error
    } = await window.hlbpSupabase.auth.signInWithPassword({
        email: emailInterno,
        password: password
    });

    if (error) {
        console.error("Errorea saioa hastean:", error);
        throw error;
    }

    return data;
}


// ============================================================
// CERRAR SESIÓN
// ============================================================

async function cerrarSesion() {

    const { error } =
        await window.hlbpSupabase.auth.signOut();

    if (error) {
        throw error;
    }

    window.location.href = "../index.html";
}


// ============================================================
// OBTENER USUARIO ACTUAL
// ============================================================

async function obtenerUsuarioActual() {

    const {
        data: { user },
        error
    } = await window.hlbpSupabase.auth.getUser();

    if (error) {
        console.error(
            "Error obteniendo usuario:",
            error
        );

        return null;
    }

    return user;
}


// ============================================================
// OBTENER PERFIL ACTUAL
// ============================================================

async function obtenerPerfilActual() {

    const usuario =
        await obtenerUsuarioActual();

    if (!usuario) {
        return null;
    }

    const {
        data,
        error
    } = await window.hlbpSupabase
        .from("profiles")
        .select("*")
        .eq("id", usuario.id)
        .single();

    if (error) {

        console.error(
            "Error obteniendo perfil:",
            error
        );

        return null;
    }

    return data;
}
