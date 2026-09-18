// ============================================================
// HLBP - Layout común
// ============================================================

function crearLayout() {

    const app = document.getElementById("app");

    if (!app) {
        return;
    }

    const profile = HLBPSession.profile;

    const nombre =
        HLBPSession.getName();

    const role =
        HLBPSession.getRoleLabel();

    const inicial =
        nombre.charAt(0).toUpperCase();


    app.innerHTML = `

        <div class="app-shell">

            <!-- ================================================
                 SIDEBAR
            ================================================= -->

            <aside class="sidebar" id="sidebar">

                <div class="sidebar-brand">

                    <div class="brand-mark">
                        H
                    </div>

                    <div class="brand-text">
                        <strong>HLBP</strong>
                        <span>Sistema Profesional</span>
                    </div>

                </div>


                <nav class="main-nav">

                    <div class="nav-section-title">
                        MENÚ
                    </div>


                    <a
                        href="dashboard.html"
                        class="nav-item active"
                        data-page="dashboard"
                    >
                        <span class="nav-icon">⌂</span>
                        <span>Hasiera</span>
                    </a>


                    <a
                        href="registroa.html"
                        class="nav-item"
                        data-page="registroa"
                    >
                        <span class="nav-icon">＋</span>
                        <span>Erregistroa</span>
                    </a>


                    <a
                        href="historiala.html"
                        class="nav-item"
                        data-page="historiala"
                    >
                        <span class="nav-icon">▤</span>
                        <span>Historiala</span>
                    </a>


                    <a
                        href="centros.html"
                        class="nav-item"
                        data-page="centros"
                    >
                        <span class="nav-icon">⌂</span>
                        <span>Zentroak</span>
                    </a>


                    ${
                        HLBPSession.isAdminOrMaster()
                        ? `
                            <div class="nav-section-title nav-admin-title">
                                KUDEAKETA
                            </div>

                            <a
                                href="administrazioa.html"
                                class="nav-item"
                                data-page="administrazioa"
                            >
                                <span class="nav-icon">⚙</span>
                                <span>Administrazioa</span>
                            </a>
                        `
                        : ""
                    }

                </nav>


                <div class="sidebar-footer">

                    <div class="sidebar-user">

                        <div class="user-avatar">
                            ${inicial}
                        </div>

                        <div class="user-info">

                            <strong>
                                ${nombre}
                            </strong>

                            <span>
                                ${role}
                            </span>

                        </div>

                    </div>


                    <button
                        type="button"
                        class="logout-button"
                        id="logoutButton"
                    >
                        Itxi saioa
                    </button>

                </div>

            </aside>


            <!-- ================================================
                 MAIN
            ================================================= -->

            <div class="main-area">

                <header class="topbar">

                    <button
                        type="button"
                        class="mobile-menu-button"
                        id="mobileMenuButton"
                        aria-label="Menua"
                    >
                        ☰
                    </button>


                    <div class="topbar-title">

                        <span class="topbar-label">
                            HLBP
                        </span>

                        <h1 id="pageTitle">
                            Hasiera
                        </h1>

                    </div>


                    <div class="topbar-user">

                        <div class="topbar-user-text">

                            <strong>
                                ${nombre}
                            </strong>

                            <span>
                                ${role}
                            </span>

                        </div>

                        <div class="topbar-avatar">
                            ${inicial}
                        </div>

                    </div>

                </header>


                <main class="page-content" id="pageContent">
                </main>

            </div>

        </div>
    `;


    configurarLayout();
}


function configurarLayout() {

    const logoutButton =
        document.getElementById("logoutButton");

    if (logoutButton) {

        logoutButton.addEventListener(
            "click",
            async () => {

                logoutButton.disabled = true;

                try {
                    await cerrarSesion();
                } catch (error) {

                    console.error(
                        "Error cerrando sesión:",
                        error
                    );

                    logoutButton.disabled = false;
                }

            }
        );
    }


    const mobileButton =
        document.getElementById("mobileMenuButton");

    const sidebar =
        document.getElementById("sidebar");

    if (mobileButton && sidebar) {

        mobileButton.addEventListener(
            "click",
            () => {

                sidebar.classList.toggle(
                    "sidebar-open"
                );

            }
        );
    }


    document
        .querySelectorAll(".nav-item")
        .forEach(item => {

            item.addEventListener(
                "click",
                () => {

                    if (sidebar) {
                        sidebar.classList.remove(
                            "sidebar-open"
                        );
                    }

                }
            );

        });
}
