// ============================================================
// HLBP - ADMINISTRAZIOA
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
    iniciarAdministrazioa();
});


// ============================================================
// INICIO
// ============================================================

async function iniciarAdministrazioa() {

    try {

        console.log("HLBP Administrazioa: iniciando...");

        // ----------------------------------------------------
        // SESIÓN
        // ----------------------------------------------------

        const sesionOk =
            await window.HLBPSession.init();

        if (!sesionOk) {

            console.error(
                "Administrazioa: no hay sesión."
            );

            window.location.replace("../index.html");
            return;
        }


        console.log(
            "HLBP Administrazioa: usuario autenticado:",
            window.HLBPSession.user?.email
        );


        // ----------------------------------------------------
        // PERMISOS
        // ----------------------------------------------------

        if (
            !window.HLBPSession.isAdminOrMaster()
        ) {

            console.error(
                "Administrazioa: usuario sin permisos."
            );

            window.location.replace(
                "dashboard.html"
            );

            return;
        }


        // ----------------------------------------------------
        // LAYOUT
        // ----------------------------------------------------

        window.HLBPLayout.render();


        const pageContent =
            document.getElementById(
                "pageContent"
            );


        if (!pageContent) {

            throw new Error(
                "No se encontró #pageContent después de cargar el layout."
            );

        }


        console.log(
            "Administrazioa: #pageContent encontrado."
        );


        // ----------------------------------------------------
        // ¿FICHA INDIVIDUAL?
        // ----------------------------------------------------

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


        // ----------------------------------------------------
        // LISTADO GENERAL
        // ----------------------------------------------------

        await renderAdministrazioa();

    } catch (error) {

        console.error(
            "Administrazioa: error inicializando:",
            error
        );

        mostrarErrorAdministrazioa(
            error
        );
    }
}


// ============================================================
// RENDER PRINCIPAL
// ============================================================

async function renderAdministrazioa() {

    const pageContent =
        document.getElementById(
            "pageContent"
        );


    if (!pageContent) {

        throw new Error(
            "No existe #pageContent."
        );

    }


    pageContent.innerHTML = `

        <div class="admin-page">

            <div class="admin-page-header">

                <div>

                    <div class="admin-breadcrumb">
                        HLBP / Administrazioa
                    </div>

                    <h1>
                        Aholkulariak Kudeaketa
                    </h1>

                    <p>
                        Aholkulariak, zentroak eta erregistroak
                        kudeatzeko administrazio panela.
                    </p>

                </div>


                <div class="admin-header-actions">

                    <button
                        type="button"
                        class="admin-btn admin-btn-secondary"
                        id="btnExcelGlobal"
                    >
                        📥 Excelera deskargatu
                    </button>


                    <button
                        type="button"
                        class="admin-btn admin-btn-primary"
                        id="btnNuevoAholkularia"
                    >
                        ＋ Gehitu Aholkularia
                    </button>

                </div>

            </div>


            <div id="adminContent">

                <div class="admin-loading">

                    <div class="loading-spinner"></div>

                    <p>
                        Kargatzen...
                    </p>

                </div>

            </div>

        </div>
    `;


    document
        .getElementById(
            "btnNuevoAholkularia"
        )
        ?.addEventListener(
            "click",
            mostrarFormularioNuevoAholkularia
        );


    document
        .getElementById(
            "btnExcelGlobal"
        )
        ?.addEventListener(
            "click",
            descargarExcelGlobal
        );


    await cargarListadoAholkulariak();
}


// ============================================================
// LISTADO DE AHOLKULARIAK
// ============================================================

async function cargarListadoAholkulariak() {

    const container =
        document.getElementById(
            "adminContent"
        );


    if (!container) return;


    container.innerHTML = `

        <div class="admin-loading">

            <div class="loading-spinner"></div>

            <p>
                Aholkulariak kargatzen...
            </p>

        </div>
    `;


    try {

        // ----------------------------------------------------
        // PERFILES
        // ----------------------------------------------------

        const {
            data: perfiles,
            error: perfilesError
        } =
            await window.hlbpSupabase
                .from("profiles")
                .select(`
                    id,
                    email,
                    nombre,
                    apellidos,
                    codigo,
                    role,
                    berritzegune,
                    espezialitatea,
                    activo
                `)
                .eq(
                    "role",
                    "AHL"
                )
                .order(
                    "apellidos",
                    {
                        ascending: true
                    }
                )
                .order(
                    "nombre",
                    {
                        ascending: true
                    }
                );


        if (perfilesError) {
            throw perfilesError;
        }


        const personas =
            perfiles || [];


        // ----------------------------------------------------
        // REGISTROS
        // ----------------------------------------------------

        const {
            data: registros,
            error: registrosError
        } =
            await window.hlbpSupabase
                .from("registros")
                .select(`
                    id,
                    aholkulari_id
                `);


        if (registrosError) {
            throw registrosError;
        }


        // ----------------------------------------------------
        // RELACIONES AHOLKULARIA - CENTRO
        // ----------------------------------------------------

        const {
            data: relacionesCentros,
            error: relacionesError
        } =
            await window.hlbpSupabase
                .from(
                    "aholkulari_centros"
                )
                .select(`
                    id,
                    aholkulari_id,
                    centro_id
                `);


        if (relacionesError) {
            throw relacionesError;
        }


        // ----------------------------------------------------
        // CENTROS
        // ----------------------------------------------------

        const {
            data: centros,
            error: centrosError
        } =
            await window.hlbpSupabase
                .from("centros")
                .select(`
                    id,
                    codigo,
                    nombre,
                    activo
                `)
                .order(
                    "codigo",
                    {
                        ascending: true
                    }
                );


        if (centrosError) {
            throw centrosError;
        }


        // ----------------------------------------------------
        // MAPA DE CENTROS
        // ----------------------------------------------------

        const centrosMap =
            new Map();


        (centros || []).forEach(
            centro => {

                centrosMap.set(
                    String(centro.id),
                    centro
                );

            }
        );


        // ----------------------------------------------------
        // CONSTRUIR DATOS
        // ----------------------------------------------------

        const datos =
            personas.map(
                persona => {

                    const personaId =
                        String(
                            persona.id
                        );


                    const registrosPersona =
                        (
                            registros || []
                        ).filter(
                            registro =>
                                String(
                                    registro.aholkulari_id
                                ) === personaId
                        );


                    const relacionesPersona =
                        (
                            relacionesCentros || []
                        ).filter(
                            relacion =>
                                String(
                                    relacion.aholkulari_id
                                ) === personaId
                        );


                    const centrosPersona =
                        relacionesPersona
                            .map(
                                relacion =>
                                    centrosMap.get(
                                        String(
                                            relacion.centro_id
                                        )
                                    )
                            )
                            .filter(Boolean);


                    return {

                        ...persona,

                        registrosCount:
                            registrosPersona.length,

                        centrosCount:
                            centrosPersona.length,

                        centros:
                            centrosPersona

                    };

                }
            );


        renderListado(
            datos
        );


    } catch (error) {

        console.error(
            "Error cargando Aholkulariak:",
            error
        );


        container.innerHTML = `

            <div class="admin-panel">

                <div class="admin-empty-state">

                    <div class="admin-empty-icon">
                        ⚠️
                    </div>


                    <h3>
                        Ezin izan dira Aholkulariak kargatu
                    </h3>


                    <p>
                        ${escapeHtml(
                            obtenerMensajeError(
                                error
                            )
                        )}
                    </p>


                    <button
                        type="button"
                        class="admin-btn admin-btn-primary"
                        onclick="cargarListadoAholkulariak()"
                    >
                        Berriro saiatu
                    </button>

                </div>

            </div>
        `;
    }
}


