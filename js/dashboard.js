// ============================================================
// HLBP - DASHBOARD
// ============================================================

document.addEventListener("DOMContentLoaded", async () => {

    try {

        // --------------------------------------------------------
        // 1. Inicializar sesión
        // --------------------------------------------------------

        const sessionOk = await HLBPSession.init();

        if (!sessionOk) {
            window.location.href = "../index.html";
            return;
        }


        // --------------------------------------------------------
        // 2. Crear interfaz general
        // --------------------------------------------------------

        HLBPLayout.render();


        // --------------------------------------------------------
        // 3. Cargar datos del dashboard
        // --------------------------------------------------------

        await cargarDashboard();

    } catch (error) {

        console.error("Error inicializando dashboard:", error);

    }

});


// ============================================================
// CARGAR DASHBOARD
// ============================================================

async function cargarDashboard() {

    const container = document.getElementById("dashboardContent");

    if (!container) {
        console.error("No se encontró #dashboardContent");
        return;
    }

    try {

        const perfil = HLBPSession.profile;

        if (!perfil) {
            throw new Error("No se ha encontrado el perfil del usuario.");
        }


        // --------------------------------------------------------
        // Datos básicos del usuario
        // --------------------------------------------------------

        const nombre = obtenerNombreUsuario(perfil);

        const rol = HLBPSession.getRoleLabel();


        // --------------------------------------------------------
        // Obtener estadísticas
        // --------------------------------------------------------

        const estadisticas = await obtenerEstadisticas();


        // --------------------------------------------------------
        // Pintar dashboard
        // --------------------------------------------------------

        container.innerHTML = `
            <div class="dashboard-welcome">

                <div>
                    <span class="dashboard-eyebrow">
                        PANEL DE CONTROL
                    </span>

                    <h1>
                        Ongi etorri, ${escapeHtml(nombre)}
                    </h1>

                    <p>
                        ${escapeHtml(rol)}
                    </p>
                </div>

            </div>


            <section class="dashboard-stats">

                ${crearStatCard(
                    "Erregistroak",
                    estadisticas.registros,
                    "Erregistro guztien kopurua"
                )}

                ${crearStatCard(
                    "Zentroak",
                    estadisticas.centros,
                    "Zentro aktiboak"
                )}

                ${crearStatCard(
                    "Erabiltzaileak",
                    estadisticas.usuarios,
                    "Erabiltzaile aktiboak"
                )}

            </section>


            <section class="dashboard-grid">

                <div class="dashboard-panel">

                    <div class="panel-header">
                        <div>
                            <h2>
                                Azken erregistroak
                            </h2>

                            <p>
                                Sistemako azken jarduerak
                            </p>
                        </div>
                    </div>

                    <div id="recentRecords">
                        ${crearEstadoVacio()}
                    </div>

                </div>


                <div class="dashboard-panel">

                    <div class="panel-header">
                        <div>
                            <h2>
                                Sarbide azkarrak
                            </h2>

                            <p>
                                Ohiko ekintzak
                            </p>
                        </div>
                    </div>

                    <div class="quick-actions">

                        <a
                            href="erregistroa.html"
                            class="quick-action"
                        >
                            <span class="quick-action-icon">
                                +
                            </span>

                            <span>
                                <strong>
                                    Erregistro berria
                                </strong>

                                <small>
                                    Sortu jarduera-erregistro berri bat
                                </small>
                            </span>
                        </a>


                        <a
                            href="historiala.html"
                            class="quick-action"
                        >
                            <span class="quick-action-icon">
                                ≡
                            </span>

                            <span>
                                <strong>
                                    Historia
                                </strong>

                                <small>
                                    Ikusi aurreko erregistroak
                                </small>
                            </span>
                        </a>


                        <a
                            href="zentroak.html"
                            class="quick-action"
                        >
                            <span class="quick-action-icon">
                                □
                            </span>

                            <span>
                                <strong>
                                    Zentroak
                                </strong>

                                <small>
                                    Kontsultatu zentroen informazioa
                                </small>
                            </span>
                        </a>

                    </div>

                </div>

            </section>
        `;


        // --------------------------------------------------------
        // Azken erregistroak
        // --------------------------------------------------------

        await cargarUltimosRegistros();


    } catch (error) {

        console.error(
            "Errorea dashboarda kargatzean:",
            error
        );

        container.innerHTML = `
            <div class="dashboard-error">

                <h2>
                    Ezin izan da dashboarda kargatu
                </h2>

                <p>
                    ${escapeHtml(error.message)}
                </p>

            </div>
        `;

    }

}


// ============================================================
// ESTADÍSTICAS
// ============================================================

