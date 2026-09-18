/* ============================================================
   HLBP - ADMINISTRAZIOA
   ============================================================ */

document.addEventListener("DOMContentLoaded", async () => {

    const ok = await window.HLBPSession.init();

    if (!ok) {
        window.location.replace("../index.html");
        return;
    }

    if (!window.HLBPSession.isAdminOrMaster()) {
        window.location.replace("dashboard.html");
        return;
    }

    window.HLBPLayout.render();

    await iniciarAdministrazioa();
});


let aholkulariak = [];
let registrosGlobales = [];
let centrosGlobales = [];
let personaActual = null;
let registrosPersona = [];


/* ============================================================
   INICIO
   ============================================================ */

async function iniciarAdministrazioa() {

    const params = new URLSearchParams(window.location.search);
    const personaId = params.get("persona");

    if (personaId) {
        await renderPersona(personaId);
    } else {
        await renderAdministrazioa();
    }
}


/* ============================================================
   VISTA GENERAL
   ============================================================ */

async function renderAdministrazioa() {

    document.title = "HLBP - Administrazioa";

    const app = document.getElementById("app");

    app.innerHTML = `
        ${window.HLBPLayout.getShell()}

        <main class="content-area">

            <div class="admin-page">

                <div class="admin-page-header">

                    <div>
                        <h1>Aholkulariak Kudeaketa</h1>
                        <p>
                            Aholkulariak, zentroak eta erregistro guztiak kudeatu.
                        </p>
                    </div>

                    <div class="admin-header-actions">

                        <button
                            class="admin-btn admin-btn-success"
                            id="btnExcelGlobal">
                            📥 DESCARGAR A EXCEL
                        </button>

                        <button
                            class="admin-btn admin-btn-primary"
                            id="btnNuevoAholkularia">
                            ➕ GEHITU AHOLKULARIA
                        </button>

                    </div>

                </div>


                <section class="admin-summary">

                    <div class="admin-summary-card">
                        <div class="admin-summary-label">
                            Aholkulariak
                        </div>

                        <div
                            class="admin-summary-value"
                            id="summaryAholkulariak">
                            —
                        </div>
                    </div>

                    <div class="admin-summary-card">
                        <div class="admin-summary-label">
                            Erregistroak
                        </div>

                        <div
                            class="admin-summary-value"
                            id="summaryRegistros">
                            —
                        </div>
                    </div>

                    <div class="admin-summary-card">
                        <div class="admin-summary-label">
                            Zentroak
                        </div>

                        <div
                            class="admin-summary-value"
                            id="summaryCentros">
                            —
                        </div>
                    </div>

                </section>


                <!-- CREAR AHOLKULARIA -->

                <section
                    class="admin-panel admin-create-panel"
                    id="createAholkulariaPanel">

                    <div class="admin-panel-header">

                        <div>
                            <h2>Aholkularia berria</h2>

                            <p>
                                Sortu Aholkulariaren erabiltzaile-kontua eta profila.
                            </p>
                        </div>

                    </div>

                    <div class="admin-panel-body">

                        <div
                            id="createAlert"
                            class="admin-alert">
                        </div>


                        <form id="createAholkulariaForm">

                            <div class="admin-form-grid">

                                <div class="admin-form-group">

                                    <label for="nuevoNombre">
                                        Izena *
                                    </label>

                                    <input
                                        type="text"
                                        id="nuevoNombre"
                                        required
                                        autocomplete="off">

                                </div>


                                <div class="admin-form-group">

                                    <label for="nuevoCodigo">
                                        Kodigoa *
                                    </label>

                                    <input
                                        type="text"
                                        id="nuevoCodigo"
                                        required
                                        autocomplete="off">

                                </div>


                                <div class="admin-form-group">

                                    <label for="nuevoBerritzegune">
                                        Berritzegune *
                                    </label>

                                    <input
                                        type="text"
                                        id="nuevoBerritzegune"
                                        required
                                        autocomplete="off">

                                </div>


                                <div class="admin-form-group">

                                    <label for="nuevoEspecialidad">
                                        Espezialitatea *
                                    </label>

                                    <select
                                        id="nuevoEspecialidad"
                                        required>

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


                                <div class="admin-form-group full">

                                    <label for="nuevoEmail">
                                        Emaila *
                                    </label>

                                    <input
                                        type="email"
                                        id="nuevoEmail"
                                        required
                                        autocomplete="email"
                                        placeholder="adibidez@bizilab.eus">

                                    <span class="admin-form-help">
                                        Helbide honetara gonbidapena bidaliko da.
                                    </span>

                                </div>


                                <div class="admin-form-group full">

                                    <label for="nuevoCentros">
                                        Zentroak
                                    </label>

                                    <input
                                        type="text"
                                        id="nuevoCentros"
                                        placeholder="1234, 5678, 9012"
                                        autocomplete="off">

                                    <span class="admin-form-help">
                                        Zentroen kodeak koma bidez banatu.
                                    </span>

                                </div>

                            </div>


                            <div class="admin-form-actions">

                                <button
                                    type="button"
                                    class="admin-btn admin-btn-secondary"
                                    id="btnCancelarNuevo">
                                    Utzi
                                </button>

                                <button
                                    type="submit"
                                    class="admin-btn admin-btn-primary"
                                    id="btnCrearAholkularia">
                                    ➕ Gehitu Aholkularia
                                </button>

                            </div>

                        </form>

                    </div>

                </section>


                <!-- LISTADO -->

                <section class="admin-panel">

                    <div class="admin-panel-header">

                        <div>
                            <h2>Aholkulariak</h2>

                            <p>
                                Sistemako Aholkulari guztiak.
                            </p>
                        </div>

                    </div>


                    <div class="admin-filters">

                        <div class="admin-filter">

                            <input
                                type="search"
                                id="adminSearch"
                                placeholder="Bilatu izena, kodigoa edo emaila...">

                        </div>


                        <div class="admin-filter">

                            <select id="adminEspecialidadFilter">

                                <option value="">
                                    Espezialitate guztiak
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


                        <div class="admin-filter">

                            <select id="adminBerritzeguneFilter">

                                <option value="">
                                    Berritzegune guztiak
                                </option>

                            </select>

                        </div>

                    </div>


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

                            <tbody id="adminAholkulariakBody">

                                <tr>
                                    <td colspan="7">
                                        <div class="admin-loading">
                                            Kargatzen...
                                        </div>
                                    </td>
                                </tr>

                            </tbody>

                        </table>

                    </div>

                </section>

            </div>

        </main>
    `;

    configurarEventosAdministrazioa();

    await cargarDatosAdministrazioa();

}