// ============================================================
// RENDER LISTADO
// ============================================================

function renderListado(
    personas
) {

    const container =
        document.getElementById(
            "adminContent"
        );


    if (!container) return;


    const totalPersonas =
        personas.length;


    const totalRegistros =
        personas.reduce(
            (
                total,
                persona
            ) =>
                total +
                persona.registrosCount,
            0
        );


    const totalCentros =
        personas.reduce(
            (
                total,
                persona
            ) =>
                total +
                persona.centrosCount,
            0
        );


    container.innerHTML = `

        <div class="admin-summary">

            <div class="admin-stat-card">

                <div class="admin-stat-icon">
                    👥
                </div>

                <div>

                    <span class="admin-stat-label">
                        Aholkulariak
                    </span>

                    <strong class="admin-stat-value">
                        ${totalPersonas}
                    </strong>

                </div>

            </div>


            <div class="admin-stat-card">

                <div class="admin-stat-icon">
                    📋
                </div>

                <div>

                    <span class="admin-stat-label">
                        Erregistroak
                    </span>

                    <strong class="admin-stat-value">
                        ${totalRegistros}
                    </strong>

                </div>

            </div>


            <div class="admin-stat-card">

                <div class="admin-stat-icon">
                    🏫
                </div>

                <div>

                    <span class="admin-stat-label">
                        Zentroen esleipenak
                    </span>

                    <strong class="admin-stat-value">
                        ${totalCentros}
                    </strong>

                </div>

            </div>

        </div>


        <div class="admin-panel">

            <div class="admin-panel-header">

                <div>

                    <h2>
                        Aholkulariak
                    </h2>

                    <p>
                        Sistemako Aholkulariak kudeatu.
                    </p>

                </div>

            </div>


            <div class="admin-filters">

                <div class="admin-filter-group">

                    <label for="adminSearch">
                        Bilatu
                    </label>

                    <input
                        type="search"
                        id="adminSearch"
                        class="admin-input"
                        placeholder="Izena, kodigoa edo emaila..."
                    >

                </div>


                <div class="admin-filter-group">

                    <label for="adminEspecialidad">
                        Espezialitatea
                    </label>

                    <select
                        id="adminEspecialidad"
                        class="admin-input"
                    >

                        <option value="">
                            Guztiak
                        </option>

                        <option value="Inklusioa">
                            Inklusioa
                        </option>

                        <option value="Bizikidetza">
                            Bizikidetza
                        </option>

                        <option value="Posbentzioa">
                            Posbentzioa
                        </option>

                    </select>

                </div>


                <div class="admin-filter-group">

                    <label for="adminBerritzegune">
                        Berritzegunea
                    </label>

                    <select
                        id="adminBerritzegune"
                        class="admin-input"
                    >

                        <option value="">
                            Guztiak
                        </option>

                        ${obtenerBerritzeguneOptions(
                            personas
                        )}

                    </select>

                </div>

            </div>


            <div
                id="adminTableContainer"
                class="admin-table-container"
            ></div>

        </div>
    `;


    const search =
        document.getElementById(
            "adminSearch"
        );


    const especialidad =
        document.getElementById(
            "adminEspecialidad"
        );


    const berritzegune =
        document.getElementById(
            "adminBerritzegune"
        );


    function aplicarFiltros() {

        const texto =
            search?.value
                .trim()
                .toLowerCase() || "";


        const especialidadValue =
            especialidad?.value || "";


        const berritzeguneValue =
            berritzegune?.value || "";


        const filtradas =
            personas.filter(
                persona => {

                    const nombre =
                        `${
                            persona.nombre || ""
                        } ${
                            persona.apellidos || ""
                        }`
                            .trim()
                            .toLowerCase();


                    const codigo =
                        String(
                            persona.codigo || ""
                        ).toLowerCase();


                    const email =
                        String(
                            persona.email || ""
                        ).toLowerCase();


                    const coincideTexto =
                        !texto ||
                        nombre.includes(
                            texto
                        ) ||
                        codigo.includes(
                            texto
                        ) ||
                        email.includes(
                            texto
                        );


                    const coincideEspecialidad =
                        !especialidadValue ||
                        persona.espezialitatea ===
                            especialidadValue;


                    const coincideBerritzegune =
                        !berritzeguneValue ||
                        persona.berritzegune ===
                            berritzeguneValue;


                    return (
                        coincideTexto &&
                        coincideEspecialidad &&
                        coincideBerritzegune
                    );

                }
            );


        renderTablaAholkulariak(
            filtradas
        );
    }


    search?.addEventListener(
        "input",
        aplicarFiltros
    );


    especialidad?.addEventListener(
        "change",
        aplicarFiltros
    );


    berritzegune?.addEventListener(
        "change",
        aplicarFiltros
    );


    aplicarFiltros();
}


// ============================================================
// TABLA AHOLKULARIAK
// ============================================================

