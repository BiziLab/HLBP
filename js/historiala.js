// ============================================================
// HLBP - HISTORIALA
// Aholkulariaren erregistro guztien historial filtragarria
// ============================================================

(function () {

    "use strict";


    const estado = {
        registros: [],
        centros: []
    };


    const svg = contenido =>
        `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">${contenido}</svg>`;

    const ICONOS = {
        buscar: svg('<circle cx="11" cy="11" r="7"></circle><path d="m20 20-3.5-3.5"></path>'),
        cerrar: svg('<path d="M6 6l12 12M18 6 6 18"></path>'),
        editatu: svg('<path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z"></path>'),
        papelera: svg('<path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3"></path>'),
        volver: svg('<path d="M19 12H5m0 0 6-6m-6 6 6 6"></path>'),
        aviso: svg('<path d="M12 4 2.5 20h19L12 4ZM12 10v4M12 17v.01"></path>'),
        registros: svg('<rect x="5" y="4" width="14" height="17" rx="2"></rect><path d="M9 4V3h6v1M9 10h6M9 14h6M9 18h3"></path>')
    };


    // ============================================================
    // INICIO
    // ============================================================

    document.addEventListener("DOMContentLoaded", () => {
        iniciarHistoriala();
    });


    async function iniciarHistoriala() {

        try {

            const sesionOk = await window.HLBPSession.init();

            if (!sesionOk) {

                window.location.replace("../index.html");

                return;
            }

            /*
             * Historiala AHLentzat bakarrik dago.
             */

            if (!window.HLBPSession.isAHL()) {

                window.location.replace("dashboard.html");

                return;
            }

            window.HLBPLayout.render();

            if (!document.getElementById("pageContent")) {
                throw new Error("No se encontró #pageContent después de cargar el layout.");
            }

            await cargarDatos();

        } catch (error) {

            console.error("Historiala: error inicializando:", error);

            mostrarErrorHistoriala(error);
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


    function formatearFecha(fecha) {

        if (!fecha) {
            return "—";
        }

        const partes = String(fecha).slice(0, 10).split("-");

        if (partes.length === 3) {
            return `${partes[2]}/${partes[1]}/${partes[0]}`;
        }

        return String(fecha);
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


    function unicos(lista) {

        return [
            ...new Set(
                lista
                    .filter(valor => valor !== null && valor !== undefined)
                    .map(valor => String(valor).trim())
                    .filter(Boolean)
            )
        ].sort((a, b) => a.localeCompare(b, "eu", { sensitivity: "base" }));
    }


    function opcionesHtml(valores) {

        return valores
            .map(valor => `<option value="${escapeHtml(valor)}">${escapeHtml(valor)}</option>`)
            .join("");
    }


    function cargando(texto) {

        return `
            <div class="admin-loading">
                <div class="loading-spinner"></div>
                <p>${escapeHtml(texto)}</p>
            </div>
        `;
    }


    function estadoVacio(icono, titulo, descripcion, accion = "") {

        return `
            <div class="admin-empty-state">
                <div class="admin-empty-icon">${icono}</div>
                <h3>${escapeHtml(titulo)}</h3>
                <p>${escapeHtml(descripcion)}</p>
                ${accion}
            </div>
        `;
    }


    // Lee todas las filas de una tabla en bloques de 1000.
    async function obtenerTodas(tabla, columnas, opciones = {}) {

        const tamano = 1000;

        const ordenes = opciones.orden || [["id", true]];

        const filas = [];

        let desde = 0;

        while (true) {

            let consulta = window.hlbpSupabase
                .from(tabla)
                .select(columnas);

            if (opciones.filtro) {
                consulta = opciones.filtro(consulta);
            }

            ordenes.forEach(([columna, ascendente]) => {
                consulta = consulta.order(columna, { ascending: ascendente });
            });

            const { data, error } =
                await consulta.range(desde, desde + tamano - 1);

            if (error) {
                throw error;
            }

            filas.push(...(data || []));

            if (!data || data.length < tamano) {
                break;
            }

            desde += tamano;
        }

        return filas;
    }


    // ============================================================
    // CARGAR DATOS
    // ============================================================

    async function cargarDatos() {

        const pageContent = $("pageContent");

        if (!pageContent) {
            return;
        }

        pageContent.innerHTML = cargando("Historiala kargatzen...");

        try {

            const userId = window.HLBPSession.user.id;

            const registros = await obtenerTodas(
                "registros",
                `
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
                `,
                {
                    filtro: consulta => consulta.eq("aholkulari_id", userId),
                    orden: [["fecha", false], ["id", true]]
                }
            );


            // ----------------------------------------------------
            // CENTROS (esleituak + historikoak)
            // ----------------------------------------------------

            const { data: relaciones, error: relacionesError } =
                await window.hlbpSupabase
                    .from("aholkulari_centros")
                    .select("centro_id")
                    .eq("aholkulari_id", userId);

            if (relacionesError) {
                throw relacionesError;
            }

            const centroIds = [
                ...new Set(
                    [
                        ...(relaciones || []).map(relacion => relacion.centro_id),
                        ...registros.map(registro => registro.centro_id)
                    ].filter(valor => valor !== null && valor !== undefined)
                )
            ];

            let centros = [];

            if (centroIds.length > 0) {

                const { data, error } =
                    await window.hlbpSupabase
                        .from("centros")
                        .select("id, codigo, nombre, activo")
                        .in("id", centroIds)
                        .order("codigo", { ascending: true });

                if (error) {
                    throw error;
                }

                centros = data || [];
            }

            estado.registros = registros;
            estado.centros = centros;

            renderHistoriala();

        } catch (error) {

            console.error("Historiala: error cargando datos:", error);

            pageContent.innerHTML = `
                <div class="admin-page">
                    <div class="admin-panel">
                        ${estadoVacio(
                            ICONOS.aviso,
                            "Ezin izan da historiala kargatu",
                            obtenerMensajeError(error),
                            `<button type="button" class="admin-btn admin-btn-primary" id="btnReintentarHistoriala">Berriro saiatu</button>`
                        )}
                    </div>
                </div>
            `;

            $("btnReintentarHistoriala")?.addEventListener("click", cargarDatos);
        }
    }


    // ============================================================
    // RENDER PRINCIPAL
    // ============================================================

    function renderHistoriala() {

        const pageContent = $("pageContent");

        if (!pageContent) {
            return;
        }

        const registros = estado.registros;

        const tareas = unicos(registros.map(registro => registro.tarea));
        const tipos = unicos(registros.map(registro => registro.tipo));
        const subtipos = unicos(registros.map(registro => registro.subtipo));

        const centrosMap = new Map(
            estado.centros.map(centro => [String(centro.id), centro])
        );

        const opcionesCentros = estado.centros
            .map(centro => {

                const etiqueta = `${centro.codigo || ""} ${centro.nombre ? "· " + centro.nombre : ""}`.trim();

                return `<option value="${escapeHtml(centro.id)}">${escapeHtml(etiqueta || centro.id)}</option>`;
            })
            .join("");

        pageContent.innerHTML = `

            <div class="admin-page">

                <header class="admin-page-header">

                    <div>

                        <div class="admin-breadcrumb">
                            HLBP / Historiala
                        </div>

                        <h1>Nire historiala</h1>

                        <p>
                            Sortu dituzun erregistro guztiak: iragazi, aldatu edo ezabatu.
                        </p>

                    </div>

                </header>


                <section class="admin-panel">

                    <div class="admin-panel-header">
                        <div>
                            <h2>Erregistroak</h2>
                            <p id="historialaCount"></p>
                        </div>
                    </div>


                    <div class="admin-toolbar admin-toolbar-records">

                        <div class="admin-field admin-field-search">

                            <label for="histSearch">Bilatu</label>

                            <div class="admin-search">
                                ${ICONOS.buscar}
                                <input
                                    type="search"
                                    id="histSearch"
                                    placeholder="Bilatu erregistroetan"
                                    autocomplete="off"
                                >
                            </div>

                        </div>

                        <div class="admin-field">
                            <label for="histFechaDesde">Data hasiera</label>
                            <input type="date" id="histFechaDesde" class="admin-input">
                        </div>

                        <div class="admin-field">
                            <label for="histFechaHasta">Data amaiera</label>
                            <input type="date" id="histFechaHasta" class="admin-input">
                        </div>

                        <div class="admin-field">
                            <label for="histCentro">Zentroa</label>
                            <select id="histCentro" class="admin-input">
                                <option value="">Guztiak</option>
                                ${opcionesCentros}
                            </select>
                        </div>

                        <div class="admin-field">
                            <label for="histTarea">Eginkizuna</label>
                            <select id="histTarea" class="admin-input">
                                <option value="">Guztiak</option>
                                ${opcionesHtml(tareas)}
                            </select>
                        </div>

                        <div class="admin-field">
                            <label for="histTipo">Mota</label>
                            <select id="histTipo" class="admin-input">
                                <option value="">Guztiak</option>
                                ${opcionesHtml(tipos)}
                            </select>
                        </div>

                        <div class="admin-field">
                            <label for="histSubtipo">Azpi-mota</label>
                            <select id="histSubtipo" class="admin-input">
                                <option value="">Guztiak</option>
                                ${opcionesHtml(subtipos)}
                            </select>
                        </div>

                        <div class="admin-field">
                            <label for="histEstado">Egoera</label>
                            <select id="histEstado" class="admin-input">
                                <option value="">Guztiak</option>
                                <option value="Egin gabe">Egin gabe</option>
                                <option value="Eginda">Eginda</option>
                            </select>
                        </div>

                        <button
                            type="button"
                            class="admin-btn admin-btn-ghost"
                            id="histClearFilters"
                        >
                            ${ICONOS.cerrar}
                            Garbitu
                        </button>

                    </div>


                    <div id="historialaTableContainer" class="admin-table-container"></div>

                </section>

            </div>
        `;

        inicializarFiltros();

        aplicarFiltros();
    }


    // ============================================================
    // FILTROS
    // ============================================================

    const IDS_FILTROS = [
        "histSearch",
        "histFechaDesde",
        "histFechaHasta",
        "histCentro",
        "histTarea",
        "histTipo",
        "histSubtipo",
        "histEstado"
    ];


    function inicializarFiltros() {

        IDS_FILTROS.forEach(id => {

            const elemento = $(id);

            if (!elemento) {
                return;
            }

            elemento.addEventListener("input", aplicarFiltros);
            elemento.addEventListener("change", aplicarFiltros);
        });

        $("histClearFilters")?.addEventListener("click", () => {

            IDS_FILTROS.forEach(id => {

                const elemento = $(id);

                if (elemento) {
                    elemento.value = "";
                }
            });

            aplicarFiltros();
        });
    }


    function aplicarFiltros() {

        const registros = estado.registros || [];

        const centrosMap = new Map(
            estado.centros.map(centro => [String(centro.id), centro])
        );

        const texto = valorDe("histSearch").toLowerCase();
        const fechaDesde = valorDe("histFechaDesde");
        const fechaHasta = valorDe("histFechaHasta");
        const centro = valorDe("histCentro");
        const tarea = valorDe("histTarea");
        const tipo = valorDe("histTipo");
        const subtipo = valorDe("histSubtipo");
        const estadoRegistro = valorDe("histEstado");

        const filtrados = registros.filter(registro => {

            const centroRegistro = centrosMap.get(String(registro.centro_id));

            const centroTexto = centroRegistro
                ? `${centroRegistro.codigo || ""} ${centroRegistro.nombre || ""}`
                : String(registro.centro_id || "");

            const contenido = [
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
                .map(valor => String(valor || "").toLowerCase())
                .join(" ");

            const fecha = registro.fecha || "";

            return (
                (!texto || contenido.includes(texto)) &&
                (!fechaDesde || fecha >= fechaDesde) &&
                (!fechaHasta || fecha <= fechaHasta) &&
                (!centro || String(registro.centro_id) === centro) &&
                (!tarea || registro.tarea === tarea) &&
                (!tipo || registro.tipo === tipo) &&
                (!subtipo || registro.subtipo === subtipo) &&
                (!estadoRegistro || registro.estado === estadoRegistro)
            );
        });

        const contador = $("historialaCount");

        if (contador) {

            contador.textContent =
                filtrados.length === registros.length
                    ? `${registros.length} erregistro`
                    : `${filtrados.length} / ${registros.length} erregistro`;
        }

        renderTabla(filtrados, registros.length);
    }


    // ============================================================
    // TABLA
    // ============================================================

    function renderTabla(registros, totalGeneral) {

        const container = $("historialaTableContainer");

        if (!container) {
            return;
        }

        if (!registros.length) {

            container.innerHTML =
                totalGeneral === 0
                    ? estadoVacio(
                        ICONOS.registros,
                        "Ez dago erregistrorik",
                        "Oraindik ez duzu erregistrorik sortu. Joan Erregistroa orrira lehen sarrera egiteko."
                    )
                    : estadoVacio(
                        ICONOS.buscar,
                        "Ez dago emaitzarik",
                        "Ez da erregistrorik aurkitu hautatutako irizpideekin."
                    );

            return;
        }

        const centrosMap = new Map(
            estado.centros.map(centro => [String(centro.id), centro])
        );

        const filas = registros.map(registro => {

            const centro = centrosMap.get(String(registro.centro_id));

            const centroTexto = centro
                ? (centro.codigo || centro.nombre || "—")
                : (registro.centro_id || "—");

            const hecho = registro.estado === "Eginda";

            return `
                <tr>

                    <td>${escapeHtml(formatearFecha(registro.fecha))}</td>

                    <td>
                        <span class="admin-chip" title="${escapeHtml(centro?.nombre || "")}">
                            ${escapeHtml(centroTexto)}
                        </span>
                    </td>

                    <td>${escapeHtml(registro.tarea || "—")}</td>

                    <td>${escapeHtml(registro.tipo || "—")}</td>

                    <td>${escapeHtml(registro.subtipo || "—")}</td>

                    <td>${escapeHtml(registro.estudiante_id ?? "—")}</td>

                    <td>
                        <span class="admin-status ${hecho ? "admin-status-success" : "admin-status-pending"}">
                            ${escapeHtml(registro.estado || "—")}
                        </span>
                    </td>

                    <td>
                        <div class="admin-actions">

                            <button
                                type="button"
                                class="admin-btn admin-btn-small admin-btn-secondary"
                                data-edit-id="${escapeHtml(registro.id)}"
                            >
                                ${ICONOS.editatu}
                                Editatu
                            </button>

                            <button
                                type="button"
                                class="admin-btn admin-btn-small admin-btn-danger"
                                data-delete-id="${escapeHtml(registro.id)}"
                            >
                                ${ICONOS.papelera}
                                Ezabatu
                            </button>

                        </div>
                    </td>

                </tr>
            `;
        }).join("");

        container.innerHTML = `
            <div class="admin-table-wrapper">

                <table class="admin-table">

                    <thead>
                        <tr>
                            <th>Data</th>
                            <th>Zentroa</th>
                            <th>Eginkizuna</th>
                            <th>Mota</th>
                            <th>Azpi-mota</th>
                            <th>Ikasle kopurua</th>
                            <th>Egoera</th>
                            <th>Ekintzak</th>
                        </tr>
                    </thead>

                    <tbody>${filas}</tbody>

                </table>

            </div>
        `;

        container.onclick = evento => {

            const botonEditar = evento.target.closest("[data-edit-id]");

            if (botonEditar) {

                const registro = estado.registros.find(
                    item => String(item.id) === String(botonEditar.dataset.editId)
                );

                if (registro) {
                    renderEditarRegistro(registro);
                }

                return;
            }

            const botonEliminar = evento.target.closest("[data-delete-id]");

            if (botonEliminar) {
                eliminarRegistro(botonEliminar.dataset.deleteId);
            }
        };
    }


    // ============================================================
    // ELIMINAR
    // ============================================================

    async function eliminarRegistro(id) {

        if (!id) {
            return;
        }

        if (!window.confirm("Ziur zaude erregistro hau ezabatu nahi duzula?")) {
            return;
        }

        try {

            const { error } =
                await window.hlbpSupabase
                    .from("registros")
                    .delete()
                    .eq("id", id)
                    .eq("aholkulari_id", window.HLBPSession.user.id);

            if (error) {
                throw error;
            }

            estado.registros = estado.registros.filter(
                registro => String(registro.id) !== String(id)
            );

            aplicarFiltros();

        } catch (error) {

            console.error("Historiala: error eliminando registro:", error);

            alert(obtenerMensajeError(error));
        }
    }


    // ============================================================
    // EDITAR REGISTRO
    // ============================================================

    function renderEditarRegistro(registro) {

        const pageContent = $("pageContent");

        if (!pageContent) {
            return;
        }

        const centro = estado.centros.find(
            item => String(item.id) === String(registro.centro_id)
        );

        const opcionesCentros = estado.centros
            .map(item => {

                const etiqueta = item.codigo
                    ? `${item.nombre} (${item.codigo})`
                    : item.nombre;

                return `
                    <option
                        value="${escapeHtml(item.id)}"
                        ${String(item.id) === String(registro.centro_id) ? "selected" : ""}
                    >
                        ${escapeHtml(etiqueta || item.id)}
                    </option>
                `;
            })
            .join("");

        const cfgActual = EGINKIZUNAK[registro.tarea] || {};

        pageContent.innerHTML = `

            <div class="erregistroa-page">

                <header class="erregistroa-header">

                    <div class="erregistroa-header-content">

                        <h1 class="erregistroa-title">Erregistroa editatu</h1>

                        <p class="erregistroa-subtitle">
                            ${escapeHtml(registro.tarea || "")} · ${escapeHtml(formatearFecha(registro.fecha))}
                        </p>

                    </div>

                    <button type="button" class="admin-btn admin-btn-secondary" id="btnCancelarEdicionHist">
                        ${ICONOS.volver}
                        Historialera itzuli
                    </button>

                </header>


                <div id="histEditAlert" class="erregistroa-alert" aria-live="polite"></div>


                <section class="erregistroa-card">

                    <form id="histEditForm" class="erregistroa-form" novalidate>

                        <section class="erregistroa-section">

                            <h3 class="erregistroa-section-title">Identifikazioa</h3>

                            <div class="erregistroa-grid">

                                <div class="erregistroa-field">
                                    <label for="histEditCentro">
                                        Ikastetxea
                                        <span class="erregistroa-required">*</span>
                                    </label>
                                    <select id="histEditCentro" required>
                                        ${opcionesCentros || `<option value="${escapeHtml(registro.centro_id || "")}">${escapeHtml(centro?.nombre || registro.centro_id || "")}</option>`}
                                    </select>
                                </div>

                            </div>

                        </section>


                        <section class="erregistroa-section">

                            <h3 class="erregistroa-section-title">Eginkizuna</h3>

                            <div class="erregistroa-grid">

                                <div class="erregistroa-field">
                                    <label for="histEditTarea">
                                        Eginkizuna
                                        <span class="erregistroa-required">*</span>
                                    </label>
                                    <select id="histEditTarea" required>
                                        <option value="">Aukeratu eginkizuna...</option>
                                        ${EGINKIZUNA_ZERRENDA.map(tarea => `
                                            <option value="${escapeHtml(tarea)}" ${tarea === registro.tarea ? "selected" : ""}>
                                                ${escapeHtml(tarea)}
                                            </option>
                                        `).join("")}
                                    </select>
                                </div>

                                <div
                                    class="erregistroa-field erregistroa-dynamic ${cfgActual.motak ? "visible" : ""}"
                                    id="histGrupoMota"
                                >
                                    <label for="histEditMota">
                                        Mota
                                        <span class="erregistroa-required">*</span>
                                    </label>
                                    <select id="histEditMota">
                                        <option value="">Aukeratu mota...</option>
                                        ${(cfgActual.motak || []).map(mota => `
                                            <option value="${escapeHtml(mota)}" ${mota === registro.tipo ? "selected" : ""}>
                                                ${escapeHtml(mota)}
                                            </option>
                                        `).join("")}
                                    </select>
                                </div>

                                <div
                                    class="erregistroa-field erregistroa-dynamic ${cfgActual.azpiMotak ? "visible" : ""}"
                                    id="histGrupoAzpiMota"
                                >
                                    <label for="histEditAzpiMota">
                                        Azpi-mota
                                        <span class="erregistroa-required">*</span>
                                    </label>
                                    <select id="histEditAzpiMota">
                                        <option value="">Aukeratu azpi-mota...</option>
                                        ${(cfgActual.azpiMotak || []).map(azpiMota => `
                                            <option value="${escapeHtml(azpiMota)}" ${azpiMota === registro.subtipo ? "selected" : ""}>
                                                ${escapeHtml(azpiMota)}
                                            </option>
                                        `).join("")}
                                    </select>
                                </div>

                                <div
                                    class="erregistroa-field erregistroa-dynamic erregistroa-dynamic-wide ${cfgActual.zehaztu ? "visible" : ""}"
                                    id="histGrupoZehaztu"
                                >
                                    <label for="histEditZehaztu">
                                        Zehaztu
                                        <span class="erregistroa-required">*</span>
                                    </label>
                                    <textarea id="histEditZehaztu" placeholder="Zehaztu eginbeharrak...">${escapeHtml(registro.zehaztu || "")}</textarea>
                                </div>

                                <div class="erregistroa-field" id="histGrupoIkasleKopurua">
                                    <label for="histEditIkasleKopurua" id="histLabelIkasleKopurua">
                                        ${EGINKIZUNAK_IKASLE_KOPURUA.includes(registro.tarea) ? "Ikasle kopurua" : "Ikaslearen HNA/NIE"}
                                        <span class="erregistroa-required">*</span>
                                    </label>
                                    <input
                                        type="${EGINKIZUNAK_IKASLE_KOPURUA.includes(registro.tarea) ? "number" : "text"}"
                                        id="histEditIkasleKopurua"
                                        ${EGINKIZUNAK_IKASLE_KOPURUA.includes(registro.tarea) ? 'min="0" step="1" inputmode="numeric"' : ""}
                                        value="${escapeHtml(registro.estudiante_id ?? "")}"
                                    >
                                </div>

                            </div>

                        </section>


                        <section class="erregistroa-section">

                            <h3 class="erregistroa-section-title">Data eta egoera</h3>

                            <div class="erregistroa-grid">

                                <div class="erregistroa-field">
                                    <label for="histEditData">
                                        Egiteko data
                                        <span class="erregistroa-required">*</span>
                                    </label>
                                    <input type="date" id="histEditData" value="${escapeHtml((registro.fecha || "").slice(0, 10))}" required>
                                </div>

                                <div class="erregistroa-field">
                                    <label for="histEditAmaieraData">Amaiera-data</label>
                                    <input type="date" id="histEditAmaieraData" value="${escapeHtml((registro.fecha_fin || "").slice(0, 10))}">
                                </div>

                                <div class="erregistroa-field">
                                    <label for="histEditEgoera">Egoera</label>
                                    <select id="histEditEgoera">
                                        <option value="Egin gabe" ${registro.estado === "Egin gabe" ? "selected" : ""}>Egin gabe</option>
                                        <option value="Eginda" ${registro.estado === "Eginda" ? "selected" : ""}>Eginda</option>
                                    </select>
                                </div>

                            </div>

                        </section>


                        <section class="erregistroa-section">

                            <h3 class="erregistroa-section-title">Oharrak</h3>

                            <div class="erregistroa-field">
                                <label for="histEditOharrak">Oharrak</label>
                                <textarea id="histEditOharrak" placeholder="Gehitu ohar...">${escapeHtml(registro.observaciones || "")}</textarea>
                            </div>

                        </section>


                        <div class="erregistroa-actions">

                            <button type="button" id="btnCancelarEdicionHist2" class="erregistroa-btn erregistroa-btn-secondary">
                                Utzi
                            </button>

                            <button type="submit" id="histGuardarButton" class="erregistroa-btn erregistroa-btn-primary">
                                💾 Aldaketak gorde
                            </button>

                        </div>

                    </form>

                </section>

            </div>
        `;


        $("btnCancelarEdicionHist")?.addEventListener("click", renderHistoriala);

        $("btnCancelarEdicionHist2")?.addEventListener("click", renderHistoriala);


        $("histEditTarea")?.addEventListener("change", () => {

            const tarea = $("histEditTarea").value;

            const cfg = EGINKIZUNAK[tarea] || {};

            const grupoMota = $("histGrupoMota");
            const grupoAzpiMota = $("histGrupoAzpiMota");
            const grupoZehaztu = $("histGrupoZehaztu");
            const motaSelect = $("histEditMota");
            const azpiMotaSelect = $("histEditAzpiMota");
            const zehaztuInput = $("histEditZehaztu");

            if (cfg.motak && cfg.motak.length) {

                motaSelect.innerHTML = `<option value="">Aukeratu mota...</option>` +
                    cfg.motak.map(mota => `<option value="${escapeHtml(mota)}">${escapeHtml(mota)}</option>`).join("");

                grupoMota.classList.add("visible");

            } else {

                motaSelect.innerHTML = `<option value="">Aukeratu mota...</option>`;

                grupoMota.classList.remove("visible");
            }

            if (cfg.azpiMotak && cfg.azpiMotak.length) {

                azpiMotaSelect.innerHTML = `<option value="">Aukeratu azpi-mota...</option>` +
                    cfg.azpiMotak.map(azpiMota => `<option value="${escapeHtml(azpiMota)}">${escapeHtml(azpiMota)}</option>`).join("");

                grupoAzpiMota.classList.add("visible");

            } else {

                azpiMotaSelect.innerHTML = `<option value="">Aukeratu azpi-mota...</option>`;

                grupoAzpiMota.classList.remove("visible");
            }

            if (cfg.zehaztu) {

                grupoZehaztu.classList.add("visible");

            } else {

                grupoZehaztu.classList.remove("visible");

                if (zehaztuInput) {
                    zehaztuInput.value = "";
                }
            }

            aplicarModoIkasleKopuruaHist(tarea);
        });


        $("histEditForm")?.addEventListener("submit", async event => {

            event.preventDefault();

            await guardarEdicionRegistro(registro);
        });
    }


    function aplicarModoIkasleKopuruaHist(tarea) {

        const label = $("histLabelIkasleKopurua");
        const input = $("histEditIkasleKopurua");

        if (!label || !input) {
            return;
        }

        const eskatuKopurua =
            tarea === "" ||
            EGINKIZUNAK_IKASLE_KOPURUA.includes(tarea);

        if (eskatuKopurua) {

            label.innerHTML = `Ikasle kopurua <span class="erregistroa-required">*</span>`;

            input.type = "number";
            input.min = "0";
            input.step = "1";
            input.inputMode = "numeric";

        } else {

            label.innerHTML = `Ikaslearen HNA/NIE <span class="erregistroa-required">*</span>`;

            input.type = "text";
            input.removeAttribute("min");
            input.removeAttribute("step");
            input.inputMode = "text";

        }
    }


    async function guardarEdicionRegistro(registro) {

        const centroId = $("histEditCentro")?.value || "";
        const tarea = $("histEditTarea")?.value || "";
        const mota = $("histEditMota")?.value || "";
        const azpiMota = $("histEditAzpiMota")?.value || "";
        const zehaztu = valorDe("histEditZehaztu");
        const ikasleKopuruaRaw = valorDe("histEditIkasleKopurua");
        const fecha = $("histEditData")?.value || "";
        const fechaFin = $("histEditAmaieraData")?.value || "";
        const estadoValor = $("histEditEgoera")?.value || "Egin gabe";
        const observaciones = valorDe("histEditOharrak");

        const cfg = EGINKIZUNAK[tarea] || {};

        const alertar = mensaje => mostrarAlertaHist("error", mensaje);

        if (!centroId) {
            alertar("Ikastetxea aukeratu behar da.");
            return;
        }

        if (!tarea) {
            alertar("Eginkizuna aukeratu behar da.");
            return;
        }

        if (cfg.motak && !mota) {
            alertar("Mota aukeratu behar da.");
            return;
        }

        if (cfg.azpiMotak && !azpiMota) {
            alertar("Azpi-mota aukeratu behar da.");
            return;
        }

        if (cfg.zehaztu && !zehaztu) {
            alertar("\"Zehaztu\" eremua bete behar da.");
            return;
        }

        const eskatuIkasleKopurua = EGINKIZUNAK_IKASLE_KOPURUA.includes(tarea);

        if (ikasleKopuruaRaw === "") {
            alertar(
                eskatuIkasleKopurua
                    ? "Ikasle kopurua bete behar da."
                    : "Ikaslearen HNA/NIE bete behar da."
            );
            return;
        }

        let estudianteValue;

        if (eskatuIkasleKopurua) {

            const ikasleKopurua = Number(ikasleKopuruaRaw);

            if (!Number.isInteger(ikasleKopurua) || ikasleKopurua < 0) {
                alertar("Ikasle kopuruak zenbaki oso positibo bat izan behar du.");
                return;
            }

            estudianteValue = ikasleKopurua;

        } else {

            estudianteValue = ikasleKopuruaRaw;

        }

        if (!fecha) {
            alertar("Egiteko data aukeratu behar da.");
            return;
        }

        if (fechaFin && fechaFin < fecha) {
            alertar("Amaiera-data ezin da hasiera-data baino lehenagokoa izan.");
            return;
        }

        const boton = $("histGuardarButton");

        const contenidoBoton = boton ? boton.innerHTML : "";

        if (boton) {
            boton.disabled = true;
            boton.textContent = "Gordetzen...";
        }

        try {

            const { error } =
                await window.hlbpSupabase
                    .from("registros")
                    .update({
                        centro_id: centroId,
                        tarea,
                        tipo: mota || null,
                        subtipo: azpiMota || null,
                        zehaztu: zehaztu || null,
                        estudiante_id: estudianteValue,
                        fecha,
                        fecha_fin: fechaFin || null,
                        estado: estadoValor,
                        observaciones: observaciones || null
                    })
                    .eq("id", registro.id)
                    .eq("aholkulari_id", window.HLBPSession.user.id);

            if (error) {
                throw error;
            }

            await cargarDatos();

        } catch (error) {

            console.error("Historiala: error gordetzean:", error);

            mostrarAlertaHist("error", obtenerMensajeError(error));

            if (boton) {
                boton.disabled = false;
                boton.innerHTML = contenidoBoton;
            }
        }
    }


    function mostrarAlertaHist(tipo, mensaje) {

        const alerta = $("histEditAlert");

        if (!alerta) {
            return;
        }

        alerta.className = `erregistroa-alert ${tipo} show`;

        alerta.innerHTML = `
            <div class="erregistroa-alert-icon">!</div>
            <div>${escapeHtml(mensaje)}</div>
        `;

        clearTimeout(window.hlbpHistAlertTimeout);

        window.hlbpHistAlertTimeout = setTimeout(() => {
            alerta.classList.remove("show");
        }, 5000);
    }


    // ============================================================
    // ERROR GENERAL
    // ============================================================

    function mostrarErrorHistoriala(error) {

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
