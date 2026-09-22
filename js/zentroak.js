// ============================================================
// HLBP - ZENTROAK
// ============================================================

let hlbpZentroak = [];
let hlbpZentroakFiltratuak = [];


// ============================================================
// INICIO
// ============================================================

document.addEventListener("DOMContentLoaded", async () => {
    await iniciarZentroak();
});


// ============================================================
// INICIALIZACIÓN
// ============================================================

async function iniciarZentroak() {

    try {

        const sesionOk = await window.HLBPSession.init();

        if (!sesionOk) {
            window.location.href = "../index.html";
            return;
        }

        // Solo ADMIN y MASTER
        if (!window.HLBPSession.isAdminOrMaster()) {

            window.location.href = "dashboard.html";
            return;
        }

        // Renderizar estructura general de la aplicación
        window.HLBPLayout.render();

        const pageContent = document.getElementById("pageContent");

        if (!pageContent) {
            throw new Error("Ez da pageContent aurkitu.");
        }

        await cargarZentroak();

    } catch (error) {

        console.error(
            "Errorea Zentroak hasieratzean:",
            error
        );

        mostrarErrorZentroak(error);
    }
}


// ============================================================
// CARGAR CENTROS
// ============================================================

async function cargarZentroak() {

    const pageContent =
        document.getElementById("pageContent");

    if (!pageContent) return;


    pageContent.innerHTML = `
        <div class="zentroak-loading">
            <div class="zentroak-spinner"></div>
            <p>Zentroak kargatzen...</p>
        </div>
    `;


    try {

        const {
            data: centros,
            error
        } = await window.hlbpSupabase
            .from("centros")
            .select("*")
            .order("nombre", {
                ascending: true
            });


        if (error) {
            throw error;
        }


        hlbpZentroak = centros || [];

        hlbpZentroakFiltratuak =
            [...hlbpZentroak];


        // Cargar relaciones Aholkularia - Centro
        let relaciones = [];

        const {
            data: relacionesData,
            error: relacionesError
        } = await window.hlbpSupabase
            .from("aholkulari_centros")
            .select("centro_id, aholkulari_id");


        if (!relacionesError) {
            relaciones = relacionesData || [];
        }


        // Cargar registros por centro
        let registros = [];

        const {
            data: registrosData,
            error: registrosError
        } = await window.hlbpSupabase
            .from("registros")
            .select("centro_id");


        if (!registrosError) {
            registros = registrosData || [];
        }


        // ----------------------------------------------------
        // CONTADORES
        // ----------------------------------------------------

        const asesoresPorCentro = new Map();
        const registrosPorCentro = new Map();


        relaciones.forEach(relacion => {

            const centroId =
                String(relacion.centro_id);

            asesoresPorCentro.set(
                centroId,
                (asesoresPorCentro.get(centroId) || 0) + 1
            );

        });


        registros.forEach(registro => {

            const centroId =
                String(registro.centro_id);

            registrosPorCentro.set(
                centroId,
                (registrosPorCentro.get(centroId) || 0) + 1
            );

        });


        // Añadir datos calculados
        hlbpZentroak =
            hlbpZentroak.map(centro => ({

                ...centro,

                aholkulariKopurua:
                    asesoresPorCentro.get(
                        String(centro.id)
                    ) || 0,

                erregistroKopurua:
                    registrosPorCentro.get(
                        String(centro.id)
                    ) || 0

            }));


        hlbpZentroakFiltratuak =
            [...hlbpZentroak];


        renderZentroak();

    } catch (error) {

        console.error(
            "Errorea zentroak kargatzean:",
            error
        );

        mostrarErrorZentroak(error);
    }
}


// ============================================================
// RENDER PRINCIPAL
// ============================================================

