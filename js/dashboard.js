// ============================================================
// HLBP - DASHBOARD
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    inicializarDashboard
);


// ============================================================
// INICIALIZACIÓN
// ============================================================

async function inicializarDashboard() {

    console.log(
        "HLBP: iniciando dashboard..."
    );


    // --------------------------------------------------------
    // Comprobar autenticación
    // --------------------------------------------------------

    const autenticado =
        await HLBPSession.init();


    if (!autenticado) {

        console.log(
            "HLBP: no hay sesión."
        );

        window.location.replace(
            "../index.html"
        );

        return;
    }


    // --------------------------------------------------------
    // Layout
    // --------------------------------------------------------

    HLBPLayout.render();


    // --------------------------------------------------------
    // Cargar contenido
    // --------------------------------------------------------

    await cargarDashboard();

}


// ============================================================
// DASHBOARD
// ============================================================

async function cargarDashboard() {

    const container =
        document.getElementById(
            "pageContent"
        );


    if (!container) {

        console.error(
            "No existe #pageContent"
        );

        return;
    }


    const nombre =
        HLBPSession.getName() ||
        HLBPSession.user.email;


    const rol =
        HLBPSession.getRoleLabel();


    container.innerHTML = `

        <section class="dashboard-header">

            <span class="dashboard-eyebrow">
                PANEL DE CONTROL
            </span>

            <h1>
                Ongi etorri, ${escapeHtml(nombre)}
            </h1>

            <p>
                Hona hemen zure HLBP jardueraren laburpena.
            </p>

        </section>


        <section
            class="dashboard-stats"
            id="dashboardStats"
        >

            ${crearStatLoading()}

            ${crearStatLoading()}

            ${crearStatLoading()}

        </section>


        <section class="dashboard-grid">


            <!-- =================================================
                 REGISTROS
                 ================================================= -->

            <article class="dashboard-panel">

                <div class="panel-header">

                    <h2>
                        Azken erregistroak
                    </h2>

                    <p>
                        Sistemako azken jarduerak
                    </p>

                </div>


                <div id="recentRecords">

                    ${crearEstadoVacio(
                        "Kargatzen...",
                        "Datuak eskuratzen."
                    )}

                </div>

            </article>


            <!-- =================================================
                 ACCIONES
                 ================================================= -->

            <article class="dashboard-panel">

                <div class="panel-header">

                    <h2>
                        Sarbide azkarrak
                    </h2>

                    <p>
                        Ohiko ekintzak
                    </p>

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
                                Sortu jarduera berri bat
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
                                Historiala
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
                                Kontsultatu zentroak
                            </small>

                        </span>

                    </a>


                    ${
                        HLBPSession.isAdminOrMaster()
                        ? `

                        <a
                            href="administrazioa.html"
                            class="quick-action"
                        >

                            <span class="quick-action-icon">
                                ⚙
                            </span>

                            <span>

                                <strong>
                                    Administrazioa
                                </strong>

                                <small>
                                    Kudeatu sistema
                                </small>

                            </span>

                        </a>

                        `
                        : ""
                    }


                </div>

            </article>


        </section>

    `;


    // --------------------------------------------------------
    // Datos
    // --------------------------------------------------------

    await cargarEstadisticas();

    await cargarUltimosRegistros();

}


// ============================================================
// ESTADÍSTICAS
// ============================================================