function renderTablaAholkulariak(
    personas
) {

    const container =
        document.getElementById(
            "adminTableContainer"
        );


    if (!container) return;


    if (!personas.length) {

        container.innerHTML = `

            <div class="admin-empty-state">

                <div class="admin-empty-icon">
                    👥
                </div>

                <h3>
                    Ez dago emaitzarik
                </h3>

                <p>
                    Ez da Aholkularirik aurkitu
                    hautatutako irizpideekin.
                </p>

            </div>
        `;

        return;
    }


    const rows =
        personas.map(
            persona => {

                const nombre =
                    `${
                        persona.nombre || ""
                    } ${
                        persona.apellidos || ""
                    }`
                        .trim() ||
                    persona.email ||
                    "—";


                const centros =
                    persona.centros || [];


                const centrosTexto =
                    centros.length
                        ? centros
                            .map(
                                centro =>
                                    centro.codigo ||
                                    centro.nombre ||
                                    ""
                            )
                            .filter(Boolean)
                            .join(", ")
                        : "—";


                return `

                    <tr>

                        <td>
                            <strong>
                                ${escapeHtml(
                                    persona.codigo ||
                                    "—"
                                )}
                            </strong>
                        </td>


                        <td>

                            <div class="admin-person-name">
                                ${escapeHtml(
                                    nombre
                                )}
                            </div>

                            <div class="admin-person-email">
                                ${escapeHtml(
                                    persona.email ||
                                    ""
                                )}
                            </div>

                        </td>


                        <td>
                            ${escapeHtml(
                                persona.berritzegune ||
                                "—"
                            )}
                        </td>


                        <td>

                            ${
                                persona.espezialitatea
                                    ? `
                                        <span class="admin-badge">
                                            ${escapeHtml(
                                                persona.espezialitatea
                                            )}
                                        </span>
                                      `
                                    : "—"
                            }

                        </td>


                        <td>
                            ${escapeHtml(
                                centrosTexto
                            )}
                        </td>


                        <td>

                            <strong>
                                ${persona.registrosCount}
                            </strong>

                        </td>


                        <td>

                            <button
                                type="button"
                                class="admin-btn admin-btn-small admin-btn-secondary"
                                data-persona-id="${escapeHtml(
                                    persona.id
                                )}"
                                onclick="abrirPersonaDesdeBoton(this)"
                            >
                                IKUSI
                            </button>

                        </td>

                    </tr>
                `;
            }
        )
        .join("");


    container.innerHTML = `

        <div class="admin-table-wrapper">

            <table class="admin-table">

                <thead>

                    <tr>
                        <th>Kodigoa</th>
                        <th>Izena</th>
                        <th>Kokapena</th>
                        <th>Espezialitatea</th>
                        <th>Zentroak</th>
                        <th>Erregistroak</th>
                        <th>Ekintza</th>
                    </tr>

                </thead>


                <tbody>
                    ${rows}
                </tbody>

            </table>

        </div>
    `;
}


// ============================================================
// ABRIR PERSONA
// ============================================================

function abrirPersonaDesdeBoton(
    button
) {

    const id =
        button.dataset.personaId;


    if (!id) return;


    window.location.href =
        `administrazioa.html?persona=${encodeURIComponent(
            id
        )}`;
}


// ============================================================
// FORMULARIO NUEVO AHOLKULARIA
// ============================================================

function mostrarFormularioNuevoAholkularia() {

    const pageContent =
        document.getElementById(
            "pageContent"
        );


    if (!pageContent) return;


    pageContent.innerHTML = `

        <div class="admin-page">

            <div class="admin-page-header">

                <div>

                    <div class="admin-breadcrumb">
                        HLBP / Administrazioa /
                        Aholkularia berria
                    </div>


                    <h1>
                        Aholkularia gehitu
                    </h1>


                    <p>
                        Sortu Aholkulariaren erabiltzaile-kontua
                        eta lotu dagokion informazioa.
                    </p>

                </div>


                <div class="admin-header-actions">

                    <button
                        type="button"
                        class="admin-btn admin-btn-secondary"
                        id="btnVolverListado"
                    >
                        ← Itzuli
                    </button>

                </div>

            </div>


            <div class="admin-panel">

                <div class="admin-panel-header">

                    <div>

                        <h2>
                            Aholkulariaren datuak
                        </h2>

                        <p>
                            Derrigorrezko eremuak *
                            batekin markatuta daude.
                        </p>

                    </div>

                </div>


                <form
                    id="nuevoAholkulariaForm"
                    class="admin-form"
                >

                    <div class="admin-form-grid">


                        <!-- IZENA -->

                        <div class="admin-form-group">

                            <label for="nuevoNombre">
                                Izena *
                            </label>

                            <input
                                type="text"
                                id="nuevoNombre"
                                class="admin-input"
                                required
                                autocomplete="off"
                            >

                        </div>


                        <!-- ABIZENAK -->

                        <div class="admin-form-group">

                            <label for="nuevoApellidos">
                                Abizenak *
                            </label>

                            <input
                                type="text"
                                id="nuevoApellidos"
                                class="admin-input"
                                required
                                autocomplete="off"
                            >

                        </div>


                        <!-- KODIGOA -->

                        <div class="admin-form-group">

                            <label for="nuevoCodigo">
                                Kodigoa *
                            </label>

                            <input
                                type="text"
                                id="nuevoCodigo"
                                class="admin-input"
                                required
                                autocomplete="off"
                            >

                        </div>


                        <!-- BERRITZEGUNE -->

                        <div class="admin-form-group">

                            <label for="nuevoBerritzegune">
                                Berritzegune *
                            </label>

                            <input
                                type="text"
                                id="nuevoBerritzegune"
                                class="admin-input"
                                required
                                autocomplete="off"
                            >

                        </div>


                        <!-- ESPEZIALITATEA -->

                        <div class="admin-form-group">

                            <label for="nuevoEspecialidad">
                                Espezialitatea *
                            </label>

                            <select
                                id="nuevoEspecialidad"
                                class="admin-input"
                                required
                            >

                                <option value="">
                                    Aukeratu...
                                </option>

                                <option value="Inklusioa">
                                    Inklusioa
                                </option>

                                <option value="Bizikidetza">
                                    Bizikidetza
                                </option>

                                <option value="Posbentzioa">
                                    Posbentzioa
                                </option>

                            </select>

                        </div>


                        <!-- EMAIL -->

                        <div class="admin-form-group">

                            <label for="nuevoEmail">
                                Emaila *
                            </label>

                            <input
                                type="email"
                                id="nuevoEmail"
                                class="admin-input"
                                required
                                autocomplete="off"
                                placeholder="adibidea@bizilab.eus"
                            >

                            <small>
                                Email hau izango da
                                Aholkulariak saioa hasteko
                                erabiliko duen erabiltzailea.
                                Ez da gonbidapenik bidaliko.
                            </small>

                        </div>


                        <!-- CENTROS -->

                        <div class="admin-form-group admin-form-full">

                            <label for="nuevoCentros">
                                Zentroak
                            </label>

                            <input
                                type="text"
                                id="nuevoCentros"
                                class="admin-input"
                                placeholder="1001, 1002, 1003"
                                autocomplete="off"
                            >

                            <small>
                                Zentroen kodigoak koma bidez
                                bereizita.
                            </small>

                        </div>

                    </div>


                    <div
                        id="nuevoAholkulariaMessage"
                        class="admin-form-message"
                        aria-live="polite"
                    ></div>


                    <div class="admin-form-actions">

                        <button
                            type="button"
                            class="admin-btn admin-btn-secondary"
                            id="btnCancelarNuevo"
                        >
                            Utzi
                        </button>


                        <button
                            type="submit"
                            class="admin-btn admin-btn-primary"
                            id="btnCrearAholkularia"
                        >
                            ➕ Gehitu Aholkularia
                        </button>

                    </div>

                </form>

            </div>

        </div>
    `;


    document
        .getElementById(
            "btnVolverListado"
        )
        ?.addEventListener(
            "click",
            cargarListadoAholkulariak
        );


    document
        .getElementById(
            "btnCancelarNuevo"
        )
        ?.addEventListener(
            "click",
            cargarListadoAholkulariak
        );


    document
        .getElementById(
            "nuevoAholkulariaForm"
        )
        ?.addEventListener(
            "submit",
            crearAholkularia
        );
}


// ============================================================
// CREAR AHOLKULARIA
// ============================================================

