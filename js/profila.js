// ============================================================
// HLBP - NIRE PROFILA
// ============================================================

(function () {

    "use strict";


    // ============================================================
    // INICIO
    // ============================================================

    document.addEventListener("DOMContentLoaded", () => {
        iniciarProfila();
    });


    async function iniciarProfila() {

        try {

            const sesionOk = await window.HLBPSession.init();

            if (!sesionOk) {

                window.location.replace("../index.html");

                return;
            }

            window.HLBPLayout.render();

            const pageContent = document.getElementById("pageContent");

            if (!pageContent) {
                throw new Error("No se encontró #pageContent.");
            }

            renderProfila();

        } catch (error) {

            console.error("Errorea Profila hasieratzean:", error);

            mostrarErrorProfila(error);
        }
    }


    // ============================================================
    // UTILIDADES
    // ============================================================

    function $(id) {
        return document.getElementById(id);
    }


    function valorDe(id) {
        return $(id)?.value?.trim() || "";
    }


    function escapeHtml(valor) {

        return String(valor ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }


    function obtenerMensajeError(error) {

        if (!error) {
            return "Errore ezezaguna.";
        }

        if (typeof error === "string") {
            return error;
        }

        return (
            error.message ||
            error.error_description ||
            error.details ||
            error.hint ||
            "Errore ezezaguna."
        );
    }


    function mostrarMensaje(elemento, texto, tipo) {

        if (!elemento) {
            return;
        }

        elemento.className = `admin-form-message ${tipo}`;

        elemento.textContent = texto;
    }


    // ============================================================
    // RENDER
    // ============================================================

    function renderProfila() {

        const pageContent = $("pageContent");

        if (!pageContent) {
            return;
        }

        const perfil = window.HLBPSession.profile || {};

        const esAdminOMaster = window.HLBPSession.isAdminOrMaster();

        pageContent.innerHTML = `

            <div class="admin-page admin-page-narrow">

                <header class="admin-page-header">

                    <div>

                        <div class="admin-breadcrumb">
                            HLBP / Nire profila
                        </div>

                        <h1>Nire profila</h1>

                        <p>
                            ${
                                esAdminOMaster
                                    ? "Zure kontuaren mota eta sarbide-pasahitza."
                                    : "Zure datu pertsonalak eta sarbide-pasahitza."
                            }
                        </p>

                    </div>

                </header>


                ${
                    esAdminOMaster
                        ? renderSeccionAdmin(perfil)
                        : renderSeccionAHL(perfil)
                }


                <section class="admin-panel admin-form-card">

                    <div class="admin-form-section-head">
                        <h2>Pasahitza aldatu</h2>
                        <p>Zure kontuaren sarbide-pasahitza ezarri.</p>
                    </div>

                    <form id="profilaPasswordForm" novalidate>

                        <div class="admin-form-grid">

                            <div class="admin-form-group">
                                <label for="profilaPasswordNueva">Pasahitz berria *</label>
                                <input
                                    type="password"
                                    id="profilaPasswordNueva"
                                    class="admin-input"
                                    autocomplete="new-password"
                                    minlength="6"
                                    required
                                >
                                <small class="admin-help">Gutxienez 6 karaktere.</small>
                            </div>

                            <div class="admin-form-group">
                                <label for="profilaPasswordErrepikatu">Errepikatu pasahitza *</label>
                                <input
                                    type="password"
                                    id="profilaPasswordErrepikatu"
                                    class="admin-input"
                                    autocomplete="new-password"
                                    minlength="6"
                                    required
                                >
                            </div>

                        </div>

                        <div id="profilaPasswordMessage" class="admin-form-message" aria-live="polite"></div>

                        <footer class="admin-form-actions">
                            <button type="submit" class="admin-btn admin-btn-primary" id="btnGuardarPassword">
                                Pasahitza eguneratu
                            </button>
                        </footer>

                    </form>

                </section>

            </div>
        `;

        $("profilaPasswordForm")?.addEventListener("submit", guardarPassword);
    }


    // ============================================================
    // SECCIÓN: AHL (datos de solo lectura)
    // ============================================================

    function renderSeccionAHL(perfil) {

        return `

            <form id="profilaDatosForm" class="admin-panel admin-form-card" novalidate>

                <section class="admin-form-section">

                    <div class="admin-form-section-head">
                        <h2>Datu pertsonalak</h2>
                        <p>
                            Datu hauek administratzaileak kudeatzen ditu.
                            Zerbait aldatu behar baduzu, jarri harremanetan
                            zure administratzailearekin.
                        </p>
                    </div>

                    <div class="admin-form-grid">

                        <div class="admin-form-group">
                            <label for="profilaNombre">Izena</label>
                            <input
                                type="text"
                                id="profilaNombre"
                                class="admin-input"
                                value="${escapeHtml(perfil.nombre || "")}"
                                disabled
                            >
                        </div>

                        <div class="admin-form-group">
                            <label for="profilaApellidos">Abizenak</label>
                            <input
                                type="text"
                                id="profilaApellidos"
                                class="admin-input"
                                value="${escapeHtml(perfil.apellidos || "")}"
                                disabled
                            >
                        </div>

                        <div class="admin-form-group">
                            <label for="profilaEmail">Emaila</label>
                            <input
                                type="email"
                                id="profilaEmail"
                                class="admin-input"
                                value="${escapeHtml(perfil.email || "")}"
                                disabled
                            >
                        </div>

                        <div class="admin-form-group">
                            <label for="profilaBerritzegune">Berritzegunea</label>
                            <input
                                type="text"
                                id="profilaBerritzegune"
                                class="admin-input"
                                value="${escapeHtml(perfil.berritzegune || "")}"
                                disabled
                            >
                        </div>

                        <div class="admin-form-group">
                            <label for="profilaEspecialidad">Espezialitatea</label>
                            <input
                                type="text"
                                id="profilaEspecialidad"
                                class="admin-input"
                                value="${escapeHtml(perfil.espezialitatea || "")}"
                                disabled
                            >
                        </div>

                    </div>

                </section>

            </form>
        `;
    }


    // ============================================================
    // SECCIÓN: ADMIN / MASTER (solo el rol)
    // ============================================================

    function renderSeccionAdmin(perfil) {

        return `

            <section class="admin-panel admin-form-card">

                <section class="admin-form-section">

                    <div class="admin-form-section-head">
                        <h2>Kontuaren mota</h2>
                        <p>Zure kontuaren informazioa, soilik irakurtzeko.</p>
                    </div>

                    <div class="admin-form-grid">

                        <div class="admin-form-group">
                            <label for="profilaRol">Rola</label>
                            <input
                                type="text"
                                id="profilaRol"
                                class="admin-input"
                                value="${escapeHtml(window.HLBPSession.getRoleLabel())}"
                                disabled
                            >
                        </div>

                        <div class="admin-form-group">
                            <label for="profilaEmailAdmin">Emaila</label>
                            <input
                                type="email"
                                id="profilaEmailAdmin"
                                class="admin-input"
                                value="${escapeHtml(perfil.email || "")}"
                                disabled
                            >
                        </div>

                    </div>

                </section>

            </section>
        `;
    }


    // ============================================================
    // GUARDAR PASSWORD
    // ============================================================

    async function guardarPassword(event) {

        event.preventDefault();

        const mensaje = $("profilaPasswordMessage");

        const boton = $("btnGuardarPassword");

        const nueva = valorDe("profilaPasswordNueva");

        const repetida = valorDe("profilaPasswordErrepikatu");

        if (!nueva || !repetida) {

            mostrarMensaje(mensaje, "Bete eremu guztiak.", "error");

            return;
        }

        if (nueva.length < 6) {

            mostrarMensaje(mensaje, "Pasahitzak gutxienez 6 karaktere izan behar ditu.", "error");

            return;
        }

        if (nueva !== repetida) {

            mostrarMensaje(mensaje, "Pasahitzak ez datoz bat.", "error");

            return;
        }

        const contenidoBoton = boton ? boton.innerHTML : "";

        if (boton) {
            boton.disabled = true;
            boton.textContent = "Eguneratzen...";
        }

        mostrarMensaje(mensaje, "Eguneratzen...", "loading");

        try {

            const { error } =
                await window.hlbpSupabase.auth.updateUser({
                    password: nueva
                });

            if (error) {
                throw error;
            }

            $("profilaPasswordForm")?.reset();

            mostrarMensaje(mensaje, "✓ Pasahitza behar bezala eguneratu da.", "success");

        } catch (error) {

            console.error("Errorea pasahitza aldatzean:", error);

            mostrarMensaje(mensaje, obtenerMensajeError(error), "error");

        } finally {

            if (boton) {

                boton.disabled = false;
                boton.innerHTML = contenidoBoton;
            }
        }
    }


    // ============================================================
    // ERROR GENERAL
    // ============================================================

    function mostrarErrorProfila(error) {

        const app = document.getElementById("app");

        if (!app) {
            return;
        }

        app.innerHTML = `
            <div class="app-error-state">
                <h2>Errorea</h2>
                <p>${escapeHtml(obtenerMensajeError(error))}</p>
            </div>
        `;
    }

})();
