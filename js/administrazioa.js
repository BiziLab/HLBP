// ============================================================
// HLBP - Administrazioa
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        console.log("HLBP: iniciando administración...");

        const autenticado =
            await window.HLBPSession.init();

        if (!autenticado) {
            window.location.replace("../index.html");
            return;
        }

        if (!window.HLBPSession.isAdminOrMaster()) {
            window.location.replace("dashboard.html");
            return;
        }

        window.HLBPLayout.render();

        await inicializarAdministrazioa();
    }
);


// ============================================================
// INICIALIZACIÓN
// ============================================================

async function inicializarAdministrazioa() {

    const contenido =
        document.getElementById("pageContent");

    if (!contenido) {
        console.error(
            "No se encontró #pageContent"
        );
        return;
    }

    const parametros =
        new URLSearchParams(
            window.location.search
        );

    const personaId =
        parametros.get("persona");

    if (personaId) {

        await cargarPersona(
            personaId
        );

        return;
    }

    await cargarListaPersonas();
}


// ============================================================
// LISTA DE PERSONAS
// ============================================================

async function cargarListaPersonas() {

    const contenido =
        document.getElementById("pageContent");

    contenido.innerHTML = `

        <div class="admin-page">

            <div class="admin-page-header">

                <div class="admin-page-title">

                    <h1>Administrazioa</h1>

                    <p>
                        Erabiltzaileak eta haien erregistroak kudeatu.
                    </p>

                </div>

                <div class="admin-header-actions">

                    <button
                        type="button"
                        class="admin-btn admin-btn-primary"
                        id="downloadAllButton"
                    >
                        📥 Denen erregistroak deskargatu
                    </button>

                </div>

            </div>


            <div
                class="admin-summary"
                id="adminSummary"
            >

                <div class="admin-summary-card">

                    <div class="admin-summary-label">
                        Pertsonak
                    </div>

                    <div
                        class="admin-summary-value"
                        id="summaryPeople"
                    >
                        —
                    </div>

                </div>


                <div class="admin-summary-card">

                    <div class="admin-summary-label">
                        Erregistroak
                    </div>

                    <div
                        class="admin-summary-value"
                        id="summaryRecords"
                    >
                        —
                    </div>

                </div>


                <div class="admin-summary-card">

                    <div class="admin-summary-label">
                        Aktiboak
                    </div>

                    <div
                        class="admin-summary-value"
                        id="summaryActive"
                    >
                        —
                    </div>

                </div>

            </div>


            <section class="admin-panel">

                <div class="admin-panel-header">

                    <h2>
                        Pertsona guztiak
                    </h2>

                    <input
                        type="search"
                        id="personSearch"
                        class="admin-search"
                        placeholder="Bilatu pertsona..."
                        autocomplete="off"
                    >

                </div>


                <div
                    id="peopleTableContainer"
                    class="admin-table-wrapper"
                >

                    <div class="admin-loading">
                        Kargatzen...
                    </div>

                </div>

            </section>

        </div>
    `;


    document
        .getElementById("downloadAllButton")
        .addEventListener(
            "click",
            descargarTodosLosRegistros
        );


    document
        .getElementById("personSearch")
        .addEventListener(
            "input",
            aplicarBusquedaPersonas
        );


    await obtenerPersonas();
}


// ============================================================
// VARIABLES
// ============================================================

let personasCargadas = [];


// ============================================================
// OBTENER PERSONAS
// ============================================================

async function obtenerPersonas() {

    const container =
        document.getElementById(
            "peopleTableContainer"
        );

    try {

        const {
            data,
            error
        } = await window.hlbpSupabase
            .from("profiles")
            .select(`
                id,
                email,
                nombre,
                apellidos,
                codigo,
                role,
                berritzegune,
                activo
            `)
            .order(
                "apellidos",
                {
                    ascending: true
                }
            );


        if (error) {
            throw error;
        }


        personasCargadas =
            data || [];


        await cargarContadores(
            personasCargadas
        );


        renderizarPersonas(
            personasCargadas
        );


    } catch (error) {

        console.error(
            "Error cargando personas:",
            error
        );

        container.innerHTML = `

            <div class="admin-error">

                <strong>
                    Ezin izan dira erabiltzaileak kargatu.
                </strong>

                <br><br>

                <small>
                    ${escapeHtml(
                        error.message ||
                        "Errore ezezaguna"
                    )}
                </small>

            </div>

        `;
    }
}


