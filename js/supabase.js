// ============================================================
// HLBP - Autenticación mediante DNI
// ============================================================


async function iniciarSesion(dni, password) {

    dni = dni
        .trim()
        .toUpperCase();


    if (!dni || !password) {

        throw new Error(
            "DNI eta pasahitza beharrezkoak dira."
        );

    }


    const { data, error } =
        await window.hlbpSupabase.functions.invoke(
            "login-dni",
            {
                body: {
                    dni: dni,
                    password: password
                }
            }
        );


    if (error) {

        console.error(
            "Errorea DNI login-ean:",
            error
        );

        throw new Error(
            "DNI edo pasahitza ez dira zuzenak."
        );
    }


    if (!data || !data.access_token) {

        console.error(
            "Login erantzun baliogabea:",
            data
        );

        throw new Error(
            "Ezin izan da saioa hasi."
        );
    }


    // Gorde gure autentifikazio-tokena
    window.HLBPAuthToken.set(
        data.access_token
    );


    // Gorde erabiltzailearen profila
    if (data.profile) {

        sessionStorage.setItem(
            "hlbp_profile",
            JSON.stringify(data.profile)
        );
    }


    return data;
}


// ============================================================
// Amaitu saioa
// ============================================================

async function cerrarSesion() {

    window.HLBPAuthToken.clear();

    sessionStorage.removeItem(
        "hlbp_profile"
    );


    window.location.href =
        "../index.html";
}


// ============================================================
// Erabiltzaile aktiboa
// ============================================================

async function obtenerUsuarioActual() {

    const token =
        window.HLBPAuthToken.get();


    if (!token) {
        return null;
    }


    try {

        const payload =
            JSON.parse(
                atob(
                    token
                        .split(".")[1]
                        .replace(/-/g, "+")
                        .replace(/_/g, "/")
                )
            );


        return {
            id: payload.sub,
            dni: payload.dni,
            role: payload.role
        };


    } catch (error) {

        console.error(
            "Errorea tokena irakurtzean:",
            error
        );

        return null;
    }
}


// ============================================================
// Perfil actual
// ============================================================

async function obtenerPerfilActual() {

    const usuario =
        await obtenerUsuarioActual();


    if (!usuario) {
        return null;
    }


    const cachedProfile =
        sessionStorage.getItem(
            "hlbp_profile"
        );


    if (cachedProfile) {

        try {

            return JSON.parse(
                cachedProfile
            );

        } catch (error) {

            console.error(
                "Errorea profile lokalean:",
                error
            );

        }
    }


    const {
        data,
        error
    } =
        await window.hlbpSupabase
            .from("profiles")
            .select("*")
            .eq("id", usuario.id)
            .single();


    if (error) {

        console.error(
            "Errorea profila lortzean:",
            error
        );

        return null;
    }


    sessionStorage.setItem(
        "hlbp_profile",
        JSON.stringify(data)
    );


    return data;
}