function renderZentroak() {

    const pageContent =
        document.getElementById("pageContent");

    if (!pageContent) return;


    const total =
        hlbpZentroak.length;


    const activos =
        hlbpZentroak.filter(
            centro => centro.activo !== false
        ).length;


    const inactivos =
        total - activos;


    const municipios =
        obtenerValoresUnicos(
            hlbpZentroak,
            "udalerria"
        ).length;


    pageContent.innerHTML = `

        <div class="zentroak-page">

            <!-- HEADER -->

            <div class="zentroak-header">

                <div class="zentroak-header-content">

                    <div class="zentroak-breadcrumb">
                        HLBP / Zentroak
                    </div>

                    <div class="zentroak-title-row">

                        <div class="zentroak-title-icon">
                            🏫
                        </div>

                        <div>

                            <h1>
                                Zentroak
                            </h1>

                            <p>
                                HLBP sisteman erregistratutako
                                ikastetxe guztien katalogoa.
                            </p>

                        </div>

                    </div>

                </div>


                <button
                    type="button"
                    class="zentroak-refresh"
                    id="btnRefreshZentroak"
                >
                    ↻ Eguneratu
                </button>

            </div>


            <!-- ESTADÍSTICAS -->

            <div class="zentroak-stats">

                <div class="zentroak-stat-card">

                    <div class="zentroak-stat-icon">
                        🏫
                    </div>

                    <div>
                        <span>
                            Zentro guztiak
                        </span>

                        <strong>
                            ${total}
                        </strong>
                    </div>

                </div>


                <div class="zentroak-stat-card">

                    <div class="zentroak-stat-icon active">
                        ✓
                    </div>

                    <div>
                        <span>
                            Aktiboak
                        </span>

                        <strong>
                            ${activos}
                        </strong>
                    </div>

                </div>


                <div class="zentroak-stat-card">

                    <div class="zentroak-stat-icon inactive">
                        ○
                    </div>

                    <div>
                        <span>
                            Inaktiboak
                        </span>

                        <strong>
                            ${inactivos}
                        </strong>
                    </div>

                </div>


                <div class="zentroak-stat-card">

                    <div class="zentroak-stat-icon location">
                        ◉
                    </div>

                    <div>
                        <span>
                            Udalerriak
                        </span>

                        <strong>
                            ${municipios}
                        </strong>
                    </div>

                </div>

            </div>


            <!-- PANEL -->

            <section class="zentroak-panel">

                <div class="zentroak-panel-header">

                    <div>

                        <h2>
                            Ikastetxeen katalogoa
                        </h2>

                        <p id="zentroakResultInfo">
                            ${total} zentro
                        </p>

                    </div>

                </div>


                <!-- FILTROS -->

                <div class="zentroak-filters">

                    <div class="zentroak-filter-group zentroak-search-group">

                        <label for="zentroakSearch">
                            Bilatu
                        </label>

                        <div class="zentroak-search">

                            <span class="zentroak-search-icon">
                                ⌕
                            </span>

                            <input
                                type="search"
                                id="zentroakSearch"
                                placeholder="Bilatu izena, kodigoa, udalerria..."
                                autocomplete="off"
                            >

                        </div>

                    </div>


                    <div class="zentroak-filter-group">

                        <label for="zentroakBerritzegune">
                            Berritzegunea
                        </label>

                        <select id="zentroakBerritzegune">

                            <option value="">
                                Berritzegune guztiak
                            </option>

                        </select>

                    </div>


                    <div class="zentroak-filter-group">

                        <label for="zentroakLurraldea">
                            Lurraldea
                        </label>

                        <select id="zentroakLurraldea">

                            <option value="">
                                Lurralde guztiak
                            </option>

                        </select>

                    </div>


                    <div class="zentroak-filter-group">

                        <label for="zentroakEstado">
                            Egoera
                        </label>

                        <select id="zentroakEstado">

                            <option value="">
                                Egoera guztiak
                            </option>

                            <option value="activo">
                                Aktiboak
                            </option>

                            <option value="inactivo">
                                Inaktiboak
                            </option>

                        </select>

                    </div>

                </div>


                <!-- TABLA -->

                <div class="zentroak-table-wrapper">

                    <table class="zentroak-table">

                        <thead>

                            <tr>

                                <th>
                                    Zentroa
                                </th>

                                <th>
                                    Kodigoa
                                </th>

                                <th>
                                    Udalerria
                                </th>

                                <th>
                                    Lurraldea
                                </th>

                                <th>
                                    Berritzegunea
                                </th>

                                <th>
                                    Aholkulariak
                                </th>

                                <th>
                                    Erregistroak
                                </th>

                                <th>
                                    Egoera
                                </th>

                            </tr>

                        </thead>

                        <tbody id="zentroakTableBody"></tbody>

                    </table>

                </div>

            </section>

        </div>
    `;


    prepararFiltros();


    document
        .getElementById("btnRefreshZentroak")
        ?.addEventListener(
            "click",
            cargarZentroak
        );


    document
        .getElementById("zentroakSearch")
        ?.addEventListener(
            "input",
            aplicarFiltrosZentroak
        );


    document
        .getElementById("zentroakBerritzegune")
        ?.addEventListener(
            "change",
            aplicarFiltrosZentroak
        );


    document
        .getElementById("zentroakLurraldea")
        ?.addEventListener(
            "change",
            aplicarFiltrosZentroak
        );


    document
        .getElementById("zentroakEstado")
        ?.addEventListener(
            "change",
            aplicarFiltrosZentroak
        );


    pintarTablaZentroak();
}