async function crearAholkularia(
    event
) {

    event.preventDefault();


    const button =
        document.getElementById(
            "btnCrearAholkularia"
        );


    const message =
        document.getElementById(
            "nuevoAholkulariaMessage"
        );


    // --------------------------------------------------------
    // DATOS
    // --------------------------------------------------------

    const nombre =
        document.getElementById(
            "nuevoNombre"
        )?.value.trim();


    const apellidos =
        document.getElementById(
            "nuevoApellidos"
        )?.value.trim();


    const codigo =
        document.getElementById(
            "nuevoCodigo"
        )?.value.trim();


    const berritzegune =
        document.getElementById(
            "nuevoBerritzegune"
        )?.value.trim();


    const espezialitatea =
        document.getElementById(
            "nuevoEspecialidad"
        )?.value;


    const email =
        document.getElementById(
            "nuevoEmail"
        )?.value
            .trim()
            .toLowerCase();


    const centrosTexto =
        document.getElementById(
            "nuevoCentros"
        )?.value.trim();


    // --------------------------------------------------------
    // VALIDACIÓN
    // --------------------------------------------------------

    if (
        !nombre ||
        !apellidos ||
        !codigo ||
        !berritzegune ||
        !espezialitatea ||
        !email
    ) {

        mostrarFormularioMensaje(
            message,
            "Bete derrigorrezko eremu guztiak.",
            "error"
        );

        return;
    }


    // --------------------------------------------------------
    // VALIDAR EMAIL
    // --------------------------------------------------------

    const emailRegex =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


    if (
        !emailRegex.test(email)
    ) {

        mostrarFormularioMensaje(
            message,
            "Email helbideak ez du formatu zuzena.",
            "error"
        );

        return;
    }


    // --------------------------------------------------------
    // CENTROS
    // --------------------------------------------------------

    const centros =
        centrosTexto
            ? centrosTexto
                .split(",")
                .map(
                    valor =>
                        valor.trim()
                )
                .filter(Boolean)
            : [];


    // --------------------------------------------------------
    // BOTÓN
    // --------------------------------------------------------

    if (button) {

        button.disabled = true;

        button.dataset.originalText =
            button.textContent;

        button.textContent =
            "Sortzen...";

    }


    mostrarFormularioMensaje(
        message,
        "Aholkulariaren kontua sortzen...",
        "loading"
    );


    try {

        console.log(
            "HLBP: create-aholkularia invoke..."
        );


        // ----------------------------------------------------
        // EDGE FUNCTION
        // ----------------------------------------------------

        const {
            data,
            error
        } =
            await window.hlbpSupabase.functions.invoke(
                "create-aholkularia",
                {
                    body: {

                        nombre,

                        apellidos,

                        codigo,

                        berritzegune,

                        espezialitatea,

                        email,

                        centros

                    }
                }
            );


        // ----------------------------------------------------
        // ERROR
        // ----------------------------------------------------

        if (error) {

            console.error(
                "Edge Function error:",
                error
            );


            let mensaje =
                error.message ||
                "Ezin izan da Aholkularia sortu.";


            if (
                error.context?.body
            ) {

                try {

                    const body =
                        typeof error.context.body ===
                            "string"
                            ? JSON.parse(
                                error.context.body
                            )
                            : error.context.body;


                    if (body?.error) {

                        mensaje =
                            body.error;

                    }

                } catch {

                    // Ignorar error de parseo.

                }

            }


            throw new Error(
                mensaje
            );
        }


        // ----------------------------------------------------
        // COMPROBAR RESPUESTA
        // ----------------------------------------------------

        if (
            !data ||
            data.success !== true
        ) {

            throw new Error(
                data?.error ||
                "Ezin izan da Aholkularia sortu."
            );

        }


        console.log(
            "HLBP: Aholkularia sortuta:",
            data
        );


        // ----------------------------------------------------
        // CONTRASEÑA INICIAL
        // ----------------------------------------------------

        const initialPassword =
            data.initialPassword || "";


        // ----------------------------------------------------
        // MOSTRAR RESULTADO
        // ----------------------------------------------------

        message.className =
            "admin-form-message success";


        message.innerHTML = `

            <div style="
                display:flex;
                flex-direction:column;
                gap:12px;
            ">

                <strong>
                    ✅ Aholkularia behar bezala sortu da.
                </strong>


                <div>
                    <strong>
                        Emaila:
                    </strong>

                    ${escapeHtml(
                        email
                    )}
                </div>


                <div>

                    <strong>
                        Hasierako pasahitza:
                    </strong>


                    <div style="
                        display:flex;
                        align-items:center;
                        gap:8px;
                        margin-top:6px;
                        flex-wrap:wrap;
                    ">

                        <code
                            id="initialPasswordValue"
                            style="
                                padding:8px 12px;
                                border-radius:6px;
                                background:#f3f3f3;
                                font-size:15px;
                                font-weight:700;
                            "
                        >
                            ${escapeHtml(
                                initialPassword
                            )}
                        </code>


                        <button
                            type="button"
                            class="admin-btn admin-btn-small admin-btn-secondary"
                            id="btnCopyInitialPassword"
                        >
                            📋 Kopiatu
                        </button>

                    </div>

                </div>


                <small>
                    Ez da emailik bidali.
                    Aholkulariak email honekin eta
                    goiko hasierako pasahitzarekin
                    sartu beharko du.
                </small>

            </div>

        `;


        // ----------------------------------------------------
        // COPIAR PASSWORD
        // ----------------------------------------------------

        document
            .getElementById(
                "btnCopyInitialPassword"
            )
            ?.addEventListener(
                "click",
                async () => {

                    try {

                        await navigator
                            .clipboard
                            .writeText(
                                initialPassword
                            );


                        const copyButton =
                            document.getElementById(
                                "btnCopyInitialPassword"
                            );


                        if (copyButton) {

                            copyButton.textContent =
                                "✅ Kopiatuta";


                            setTimeout(
                                () => {

                                    copyButton.textContent =
                                        "📋 Kopiatu";

                                },
                                2000
                            );

                        }

                    } catch (copyError) {

                        console.error(
                            "Error copiando contraseña:",
                            copyError
                        );


                        alert(
                            `Hasierako pasahitza: ${initialPassword}`
                        );

                    }

                }
            );


        // ----------------------------------------------------
        // LIMPIAR FORMULARIO
        // ----------------------------------------------------

        document
            .getElementById(
                "nuevoAholkulariaForm"
            )
            ?.reset();


        // ----------------------------------------------------
        // RESTAURAR BOTÓN
        // ----------------------------------------------------

        if (button) {

            button.disabled =
                false;

            button.textContent =
                button.dataset.originalText ||
                "➕ Gehitu Aholkularia";

        }


    } catch (error) {

        console.error(
            "Errorea Aholkularia sortzean:",
            error
        );


        mostrarFormularioMensaje(
            message,
            obtenerMensajeError(
                error
            ),
            "error"
        );


        if (button) {

            button.disabled =
                false;

            button.textContent =
                button.dataset.originalText ||
                "➕ Gehitu Aholkularia";

        }
    }
}