// ============================================================
// CONTADORES
// ============================================================

async function cargarContadores(
    personas
) {

    const totalPersonas =
        personas.length;

    const activas =
        personas.filter(
            persona => persona.activo !== false
        ).length;


    let totalRegistros = 0;


    const {
        count,
        error
    } = await window.hlbpSupabase
        .from("registros")
        .select(
            "*",
            {
                count: "exact",
                head: true
            }
        );


    if (!error) {
        totalRegistros =
            count || 0;
    }


    document
        .getElementById(
            "summaryPeople"
        )
        .textContent =
        totalPersonas;


    document
        .getElementById(
            "summaryRecords"
        )
        .textContent =
        totalRegistros;


    document
        .getElementById(
            "summaryActive"
        )
        .textContent =
        activas;
}


// ============================================================
// RENDERIZAR PERSONAS
// ============================================================

function renderizarPersonas(
    personas
) {

    const container =
        document.getElementById(
            "peopleTableContainer"
        );


    if (!personas.length) {

        container.innerHTML = `

            <div class="admin-empty">

                <div class="admin-empty-title">
                    Ez dago pertsonarik.
                </div>

                <div class="admin-empty-text">
                    Oraindik ez dago erabiltzaile erregistraturik.
                </div>

            </div>

        `;

        return;
    }


    const filas =
        personas.map(
            persona => {

                const nombre =
                    `${persona.nombre || ""} ${persona.apellidos || ""}`
                        .trim() ||
                    persona.email ||
                    "—";


                const estado =
                    persona.activo !== false
                        ? `
                            <span class="admin-badge admin-badge-active">
                                Aktiboa
                            </span>
                        `
                        : `
                            <span class="admin-badge admin-badge-inactive">
                                Inaktiboa
                            </span>
                        `;


                return `

                    <tr>

                        <td>
                            <span class="admin-code">
                                ${escapeHtml(
                                    persona.codigo || "—"
                                )}
                            </span>
                        </td>


                        <td>

                            <div class="admin-person-name">
                                ${escapeHtml(nombre)}
                            </div>

                            <div class="admin-muted">
                                ${escapeHtml(
                                    persona.email || ""
                                )}
                            </div>

                        </td>


                        <td>
                            ${escapeHtml(
                                persona.berritzegune || "—"
                            )}
                        </td>


                        <td>
                            ${escapeHtml(
                                persona.role || "—"
                            )}
                        </td>


                        <td>
                            <span
                                class="admin-count"
                                data-centers-for="${persona.id}"
                            >
                                —
                            </span>
                        </td>


                        <td>
                            <span
                                class="admin-count"
                                data-records-for="${persona.id}"
                            >
                                —
                            </span>
                        </td>


                        <td>

                            ${estado}

                        </td>


                        <td>

                            <div class="admin-row-actions">

                                <button
                                    type="button"
                                    class="admin-view-btn"
                                    onclick="verPersona('${persona.id}')"
                                >
                                    IKUSI
                                </button>

                            </div>

                        </td>

                    </tr>
                `;
            }
        )
        .join("");


    container.innerHTML = `

        <table class="admin-table">

            <thead>

                <tr>

                    <th>Kodigoa</th>
                    <th>Izena</th>
                    <th>Kokapena</th>
                    <th>Espezialitatea</th>
                    <th>Zentroak</th>
                    <th>Erregistroak</th>
                    <th>Egoera</th>
                    <th>Ekintza</th>

                </tr>

            </thead>

            <tbody>
                ${filas}
            </tbody>

        </table>
    `;


    cargarContadoresIndividuales(
        personas
    );
}


