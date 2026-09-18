// ============================================================
// HLBP - DASHBOARD
// ============================================================

document.addEventListener("DOMContentLoaded", async () => {

    console.log("HLBP: iniciando dashboard...");


    // --------------------------------------------------------
    // Comprobar autenticación
    // --------------------------------------------------------

    const autenticado =
        await HLBPSession.init();


    if (!autenticado) {

        console.log(
            "HLBP: usuario no autenticado. Volviendo al login."
        );

        window.location.replace(
            "../index.html"
        );

        return;
    }


    console.log(
        "HLBP: usuario autenticado correctamente."
    );


    // --------------------------------------------------------
    // Mostrar interfaz
    // --------------------------------------------------------

    const app =
        document.getElementById("app");


    if (!app) {

        console.error(
            "HLBP: no existe el elemento #app"
        );

        return;
    }


    // --------------------------------------------------------
    // Dashboard básico
    // --------------------------------------------------------

    const nombre =
        HLBPSession.getName() ||
        HLBPSession.user.email;


    const rol =
        HLBPSession.getRoleLabel();


    app.innerHTML = `

        <div class="dashboard-test">

            <div class="dashboard-test-card">

                <div class="dashboard-test-logo">
                    HLBP
                </div>


                <h1>
                    Ongi etorri, ${escapeHtml(nombre)}
                </h1>


                <p class="dashboard-test-role">
                    ${escapeHtml(rol)}
                </p>


                <p class="dashboard-test-email">
                    ${escapeHtml(
                        HLBPSession.user.email
                    )}
                </p>


                <div class="dashboard-test-success">

                    ✓ Autentikazioa zuzena da

                </div>


                <button
                    type="button"
                    id="logoutButton"
                    class="dashboard-test-button"
                >
                    Saioa itxi
                </button>

            </div>

        </div>

    `;


    // --------------------------------------------------------
    // Logout
    // --------------------------------------------------------

    const logoutButton =
        document.getElementById(
            "logoutButton"
        );


    if (logoutButton) {

        logoutButton.addEventListener(
            "click",
            async () => {

                try {

                    await cerrarSesion();

                    window.location.replace(
                        "../index.html"
                    );

                } catch (error) {

                    console.error(
                        "Error cerrando sesión:",
                        error
                    );

                }

            }
        );

    }

});


// ============================================================
// ESCAPAR HTML
// ============================================================

function escapeHtml(value) {

    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