// ============================================================
// PERSONA - VISTA INDIVIDUAL
// ============================================================

async function cargarPersona(
    id
) {

    const pageContent =
        document.getElementById(
            "pageContent"
        );


    if (!pageContent) return;


    pageContent.innerHTML = `

        <div class="admin-loading">

            <div class="loading-spinner"></div>

            <p>
                Aholkulariaren informazioa kargatzen...
            </p>

        </div>
    `;


    try {

        // ----------------------------------------------------
        // PERSONA
        // ----------------------------------------------------

        const {
            data: persona,
            error: personaError
        } =
            await window.hlbpSupabase
                .from("profiles")
                .select(`
                    id,
                    email,
                    nombre,
                    apellidos,
                    codigo,
                    role,
                    berritzegune,
                    espezialitatea,
                    activo
                `)
                .eq(
                    "id",
                    id
                )
                .maybeSingle();


        if (personaError) {
            throw personaError;
        }


        if (!persona) {

            throw new Error(
                "Ez da Aholkularia aurkitu."
            );

        }


        // ----------------------------------------------------
        // REGISTROS
        // ----------------------------------------------------

        const {
            data: registros,
            error: registrosError
        } =
            await window.hlbpSupabase
                .from("registros")
                .select(`
                    id,
                    aholkulari_id,
                    fecha,
                    fecha_fin,
                    centro_id,
                    tarea,
                    tipo,
                    subtipo,
                    estudiante_id,
                    zehaztu,
                    estado,
                    observaciones,
                    created_at
                `)
                .eq(
                    "aholkulari_id",
                    id
                )
                .order(
                    "fecha",
                    {
                        ascending: false
                    }
                );


        if (registrosError) {
            throw registrosError;
        }


        // ----------------------------------------------------
        // CENTROS ASIGNADOS
        // ----------------------------------------------------

        const {
            data: relaciones,
            error: relacionesError
        } =
            await window.hlbpSupabase
                .from(
                    "aholkulari_centros"
                )
                .select(`
                    id,
                    aholkulari_id,
                    centro_id
                `)
                .eq(
                    "aholkulari_id",
                    id
                );


        if (relacionesError) {
            throw relacionesError;
        }


        const centroIds =
            (relaciones || [])
                .map(
                    relacion =>
                        relacion.centro_id
                )
                .filter(
                    id =>
                        id !== null &&
                        id !== undefined
                );


        let centros = [];


        // ----------------------------------------------------
        // CENTROS
        // ----------------------------------------------------

        if (centroIds.length > 0) {

            const {
                data,
                error
            } =
                await window.hlbpSupabase
                    .from("centros")
                    .select(`
                        id,
                        codigo,
                        nombre,
                        activo
                    `)
                    .in(
                        "id",
                        centroIds
                    )
                    .order(
                        "codigo",
                        {
                            ascending: true
                        }
                    );


            if (error) {
                throw error;
            }


            centros =
                data || [];
        }


        // ----------------------------------------------------
        // RENDER
        // ----------------------------------------------------

        renderPersona(
            persona,
            registros || [],
            centros
        );


    } catch (error) {

        console.error(
            "Error cargando persona:",
            error
        );


        pageContent.innerHTML = `

            <div class="admin-panel">

                <div class="admin-empty-state">

                    <div class="admin-empty-icon">
                        ⚠️
                    </div>


                    <h3>
                        Ezin izan da informazioa kargatu
                    </h3>


                    <p>
                        ${escapeHtml(
                            obtenerMensajeError(
                                error
                            )
                        )}
                    </p>


                    <button
                        type="button"
                        class="admin-btn admin-btn-primary"
                        onclick="cargarListadoAholkulariak()"
                    >
                        ← Itzuli
                    </button>

                </div>

            </div>
        `;
    }
}


// ============================================================
// RENDER PERSONA
// ============================================================

function renderPersona(
    persona,
    registros,
    centros
) {

    const pageContent =
        document.getElementById(
            "pageContent"
        );


    if (!pageContent) return;


    const nombre =
        `${
            persona.nombre || ""
        } ${
            persona.apellidos || ""
        }`
            .trim() ||
        persona.email ||
        "Aholkularia";


    pageContent.innerHTML = `

        <div class="admin-page">

            <div class="admin-page-header">

                <div>

                    <div class="admin-breadcrumb">
                        HLBP / Administrazioa /
                        ${escapeHtml(
                            nombre
                        )}
                    </div>


                    <h1>
                        ${escapeHtml(
                            nombre
                        )}
                    </h1>


                    <p>
                        Aholkulariaren informazioa
                        eta erregistroak.
                    </p>

                </div>


                <div class="admin-header-actions">

                    <button
                        type="button"
                        class="admin-btn admin-btn-secondary"
                        onclick="cargarListadoAholkulariak()"
                    >
                        ← Itzuli
                    </button>


                    <button
                        type="button"
                        class="admin-btn admin-btn-secondary"
                        onclick="descargarExcelPersona()"
                    >
                        📥 Excelera deskargatu
                    </button>

                </div>

            </div>


            <div class="admin-panel">

                <div class="admin-panel-header">

                    <div>

                        <h2>
                            Aholkulariaren datuak
                        </h2>

                    </div>

                </div>


                <div class="person-info-grid">


                    <div class="person-info-item">

                        <span>
                            Kodigoa
                        </span>

                        <strong>
                            ${escapeHtml(
                                persona.codigo ||
                                "—"
                            )}
                        </strong>

                    </div>


                    <div class="person-info-item">

                        <span>
                            Izena
                        </span>

                        <strong>
                            ${escapeHtml(
                                nombre
                            )}
                        </strong>

                    </div>


                    <div class="person-info-item">

                        <span>
                            Emaila
                        </span>

                        <strong>
                            ${escapeHtml(
                                persona.email ||
                                "—"
                            )}
                        </strong>

                    </div>


                    <div class="person-info-item">

                        <span>
                            Kokapena
                        </span>

                        <strong>
                            ${escapeHtml(
                                persona.berritzegune ||
                                "—"
                            )}
                        </strong>

                    </div>


                    <div class="person-info-item">

                        <span>
                            Espezialitatea
                        </span>

                        <strong>
                            ${escapeHtml(
                                persona.espezialitatea ||
                                "—"
                            )}
                        </strong>

                    </div>


                    <div class="person-info-item">

                        <span>
                            Zentroak
                        </span>

                        <strong>
                            ${centros.length}
                        </strong>

                    </div>

                </div>


                <div class="person-centers">

                    <h3>
                        Esleitutako zentroak
                    </h3>


                    ${
                        centros.length
                            ? `
                                <div class="person-center-list">

                                    ${centros
                                        .map(
                                            centro => `

                                                <span class="admin-badge">

                                                    ${escapeHtml(
                                                        centro.codigo ||
                                                        centro.nombre ||
                                                        "—"
                                                    )}

                                                </span>
                                            `
                                        )
                                        .join("")}

                                </div>
                              `
                            : `
                                <p class="admin-muted">
                                    Ez dago zentrorik esleituta.
                                </p>
                              `
                    }

                </div>

            </div>


            <div class="admin-panel">

                <div class="admin-panel-header">

                    <div>

                        <h2>
                            Erregistroak
                        </h2>


                        <p>
                            Guztira:
                            <strong>
                                ${registros.length}
                            </strong>
                        </p>

                    </div>

                </div>


                ${renderFiltrosRegistros()}


                <div
                    id="personaRecordsContainer"
                    class="admin-table-container"
                ></div>

            </div>

        </div>
    `;


    window.HLBPAdminPersona = {

        persona,

        registros,

        centros
    };


    inicializarFiltrosRegistros();


    renderTablaRegistros(
        registros
    );
}