/* ============================================================
   EVENTOS
   ============================================================ */

function configurarEventosAdministrazioa() {

    document
        .getElementById("btnNuevoAholkularia")
        ?.addEventListener("click", () => {

            const panel =
                document.getElementById("createAholkulariaPanel");

            panel.classList.add("is-open");

            panel.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });

        });


    document
        .getElementById("btnCancelarNuevo")
        ?.addEventListener("click", cerrarFormularioNuevo);


    document
        .getElementById("createAholkulariaForm")
        ?.addEventListener(
            "submit",
            crearAholkularia
        );


    document
        .getElementById("btnExcelGlobal")
        ?.addEventListener(
            "click",
            descargarExcelGlobal
        );


    document
        .getElementById("adminSearch")
        ?.addEventListener(
            "input",
            aplicarFiltrosAdmin
        );


    document
        .getElementById("adminEspecialidadFilter")
        ?.addEventListener(
            "change",
            aplicarFiltrosAdmin
        );


    document
        .getElementById("adminBerritzeguneFilter")
        ?.addEventListener(
            "change",
            aplicarFiltrosAdmin
        );

}


/* ============================================================
   CARGAR DATOS
   ============================================================ */

async function cargarDatosAdministrazioa() {

    try {

        const [
            perfilesResponse,
            registrosResponse,
            centrosResponse,
            relacionesResponse
        ] = await Promise.all([

            window.hlbpSupabase
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
                .eq("role", "AHL")
                .order("apellidos", {
                    ascending: true
                }),

            window.hlbpSupabase
                .from("registros")
                .select(`
                    id,
                    usuario_id,
                    centro_id,
                    tarea,
                    tipo,
                    subtipo,
                    alumno_id,
                    zehaztu,
                    fecha,
                    fecha_fin,
                    estado,
                    observaciones,
                    created_at,
                    updated_at
                `)
                .order("fecha", {
                    ascending: false
                }),

            window.hlbpSupabase
                .from("centros")
                .select(`
                    id,
                    codigo,
                    nombre,
                    municipio,
                    zona,
                    activo
                `)
                .order("codigo", {
                    ascending: true
                }),

            window.hlbpSupabase
                .from("aholkulari_centros")
                .select(`
                    aholkulari_id,
                    centro_id
                `)

        ]);


        if (perfilesResponse.error) {
            throw perfilesResponse.error;
        }

        if (registrosResponse.error) {
            throw registrosResponse.error;
        }

        if (centrosResponse.error) {
            throw centrosResponse.error;
        }

        if (relacionesResponse.error) {
            throw relacionesResponse.error;
        }


        aholkulariak = perfilesResponse.data || [];
        registrosGlobales = registrosResponse.data || [];
        centrosGlobales = centrosResponse.data || [];

        const relaciones =
            relacionesResponse.data || [];


        const registrosPorUsuario = {};

        registrosGlobales.forEach(registro => {

            if (!registrosPorUsuario[registro.usuario_id]) {
                registrosPorUsuario[registro.usuario_id] = 0;
            }

            registrosPorUsuario[registro.usuario_id]++;

        });


        const centrosPorUsuario = {};

        relaciones.forEach(relacion => {

            if (!centrosPorUsuario[relacion.aholkulari_id]) {
                centrosPorUsuario[relacion.aholkulari_id] = 0;
            }

            centrosPorUsuario[relacion.aholkulari_id]++;

        });


        aholkulariak = aholkulariak.map(persona => ({

            ...persona,

            _registroCount:
                registrosPorUsuario[persona.id] || 0,

            _centroCount:
                centrosPorUsuario[persona.id] || 0

        }));


        document.getElementById(
            "summaryAholkulariak"
        ).textContent = aholkulariak.length;


        document.getElementById(
            "summaryRegistros"
        ).textContent = registrosGlobales.length;


        document.getElementById(
            "summaryCentros"
        ).textContent = centrosGlobales.length;


        cargarFiltroBerritzegune();


        renderTablaAholkulariak(
            aholkulariak
        );

    } catch (error) {

        console.error(
            "Error cargando administración:",
            error
        );

        const body =
            document.getElementById(
                "adminAholkulariakBody"
            );

        if (body) {

            body.innerHTML = `
                <tr>
                    <td colspan="7">
                        <div class="admin-empty">
                            <strong>Ezin izan dira datuak kargatu.</strong>
                            ${escapeHtml(error.message || "")}
                        </div>
                    </td>
                </tr>
            `;

        }

    }

}