// ============================================================
// CONTADORES INDIVIDUALES
// ============================================================

async function cargarContadoresIndividuales(
    personas
) {

    for (const persona of personas) {

        const {
            count: registros,
            error: registrosError
        } = await window.hlbpSupabase
            .from("registros")
            .select(
                "*",
                {
                    count: "exact",
                    head: true
                }
            )
            .eq(
                "usuario_id",
                persona.id
            );


        const registroElemento =
            document.querySelector(
                `[data-records-for="${persona.id}"]`
            );


        if (
            registroElemento &&
            !registrosError
        ) {
            registroElemento.textContent =
                registros || 0;
        }


        const {
            count: centros,
            error: centrosError
        } = await window.hlbpSupabase
            .from("aholkulari_centros")
            .select(
                "*",
                {
                    count: "exact",
                    head: true
                }
            )
            .eq(
                "aholkulari_id",
                persona.id
            );


        const centrosElemento =
            document.querySelector(
                `[data-centers-for="${persona.id}"]`
            );


        if (
            centrosElemento &&
            !centrosError
        ) {
            centrosElemento.textContent =
                centros || 0;
        }

    }
}


// ============================================================
// VER PERSONA
// ============================================================

function verPersona(
    personaId
) {

    window.location.href =
        `administrazioa.html?persona=${encodeURIComponent(
            personaId
        )}`;
}


// ============================================================
// BÚSQUEDA
// ============================================================

function aplicarBusquedaPersonas(
    event
) {

    const texto =
        event.target.value
            .trim()
            .toLowerCase();


    if (!texto) {

        renderizarPersonas(
            personasCargadas
        );

        return;
    }


    const filtradas =
        personasCargadas.filter(
            persona => {

                const contenido = [

                    persona.codigo,
                    persona.nombre,
                    persona.apellidos,
                    persona.email,
                    persona.berritzegune,
                    persona.role

                ]
                    .filter(Boolean)
                    .join(" ")
                    .toLowerCase();


                return contenido.includes(
                    texto
                );
            }
        );


    renderizarPersonas(
        filtradas
    );
}


// ============================================================
// DESCARGA GLOBAL
// ============================================================

async function descargarTodosLosRegistros() {

    alert(
        "La exportación XLSX global la activaremos en el siguiente paso."
    );
}


// ============================================================
// PERSONA INDIVIDUAL
// ============================================================

