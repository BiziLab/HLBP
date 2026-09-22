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


        /*
         * Un AHL solo puede ver los centros que tiene
         * asignados. No puede editar nada de esta pantalla:
         * es una vista de solo lectura de "sus" centros.
         */

        if (!window.HLBPSession.isAdminOrMaster()) {

            const userId =
                String(window.HLBPSession.user.id);

            const idsAsignados = new Set(
                relaciones
                    .filter(
                        relacion =>
                            String(relacion.aholkulari_id) === userId
                    )
                    .map(
                        relacion => String(relacion.centro_id)
                    )
            );

            hlbpZentroak = hlbpZentroak.filter(
                centro => idsAsignados.has(String(centro.id))
            );
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


    const esAdminOMaster =
        window.HLBPSession.isAdminOrMaster();


    const zentroakDeskribapena =
        esAdminOMaster
            ? "HLBP sisteman erregistratutako ikastetxe guztien katalogoa."
            : "Zuri esleitutako ikastetxeen zerrenda.";


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
                                ${zentroakDeskribapena}
                            </p>

                        </div>

                    </div>

                </div>


                <div class="zentroak-header-actions">

                    <button
                        type="button"
                        class="zentroak-refresh"
                        id="btnRefreshZentroak"
                    >
                        ↻ Eguneratu
                    </button>

                    ${
                        esAdminOMaster
                            ? `
                                <button
                                    type="button"
                                    class="zentroak-refresh zentroak-btn-primary"
                                    id="btnGehituZentroa"
                                >
                                    + Zentroa gehitu
                                </button>
                            `
                            : ""
                    }

                </div>

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

                                ${
                                    esAdminOMaster
                                        ? `<th>Ekintzak</th>`
                                        : ""
                                }

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
        .getElementById("btnGehituZentroa")
        ?.addEventListener(
            "click",
            () => mostrarFormularioZentroa(null)
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


    const esAdminOMaster =
        window.HLBPSession.isAdminOrMaster();


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
                    colspan="${esAdminOMaster ? 9 : 8}"
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

                    ${
                        esAdminOMaster
                            ? `
                                <td>
                                    <div class="zentroa-actions">

                                        <button
                                            type="button"
                                            class="zentroak-row-btn"
                                            data-edit-centro="${escapeHtml(zentroa.id)}"
                                        >
                                            ✎ Editatu
                                        </button>

                                        <button
                                            type="button"
                                            class="zentroak-row-btn zentroak-row-btn-danger"
                                            data-delete-centro="${escapeHtml(zentroa.id)}"
                                            data-delete-nombre="${escapeHtml(nombre)}"
                                        >
                                            🗑 Ezabatu
                                        </button>

                                    </div>
                                </td>
                            `
                            : ""
                    }

                </tr>

            `;

        })
        .join("");


    tbody.onclick = evento => {

        const botonEditar =
            evento.target.closest("[data-edit-centro]");

        if (botonEditar) {

            const centro =
                hlbpZentroak.find(
                    item => String(item.id) === String(botonEditar.dataset.editCentro)
                );

            if (centro) {
                mostrarFormularioZentroa(centro);
            }

            return;
        }

        const botonEliminar =
            evento.target.closest("[data-delete-centro]");

        if (botonEliminar) {

            eliminarZentroa(
                botonEliminar.dataset.deleteCentro,
                botonEliminar.dataset.deleteNombre || "Zentroa"
            );
        }
    };
}


// ============================================================
// FORMULARIO ZENTROA (GEHITU / EDITATU)
// ============================================================

function mostrarFormularioZentroa(centroExistente) {

    const pageContent =
        document.getElementById("pageContent");

    if (!pageContent) return;

    const editando = Boolean(centroExistente);

    const centro = centroExistente || {};

    pageContent.innerHTML = `

        <div class="admin-page admin-page-narrow">

            <header class="admin-page-header">

                <div>

                    <div class="admin-breadcrumb">
                        HLBP / Zentroak / ${editando ? "Editatu" : "Zentro berria"}
                    </div>

                    <h1>${editando ? "Zentroa editatu" : "Zentro berria gehitu"}</h1>

                    <p>Ikastetxearen datuak bete.</p>

                </div>

                <div class="admin-header-actions">

                    <button type="button" class="admin-btn admin-btn-secondary" id="btnCancelarZentroa">
                        ← Itzuli
                    </button>

                </div>

            </header>


            <form id="zentroaForm" class="admin-panel admin-form-card" novalidate>

                <section class="admin-form-section">

                    <div class="admin-form-section-head">
                        <h2>Datu orokorrak</h2>
                        <p>Zentroaren identifikazio-datuak.</p>
                    </div>

                    <div class="admin-form-grid">

                        <div class="admin-form-group">
                            <label for="zentroaNombre">Izena *</label>
                            <input
                                type="text"
                                id="zentroaNombre"
                                class="admin-input"
                                value="${escapeHtml(centro.nombre || "")}"
                                required
                                autocomplete="off"
                            >
                        </div>

                        <div class="admin-form-group">
                            <label for="zentroaCodigo">Kodigoa</label>
                            <input
                                type="text"
                                id="zentroaCodigo"
                                class="admin-input"
                                value="${escapeHtml(centro.codigo || "")}"
                                autocomplete="off"
                                placeholder="014002"
                            >
                        </div>

                    </div>

                </section>


                <section class="admin-form-section">

                    <div class="admin-form-section-head">
                        <h2>Kokapena</h2>
                        <p>Udalerria, lurraldea eta berritzegunea.</p>
                    </div>

                    <div class="admin-form-grid">

                        <div class="admin-form-group">
                            <label for="zentroaUdalerria">Udalerria</label>
                            <input
                                type="text"
                                id="zentroaUdalerria"
                                class="admin-input"
                                value="${escapeHtml(centro.udalerria || "")}"
                                autocomplete="off"
                            >
                        </div>

                        <div class="admin-form-group">
                            <label for="zentroaLurraldea">Lurraldea</label>
                            <input
                                type="text"
                                id="zentroaLurraldea"
                                class="admin-input"
                                value="${escapeHtml(centro.lurraldea || "")}"
                                autocomplete="off"
                            >
                        </div>

                        <div class="admin-form-group">
                            <label for="zentroaBerritzegune">Berritzegunea</label>
                            <input
                                type="text"
                                id="zentroaBerritzegune"
                                class="admin-input"
                                value="${escapeHtml(centro.berritzegune || "")}"
                                autocomplete="off"
                            >
                        </div>

                        <div class="admin-form-group">
                            <label for="zentroaActivo">Egoera</label>
                            <select id="zentroaActivo" class="admin-input">
                                <option value="true" ${centro.activo !== false ? "selected" : ""}>Aktiboa</option>
                                <option value="false" ${centro.activo === false ? "selected" : ""}>Inaktiboa</option>
                            </select>
                        </div>

                    </div>

                </section>


                <div id="zentroaMessage" class="admin-form-message" aria-live="polite"></div>

                <footer class="admin-form-actions">

                    <button type="button" class="admin-btn admin-btn-secondary" id="btnCancelarZentroa2">
                        Utzi
                    </button>

                    <button type="submit" class="admin-btn admin-btn-primary" id="btnGuardarZentroa">
                        ${editando ? "Aldaketak gorde" : "Zentroa gehitu"}
                    </button>

                </footer>

            </form>

        </div>
    `;

    document.getElementById("btnCancelarZentroa")
        ?.addEventListener("click", renderZentroak);

    document.getElementById("btnCancelarZentroa2")
        ?.addEventListener("click", renderZentroak);

    document.getElementById("zentroaForm")
        ?.addEventListener("submit", event => {

            event.preventDefault();

            guardarZentroa(editando ? centro.id : null);
        });
}


async function guardarZentroa(idExistente) {

    const mensaje =
        document.getElementById("zentroaMessage");

    const boton =
        document.getElementById("btnGuardarZentroa");

    const nombre =
        document.getElementById("zentroaNombre")?.value.trim() || "";

    const codigo =
        document.getElementById("zentroaCodigo")?.value.trim() || "";

    const udalerria =
        document.getElementById("zentroaUdalerria")?.value.trim() || "";

    const lurraldea =
        document.getElementById("zentroaLurraldea")?.value.trim() || "";

    const berritzegune =
        document.getElementById("zentroaBerritzegune")?.value.trim() || "";

    const activo =
        document.getElementById("zentroaActivo")?.value === "true";

    if (!nombre) {

        if (mensaje) {
            mensaje.className = "admin-form-message error";
            mensaje.textContent = "Izena bete behar da.";
        }

        return;
    }

    const contenidoBoton = boton ? boton.innerHTML : "";

    if (boton) {
        boton.disabled = true;
        boton.textContent = "Gordetzen...";
    }

    if (mensaje) {
        mensaje.className = "admin-form-message loading";
        mensaje.textContent = "Gordetzen...";
    }

    try {

        const datos = {
            nombre,
            codigo: codigo || null,
            udalerria: udalerria || null,
            lurraldea: lurraldea || null,
            berritzegune: berritzegune || null,
            activo
        };

        const consulta =
            idExistente
                ? window.hlbpSupabase
                    .from("centros")
                    .update(datos)
                    .eq("id", idExistente)
                : window.hlbpSupabase
                    .from("centros")
                    .insert(datos);

        const { error } = await consulta;

        if (error) {
            throw error;
        }

        await cargarZentroak();

    } catch (error) {

        console.error("Errorea zentroa gordetzean:", error);

        if (mensaje) {
            mensaje.className = "admin-form-message error";
            mensaje.textContent =
                error?.message || "Ezin izan da zentroa gorde.";
        }

        if (boton) {
            boton.disabled = false;
            boton.innerHTML = contenidoBoton;
        }
    }
}


async function eliminarZentroa(id, nombre) {

    if (!id) return;

    const confirmar = window.confirm(
        `Ziur zaude "${nombre}" zentroa ezabatu nahi duzula?\n\n` +
        `Zentro honi lotutako erregistro edo esleipenik badago, ` +
        `baliteke ezabaketak huts egitea.`
    );

    if (!confirmar) return;

    try {

        const { error } =
            await window.hlbpSupabase
                .from("centros")
                .delete()
                .eq("id", id);

        if (error) {
            throw error;
        }

        await cargarZentroak();

    } catch (error) {

        console.error("Errorea zentroa ezabatzean:", error);

        alert(
            error?.message ||
            "Ezin izan da zentroa ezabatu. Baliteke erregistro edo aholkularirekin lotuta egotea."
        );
    }
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
