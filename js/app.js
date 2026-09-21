// ============================================================
// HLBP - Aplicación principal
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        const loginForm =
            document.getElementById("loginForm");

        // Si esta página no contiene el formulario de login,
        // no hacemos nada.
        if (!loginForm) {
            return;
        }


        // ----------------------------------------------------
        // Comprobar sesión existente
        // ----------------------------------------------------

        const usuario =
            await obtenerUsuarioActual();

        if (usuario) {

            window.location.href =
                "pages/dashboard.html";

            return;
        }


        // ----------------------------------------------------
        // Login
        // ----------------------------------------------------

        loginForm.addEventListener(
            "submit",
            async (event) => {

                event.preventDefault();


                // DNI
                const dni =
                    document
                        .getElementById("dni")
                        .value
                        .trim();


                // Contraseña
                const password =
                    document
                        .getElementById("password")
                        .value;


                const button =
                    document.getElementById(
                        "loginButton"
                    );


                button.disabled = true;


                mostrarMensaje(
                    "Saioa hasten..."
                );


                try {

                    // ------------------------------------------------
                    // Iniciar sesión con DNI + contraseña
                    // ------------------------------------------------

                    await iniciarSesion(
                        dni,
                        password
                    );


                    // ------------------------------------------------
                    // Obtener perfil después del login
                    // ------------------------------------------------

                    const perfil =
                        await obtenerPerfilActual();


                    if (!perfil) {

                        throw new Error(
                            "Ez da profilik aurkitu."
                        );
                    }


                    console.log(
                        "HLBP: login correcto:",
                        perfil
                    );


                    mostrarMensaje(
                        `Ongi etorri, ${
                            perfil.nombre || dni
                        }`
                    );


                    // ------------------------------------------------
                    // Redirección
                    // ------------------------------------------------

                    setTimeout(
                        () => {

                            window.location.href =
                                "pages/dashboard.html";

                        },
                        500
                    );


                } catch (error) {

                    console.error(
                        "Login error:",
                        error
                    );


                    mostrarError(
                        "DNIa edo pasahitza ez dira zuzenak."
                    );


                    button.disabled = false;

                }

            }
        );

    }
);


// ============================================================
// MENSAJE
// ============================================================

function mostrarMensaje(texto) {

    const elemento =
        document.getElementById(
            "loginMessage"
        );

    if (!elemento) {
        return;
    }

    elemento.textContent =
        texto;

    elemento.className =
        "login-message";
}


// ============================================================
// ERROR
// ============================================================

function mostrarError(texto) {

    const elemento =
        document.getElementById(
            "loginMessage"
        );

    if (!elemento) {
        return;
    }

    elemento.textContent =
        texto;

    elemento.className =
        "login-message error";
}