// ============================================================
// FILTROS REGISTROS
// ============================================================

function renderFiltrosRegistros() {

    return `

        <div class="admin-filters admin-record-filters">

            <div class="admin-filter-group">

                <label for="recordSearch">
                    Bilatu
                </label>

                <input
                    type="search"
                    id="recordSearch"
                    class="admin-input"
                    placeholder="Bilatu erregistroetan..."
                >

            </div>


            <div class="admin-filter-group">

                <label for="recordFechaDesde">
                    Data hasiera
                </label>

                <input
                    type="date"
                    id="recordFechaDesde"
                    class="admin-input"
                >

            </div>


            <div class="admin-filter-group">

                <label for="recordFechaHasta">
                    Data amaiera
                </label>

                <input
                    type="date"
                    id="recordFechaHasta"
                    class="admin-input"
                >

            </div>


            <div class="admin-filter-group">

                <label for="recordCentro">
                    Zentroa
                </label>

                <input
                    type="text"
                    id="recordCentro"
                    class="admin-input"
                    placeholder="Kodea edo zentroa..."
                >

            </div>


            <div class="admin-filter-group">

                <label for="recordTarea">
                    Eginkizuna
                </label>

                <input
                    type="text"
                    id="recordTarea"
                    class="admin-input"
                    placeholder="Eginkizuna..."
                >

            </div>


            <div class="admin-filter-group">

                <label for="recordTipo">
                    Mota
                </label>

                <input
                    type="text"
                    id="recordTipo"
                    class="admin-input"
                    placeholder="Mota..."
                >

            </div>


            <div class="admin-filter-group">

                <label for="recordSubtipo">
                    Azpi-mota
                </label>

                <input
                    type="text"
                    id="recordSubtipo"
                    class="admin-input"
                    placeholder="Azpi-mota..."
                >

            </div>


            <div class="admin-filter-group">

                <label for="recordEstado">
                    Egoera
                </label>

                <select
                    id="recordEstado"
                    class="admin-input"
                >

                    <option value="">
                        Guztiak
                    </option>

                    <option value="Egin gabe">
                        Egin gabe
                    </option>

                    <option value="Eginda">
                        Eginda
                    </option>

                </select>

            </div>

        </div>
    `;
}


// ============================================================
// INICIALIZAR FILTROS
// ============================================================

function inicializarFiltrosRegistros() {

    const ids = [

        "recordSearch",

        "recordFechaDesde",

        "recordFechaHasta",

        "recordCentro",

        "recordTarea",

        "recordTipo",

        "recordSubtipo",

        "recordEstado"

    ];


    ids.forEach(
        id => {

            const elemento =
                document.getElementById(
                    id
                );


            if (!elemento) return;


            elemento.addEventListener(
                "input",
                aplicarFiltrosRegistros
            );


            elemento.addEventListener(
                "change",
                aplicarFiltrosRegistros
            );

        }
    );
}


// ============================================================
// APLICAR FILTROS REGISTROS
// ============================================================

function aplicarFiltrosRegistros() {

    const registros =
        window.HLBPAdminPersona
            ?.registros || [];


    const centros =
        window.HLBPAdminPersona
            ?.centros || [];


    const texto =
        document.getElementById(
            "recordSearch"
        )?.value
            .trim()
            .toLowerCase() || "";


    const fechaDesde =
        document.getElementById(
            "recordFechaDesde"
        )?.value || "";


    const fechaHasta =
        document.getElementById(
            "recordFechaHasta"
        )?.value || "";


    const centro =
        document.getElementById(
            "recordCentro"
        )?.value
            .trim()
            .toLowerCase() || "";


    const tarea =
        document.getElementById(
            "recordTarea"
        )?.value
            .trim()
            .toLowerCase() || "";


    const tipo =
        document.getElementById(
            "recordTipo"
        )?.value
            .trim()
            .toLowerCase() || "";


    const subtipo =
        document.getElementById(
            "recordSubtipo"
        )?.value
            .trim()
            .toLowerCase() || "";


    const estado =
        document.getElementById(
            "recordEstado"
        )?.value || "";


    const centrosMap =
        new Map();


    centros.forEach(
        item => {

            centrosMap.set(
                String(item.id),
                item
            );

        }
    );


    const filtrados =
        registros.filter(
            registro => {

                const centroRegistro =
                    centrosMap.get(
                        String(
                            registro.centro_id
                        )
                    );


                const centroTexto =
                    centroRegistro
                        ? `${
                            centroRegistro.codigo || ""
                        } ${
                            centroRegistro.nombre || ""
                        }`
                            .toLowerCase()
                        : String(
                            registro.centro_id || ""
                        ).toLowerCase();


                const valoresTexto = [

                    registro.fecha,

                    registro.fecha_fin,

                    registro.tarea,

                    registro.tipo,

                    registro.subtipo,

                    registro.estudiante_id,

                    registro.zehaztu,

                    registro.estado,

                    registro.observaciones,

                    centroTexto

                ]
                    .map(
                        valor =>
                            String(
                                valor || ""
                            ).toLowerCase()
                    )
                    .join(" ");


                const coincideTexto =
                    !texto ||
                    valoresTexto.includes(
                        texto
                    );


                const fecha =
                    registro.fecha || "";


                const coincideDesde =
                    !fechaDesde ||
                    fecha >= fechaDesde;


                const coincideHasta =
                    !fechaHasta ||
                    fecha <= fechaHasta;


                const coincideCentro =
                    !centro ||
                    centroTexto.includes(
                        centro
                    );


                const coincideTarea =
                    !tarea ||
                    String(
                        registro.tarea || ""
                    )
                        .toLowerCase()
                        .includes(
                            tarea
                        );


                const coincideTipo =
                    !tipo ||
                    String(
                        registro.tipo || ""
                    )
                        .toLowerCase()
                        .includes(
                            tipo
                        );


                const coincideSubtipo =
                    !subtipo ||
                    String(
                        registro.subtipo || ""
                    )
                        .toLowerCase()
                        .includes(
                            subtipo
                        );


                const coincideEstado =
                    !estado ||
                    registro.estado ===
                        estado;


                return (

                    coincideTexto &&

                    coincideDesde &&

                    coincideHasta &&

                    coincideCentro &&

                    coincideTarea &&

                    coincideTipo &&

                    coincideSubtipo &&

                    coincideEstado

                );

            }
        );


    renderTablaRegistros(
        filtrados
    );
}