/* ============================================================
   FILTRO BERRITZEGUNE
   ============================================================ */

function cargarFiltroBerritzegune() {

    const select =
        document.getElementById(
            "adminBerritzeguneFilter"
        );

    if (!select) return;


    const valores = [
        ...new Set(
            aholkulariak
                .map(item => item.berritzegune)
                .filter(Boolean)
        )
    ].sort();


    select.innerHTML = `
        <option value="">
            Berritzegune guztiak
        </option>
    `;


    valores.forEach(valor => {

        const option =
            document.createElement("option");

        option.value = valor;
        option.textContent = valor;

        select.appendChild(option);

    });

}


/* ============================================================
   RENDER TABLA
   ============================================================ */

function renderTablaAholkulariak(lista) {

    const body =
        document.getElementById(
            "adminAholkulariakBody"
        );

    if (!body) return;


    if (!lista.length) {

        body.innerHTML = `
            <tr>
                <td colspan="7">

                    <div class="admin-empty">

                        <strong>
                            Ez da Aholkularirik aurkitu.
                        </strong>

                        Saiatu beste bilaketa-iragazki batekin.

                    </div>

                </td>
            </tr>
        `;

        return;

    }


    body.innerHTML = lista.map(persona => {

        const nombre =
            `${persona.nombre || ""} ${persona.apellidos || ""}`
                .trim();


        return `
            <tr>

                <td>
                    <span class="admin-code">
                        ${escapeHtml(persona.codigo || "—")}
                    </span>
                </td>


                <td>

                    <span class="admin-person-name">
                        ${escapeHtml(nombre || "—")}
                    </span>

                    <span class="admin-person-email">
                        ${escapeHtml(persona.email || "")}
                    </span>

                </td>


                <td>
                    ${escapeHtml(persona.berritzegune || "—")}
                </td>


                <td>

                    ${
                        persona.espezialitatea
                            ? `
                                <span class="admin-specialty">
                                    ${escapeHtml(persona.espezialitatea)}
                                </span>
                              `
                            : "—"
                    }

                </td>


                <td>
                    <span class="admin-center-count">
                        ${persona._centroCount}
                    </span>
                </td>


                <td>
                    <span class="admin-record-count">
                        ${persona._registroCount}
                    </span>
                </td>


                <td>

                    <div class="admin-actions">

                        <button
                            class="admin-btn admin-btn-primary admin-btn-small"
                            onclick="abrirPersona('${persona.id}')">
                            IKUSI
                        </button>

                    </div>

                </td>

            </tr>
        `;

    }).join("");

}


/* ============================================================
   FILTROS
   ============================================================ */