async function cargarPersona(
    personaId
) {

    const contenido =
        document.getElementById(
            "pageContent"
        );


    contenido.innerHTML = `

        <div class="person-page">

            <a
                href="administrazioa.html"
                class="person-back"
            >
                ← Pertsona guztietara itzuli
            </a>


            <div class="person-header">

                <div class="person-header-main">

                    <div class="person-identity">

                        <div
                            class="person-avatar"
                            id="personAvatar"
                        >
                            —
                        </div>

                        <div>

                            <h1
                                class="person-name"
                                id="personName"
                            >
                                Kargatzen...
                            </h1>

                            <p
                                class="person-meta"
                                id="personMeta"
                            >
                                —
                            </p>

                        </div>

                    </div>


                    <div class="person-actions">

                        <button
                            type="button"
                            class="admin-btn admin-btn-primary"
                            id="downloadPersonButton"
                        >
                            📥 Bere erregistroak deskargatu
                        </button>

                        <button
                            type="button"
                            class="admin-btn admin-btn-danger"
                            id="deletePersonButton"
                        >
                            ⚠ Pertsona ezabatu
                        </button>

                    </div>

                </div>


                <div class="person-stats">

                    <div class="person-stat">

                        <div class="person-stat-label">
                            Kodigoa
                        </div>

                        <div
                            class="person-stat-value"
                            id="personCode"
                        >
                            —
                        </div>

                    </div>


                    <div class="person-stat">

                        <div class="person-stat-label">
                            Zentroak
                        </div>

                        <div
                            class="person-stat-value"
                            id="personCenters"
                        >
                            —
                        </div>

                    </div>


                    <div class="person-stat">

                        <div class="person-stat-label">
                            Erregistroak
                        </div>

                        <div
                            class="person-stat-value"
                            id="personRecords"
                        >
                            —
                        </div>

                    </div>

                </div>

            </div>


            <section class="admin-panel">

                <div class="admin-panel-header">

                    <h2>
                        Bere erregistroak
                    </h2>

                </div>


                <div
                    id="personRecordsContainer"
                    class="admin-table-wrapper"
                >

                    <div class="admin-loading">
                        Kargatzen...
                    </div>

                </div>

            </section>

        </div>

    `;


    try {

        const {
            data: persona,
            error: personaError
        } = await window.hlbpSupabase
            .from("profiles")
            .select(`
                id,
                email,
                nombre,
                apellidos,
                codigo,
                role,
                berritzegune,
                activo
            `)
            .eq(
                "id",
                personaId
            )
            .maybeSingle();


        if (personaError) {
            throw personaError;
        }


        if (!persona) {
            throw new Error(
                "Ez da pertsona aurkitu."
            );
        }


        const nombre =
            `${persona.nombre || ""} ${persona.apellidos || ""}`
                .trim() ||
            persona.email ||
            "—";


        document
            .getElementById(
                "personName"
            )
            .textContent =
            nombre;


        document
            .getElementById(
                "personMeta"
            )
            .textContent =
            `${persona.berritzegune || "—"} · ${persona.role || "—"}`;


        document
            .getElementById(
                "personCode"
            )
            .textContent =
            persona.codigo || "—";


        document
            .getElementById(
                "personAvatar"
            )
            .textContent =
            obtenerIniciales(
                nombre
            );


        const {
            count: totalRegistros
        } = await window.hlbpSupabase
            .from("registros")
            .select(
                "*",
                {
                    count: "exact",
                    head: true
                }
            )
            .eq(
                "usuario_id",
                personaId
            );


        const {
            count: totalCentros
        } = await window.hlbpSupabase
            .from("aholkulari_centros")
            .select(
                "*",
                {
                    count: "exact",
                    head: true
                }
            )
            .eq(
                "aholkulari_id",
                personaId
            );


        document
            .getElementById(
                "personRecords"
            )
            .textContent =
            totalRegistros || 0;


        document
            .getElementById(
                "personCenters"
            )
            .textContent =
            totalCentros || 0;


        document
            .getElementById(
                "downloadPersonButton"
            )
            .addEventListener(
                "click",
                () => descargarRegistrosPersona(
                    personaId,
                    nombre
                )
            );


        document
            .getElementById(
                "deletePersonButton"
            )
            .addEventListener(
                "click",
                () => prepararEliminacionPersona(
                    personaId,
                    nombre
                )
            );


        await cargarRegistrosPersona(
            personaId
        );


    } catch (error) {

        console.error(
            "Error cargando persona:",
            error
        );

        document
            .getElementById(
                "personRecordsContainer"
            )
            .innerHTML = `

                <div class="admin-error">

                    ${escapeHtml(
                        error.message ||
                        "Errorea kargatzean."
                    )}

                </div>
            `;
    }
}


// ============================================================
// REGISTROS DE PERSONA
// ============================================================