// ============================================================
// TABLA REGISTROS
// ============================================================

function renderTablaRegistros(
    registros
) {

    const container =
        document.getElementById(
            "personaRecordsContainer"
        );


    if (!container) return;


    if (!registros.length) {

        container.innerHTML = `

            <div class="admin-empty-state">

                <div class="admin-empty-icon">
                    📋
                </div>


                <h3>
                    Ez dago erregistrorik
                </h3>


                <p>
                    Ez da erregistrorik aurkitu
                    hautatutako irizpideekin.
                </p>

            </div>
        `;

        return;
    }


    const centros =
        window.HLBPAdminPersona
            ?.centros || [];


    const centrosMap =
        new Map();


    centros.forEach(
        centro => {

            centrosMap.set(
                String(centro.id),
                centro
            );

        }
    );


    const rows =
        registros.map(
            registro => {

                const estadoClass =
                    registro.estado ===
                        "Eginda"
                        ? "admin-status-success"
                        : "admin-status-pending";


                const centro =
                    centrosMap.get(
                        String(
                            registro.centro_id
                        )
                    );


                const centroTexto =
                    centro
                        ? (
                            centro.codigo ||
                            centro.nombre ||
                            "—"
                        )
                        : (
                            registro.centro_id ||
                            "—"
                        );


                return `

                    <tr>

                        <td>
                            ${escapeHtml(
                                formatearFecha(
                                    registro.fecha
                                )
                            )}
                        </td>


                        <td>
                            ${escapeHtml(
                                registro.tarea ||
                                "—"
                            )}
                        </td>


                        <td>
                            ${escapeHtml(
                                registro.tipo ||
                                "—"
                            )}
                        </td>


                        <td>
                            ${escapeHtml(
                                registro.subtipo ||
                                "—"
                            )}
                        </td>


                        <td>
                            ${escapeHtml(
                                registro.estudiante_id ||
                                "—"
                            )}
                        </td>


                        <td>

                            <span
                                class="${estadoClass}"
                            >
                                ${escapeHtml(
                                    registro.estado ||
                                    "—"
                                )}
                            </span>

                        </td>


                        <td>

                            <button
                                type="button"
                                class="admin-btn admin-btn-small admin-btn-danger"
                                data-record-id="${escapeHtml(
                                    registro.id
                                )}"
                                onclick="eliminarRegistroDesdeBoton(this)"
                            >
                                EZABATU
                            </button>

                        </td>

                    </tr>
                `;
            }
        )
        .join("");


    container.innerHTML = `

        <div class="admin-table-wrapper">

            <table class="admin-table admin-records-table">

                <thead>

                    <tr>

                        <th>
                            Data
                        </th>

                        <th>
                            Eginkizuna
                        </th>

                        <th>
                            Mota
                        </th>

                        <th>
                            Azpi-mota
                        </th>

                        <th>
                            Ikaslearen ID
                        </th>

                        <th>
                            Egoera
                        </th>

                        <th>
                            Ekintza
                        </th>

                    </tr>

                </thead>


                <tbody>
                    ${rows}
                </tbody>

            </table>

        </div>
    `;
}


// ============================================================
// BOTÓN ELIMINAR
// ============================================================

function eliminarRegistroDesdeBoton(
    button
) {

    const id =
        button.dataset.recordId;


    if (!id) return;


    eliminarRegistro(
        id
    );
}


// ============================================================
// ELIMINAR REGISTRO
// ============================================================

async function eliminarRegistro(
    id
) {

    if (!id) return;


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
        } =
            await window.hlbpSupabase
                .from("registros")
                .delete()
                .eq(
                    "id",
                    id
                );


        if (error) {
            throw error;
        }


        if (
            window.HLBPAdminPersona
        ) {

            window.HLBPAdminPersona.registros =
                window.HLBPAdminPersona.registros
                    .filter(
                        registro =>
                            String(
                                registro.id
                            ) !==
                            String(
                                id
                            )
                    );

        }


        aplicarFiltrosRegistros();


    } catch (error) {

        console.error(
            "Error eliminando registro:",
            error
        );


        alert(
            obtenerMensajeError(
                error
            )
        );
    }
}


// ============================================================
// EXCEL GLOBAL
// ============================================================

async function descargarExcelGlobal() {

    try {

        await asegurarXLSX();


        const {
            data: registros,
            error: registrosError
        } =
            await window.hlbpSupabase
                .from("registros")
                .select(`
                    id,
                    aholkulari_id,
                    centro_id,
                    tarea,
                    tipo,
                    subtipo,
                    estudiante_id,
                    zehaztu,
                    fecha,
                    fecha_fin,
                    estado,
                    observaciones,
                    created_at
                `)
                .order(
                    "fecha",
                    {
                        ascending: false
                    }
                );


        if (registrosError) {
            throw registrosError;
        }


        const {
            data: perfiles,
            error: perfilesError
        } =
            await window.hlbpSupabase
                .from("profiles")
                .select(`
                    id,
                    email,
                    nombre,
                    apellidos,
                    codigo,
                    berritzegune,
                    espezialitatea
                `);


        if (perfilesError) {
            throw perfilesError;
        }


        const {
            data: centros,
            error: centrosError
        } =
            await window.hlbpSupabase
                .from("centros")
                .select(`
                    id,
                    codigo,
                    nombre,
                    activo
                `);


        if (centrosError) {
            throw centrosError;
        }


        const perfilesMap =
            new Map(
                (
                    perfiles || []
                ).map(
                    perfil => [

                        String(
                            perfil.id
                        ),

                        perfil

                    ]
                )
            );


        const centrosMap =
            new Map(
                (
                    centros || []
                ).map(
                    centro => [

                        String(
                            centro.id
                        ),

                        centro

                    ]
                )
            );


        const filas =
            (
                registros || []
            ).map(
                registro => {

                    const perfil =
                        perfilesMap.get(
                            String(
                                registro.aholkulari_id
                            )
                        ) || {};


                    const centro =
                        centrosMap.get(
                            String(
                                registro.centro_id
                            )
                        ) || {};


                    return {

                        "Aholkulariaren kodigoa":
                            perfil.codigo || "",

                        "Aholkularia":
                            `${
                                perfil.nombre || ""
                            } ${
                                perfil.apellidos || ""
                            }`
                                .trim(),

                        "Emaila":
                            perfil.email || "",

                        "Berritzegunea":
                            perfil.berritzegune || "",

                        "Espezialitatea":
                            perfil.espezialitatea || "",

                        "Zentroaren kodigoa":
                            centro.codigo || "",

                        "Zentroa":
                            centro.nombre || "",

                        "Eginkizuna":
                            registro.tarea || "",

                        "Mota":
                            registro.tipo || "",

                        "Azpi-mota":
                            registro.subtipo || "",

                        "Ikaslearen ID":
                            registro.estudiante_id || "",

                        "Zehaztu":
                            registro.zehaztu || "",

                        "Egiteko data":
                            registro.fecha || "",

                        "Amaiera-data":
                            registro.fecha_fin || "",

                        "Egoera":
                            registro.estado || "",

                        "Oharrak":
                            registro.observaciones || "",

                        "Erregistro ID":
                            registro.id || "",

                        "Sortze data":
                            registro.created_at || ""

                    };
                }
            );


        const worksheet =
            XLSX.utils.json_to_sheet(
                filas
            );


        worksheet["!cols"] = [

            { wch: 18 },
            { wch: 28 },
            { wch: 32 },
            { wch: 22 },
            { wch: 20 },
            { wch: 18 },
            { wch: 35 },
            { wch: 35 },
            { wch: 25 },
            { wch: 30 },
            { wch: 20 },
            { wch: 30 },
            { wch: 15 },
            { wch: 15 },
            { wch: 15 },
            { wch: 50 },
            { wch: 38 }

        ];


        const workbook =
            XLSX.utils.book_new();


        XLSX.utils.book_append_sheet(
            workbook,
            worksheet,
            "Erregistroak"
        );


        const fecha =
            new Date()
                .toISOString()
                .slice(
                    0,
                    10
                );


        XLSX.writeFile(
            workbook,
            `HLBP_erregistroak_${fecha}.xlsx`
        );


    } catch (error) {

        console.error(
            "Error exportando Excel global:",
            error
        );


        alert(
            obtenerMensajeError(
                error
            )
        );
    }
}


