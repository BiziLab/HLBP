// ============================================================
// HLBP - Aplicación principal
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        const loginForm =
            document.getElementById("loginForm");

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


                const email =
                    document
                        .getElementById("email")
                        .value
                        .trim();


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

                    await iniciarSesion(
                        email,
                        password
                    );


                    const perfil =
                        await obtenerPerfilActual();


                    if (!perfil) {

                        throw new Error(
                            "Ez da profilik aurkitu."
                        );

                    }


                    mostrarMensaje(
                        `Ongi etorri, ${
                            perfil.nombre ||
                            email
                        }`
                    );


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
                        "Emaila edo pasahitza ez dira zuzenak."
                    );


                    button.disabled = false;

                }

            }
        );

    }
);


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
