// ============================================================
// HLBP - Layout principal
// ============================================================

window.HLBPLayout = {

    render() {

        const app = document.getElementById("app");

        if (!app) {
            console.error("HLBPLayout: no se encontró #app");
            return;
        }

        const nombre = this.escapeHtml(
            window.HLBPSession?.getName?.() || "Erabiltzailea"
        );

        const role = this.escapeHtml(
            window.HLBPSession?.getRoleLabel?.() || ""
        );

        const iniciales = this.obtenerIniciales(
            window.HLBPSession?.getName?.() || "U"
        );

        const esAdminOMaster =
            window.HLBPSession?.isAdminOrMaster?.() || false;

        const esAHL =
            window.HLBPSession?.isAHL?.() || false;

        const paginaActual = this.obtenerPaginaActual();

        app.innerHTML = `

            <div class="app-shell">

                <!-- ==================================================
                     SIDEBAR
                     ================================================== -->

                <aside class="sidebar" id="sidebar">

                    <div class="sidebar-header">

                        <a href="dashboard.html" class="sidebar-brand">

                            <div class="sidebar-logo">
                                HLBP
                            </div>

                            <div class="sidebar-brand-text">
                                <strong>HLBP</strong>
                                <span>Kudeaketa Sistema</span>
                            </div>

                        </a>

                    </div>


                    <!-- NAVEGACIÓN -->

                    <nav class="sidebar-nav">

                        <div class="nav-section-title">
                            MENU NAGUSIA
                        </div>


                        <!-- HASIERA -->

                        <a
                            href="dashboard.html"
                            class="nav-item ${paginaActual === "dashboard" ? "active" : ""}"
                        >
                            <span class="nav-icon">⌂</span>
                            <span class="nav-label">Hasiera</span>
                        </a>


                        <!-- ERREGISTROA
                             SOLO PARA AHL -->

                        ${
                            esAHL
                                ? `
                                    <a
                                        href="erregistroa.html"
                                        class="nav-item ${paginaActual === "erregistroa" ? "active" : ""}"
                                    >
                                        <span class="nav-icon">＋</span>
                                        <span class="nav-label">Erregistroa</span>
                                    </a>
                                `
                                : ""
                        }


                        <!-- HISTORIALA -->

                        <a
                            href="historiala.html"
                            class="nav-item ${paginaActual === "historiala" ? "active" : ""}"
                        >
                            <span class="nav-icon">▤</span>
                            <span class="nav-label">Historiala</span>
                        </a>


                        <!-- ZENTROAK -->

                        <a
                            href="zentroak.html"
                            class="nav-item ${paginaActual === "zentroak" ? "active" : ""}"
                        >
                            <span class="nav-icon">⌂</span>
                            <span class="nav-label">Zentroak</span>
                        </a>


                        <!-- ADMINISTRAZIOA
                             SOLO ADMIN / MASTER -->

                        ${
                            esAdminOMaster
                                ? `
                                    <div class="nav-section-title admin-section">
                                        ADMINISTRAZIOA
                                    </div>

                                    <a
                                        href="administrazioa.html"
                                        class="nav-item ${paginaActual === "administrazioa" ? "active" : ""}"
                                    >
                                        <span class="nav-icon">⚙</span>
                                        <span class="nav-label">
                                            Administrazioa
                                        </span>
                                    </a>
                                `
                                : ""
                        }

                    </nav>


                    <!-- ERABILTZAILEA -->

                    <div class="sidebar-user">

                        <div class="sidebar-user-avatar">
                            ${iniciales}
                        </div>

                        <div class="sidebar-user-info">

                            <strong>
                                ${nombre}
                            </strong>

                            <span>
                                ${role}
                            </span>

                        </div>

                    </div>


                    <!-- LOGOUT -->

                    <button
                        type="button"
                        class="sidebar-logout"
                        id="logoutButton"
                    >
                        <span class="nav-icon">↪</span>
                        <span>Saioa itxi</span>
                    </button>

                </aside>


                <!-- ==================================================
                     MAIN AREA
                     ================================================== -->

                <div class="main-area">

                    <!-- TOPBAR -->

                    <header class="topbar">

                        <button
                            type="button"
                            class="mobile-menu-button"
                            id="mobileMenuButton"
                            aria-label="Menua ireki"
                        >
                            ☰
                        </button>


                        <div class="topbar-spacer"></div>


                        <div class="topbar-user">

                            <div class="topbar-avatar">
                                ${iniciales}
                            </div>

                            <div class="topbar-user-info">

                                <strong>
                                    ${nombre}
                                </strong>

                                <span>
                                    ${role}
                                </span>

                            </div>

                        </div>

                    </header>


                    <!-- EDUKIA -->

                    <main class="content-area" id="pageContent">

                        <!-- Dashboard / página se inserta aquí -->

                    </main>

                </div>

            </div>

        `;


        this.inicializarEventos();

        console.log("HLBPLayout: layout cargado correctamente.");
    },


    // ============================================================
    // EVENTOS
    // ============================================================

    inicializarEventos() {

        const logoutButton =
            document.getElementById("logoutButton");

        if (logoutButton) {

            logoutButton.addEventListener(
                "click",
                async () => {

                    logoutButton.disabled = true;
                    logoutButton.textContent = "Saioa ixten...";

                    try {

                        const { error } =
                            await window.hlbpSupabase.auth.signOut({
                                scope: "local"
                            });

                        if (error) {
                            console.error(
                                "Errorea saioa ixtean:",
                                error
                            );
                        }

                    } catch (error) {

                        console.error(
                            "Logout error:",
                            error
                        );

                    } finally {

                        window.location.replace("../index.html");

                    }

                }
            );

        }


        // ========================================================
        // MOBILE MENU
        // ========================================================

        const mobileMenuButton =
            document.getElementById("mobileMenuButton");

        const sidebar =
            document.getElementById("sidebar");

        if (
            mobileMenuButton &&
            sidebar
        ) {

            mobileMenuButton.addEventListener(
                "click",
                () => {

                    sidebar.classList.toggle(
                        "mobile-open"
                    );

                }
            );


            // Cerrar menú al pulsar un enlace

            const navLinks =
                sidebar.querySelectorAll(
                    ".nav-item"
                );

            navLinks.forEach(
                link => {

                    link.addEventListener(
                        "click",
                        () => {

                            sidebar.classList.remove(
                                "mobile-open"
                            );

                        }
                    );

                }
            );

        }

    },


    // ============================================================
    // PÁGINA ACTUAL
    // ============================================================

    obtenerPaginaActual() {

        const pathname =
            window.location.pathname
                .toLowerCase();

        if (
            pathname.includes("dashboard")
        ) {
            return "dashboard";
        }

        if (
            pathname.includes("erregistroa")
        ) {
            return "erregistroa";
        }

        if (
            pathname.includes("historiala")
        ) {
            return "historiala";
        }

        if (
            pathname.includes("zentroak")
        ) {
            return "zentroak";
        }

        if (
            pathname.includes("administrazioa")
        ) {
            return "administrazioa";
        }

        return "dashboard";
    },


    // ============================================================
    // INICIALES
    // ============================================================

    obtenerIniciales(nombre) {

        if (!nombre) {
            return "U";
        }

        const partes =
            nombre
                .trim()
                .split(/\s+/)
                .filter(Boolean);

        if (partes.length === 1) {
            return partes[0]
                .substring(0, 2)
                .toUpperCase();
        }

        return (
            partes[0].charAt(0) +
            partes[partes.length - 1].charAt(0)
        ).toUpperCase();
    },


    // ============================================================
    // SEGURIDAD HTML
    // ============================================================

    escapeHtml(valor) {

        return String(valor)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

};