// ============================================================
// EXCEL PERSONA
// ============================================================

async function descargarExcelPersona() {

    try {

        await asegurarXLSX();


        const datos =
            window.HLBPAdminPersona;


        if (!datos) {

            alert(
                "Ez dago Aholkulariaren daturik."
            );

            return;
        }


        const {
            persona,
            registros
        } = datos;


        const filas =
            registros.map(
                registro => ({

                    "Aholkulariaren kodigoa":
                        persona.codigo || "",

                    "Aholkularia":
                        `${
                            persona.nombre || ""
                        } ${
                            persona.apellidos || ""
                        }`
                            .trim(),

                    "Emaila":
                        persona.email || "",

                    "Berritzegunea":
                        persona.berritzegune || "",

                    "Espezialitatea":
                        persona.espezialitatea || "",

                    "Eginkizuna":
                        registro.tarea || "",

                    "Mota":
                        registro.tipo || "",

                    "Azpi-mota":
                        registro.subtipo || "",

                    "Ikaslearen ID":
                        registro.estudiante_id || "",

                    "Zehaztu":
                        registro.zehaztu || "",

                    "Egiteko data":
                        registro.fecha || "",

                    "Amaiera-data":
                        registro.fecha_fin || "",

                    "Egoera":
                        registro.estado || "",

                    "Oharrak":
                        registro.observaciones || "",

                    "Erregistro ID":
                        registro.id || "",

                    "Sortze data":
                        registro.created_at || ""

                })
            );


        const worksheet =
            XLSX.utils.json_to_sheet(
                filas
            );


        const workbook =
            XLSX.utils.book_new();


        XLSX.utils.book_append_sheet(
            workbook,
            worksheet,
            "Erregistroak"
        );


        const codigo =
            persona.codigo ||
            "aholkularia";


        XLSX.writeFile(
            workbook,
            `HLBP_${codigo}_erregistroak.xlsx`
        );


    } catch (error) {

        console.error(
            "Error exportando Excel persona:",
            error
        );


        alert(
            obtenerMensajeError(
                error
            )
        );
    }
}


// ============================================================
// CARGAR SHEETJS SI NO EXISTE
// ============================================================

function asegurarXLSX() {

    return new Promise(
        (resolve, reject) => {

            if (
                typeof XLSX !==
                "undefined"
            ) {

                resolve();
                return;
            }


            const script =
                document.createElement(
                    "script"
                );


            script.src =
                "https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js";


            script.onload =
                () => resolve();


            script.onerror =
                () =>
                    reject(
                        new Error(
                            "Ezin izan da Excel esportatzeko liburutegia kargatu."
                        )
                    );


            document.head.appendChild(
                script
            );

        }
    );
}


// ============================================================
// BERRITZEGUNE OPTIONS
// ============================================================

function obtenerBerritzeguneOptions(
    personas
) {

    const valores =
        [
            ...new Set(
                personas
                    .map(
                        persona =>
                            persona.berritzegune
                    )
                    .filter(Boolean)
            )
        ]
            .sort(
                (
                    a,
                    b
                ) =>
                    String(a).localeCompare(
                        String(b)
                    )
            );


    return valores
        .map(
            valor => `

                <option value="${escapeHtml(
                    valor
                )}">
                    ${escapeHtml(
                        valor
                    )}
                </option>
            `
        )
        .join("");
}


// ============================================================
// MENSAJE FORMULARIO
// ============================================================

function mostrarFormularioMensaje(
    elemento,
    texto,
    tipo
) {

    if (!elemento) return;


    elemento.className =
        `admin-form-message ${tipo}`;


    elemento.textContent =
        texto;
}


// ============================================================
// ERROR GENERAL
// ============================================================

function mostrarErrorAdministrazioa(
    error
) {

    const app =
        document.getElementById(
            "app"
        );


    if (!app) return;


    app.innerHTML = `

        <div class="app-error-state">

            <div>
                ⚠️
            </div>


            <h2>
                Ezin izan da Administrazioa kargatu
            </h2>


            <p>
                ${escapeHtml(
                    obtenerMensajeError(
                        error
                    )
                )}
            </p>


            <button
                type="button"
                onclick="window.location.reload()"
            >
                Berriro saiatu
            </button>

        </div>
    `;
}


// ============================================================
// FORMATEAR FECHA
// ============================================================

function formatearFecha(
    fecha
) {

    if (!fecha) {
        return "—";
    }


    try {

        const partes =
            String(
                fecha
            ).split("-");


        if (
            partes.length === 3
        ) {

            return `${
                partes[2]
            }/${
                partes[1]
            }/${
                partes[0]
            }`;
        }


        return fecha;

    } catch {

        return fecha;
    }
}


// ============================================================
// OBTENER MENSAJE ERROR
// ============================================================

function obtenerMensajeError(
    error
) {

    if (!error) {
        return "Errore ezezaguna.";
    }


    if (
        typeof error ===
        "string"
    ) {

        return error;
    }


    if (
        error.message
    ) {

        return error.message;
    }


    if (
        error.error_description
    ) {

        return error.error_description;
    }


    if (
        error.details
    ) {

        return error.details;
    }


    if (
        error.hint
    ) {

        return error.hint;
    }


    return "Errore ezezaguna.";
}


// ============================================================
// ESCAPE HTML
// ============================================================

function escapeHtml(
    valor
) {

    return String(
        valor ?? ""
    )
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
