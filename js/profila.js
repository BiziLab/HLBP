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


    function obtenerIniciales(persona) {

        const nombre = (persona.nombre || "").trim();
        const apellido = (persona.apellidos || "").trim();

        if (nombre || apellido) {
            return (nombre.charAt(0) + apellido.charAt(0)).toUpperCase();
        }

        return (persona.email || "?").charAt(0).toUpperCase();
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

        const esAHL = window.HLBPSession.isAHL();

        const nombreCompleto =
            `${perfil.nombre || ""} ${perfil.apellidos || ""}`.trim() ||
            perfil.email ||
            "Erabiltzailea";

        pageContent.innerHTML = `

            <div class="admin-page admin-page-narrow">

                <header class="admin-page-header">

                    <div>

                        <div class="admin-breadcrumb">
                            HLBP / Nire profila
                        </div>

                        <h1>Nire profila</h1>

                        <p>
                            Zure datu pertsonalak eta sarbide-pasahitza kudeatu.
                        </p>

                    </div>

                </header>


                <section class="admin-panel profila-panel">

                    <div class="profila-header">

                        <div class="profila-avatar">
                            ${escapeHtml(obtenerIniciales(perfil))}
                        </div>

                        <div>
                            <strong class="profila-header-name">${escapeHtml(nombreCompleto)}</strong>
                            <span class="profila-header-role">${escapeHtml(window.HLBPSession.getRoleLabel())}</span>
                        </div>

                    </div>


                    <div class="admin-panel-header">
                        <div>
                            <h2>Datu pertsonalak</h2>
                            <p>Zure profileko informazioa eguneratu.</p>
                        </div>
                    </div>


                    <form id="profilaDatosForm" class="admin-form-card" novalidate>

                        <div class="admin-form-grid">

                            <div class="admin-form-group">
                                <label for="profilaNombre">Izena *</label>
                                <input
                                    type="text"
                                    id="profilaNombre"
                                    class="admin-input"
                                    value="${escapeHtml(perfil.nombre || "")}"
                                    required
                                    autocomplete="off"
                                >
                            </div>

                            <div class="admin-form-group">
                                <label for="profilaApellidos">Abizenak *</label>
                                <input
                                    type="text"
                                    id="profilaApellidos"
                                    class="admin-input"
                                    value="${escapeHtml(perfil.apellidos || "")}"
                                    required
                                    autocomplete="off"
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
                                <small class="admin-help">
                                    Emaila ezin da orri honetatik aldatu.
                                </small>
                            </div>

                            <div class="admin-form-group">
                                <label for="profilaBerritzegune">Berritzegunea</label>
                                <input
                                    type="text"
                                    id="profilaBerritzegune"
                                    class="admin-input"
                                    value="${escapeHtml(perfil.berritzegune || "")}"
                                    autocomplete="off"
                                >
                            </div>

                            <div class="admin-form-group">
                                <label for="profilaEspecialidad">Espezialitatea</label>
                                <select id="profilaEspecialidad" class="admin-input">
                                    <option value="">Aukeratu...</option>
                                    <option value="Inklusioa" ${perfil.espezialitatea === "Inklusioa" ? "selected" : ""}>Inklusioa</option>
                                    <option value="Bizikidetza" ${perfil.espezialitatea === "Bizikidetza" ? "selected" : ""}>Bizikidetza</option>
                                    <option value="Posbentzioa" ${perfil.espezialitatea === "Posbentzioa" ? "selected" : ""}>Posbentzioa</option>
                                </select>
                            </div>

                        </div>

                        <div id="profilaDatosMessage" class="admin-form-message" aria-live="polite"></div>

                        <footer class="admin-form-actions">
                            <button type="submit" class="admin-btn admin-btn-primary" id="btnGuardarDatos">
                                Aldaketak gorde
                            </button>
                        </footer>

                    </form>

                </section>


                <section class="admin-panel profila-panel">

                    <div class="admin-panel-header">
                        <div>
                            <h2>Pasahitza aldatu</h2>
                            <p>
                                ${esAHL
                                    ? "Sarbide-pasahitz berria ezarri."
                                    : "Zure kontuaren sarbide-pasahitza aldatu."}
                            </p>
                        </div>
                    </div>

                    <form id="profilaPasswordForm" class="admin-form-card" novalidate>

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

        $("profilaDatosForm")?.addEventListener("submit", guardarDatos);

        $("profilaPasswordForm")?.addEventListener("submit", guardarPassword);
    }


    // ============================================================
    // GUARDAR DATOS PERSONALES
    // ============================================================

    async function guardarDatos(event) {

        event.preventDefault();

        const mensaje = $("profilaDatosMessage");

        const boton = $("btnGuardarDatos");

        const nombre = valorDe("profilaNombre");

        const apellidos = valorDe("profilaApellidos");

        const berritzegune = valorDe("profilaBerritzegune");

        const espezialitatea = $("profilaEspecialidad")?.value || "";

        if (!nombre || !apellidos) {

            mostrarMensaje(mensaje, "Izena eta abizenak bete behar dira.", "error");

            return;
        }

        const contenidoBoton = boton ? boton.innerHTML : "";

        if (boton) {
            boton.disabled = true;
            boton.textContent = "Gordetzen...";
        }

        mostrarMensaje(mensaje, "Gordetzen...", "loading");

        try {

            const userId = window.HLBPSession.user.id;

            const { error } =
                await window.hlbpSupabase
                    .from("profiles")
                    .update({
                        nombre,
                        apellidos,
                        berritzegune: berritzegune || null,
                        espezialitatea: espezialitatea || null
                    })
                    .eq("id", userId);

            if (error) {
                throw error;
            }

            // Actualizar la sesión en memoria para que la barra lateral
            // y el resto de la app reflejen el cambio sin recargar.
            window.HLBPSession.profile = {
                ...window.HLBPSession.profile,
                nombre,
                apellidos,
                berritzegune: berritzegune || null,
                espezialitatea: espezialitatea || null
            };

            window.HLBPLayout.render();

            renderProfila();

            const mensajeNuevo = $("profilaDatosMessage");

            mostrarMensaje(mensajeNuevo, "✓ Datuak eguneratu dira.", "success");

        } catch (error) {

            console.error("Errorea datuak gordetzean:", error);

            mostrarMensaje(mensaje, obtenerMensajeError(error), "error");

        } finally {

            if (boton && $("btnGuardarDatos")) {

                $("btnGuardarDatos").disabled = false;
                $("btnGuardarDatos").innerHTML = contenidoBoton;
            }
        }
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