async function obtenerEstadisticas() {

    const esGlobal =
        HLBPSession.isAdminOrMaster();


    // --------------------------------------------------------
    // ERREGISTROAK
    // --------------------------------------------------------

    let registrosQuery =
        window.hlbpSupabase
            .from("registros")
            .select("id", {
                count: "exact",
                head: true
            });


    // AHL → solamente sus propios registros
    if (!esGlobal) {

        registrosQuery =
            registrosQuery.eq(
                "usuario_id",
                HLBPSession.user.id
            );

    }


    const {
        count: registrosCount,
        error: registrosError
    } = await registrosQuery;


    if (registrosError) {
        console.error(registrosError);
        throw registrosError;
    }


    // --------------------------------------------------------
    // ZENTROAK
    // --------------------------------------------------------

    const {
        count: centrosCount,
        error: centrosError
    } =
        await window.hlbpSupabase
            .from("centros")
            .select("id", {
                count: "exact",
                head: true
            })
            .eq("activo", true);


    if (centrosError) {
        console.error(centrosError);
        throw centrosError;
    }


    // --------------------------------------------------------
    // ERABILTZAILEAK
    // --------------------------------------------------------

    let usuariosCount = 1;


    if (esGlobal) {

        const {
            count,
            error
        } =
            await window.hlbpSupabase
                .from("profiles")
                .select("id", {
                    count: "exact",
                    head: true
                })
                .eq("activo", true);


        if (error) {
            console.error(error);
            throw error;
        }

        usuariosCount = count || 0;

    }


    return {

        registros: registrosCount || 0,

        centros: centrosCount || 0,

        usuarios: usuariosCount

    };

}


// ============================================================
// ÚLTIMOS REGISTROS
// ============================================================

async function cargarUltimosRegistros() {

    const container =
        document.getElementById("recentRecords");

    if (!container) {
        return;
    }


    const esGlobal =
        HLBPSession.isAdminOrMaster();


    let query =
        window.hlbpSupabase
            .from("registros")
            .select(`
                id,
                fecha,
                tarea,
                tipo,
                estado,
                usuario_id
            `)
            .order("fecha", {
                ascending: false
            })
            .limit(5);


    if (!esGlobal) {

        query = query.eq(
            "usuario_id",
            HLBPSession.user.id
        );

    }


    const {
        data,
        error
    } = await query;


    if (error) {

        console.error(
            "Errorea azken erregistroak:",
            error
        );

        container.innerHTML = crearEstadoError();

        return;
    }


    if (!data || data.length === 0) {

        container.innerHTML =
            crearEstadoVacio();

        return;
    }


    container.innerHTML = `
        <div class="recent-records-list">

            ${data.map(registro => `

                <div class="recent-record">

                    <div class="recent-record-main">

                        <strong>
                            ${escapeHtml(
                                registro.tarea || "Erregistroa"
                            )}
                        </strong>

                        <span>
                            ${escapeHtml(
                                registro.tipo || ""
                            )}
                        </span>

                    </div>


                    <div class="recent-record-meta">

                        <span>
                            ${formatearFecha(
                                registro.fecha
                            )}
                        </span>

                        <span class="status-badge">
                            ${escapeHtml(
                                registro.estado || "—"
                            )}
                        </span>

                    </div>

                </div>

            `).join("")}

        </div>
    `;

}


// ============================================================
// COMPONENTES
// ============================================================

function crearStatCard(
    titulo,
    valor,
    descripcion
) {

    return `
        <article class="stat-card">

            <div class="stat-card-top">

                <span class="stat-card-label">
                    ${escapeHtml(titulo)}
                </span>

            </div>

            <div class="stat-card-value">
                ${valor}
            </div>

            <div class="stat-card-description">
                ${escapeHtml(descripcion)}
            </div>

        </article>
    `;

}


function crearEstadoVacio() {

    return `
        <div class="empty-state">

            <div class="empty-state-icon">
                —
            </div>

            <strong>
                Ez dago erregistrorik
            </strong>

            <p>
                Oraingoz ez dago erakusteko daturik.
            </p>

        </div>
    `;

}


function crearEstadoError() {

    return `
        <div class="empty-state error-state">

            <strong>
                Ezin izan dira datuak kargatu.
            </strong>

            <p>
                Saiatu berriro geroago.
            </p>

        </div>
    `;

}


// ============================================================
// UTILIDADES
// ============================================================

function obtenerNombreUsuario(perfil) {

    const nombre =
        perfil.nombre ||
        perfil.email ||
        "erabiltzailea";

    const apellidos =
        perfil.apellidos || "";

    return `${nombre} ${apellidos}`.trim();

}


function formatearFecha(fecha) {

    if (!fecha) {
        return "—";
    }

    try {

        return new Date(fecha)
            .toLocaleDateString(
                "eu-ES",
                {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric"
                }
            );

    } catch {

        return fecha;

    }

}


function escapeHtml(value) {

    if (value === null || value === undefined) {
        return "";
    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}
