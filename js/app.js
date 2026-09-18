// ============================================================
// HLBP - Aplicación principal
// ============================================================

document.addEventListener("DOMContentLoaded", async () => {

    const loginForm = document.getElementById("loginForm");

    if (!loginForm) {
        return;
    }

    // --------------------------------------------------------
    // Comprobar si ya existe una sesión
    // --------------------------------------------------------

    const usuario = await obtenerUsuarioActual();

    if (usuario) {

        const perfil = await obtenerPerfilActual();

        console.log("Usuario conectado:", usuario);
        console.log("Perfil HLBP:", perfil);

        mostrarMensaje(
            "Saioa aktibo dago. Perfilera sartzen..."
        );

        // De momento no redirigimos.
        // En el siguiente paso crearemos el dashboard.
    }


    // --------------------------------------------------------
    // Login
    // --------------------------------------------------------

    loginForm.addEventListener("submit", async (event) => {

        event.preventDefault();

        const email =
            document.getElementById("email").value.trim();

        const password =
            document.getElementById("password").value;

        const button =
            document.getElementById("loginButton");

        button.disabled = true;

        mostrarMensaje("Saioa hasten...");

        try {

            const data =
                await iniciarSesion(email, password);

            console.log("Login correcto:", data);

            const perfil =
                await obtenerPerfilActual();

            console.log("Perfil:", perfil);

            mostrarMensaje(
                `Ongi etorri, ${perfil?.nombre || email}`
            );

            /*
             * En el siguiente paso:
             *
             * AHL    -> dashboard normal
             * ADMIN  -> dashboard global
             * MASTER -> dashboard global + administración
             */

        } catch (error) {

            console.error(error);

            mostrarError(
                "Emaila edo pasahitza ez dira zuzenak."
            );

        } finally {

            button.disabled = false;
        }

    });

});


function mostrarMensaje(texto) {

    const elemento =
        document.getElementById("loginMessage");

    if (!elemento) {
        return;
    }

    elemento.textContent = texto;

    elemento.className =
        "login-message";
}


function mostrarError(texto) {

    const elemento =
        document.getElementById("loginMessage");

    if (!elemento) {
        return;
    }

    elemento.textContent = texto;

    elemento.className =
        "login-message error";
}
