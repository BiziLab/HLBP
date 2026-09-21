// ============================================================
// HLBP - Autenticación
// ============================================================

// ============================================================
// INICIAR SESIÓN CON DNI + CONTRASEÑA
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


    // --------------------------------------------------------
    // Buscar el perfil mediante DNI
    // --------------------------------------------------------

    const {
        data: perfil,
        error: perfilError
    } = await window.hlbpSupabase
        .from("profiles")
        .select("id, email, dni, activo")
        .eq("dni", dniNormalizado)
        .maybeSingle();


    if (perfilError) {

        console.error(
            "Errorea profila bilatzean:",
            perfilError
        );

        throw new Error(
            "Ezin izan da erabiltzailearen profila aurkitu."
        );
    }


    if (!perfil) {

        throw new Error(
            "DNI hori ez dago erregistratuta."
        );
    }


    if (perfil.activo === false) {

        throw new Error(
            "Erabiltzaile hau ez dago aktibo."
        );
    }


    // --------------------------------------------------------
    // El email interno de Supabase se utiliza únicamente
    // para realizar la autenticación.
    // --------------------------------------------------------

    let emailLogin = perfil.email;


    // Para los nuevos usuarios el email puede ser el interno:
    // 12345678a@hlbp.local
    //
    // Si el perfil todavía no tiene email guardado,
    // lo generamos a partir del DNI.

    if (!emailLogin) {

        emailLogin =
            `${dniNormalizado.toLowerCase()}@hlbp.local`;
    }


    // --------------------------------------------------------
    // LOGIN REAL EN SUPABASE AUTH
    // --------------------------------------------------------

    const {
        data,
        error
    } = await window.hlbpSupabase.auth.signInWithPassword({

        email: emailLogin,

        password: password

    });


    if (error) {

        console.error(
            "Errorea saioa hastean:",
            error
        );

        throw new Error(
            "DNIa edo pasahitza ez dira zuzenak."
        );
    }


    return data;
}


// ============================================================
// CERRAR SESIÓN
// ============================================================

async function cerrarSesion() {

    const {
        error
    } = await window.hlbpSupabase.auth.signOut();


    if (error) {
        throw error;
    }


    window.location.href = "index.html";
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