async function cargarRegistrosPersona(
    personaId
) {

    const container =
        document.getElementById(
            "personRecordsContainer"
        );


    const {
        data,
        error
    } = await window.hlbpSupabase
        .from("registros")
        .select("*")
        .eq(
            "usuario_id",
            personaId
        )
        .order(
            "fecha",
            {
                ascending: false
            }
        );


    if (error) {

        console.error(
            "Error registros:",
            error
        );

        container.innerHTML = `

            <div class="admin-error">

                Ezin izan dira erregistroak kargatu.

                <br><br>

                <small>
                    ${escapeHtml(
                        error.message
                    )}
                </small>

            </div>
        `;

        return;
    }


    if (!data || !data.length) {

        container.innerHTML = `

            <div class="admin-empty">

                <div class="admin-empty-title">
                    Ez dago erregistrorik.
                </div>

                <div class="admin-empty-text">
                    Pertsona honek ez du oraindik erregistrorik.
                </div>

            </div>
        `;

        return;
    }


    const filas =
        data.map(
            registro => `

                <tr>

                    <td>
                        ${escapeHtml(
                            registro.fecha || "—"
                        )}
                    </td>

                    <td>
                        ${escapeHtml(
                            registro.centro_id || "—"
                        )}
                    </td>

                    <td>
                        ${escapeHtml(
                            registro.tarea || "—"
                        )}
                    </td>

                    <td>
                        ${escapeHtml(
                            registro.tipo || "—"
                        )}
                    </td>

                    <td>
                        ${escapeHtml(
                            registro.subtipo || "—"
                        )}
                    </td>

                    <td>
                        ${escapeHtml(
                            registro.estado || "—"
                        )}
                    </td>

                    <td>

                        <button
                            type="button"
                            class="admin-btn admin-btn-danger"
                            onclick="eliminarRegistro('${registro.id}')"
                        >
                            EZABATU
                        </button>

                    </td>

                </tr>
            `
        )
        .join("");


    container.innerHTML = `

        <table class="admin-table">

            <thead>

                <tr>

                    <th>Data</th>
                    <th>Zentroa</th>
                    <th>Zeregina</th>
                    <th>Mota</th>
                    <th>Azpimota</th>
                    <th>Egoera</th>
                    <th>Ekintza</th>

                </tr>

            </thead>

            <tbody>
                ${filas}
            </tbody>

        </table>
    `;
}


// ============================================================
// ELIMINAR REGISTRO
// ============================================================

async function eliminarRegistro(
    registroId
) {

    const confirmar =
        window.confirm(
            "Ziur zaude erregistro hau ezabatu nahi duzula?"
        );


    if (!confirmar) {
        return;
    }


    try {

        const {
            error
        } = await window.hlbpSupabase
            .from("registros")
            .delete()
            .eq(
                "id",
                registroId
            );


        if (error) {
            throw error;
        }


        alert(
            "Erregistroa ezabatu da."
        );


        window.location.reload();


    } catch (error) {

        console.error(
            "Error eliminando registro:",
            error
        );


        alert(
            "Ezin izan da erregistroa ezabatu: " +
            error.message
        );
    }
}


// ============================================================
// ELIMINAR PERSONA
// ============================================================

function prepararEliminacionPersona(
    personaId,
    nombre
) {

    const confirmar =
        window.confirm(
            `ADI!\n\n` +
            `“${nombre}” pertsona ezabatuko duzu.\n\n` +
            `Pertsona horren kontua eta bere erregistro guztiak ezabatuko dira.\n\n` +
            `Ekintza hau EZIN da desegin.\n\n` +
            `Jarraitu nahi duzu?`
        );


    if (!confirmar) {
        return;
    }


    alert(
        "Pertsonen ezabaketa segurua hurrengo urratsean aktibatuko dugu."
    );
}


// ============================================================
// DESCARGA PERSONA
// ============================================================

async function descargarRegistrosPersona(
    personaId,
    nombre
) {

    alert(
        `Prestatu beharreko Excel-a:\n\n${nombre}`
    );
}


// ============================================================
// DESCARGA GLOBAL
// ============================================================

async function descargarTodosLosRegistros() {

    alert(
        "Prestatu beharreko Excel globala."
    );
}


// ============================================================
// INICIALES
// ============================================================

function obtenerIniciales(
    nombre
) {

    const partes =
        nombre
            .trim()
            .split(/\s+/)
            .filter(Boolean);


    if (!partes.length) {
        return "U";
    }


    if (partes.length === 1) {

        return partes[0]
            .substring(0, 2)
            .toUpperCase();
    }


    return (
        partes[0].charAt(0) +
        partes[
            partes.length - 1
        ].charAt(0)
    ).toUpperCase();
}


// ============================================================
// ESCAPE HTML
// ============================================================

function escapeHtml(
    valor
) {

    return String(valor ?? "")
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );
}