async function cargarEstadisticas() {

    const container =
        document.getElementById(
            "dashboardStats"
        );


    if (!container) {
        return;
    }


    try {

        const global =
            HLBPSession.isAdminOrMaster();


        // ----------------------------------------------------
        // REGISTROS
        // ----------------------------------------------------

        let registrosQuery =
            window.hlbpSupabase
                .from("registros")
                .select("id", {
                    count: "exact",
                    head: true
                });


        if (!global) {

            registrosQuery =
                registrosQuery.eq(
                    "usuario_id",
                    HLBPSession.user.id
                );

        }


        const {
            count: registros,
            error: registrosError
        } = await registrosQuery;


        if (registrosError) {
            throw registrosError;
        }


        // ----------------------------------------------------
        // CENTROS
        // ----------------------------------------------------

        const {
            count: centros,
            error: centrosError
        } =
            await window.hlbpSupabase
                .from("centros")
                .select("id", {
                    count: "exact",
                    head: true
                })
                .eq(
                    "activo",
                    true
                );


        if (centrosError) {
            throw centrosError;
        }


        // ----------------------------------------------------
        // USUARIOS
        // ----------------------------------------------------

        let usuarios = 1;


        if (global) {

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
                    .eq(
                        "activo",
                        true
                    );


            if (error) {
                throw error;
            }


            usuarios =
                count || 0;

        }


        // ----------------------------------------------------
        // Pintar
        // ----------------------------------------------------

        container.innerHTML = `

            ${crearStatCard(
                "Erregistroak",
                registros || 0,
                global
                    ? "Sistemako erregistro guztiak"
                    : "Zure erregistroak"
            )}


            ${crearStatCard(
                "Zentroak",
                centros || 0,
                "Zentro aktiboak"
            )}


            ${crearStatCard(
                "Erabiltzaileak",
                usuarios,
                global
                    ? "Erabiltzaile aktiboak"
                    : "Zure erabiltzaile-kontua"
            )}

        `;


    } catch (error) {

        console.error(
            "Errorea estatistikak:",
            error
        );


        container.innerHTML = `

            ${crearStatCard(
                "Erregistroak",
                "—",
                "Ezin izan dira kargatu"
            )}

            ${crearStatCard(
                "Zentroak",
                "—",
                "Ezin izan dira kargatu"
            )}

            ${crearStatCard(
                "Erabiltzaileak",
                "—",
                "Ezin izan dira kargatu"
            )}

        `;

    }

}


// ============================================================
// ÚLTIMOS REGISTROS
// ============================================================

async function cargarUltimosRegistros() {

    const container =
        document.getElementById(
            "recentRecords"
        );


    if (!container) {
        return;
    }


    try {

        const global =
            HLBPSession.isAdminOrMaster();


        let query =
            window.hlbpSupabase
                .from("registros")
                .select(`
                    id,
                    fecha,
                    tarea,
                    tipo,
                    estado
                `)
                .order(
                    "fecha",
                    {
                        ascending: false
                    }
                )
                .limit(5);


        if (!global) {

            query =
                query.eq(
                    "usuario_id",
                    HLBPSession.user.id
                );

        }


        const {
            data,
            error
        } = await query;


        if (error) {
            throw error;
        }


        if (
            !data ||
            data.length === 0
        ) {

            container.innerHTML =
                crearEstadoVacio(
                    "Ez dago erregistrorik",
                    "Oraingoz ez dago daturik erakusteko."
                );

            return;

        }


        container.innerHTML = `

            <div class="recent-records-list">

                ${data.map(
                    registro => `

                    <div class="recent-record">

                        <div class="recent-record-main">

                            <strong>
                                ${escapeHtml(
                                    registro.tarea ||
                                    "Erregistroa"
                                )}
                            </strong>

                            <span>
                                ${escapeHtml(
                                    registro.tipo ||
                                    ""
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
                                    registro.estado ||
                                    "—"
                                )}
                            </span>

                        </div>

                    </div>

                `
                ).join("")}

            </div>

        `;


    } catch (error) {

        console.error(
            "Errorea azken erregistroak:",
            error
        );


        container.innerHTML =
            crearEstadoVacio(
                "Ezin izan dira datuak kargatu",
                "Saiatu berriro geroago."
            );

    }

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

            <span class="stat-card-label">
                ${escapeHtml(titulo)}
            </span>

            <div class="stat-card-value">
                ${escapeHtml(valor)}
            </div>

            <div class="stat-card-description">
                ${escapeHtml(descripcion)}
            </div>

        </article>

    `;

}


function crearStatLoading() {

    return `

        <article class="stat-card">

            <span class="stat-card-label">
                Kargatzen...
            </span>

            <div class="stat-card-value">
                —
            </div>

            <div class="stat-card-description">
                Datuak eskuratzen
            </div>

        </article>

    `;

}


function crearEstadoVacio(
    titulo,
    descripcion
) {

    return `

        <div class="empty-state">

            <div class="empty-state-icon">
                —
            </div>

            <strong>
                ${escapeHtml(titulo)}
            </strong>

            <p>
                ${escapeHtml(descripcion)}
            </p>

        </div>

    `;

}


// ============================================================
// UTILIDADES
// ============================================================

function formatearFecha(fecha) {

    if (!fecha) {
        return "—";
    }


    try {

        return new Date(
            fecha
        ).toLocaleDateString(
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