// ============================================================
// PREPARAR FILTROS
// ============================================================

function prepararFiltros() {

    const berritzeguneSelect =
        document.getElementById(
            "zentroakBerritzegune"
        );

    const lurraldeaSelect =
        document.getElementById(
            "zentroakLurraldea"
        );


    if (!berritzeguneSelect ||
        !lurraldeaSelect) {

        return;
    }


    const berritzeguneak =
        obtenerValoresUnicos(
            hlbpZentroak,
            "berritzegune"
        );


    const lurraldeak =
        obtenerValoresUnicos(
            hlbpZentroak,
            "lurraldea"
        );


    berritzeguneak.forEach(valor => {

        const option =
            document.createElement("option");

        option.value = valor;
        option.textContent = valor;

        berritzeguneSelect.appendChild(
            option
        );

    });


    lurraldeak.forEach(valor => {

        const option =
            document.createElement("option");

        option.value = valor;
        option.textContent = valor;

        lurraldeaSelect.appendChild(
            option
        );

    });
}


// ============================================================
// FILTRAR
// ============================================================

function aplicarFiltrosZentroak() {

    const search =
        (
            document.getElementById(
                "zentroakSearch"
            )?.value || ""
        )
        .trim()
        .toLowerCase();


    const berritzegune =
        document.getElementById(
            "zentroakBerritzegune"
        )?.value || "";


    const lurraldea =
        document.getElementById(
            "zentroakLurraldea"
        )?.value || "";


    const estado =
        document.getElementById(
            "zentroakEstado"
        )?.value || "";


    hlbpZentroakFiltratuak =
        hlbpZentroak.filter(centro => {

            const texto =
                [
                    centro.nombre,
                    centro.codigo,
                    centro.udalerria,
                    centro.lurraldea,
                    centro.berritzegune
                ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();


            const coincideBusqueda =
                !search ||
                texto.includes(search);


            const coincideBerritzegune =
                !berritzegune ||
                String(
                    centro.berritzegune || ""
                ) === String(
                    berritzegune
                );


            const coincideLurraldea =
                !lurraldea ||
                String(
                    centro.lurraldea || ""
                ) === String(
                    lurraldea
                );


            const activo =
                centro.activo !== false;


            const coincideEstado =
                !estado ||
                (
                    estado === "activo" &&
                    activo
                ) ||
                (
                    estado === "inactivo" &&
                    !activo
                );


            return (
                coincideBusqueda &&
                coincideBerritzegune &&
                coincideLurraldea &&
                coincideEstado
            );

        });


    pintarTablaZentroak();
}


// ============================================================
// PINTAR TABLA
// ============================================================

function pintarTablaZentroak() {

    const tbody =
        document.getElementById(
            "zentroakTableBody"
        );


    const resultInfo =
        document.getElementById(
            "zentroakResultInfo"
        );


    if (!tbody) return;


    if (resultInfo) {

        resultInfo.textContent =
            `${hlbpZentroakFiltratuak.length} zentro`;

    }


    if (
        hlbpZentroakFiltratuak.length === 0
    ) {

        tbody.innerHTML = `

            <tr>

                <td
                    colspan="8"
                    class="zentroak-empty"
                >

                    <div class="zentroak-empty-icon">
                        🔎
                    </div>

                    <strong>
                        Ez da zentrorik aurkitu
                    </strong>

                    <span>
                        Aldatu bilaketa edo iragazkien irizpideak.
                    </span>

                </td>

            </tr>

        `;

        return;
    }


    tbody.innerHTML =
        hlbpZentroakFiltratuak
        .map(zentroa => {

            const nombre =
                zentroa.nombre ||
                "Izenik gabe";


            const codigo =
                zentroa.codigo ||
                "—";


            const udalerria =
                zentroa.udalerria ||
                "—";


            const lurraldea =
                zentroa.lurraldea ||
                "—";


            const berritzegunea =
                zentroa.berritzegune ||
                "—";


            const activo =
                zentroa.activo !== false;


            return `

                <tr>

                    <td>

                        <div class="zentroa-name">

                            <div class="zentroa-avatar">
                                🏫
                            </div>

                            <div>

                                <strong>
                                    ${escapeHtml(nombre)}
                                </strong>

                                <span>
                                    ID:
                                    ${escapeHtml(
                                        String(
                                            zentroa.id ?? "—"
                                        )
                                    )}
                                </span>

                            </div>

                        </div>

                    </td>


                    <td>

                        ${
                            codigo !== "—"
                                ? `
                                    <span class="zentroa-code">
                                        ${escapeHtml(codigo)}
                                    </span>
                                `
                                : `
                                    <span class="zentroa-muted">
                                        —
                                    </span>
                                `
                        }

                    </td>


                    <td>
                        ${escapeHtml(udalerria)}
                    </td>


                    <td>

                        ${
                            lurraldea !== "—"
                                ? `
                                    <span class="zentroa-tag">
                                        ${escapeHtml(lurraldea)}
                                    </span>
                                `
                                : `
                                    <span class="zentroa-muted">
                                        —
                                    </span>
                                `
                        }

                    </td>


                    <td>
                        ${escapeHtml(berritzegunea)}
                    </td>


                    <td>

                        <span class="zentroa-number">
                            ${escapeHtml(
                                String(
                                    zentroa.aholkulariKopurua || 0
                                )
                            )}
                        </span>

                    </td>


                    <td>

                        <span class="zentroa-number">
                            ${escapeHtml(
                                String(
                                    zentroa.erregistroKopurua || 0
                                )
                            )}
                        </span>

                    </td>


                    <td>

                        ${
                            activo
                                ? `
                                    <span class="zentroa-status active">
                                        <span></span>
                                        Aktiboa
                                    </span>
                                `
                                : `
                                    <span class="zentroa-status inactive">
                                        <span></span>
                                        Inaktiboa
                                    </span>
                                `
                        }

                    </td>

                </tr>

            `;

        })
        .join("");
}


// ============================================================
// ERROR
// ============================================================

function mostrarErrorZentroak(error) {

    const pageContent =
        document.getElementById(
            "pageContent"
        );


    if (!pageContent) return;


    const mensaje =
        error?.message ||
        "Ezin izan dira zentroak kargatu.";


    pageContent.innerHTML = `

        <div class="zentroak-error-page">

            <div class="zentroak-error-icon">
                ⚠️
            </div>

            <h2>
                Ezin izan da informazioa kargatu
            </h2>

            <p>
                ${escapeHtml(mensaje)}
            </p>

            <button
                type="button"
                class="zentroak-error-button"
                onclick="cargarZentroak()"
            >
                ↻ Berriro saiatu
            </button>

        </div>

    `;
}


// ============================================================
// UTILIDADES
// ============================================================

function obtenerValoresUnicos(
    datos,
    campo
) {

    return [
        ...new Set(
            datos
                .map(item => item?.[campo])
                .filter(
                    valor =>
                        valor !== null &&
                        valor !== undefined &&
                        String(valor).trim() !== ""
                )
                .map(
                    valor =>
                        String(valor).trim()
                )
        )
    ].sort(
        (a, b) =>
            a.localeCompare(
                b,
                "eu",
                {
                    sensitivity: "base"
                }
            )
    );
}


function escapeHtml(valor) {

    return String(valor ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