function aplicarFiltrosAdmin() {

    const search =
        (
            document.getElementById(
                "adminSearch"
            )?.value || ""
        )
        .trim()
        .toLowerCase();


    const especialidad =
        document.getElementById(
            "adminEspecialidadFilter"
        )?.value || "";


    const berritzegune =
        document.getElementById(
            "adminBerritzeguneFilter"
        )?.value || "";


    const filtrados =
        aholkulariak.filter(persona => {

            const texto = [

                persona.nombre,
                persona.apellidos,
                persona.email,
                persona.codigo,
                persona.berritzegune,
                persona.espezialitatea

            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();


            if (
                search &&
                !texto.includes(search)
            ) {
                return false;
            }


            if (
                especialidad &&
                persona.espezialitatea !== especialidad
            ) {
                return false;
            }


            if (
                berritzegune &&
                persona.berritzegune !== berritzegune
            ) {
                return false;
            }


            return true;

        });


    renderTablaAholkulariak(filtrados);

}


/* ============================================================
   FORMULARIO
   ============================================================ */

function cerrarFormularioNuevo() {

    const panel =
        document.getElementById(
            "createAholkulariaPanel"
        );

    const form =
        document.getElementById(
            "createAholkulariaForm"
        );


    panel?.classList.remove("is-open");

    form?.reset();

    ocultarCreateAlert();

}


async function crearAholkularia(event) {

    event.preventDefault();


    const button =
        document.getElementById(
            "btnCrearAholkularia"
        );


    const nombre =
        document.getElementById(
            "nuevoNombre"
        ).value.trim();


    const codigo =
        document.getElementById(
            "nuevoCodigo"
        ).value.trim();


    const berritzegune =
        document.getElementById(
            "nuevoBerritzegune"
        ).value.trim();


    const espezialitatea =
        document.getElementById(
            "nuevoEspecialidad"
        ).value;


    const email =
        document.getElementById(
            "nuevoEmail"
        ).value.trim();


    const centrosTexto =
        document.getElementById(
            "nuevoCentros"
        ).value.trim();


    if (
        !nombre ||
        !codigo ||
        !berritzegune ||
        !espezialitatea ||
        !email
    ) {

        mostrarCreateAlert(
            "Bete derrigorrezko eremu guztiak.",
            "error"
        );

        return;

    }


    button.disabled = true;
    button.textContent = "Sortzen...";


    try {

        const centros = centrosTexto
            ? centrosTexto
                .split(",")
                .map(item => item.trim())
                .filter(Boolean)
            : [];


        const {
            data,
            error
        } = await window.hlbpSupabase.functions.invoke(
            "create-aholkularia",
            {
                body: {
                    nombre,
                    codigo,
                    berritzegune,
                    espezialitatea,
                    email,
                    centros
                }
            }
        );


        if (error) {

            console.error(
                "Edge Function error:",
                error
            );

            throw new Error(
                error.message ||
                "Ezin izan da Aholkularia sortu."
            );

        }


        if (!data?.success) {

            throw new Error(
                data?.error ||
                "Ezin izan da Aholkularia sortu."
            );

        }


        mostrarCreateAlert(
            "Aholkularia sortu da eta gonbidapena bidali da.",
            "success"
        );


        document
            .getElementById(
                "createAholkulariaForm"
            )
            .reset();


        await cargarDatosAdministrazioa();


        setTimeout(() => {

            cerrarFormularioNuevo();

        }, 1800);


    } catch (error) {

        console.error(
            "Error creando Aholkularia:",
            error
        );


        mostrarCreateAlert(
            error.message ||
            "Ezin izan da Aholkularia sortu.",
            "error"
        );

    } finally {

        button.disabled = false;
        button.textContent =
            "➕ Gehitu Aholkularia";

    }

}


/* ============================================================
   ALERTS
   ============================================================ */

function mostrarCreateAlert(
    mensaje,
    tipo
) {

    const alert =
        document.getElementById(
            "createAlert"
        );

    if (!alert) return;


    alert.className =
        `admin-alert ${tipo} is-visible`;

    alert.textContent = mensaje;

}


function ocultarCreateAlert() {

    const alert =
        document.getElementById(
            "createAlert"
        );

    if (!alert) return;


    alert.className =
        "admin-alert";

    alert.textContent = "";

}


/* ============================================================
   VISTA PERSONA
   ============================================================ */

async function abrirPersona(id) {

    window.location.href =
        `administrazioa.html?persona=${encodeURIComponent(id)}`;

}


async function renderPersona(id) {

    const app =
        document.getElementById("app");


    app.innerHTML = `
        ${window.HLBPLayout.getShell()}

        <main class="content-area">

            <div class="person-page">

                <div class="person-back">

                    <button
                        class="admin-btn admin-btn-secondary"
                        onclick="volverAdministrazioa()">
                        ← Itzuli Aholkularietara
                    </button>

                </div>


                <div
                    id="personContent">

                    <div class="admin-loading">
                        Kargatzen...
                    </div>

                </div>

            </div>

        </main>
    `;


    await cargarPersona(id);

}


async function cargarPersona(id) {

    try {

        const [
            profileResponse,
            recordsResponse,
            relationsResponse
        ] = await Promise.all([

            window.hlbpSupabase
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
                .eq("id", id)
                .single(),

            window.hlbpSupabase
                .from("registros")
                .select(`
                    id,
                    usuario_id,
                    centro_id,
                    tarea,
                    tipo,
                    subtipo,
                    alumno_id,
                    zehaztu,
                    fecha,
                    fecha_fin,
                    estado,
                    observaciones,
                    created_at,
                    updated_at
                `)
                .eq("usuario_id", id)
                .order("fecha", {
                    ascending: false
                }),

            window.hlbpSupabase
                .from("aholkulari_centros")
                .select(`
                    centro_id
                `)
                .eq("aholkulari_id", id)

        ]);


        if (profileResponse.error) {
            throw profileResponse.error;
        }

        if (recordsResponse.error) {
            throw recordsResponse.error;
        }

        if (relationsResponse.error) {
            throw relationsResponse.error;
        }


        personaActual =
            profileResponse.data;


        registrosPersona =
            recordsResponse.data || [];


        const centroIds =
            (relationsResponse.data || [])
                .map(item => item.centro_id);


        const centrosPersona =
            centrosGlobales.length
                ? centrosGlobales.filter(
                    centro =>
                        centroIds.includes(centro.id)
                )
                : await cargarCentrosPorIds(
                    centroIds
                );


        renderPersonaContenido(
            personaActual,
            registrosPersona,
            centrosPersona
        );


    } catch (error) {

        console.error(
            "Error cargando persona:",
            error
        );


        document.getElementById(
            "personContent"
        ).innerHTML = `

            <div class="admin-panel">

                <div class="admin-panel-body">

                    <div class="admin-empty">

                        <strong>
                            Ezin izan da Aholkularia kargatu.
                        </strong>

                        ${escapeHtml(error.message || "")}

                    </div>

                </div>

            </div>
        `;

    }

}


async function cargarCentrosPorIds(ids) {

    if (!ids.length) return [];


    const {
        data,
        error
    } = await window.hlbpSupabase
        .from("centros")
        .select(`
            id,
            codigo,
            nombre,
            municipio,
            zona,
            activo
        `)
        .in("id", ids);


    if (error) {
        throw error;
    }


    return data || [];

}


/* ============================================================
   PERSONA - CONTENIDO
   ============================================================ */

function renderPersonaContenido(
    persona,
    registros,
    centros
) {

    const nombre =
        `${persona.nombre || ""} ${persona.apellidos || ""}`
            .trim();


    const content =
        document.getElementById(
            "personContent"
        );


    content.innerHTML = `

        <div class="person-header">

            <div class="person-header-main">

                <h1>
                    ${escapeHtml(nombre || "Aholkularia")}
                </h1>

                <p>
                    ${escapeHtml(persona.email || "")}
                </p>

                <div class="person-meta">

                    <span>
                        Kodigoa:
                        <strong>
                            ${escapeHtml(persona.codigo || "—")}
                        </strong>
                    </span>

                    <span>
                        Berritzegunea:
                        <strong>
                            ${escapeHtml(persona.berritzegune || "—")}
                        </strong>
                    </span>

                    <span>
                        Espezialitatea:
                        <strong>
                            ${escapeHtml(persona.espezialitatea || "—")}
                        </strong>
                    </span>

                </div>

            </div>


            <div class="person-stats">

                <div class="person-stat">

                    <strong>
                        ${registros.length}
                    </strong>

                    <span>
                        Erregistroak
                    </span>

                </div>


                <div class="person-stat">

                    <strong>
                        ${centros.length}
                    </strong>

                    <span>
                        Zentroak
                    </span>

                </div>


                <div class="person-stat">

                    <strong>
                        ${
                            registros.filter(
                                r =>
                                    r.estado === "Eginda"
                            ).length
                        }
                    </strong>

                    <span>
                        Eginda
                    </span>

                </div>

            </div>

        </div>


        <section class="admin-panel">

            <div class="admin-panel-header">

                <div>

                    <h2>
                        Erregistroen historia
                    </h2>

                    <p>
                        Aholkulari honen erregistro guztiak.
                    </p>

                </div>


                <button
                    class="admin-btn admin-btn-success"
                    id="btnExcelPersona">
                    📥 DESCARGAR A EXCEL
                </button>

            </div>


            <div class="record-filters">

                <div class="wide">

                    <input
                        type="search"
                        id="personFilterSearch"
                        placeholder="Bilatu erregistro guztietan...">

                </div>


                <div>

                    <input
                        type="date"
                        id="personFilterFechaDesde"
                        title="Hasierako data">

                </div>


                <div>

                    <input
                        type="date"
                        id="personFilterFechaHasta"
                        title="Amaierako data">

                </div>


                <div>

                    <select id="personFilterCentro">

                        <option value="">
                            Zentro guztiak
                        </option>

                        ${centros.map(c => `
                            <option value="${c.id}">
                                ${escapeHtml(
                                    c.codigo || c.nombre || "Zentroa"
                                )}
                            </option>
                        `).join("")}

                    </select>

                </div>


                <div>

                    <select id="personFilterTarea">

                        <option value="">
                            Eginkizun guztiak
                        </option>

                        ${getUniqueOptions(
                            registros,
                            "tarea"
                        ).map(value => `
                            <option value="${escapeHtml(value)}">
                                ${escapeHtml(value)}
                            </option>
                        `).join("")}

                    </select>

                </div>


                <div>

                    <select id="personFilterTipo">

                        <option value="">
                            Mota guztiak
                        </option>

                        ${getUniqueOptions(
                            registros,
                            "tipo"
                        ).map(value => `
                            <option value="${escapeHtml(value)}">
                                ${escapeHtml(value)}
                            </option>
                        `).join("")}

                    </select>

                </div>


                <div>

                    <select id="personFilterSubtipo">

                        <option value="">
                            Azpi-mota guztiak
                        </option>

                        ${getUniqueOptions(
                            registros,
                            "subtipo"
                        ).map(value => `
                            <option value="${escapeHtml(value)}">
                                ${escapeHtml(value)}
                            </option>
                        `).join("")}

                    </select>

                </div>


                <div>

                    <select id="personFilterEstado">

                        <option value="">
                            Egoera guztiak
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


            <div class="admin-table-wrapper">

                <table class="record-table">

                    <thead>

                        <tr>
                            <th>Data</th>
                            <th>Zentroa</th>
                            <th>Eginkizuna</th>
                            <th>Mota</th>
                            <th>Azpi-mota</th>
                            <th>Ikaslearen ID</th>
                            <th>Zehaztu</th>
                            <th>Amaiera</th>
                            <th>Egoera</th>
                            <th>Oharrak</th>
                            <th>Ekintza</th>
                        </tr>

                    </thead>

                    <tbody id="personRecordsBody">
                    </tbody>

                </table>

            </div>

        </section>

    `;


    window.__personCentros = centros;


    document
        .getElementById("btnExcelPersona")
        ?.addEventListener(
            "click",
            descargarExcelPersona
        );


    [
        "personFilterSearch",
        "personFilterFechaDesde",
        "personFilterFechaHasta",
        "personFilterCentro",
        "personFilterTarea",
        "personFilterTipo",
        "personFilterSubtipo",
        "personFilterEstado"
    ].forEach(id => {

        document
            .getElementById(id)
            ?.addEventListener(
                "input",
                aplicarFiltrosPersona
            );

        document
            .getElementById(id)
            ?.addEventListener(
                "change",
                aplicarFiltrosPersona
            );

    });


    renderTablaPersona(registros);

}


/* ============================================================
   FILTROS PERSONA
   ============================================================ */

function aplicarFiltrosPersona() {

    const search =
        (
            document.getElementById(
                "personFilterSearch"
            )?.value || ""
        )
        .trim()
        .toLowerCase();


    const desde =
        document.getElementById(
            "personFilterFechaDesde"
        )?.value || "";


    const hasta =
        document.getElementById(
            "personFilterFechaHasta"
        )?.value || "";


    const centro =
        document.getElementById(
            "personFilterCentro"
        )?.value || "";


    const tarea =
        document.getElementById(
            "personFilterTarea"
        )?.value || "";


    const tipo =
        document.getElementById(
            "personFilterTipo"
        )?.value || "";


    const subtipo =
        document.getElementById(
            "personFilterSubtipo"
        )?.value || "";


    const estado =
        document.getElementById(
            "personFilterEstado"
        )?.value || "";


    const filtrados =
        registrosPersona.filter(registro => {

            const texto = [

                registro.tarea,
                registro.tipo,
                registro.subtipo,
                registro.alumno_id,
                registro.zehaztu,
                registro.estado,
                registro.observaciones

            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();


            if (
                search &&
                !texto.includes(search)
            ) {
                return false;
            }


            if (
                desde &&
                (!registro.fecha ||
                    registro.fecha < desde)
            ) {
                return false;
            }


            if (
                hasta &&
                (!registro.fecha ||
                    registro.fecha > hasta)
            ) {
                return false;
            }


            if (
                centro &&
                registro.centro_id !== centro
            ) {
                return false;
            }


            if (
                tarea &&
                registro.tarea !== tarea
            ) {
                return false;
            }


            if (
                tipo &&
                registro.tipo !== tipo
            ) {
                return false;
            }


            if (
                subtipo &&
                registro.subtipo !== subtipo
            ) {
                return false;
            }


            if (
                estado &&
                registro.estado !== estado
            ) {
                return false;
            }


            return true;

        });


    renderTablaPersona(filtrados);

}


/* ============================================================
   TABLA PERSONA
   ============================================================ */

function renderTablaPersona(registros) {

    const body =
        document.getElementById(
            "personRecordsBody"
        );

    if (!body) return;


    if (!registros.length) {

        body.innerHTML = `

            <tr>

                <td colspan="11">

                    <div class="admin-empty">

                        <strong>
                            Ez da erregistrorik aurkitu.
                        </strong>

                        Saiatu beste iragazki batekin.

                    </div>

                </td>

            </tr>
        `;

        return;

    }


    body.innerHTML =
        registros.map(registro => {

            const centro =
                (window.__personCentros || [])
                    .find(
                        c =>
                            c.id ===
                            registro.centro_id
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
                            centro?.codigo ||
                            centro?.nombre ||
                            "—"
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
                            registro.alumno_id || "—"
                        )}
                    </td>


                    <td>
                        ${escapeHtml(
                            registro.zehaztu || "—"
                        )}
                    </td>


                    <td>
                        ${escapeHtml(
                            formatearFecha(
                                registro.fecha_fin
                            )
                        )}
                    </td>


                    <td>

                        ${
                            registro.estado
                                ? `
                                    <span class="status-badge ${
                                        registro.estado === "Eginda"
                                            ? "status-done"
                                            : "status-pending"
                                    }">
                                        ${escapeHtml(
                                            registro.estado
                                        )}
                                    </span>
                                  `
                                : "—"
                        }

                    </td>


                    <td>
                        ${escapeHtml(
                            registro.observaciones || "—"
                        )}
                    </td>


                    <td>

                        <button
                            class="admin-btn admin-btn-danger admin-btn-small"
                            onclick="eliminarRegistro('${registro.id}')">
                            EZABATU
                        </button>

                    </td>

                </tr>

            `;

        }).join("");

}


/* ============================================================
   ELIMINAR REGISTRO
   ============================================================ */

async function eliminarRegistro(id) {

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
            .eq("id", id);


        if (error) {
            throw error;
        }


        registrosPersona =
            registrosPersona.filter(
                registro =>
                    registro.id !== id
            );


        aplicarFiltrosPersona();


    } catch (error) {

        console.error(
            "Error eliminando registro:",
            error
        );


        alert(
            "Ezin izan da erregistroa ezabatu."
        );

    }

}


/* ============================================================
   EXCEL GLOBAL
   ============================================================ */

async function descargarExcelGlobal() {

    if (
        typeof XLSX === "undefined"
    ) {

        alert(
            "Excel liburutegia ez dago kargatuta."
        );

        return;

    }


    try {

        const {
            data,
            error
        } = await window.hlbpSupabase
            .from("registros")
            .select(`
                id,
                usuario_id,
                centro_id,
                tarea,
                tipo,
                subtipo,
                alumno_id,
                zehaztu,
                fecha,
                fecha_fin,
                estado,
                observaciones,
                created_at,
                updated_at
            `)
            .order("fecha", {
                ascending: false
            });


        if (error) {
            throw error;
        }


        const registros =
            data || [];


        const filas =
            registros.map(registro => {

                const persona =
                    aholkulariak.find(
                        p =>
                            p.id ===
                            registro.usuario_id
                    );


                const centro =
                    centrosGlobales.find(
                        c =>
                            c.id ===
                            registro.centro_id
                    );


                return {

                    "ID registro":
                        registro.id || "",

                    "Aholkulari ID":
                        registro.usuario_id || "",

                    "Aholkulari":
                        persona
                            ? `${persona.nombre || ""} ${persona.apellidos || ""}`.trim()
                            : "",

                    "Email":
                        persona?.email || "",

                    "Kodigoa":
                        persona?.codigo || "",

                    "Berritzegunea":
                        persona?.berritzegune || "",

                    "Espezialitatea":
                        persona?.espezialitatea || "",

                    "Zentroaren ID":
                        registro.centro_id || "",

                    "Zentro kodea":
                        centro?.codigo || "",

                    "Zentroa":
                        centro?.nombre || "",

                    "Udalerria":
                        centro?.municipio || "",

                    "Zona":
                        centro?.zona || "",

                    "Eginkizuna":
                        registro.tarea || "",

                    "Mota":
                        registro.tipo || "",

                    "Azpi-mota":
                        registro.subtipo || "",

                    "Ikaslearen ID":
                        registro.alumno_id || "",

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

                    "Sortze-data":
                        registro.created_at || "",

                    "Eguneratze-data":
                        registro.updated_at || ""

                };

            });


        const worksheet =
            XLSX.utils.json_to_sheet(filas);


        const workbook =
            XLSX.utils.book_new();


        XLSX.utils.book_append_sheet(
            workbook,
            worksheet,
            "Erregistro guztiak"
        );


        worksheet["!cols"] = [

            { wch: 38 },
            { wch: 38 },
            { wch: 28 },
            { wch: 32 },
            { wch: 14 },
            { wch: 20 },
            { wch: 20 },
            { wch: 38 },
            { wch: 15 },
            { wch: 30 },
            { wch: 20 },
            { wch: 20 },
            { wch: 32 },
            { wch: 25 },
            { wch: 25 },
            { wch: 20 },
            { wch: 25 },
            { wch: 16 },
            { wch: 16 },
            { wch: 16 },
            { wch: 45 },
            { wch: 25 },
            { wch: 25 }

        ];


        XLSX.writeFile(
            workbook,
            `HLBP_erregistro_guztiak_${obtenerFechaArchivo()}.xlsx`
        );


    } catch (error) {

        console.error(
            "Error exportando Excel:",
            error
        );


        alert(
            "Ezin izan da Excel sortu."
        );

    }

}


/* ============================================================
   EXCEL PERSONA
   ============================================================ */

async function descargarExcelPersona() {

    if (
        typeof XLSX === "undefined"
    ) {

        alert(
            "Excel liburutegia ez dago kargatuta."
        );

        return;

    }


    if (!personaActual) {
        return;
    }


    try {

        const filas =
            registrosPersona.map(registro => {

                const centro =
                    (window.__personCentros || [])
                        .find(
                            c =>
                                c.id ===
                                registro.centro_id
                        );


                return {

                    "ID registro":
                        registro.id || "",

                    "Aholkulari":
                        `${personaActual.nombre || ""} ${personaActual.apellidos || ""}`.trim(),

                    "Email":
                        personaActual.email || "",

                    "Kodigoa":
                        personaActual.codigo || "",

                    "Berritzegunea":
                        personaActual.berritzegune || "",

                    "Espezialitatea":
                        personaActual.espezialitatea || "",

                    "Zentro kodea":
                        centro?.codigo || "",

                    "Zentroa":
                        centro?.nombre || "",

                    "Udalerria":
                        centro?.municipio || "",

                    "Zona":
                        centro?.zona || "",

                    "Eginkizuna":
                        registro.tarea || "",

                    "Mota":
                        registro.tipo || "",

                    "Azpi-mota":
                        registro.subtipo || "",

                    "Ikaslearen ID":
                        registro.alumno_id || "",

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

                    "Sortze-data":
                        registro.created_at || "",

                    "Eguneratze-data":
                        registro.updated_at || ""

                };

            });


        const worksheet =
            XLSX.utils.json_to_sheet(filas);


        const workbook =
            XLSX.utils.book_new();


        XLSX.utils.book_append_sheet(
            workbook,
            worksheet,
            "Erregistroak"
        );


        XLSX.writeFile(
            workbook,
            `HLBP_${normalizarNombreArchivo(
                personaActual.nombre
            )}_${obtenerFechaArchivo()}.xlsx`
        );


    } catch (error) {

        console.error(
            "Error exportando Excel:",
            error
        );


        alert(
            "Ezin izan da Excel sortu."
        );

    }

}


/* ============================================================
   UTILIDADES
   ============================================================ */

function getUniqueOptions(
    registros,
    campo
) {

    return [
        ...new Set(
            registros
                .map(item => item[campo])
                .filter(Boolean)
        )
    ].sort();

}


function formatearFecha(fecha) {

    if (!fecha) {
        return "—";
    }


    const partes =
        String(fecha).split("-");


    if (partes.length === 3) {

        return `${partes[2]}/${partes[1]}/${partes[0]}`;

    }


    return fecha;

}


function obtenerFechaArchivo() {

    const fecha = new Date();

    const y =
        fecha.getFullYear();

    const m =
        String(
            fecha.getMonth() + 1
        ).padStart(2, "0");

    const d =
        String(
            fecha.getDate()
        ).padStart(2, "0");


    return `${y}-${m}-${d}`;

}


function normalizarNombreArchivo(
    nombre
) {

    return String(
        nombre || "aholkularia"
    )
        .normalize("NFD")
        .replace(
            /[\u0300-\u036f]/g,
            ""
        )
        .replace(
            /[^a-zA-Z0-9_-]+/g,
            "_"
        );

}


function escapeHtml(value) {

    return String(
        value ?? ""
    )
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


function volverAdministrazioa() {

    window.location.href =
        "administrazioa.html";

}


/* ============================================================
   GLOBAL
   ============================================================ */

window.abrirPersona =
    abrirPersona;

window.eliminarRegistro =
    eliminarRegistro;

window.volverAdministrazioa =
    volverAdministrazioa;
