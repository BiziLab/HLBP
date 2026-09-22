// ============================================================
// HLBP - ADMINISTRAZIOA
// ============================================================

(function () {

    "use strict";


    // ============================================================
    // ESTADO
    // ============================================================

    const estado = {
        personas: [],
        persona: null,
        registros: [],
        centros: []
    };


    // ============================================================
    // ICONOS
    // ============================================================

    const svg = contenido =>
        `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">${contenido}</svg>`;

    const ICONOS = {
        buscar: svg('<circle cx="11" cy="11" r="7"></circle><path d="m20 20-3.5-3.5"></path>'),
        mas: svg('<path d="M12 5v14M5 12h14"></path>'),
        descargar: svg('<path d="M12 4v11m0 0-4-4m4 4 4-4M5 20h14"></path>'),
        volver: svg('<path d="M19 12H5m0 0 6-6m-6 6 6 6"></path>'),
        ojo: svg('<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"></path><circle cx="12" cy="12" r="3"></circle>'),
        papelera: svg('<path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3"></path>'),
        cerrar: svg('<path d="M6 6l12 12M18 6 6 18"></path>'),
        copiar: svg('<rect x="9" y="9" width="11" height="11" rx="2"></rect><path d="M5 15V6a2 2 0 0 1 2-2h9"></path>'),
        check: svg('<path d="m5 12 5 5 9-10"></path>'),
        usuarios: svg('<circle cx="9" cy="8" r="3.5"></circle><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.2a6.5 6.5 0 0 1 3.5 5.8"></path>'),
        registros: svg('<rect x="5" y="4" width="14" height="17" rx="2"></rect><path d="M9 4V3h6v1M9 10h6M9 14h6M9 18h3"></path>'),
        centros: svg('<path d="M4 21V9l8-5 8 5v12M2 21h20M9 21v-6h6v6M12 10v.01"></path>'),
        aviso: svg('<path d="M12 4 2.5 20h19L12 4ZM12 10v4M12 17v.01"></path>'),
        editatu: svg('<path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z"></path>'),
        x: svg('<path d="M6 6l12 12M18 6 6 18"></path>')
    };


    // ============================================================
    // INICIO
    // ============================================================

    document.addEventListener("DOMContentLoaded", () => {
        iniciarAdministrazioa();
    });


    async function iniciarAdministrazioa() {

        try {

            console.log("HLBP Administrazioa: iniciando...");

            // ----------------------------------------------------
            // SESIÓN
            // ----------------------------------------------------

            const sesionOk = await window.HLBPSession.init();

            if (!sesionOk) {

                console.error("Administrazioa: no hay sesión.");

                window.location.replace("../index.html");

                return;
            }


            // ----------------------------------------------------
            // PERMISOS
            // ----------------------------------------------------

            if (!window.HLBPSession.isAdminOrMaster()) {

                console.error("Administrazioa: usuario sin permisos.");

                window.location.replace("dashboard.html");

                return;
            }


            // ----------------------------------------------------
            // LAYOUT
            // ----------------------------------------------------

            window.HLBPLayout.render();

            if (!document.getElementById("pageContent")) {

                throw new Error(
                    "No se encontró #pageContent después de cargar el layout."
                );
            }


            // ----------------------------------------------------
            // ¿FICHA INDIVIDUAL?
            // ----------------------------------------------------

            const parametros = new URLSearchParams(window.location.search);

            const personaId = parametros.get("persona");

            if (personaId) {

                await cargarPersona(personaId);

                return;
            }


            // ----------------------------------------------------
            // LISTADO GENERAL
            // ----------------------------------------------------

            await renderAdministrazioa();

        } catch (error) {

            console.error("Administrazioa: error inicializando:", error);

            mostrarErrorAdministrazioa(error);
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


    function nombreCompleto(persona) {

        return `${persona.nombre || ""} ${persona.apellidos || ""}`.trim();
    }


    function obtenerIniciales(persona) {

        const nombre = (persona.nombre || "").trim();
        const apellido = (persona.apellidos || "").trim();

        if (nombre || apellido) {
            return (nombre.charAt(0) + apellido.charAt(0)).toUpperCase();
        }

        return (persona.email || "?").charAt(0).toUpperCase();
    }


    function claseEspecialidad(valor) {

        switch (String(valor || "").toLowerCase()) {

            case "inklusioa":
                return "admin-badge admin-badge-inklusioa";

            case "bizikidetza":
                return "admin-badge admin-badge-bizikidetza";

            case "posbentzioa":
                return "admin-badge admin-badge-posbentzioa";

            default:
                return "admin-badge";
        }
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


    // Las Edge Functions devuelven el motivo real del error
    // dentro del cuerpo de la respuesta (error.context es un Response).
    async function leerErrorFuncion(error, porDefecto) {

        let mensaje = obtenerMensajeError(error) || porDefecto;

        const contexto = error && error.context;

        if (contexto && typeof contexto.text === "function") {

            try {

                const texto = await contexto.text();

                try {

                    const cuerpo = JSON.parse(texto);

                    mensaje = cuerpo.error || cuerpo.message || mensaje;

                } catch {

                    if (texto) {
                        mensaje = texto;
                    }
                }

            } catch {
                // El cuerpo ya se había leído: usamos el mensaje por defecto.
            }
        }

        return mensaje || porDefecto;
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
            .map(valor =>
                `<option value="${escapeHtml(valor)}">${escapeHtml(valor)}</option>`
            )
            .join("");
    }


    function slug(texto) {

        return String(texto || "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-zA-Z0-9]+/g, "_")
            .replace(/^_+|_+$/g, "")
            || "aholkularia";
    }


    // Lee todas las filas de una tabla en bloques de 1000
    // (Supabase devuelve como máximo 1000 filas por consulta).
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


    // ============================================================
    // RENDER PRINCIPAL (LISTADO)
    // ============================================================

    async function renderAdministrazioa() {

        const pageContent = $("pageContent");

        if (!pageContent) {
            throw new Error("No existe #pageContent.");
        }

        pageContent.innerHTML = `

            <div class="admin-page">

                <header class="admin-page-header">

                    <div>

                        <div class="admin-breadcrumb">
                            HLBP / Administrazioa
                        </div>

                        <h1>Aholkulariak Kudeaketa</h1>

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
                            ${ICONOS.descargar}
                            Excelera deskargatu
                        </button>

                        <button
                            type="button"
                            class="admin-btn admin-btn-primary"
                            id="btnNuevoAholkularia"
                        >
                            ${ICONOS.mas}
                            Gehitu aholkularia
                        </button>

                    </div>

                </header>

                <div id="adminContent">
                    ${cargando("Kargatzen...")}
                </div>

            </div>
        `;

        $("btnNuevoAholkularia")
            ?.addEventListener("click", mostrarFormularioNuevoAholkularia);

        $("btnExcelGlobal")
            ?.addEventListener("click", descargarExcelGlobal);

        await cargarListadoAholkulariak();
    }


    // ============================================================
    // CARGAR LISTADO DE AHOLKULARIAK
    // ============================================================

    async function cargarListadoAholkulariak() {

        const container = $("adminContent");

        if (!container) {
            return;
        }

        container.innerHTML = cargando("Aholkulariak kargatzen...");

        try {

            const perfiles = await obtenerTodas(
                "profiles",
                `
                    id,
                    email,
                    nombre,
                    apellidos,
                    role,
                    berritzegune,
                    espezialitatea,
                    activo
                `,
                {
                    filtro: consulta => consulta.eq("role", "AHL"),
                    orden: [
                        ["apellidos", true],
                        ["nombre", true],
                        ["id", true]
                    ]
                }
            );

            const registros = await obtenerTodas(
                "registros",
                "id, aholkulari_id"
            );

            const relaciones = await obtenerTodas(
                "aholkulari_centros",
                "id, aholkulari_id, centro_id"
            );

            const centros = await obtenerTodas(
                "centros",
                "id, codigo, nombre, activo",
                { orden: [["codigo", true], ["id", true]] }
            );


            const centrosMap = new Map(
                centros.map(centro => [String(centro.id), centro])
            );

            const registrosPorPersona = new Map();

            registros.forEach(registro => {

                const clave = String(registro.aholkulari_id);

                registrosPorPersona.set(
                    clave,
                    (registrosPorPersona.get(clave) || 0) + 1
                );
            });

            const datos = perfiles.map(persona => {

                const clave = String(persona.id);

                const centrosPersona = relaciones
                    .filter(relacion => String(relacion.aholkulari_id) === clave)
                    .map(relacion => centrosMap.get(String(relacion.centro_id)))
                    .filter(Boolean);

                return {
                    ...persona,
                    registrosCount: registrosPorPersona.get(clave) || 0,
                    centrosCount: centrosPersona.length,
                    centros: centrosPersona
                };
            });

            renderListado(datos);

        } catch (error) {

            console.error("Error cargando Aholkulariak:", error);

            container.innerHTML = `
                <div class="admin-panel">
                    ${estadoVacio(
                        ICONOS.aviso,
                        "Ezin izan dira Aholkulariak kargatu",
                        obtenerMensajeError(error),
                        `<button type="button" class="admin-btn admin-btn-primary" id="btnReintentarListado">Berriro saiatu</button>`
                    )}
                </div>
            `;

            $("btnReintentarListado")
                ?.addEventListener("click", cargarListadoAholkulariak);
        }
    }


    // ============================================================
    // RENDER LISTADO
    // ============================================================

    function tarjetaResumen(icono, etiqueta, valor) {

        return `
            <article class="admin-stat-card">

                <div class="admin-stat-icon">${icono}</div>

                <div>
                    <span class="admin-stat-label">${escapeHtml(etiqueta)}</span>
                    <strong class="admin-stat-value">${escapeHtml(valor)}</strong>
                </div>

            </article>
        `;
    }


    function renderListado(personas) {

        const container = $("adminContent");

        if (!container) {
            return;
        }

        estado.personas = personas;

        const totalRegistros = personas.reduce(
            (total, persona) => total + persona.registrosCount,
            0
        );

        const totalCentros = personas.reduce(
            (total, persona) => total + persona.centrosCount,
            0
        );

        const berritzeguneak = unicos(
            personas.map(persona => persona.berritzegune)
        );

        container.innerHTML = `

            <section class="admin-summary">

                ${tarjetaResumen(ICONOS.usuarios, "Aholkulariak", personas.length)}

                ${tarjetaResumen(ICONOS.registros, "Erregistroak", totalRegistros)}

                ${tarjetaResumen(ICONOS.centros, "Zentroen esleipenak", totalCentros)}

            </section>


            <section class="admin-panel">

                <div class="admin-panel-header">

                    <div>
                        <h2>Aholkulariak</h2>
                        <p id="adminResultCount"></p>
                    </div>

                </div>


                <div class="admin-toolbar">

                    <div class="admin-field admin-field-search">

                        <label for="adminSearch">Bilatu</label>

                        <div class="admin-search">

                            ${ICONOS.buscar}

                            <input
                                type="search"
                                id="adminSearch"
                                placeholder="Izena, abizenak edo emaila"
                                autocomplete="off"
                            >

                        </div>

                    </div>


                    <div class="admin-field">

                        <label for="adminEspecialidad">Espezialitatea</label>

                        <select id="adminEspecialidad" class="admin-input">
                            <option value="">Guztiak</option>
                            <option value="Inklusioa">Inklusioa</option>
                            <option value="Bizikidetza">Bizikidetza</option>
                            <option value="Posbentzioa">Posbentzioa</option>
                        </select>

                    </div>


                    <div class="admin-field">

                        <label for="adminBerritzegune">Bizilabeko Ubikazioa</label>

                        <select id="adminBerritzegune" class="admin-input">
                            <option value="">Guztiak</option>
                            ${opcionesHtml(berritzeguneak)}
                        </select>

                    </div>


                    <button
                        type="button"
                        class="admin-btn admin-btn-ghost"
                        id="adminClearFilters"
                    >
                        ${ICONOS.cerrar}
                        Garbitu
                    </button>

                </div>


                <div
                    id="adminTableContainer"
                    class="admin-table-container"
                ></div>

            </section>
        `;


        const search = $("adminSearch");
        const especialidad = $("adminEspecialidad");
        const berritzegune = $("adminBerritzegune");

        function aplicarFiltros() {

            const texto = (search?.value || "").trim().toLowerCase();

            const especialidadValue = especialidad?.value || "";

            const berritzeguneValue = berritzegune?.value || "";

            const filtradas = personas.filter(persona => {

                const contenido = [
                    nombreCompleto(persona),
                    persona.email
                ]
                    .join(" ")
                    .toLowerCase();

                return (
                    (!texto || contenido.includes(texto)) &&
                    (!especialidadValue || persona.espezialitatea === especialidadValue) &&
                    (!berritzeguneValue || persona.berritzegune === berritzeguneValue)
                );
            });

            const contador = $("adminResultCount");

            if (contador) {

                contador.textContent =
                    filtradas.length === personas.length
                        ? `${personas.length} aholkulari`
                        : `${filtradas.length} / ${personas.length} aholkulari`;
            }

            renderTablaAholkulariak(filtradas, personas.length);
        }

        search?.addEventListener("input", aplicarFiltros);
        especialidad?.addEventListener("change", aplicarFiltros);
        berritzegune?.addEventListener("change", aplicarFiltros);

        $("adminClearFilters")?.addEventListener("click", () => {

            if (search) search.value = "";
            if (especialidad) especialidad.value = "";
            if (berritzegune) berritzegune.value = "";

            aplicarFiltros();
            search?.focus();
        });

        aplicarFiltros();
    }


    // ============================================================
    // TABLA AHOLKULARIAK
    // ============================================================

    function chipsCentros(centros) {

        if (!centros.length) {
            return `<span class="admin-muted">—</span>`;
        }

        const visibles = centros.slice(0, 3);

        const resto = centros.length - visibles.length;

        return `
            <div class="admin-chip-list">

                ${visibles.map(centro => `
                    <span
                        class="admin-chip"
                        title="${escapeHtml(centro.nombre || "")}"
                    >
                        ${escapeHtml(centro.codigo || centro.nombre || "—")}
                    </span>
                `).join("")}

                ${resto > 0
                    ? `<span class="admin-chip admin-chip-more">+${resto}</span>`
                    : ""}

            </div>
        `;
    }


    function renderTablaAholkulariak(personas, totalGeneral) {

        const container = $("adminTableContainer");

        if (!container) {
            return;
        }

        if (!personas.length) {

            container.innerHTML =
                totalGeneral === 0
                    ? estadoVacio(
                        ICONOS.usuarios,
                        "Oraindik ez dago aholkularirik",
                        "Gehitu lehenengo aholkularia goiko botoiarekin."
                    )
                    : estadoVacio(
                        ICONOS.buscar,
                        "Ez dago emaitzarik",
                        "Ez da aholkularirik aurkitu hautatutako irizpideekin."
                    );

            return;
        }

        const filas = personas.map(persona => {

            const nombre = nombreCompleto(persona) || persona.email || "—";

            return `
                <tr>

                    <td>
                        <div class="admin-person">

                            <div class="admin-avatar">
                                ${escapeHtml(obtenerIniciales(persona))}
                            </div>

                            <div class="admin-person-text">
                                <div class="admin-person-name">${escapeHtml(nombre)}</div>
                                <div class="admin-person-email">${escapeHtml(persona.email || "")}</div>
                            </div>

                        </div>
                    </td>

                    <td>${escapeHtml(persona.berritzegune || "—")}</td>

                    <td>
                        ${persona.espezialitatea
                            ? `<span class="${claseEspecialidad(persona.espezialitatea)}">${escapeHtml(persona.espezialitatea)}</span>`
                            : `<span class="admin-muted">—</span>`}
                    </td>

                    <td>${chipsCentros(persona.centros || [])}</td>

                    <td class="admin-cell-number">${persona.registrosCount}</td>

                    <td>
                        <div class="admin-actions">

                            <button
                                type="button"
                                class="admin-btn admin-btn-small admin-btn-secondary"
                                data-action="ver"
                                data-persona-id="${escapeHtml(persona.id)}"
                            >
                                ${ICONOS.ojo}
                                Ikusi
                            </button>

                            <button
                                type="button"
                                class="admin-btn admin-btn-small admin-btn-danger"
                                data-action="eliminar"
                                data-persona-id="${escapeHtml(persona.id)}"
                                data-persona-name="${escapeHtml(nombre)}"
                                aria-label="Ezabatu ${escapeHtml(nombre)}"
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
                            <th>Aholkularia</th>
                            <th>Bizilabeko Ubikazioa</th>
                            <th>Espezialitatea</th>
                            <th>Zentroak</th>
                            <th class="admin-cell-number">Erregistroak</th>
                            <th>Ekintzak</th>
                        </tr>
                    </thead>

                    <tbody>${filas}</tbody>

                </table>

            </div>
        `;

        container.onclick = evento => {

            const boton = evento.target.closest("[data-action]");

            if (!boton) {
                return;
            }

            const id = boton.dataset.personaId;

            if (!id) {
                return;
            }

            if (boton.dataset.action === "ver") {

                window.location.href =
                    `administrazioa.html?persona=${encodeURIComponent(id)}`;

                return;
            }

            if (boton.dataset.action === "eliminar") {

                eliminarAholkularia(
                    id,
                    boton.dataset.personaName || "Aholkularia",
                    boton
                );
            }
        };
    }


    // ============================================================
    // ELIMINAR AHOLKULARIA
    // ============================================================

    async function eliminarAholkularia(userId, nombre, boton) {

        // --------------------------------------------------------
        // PRIMERA CONFIRMACIÓN
        // --------------------------------------------------------

        const confirmar = window.confirm(
            `⚠️ ADI!\n\n` +
            `“${nombre}” Aholkularia ezabatzera zoaz.\n\n` +
            `Ekintza honek erabiltzailearen kontua eta bere datu guztiak ezabatuko ditu:\n\n` +
            `• Erregistro guztiak\n` +
            `• Zentroen esleipenak\n` +
            `• Profil administratiboa\n` +
            `• Saioa hasteko kontua\n\n` +
            `Ekintza hau EZIN DA desegin.\n\n` +
            `Jarraitu nahi duzu?`
        );

        if (!confirmar) {
            return;
        }

        // --------------------------------------------------------
        // SEGUNDA CONFIRMACIÓN
        // --------------------------------------------------------

        const confirmarDefinitivo = window.confirm(
            `AZKEN BAIEZTAPENA\n\n` +
            `“${nombre}” erabiltzailea eta bere datu guztiak behin betiko ezabatuko dira.\n\n` +
            `Benetan ezabatu nahi duzu?`
        );

        if (!confirmarDefinitivo) {
            return;
        }

        const contenidoOriginal = boton.innerHTML;

        boton.disabled = true;
        boton.textContent = "Ezabatzen...";

        try {

            console.log("HLBP: delete-aholkularia invoke...", userId);

            const { data, error } =
                await window.hlbpSupabase.functions.invoke(
                    "delete-aholkularia",
                    { body: { userId } }
                );

            if (error) {

                console.error("Delete Edge Function error:", error);

                throw new Error(
                    await leerErrorFuncion(
                        error,
                        "Ezin izan da Aholkularia ezabatu."
                    )
                );
            }

            if (!data || data.success !== true) {

                throw new Error(
                    data?.error || "Ezin izan da Aholkularia ezabatu."
                );
            }

            console.log("HLBP: Aholkularia ezabatuta:", data);

            alert(
                `✅ ${nombre} Aholkularia eta bere datu guztiak behar bezala ezabatu dira.`
            );

            await cargarListadoAholkulariak();

        } catch (error) {

            console.error("Errorea Aholkularia ezabatzean:", error);

            alert(obtenerMensajeError(error));

            boton.disabled = false;
            boton.innerHTML = contenidoOriginal;
        }
    }


    // ============================================================
    // FORMULARIO NUEVO AHOLKULARIA
    // ============================================================

    function mostrarFormularioNuevoAholkularia() {

        const pageContent = $("pageContent");

        if (!pageContent) {
            return;
        }

        const berritzeguneak = unicos(
            estado.personas.map(persona => persona.berritzegune)
        );

        pageContent.innerHTML = `

            <div class="admin-page admin-page-narrow">

                <header class="admin-page-header">

                    <div>

                        <div class="admin-breadcrumb">
                            HLBP / Administrazioa / Aholkularia berria
                        </div>

                        <h1>Aholkularia gehitu</h1>

                        <p>
                            Sortu aholkulariaren erabiltzaile-kontua
                            eta lotu dagokion informazioa.
                        </p>

                    </div>

                    <div class="admin-header-actions">

                        <button
                            type="button"
                            class="admin-btn admin-btn-secondary"
                            id="btnVolverListado"
                        >
                            ${ICONOS.volver}
                            Itzuli
                        </button>

                    </div>

                </header>


                <div
                    id="nuevoAholkulariaResultado"
                    aria-live="polite"
                ></div>


                <form
                    id="nuevoAholkulariaForm"
                    class="admin-panel admin-form-card"
                    novalidate
                >

                    <section class="admin-form-section">

                        <div class="admin-form-section-head">
                            <h2>Datu pertsonalak</h2>
                            <p>Aholkulariaren izena eta abizenak.</p>
                        </div>

                        <div class="admin-form-grid">

                            <div class="admin-form-group">
                                <label for="nuevoNombre">Izena *</label>
                                <input
                                    type="text"
                                    id="nuevoNombre"
                                    class="admin-input"
                                    required
                                    autocomplete="off"
                                >
                            </div>

                            <div class="admin-form-group">
                                <label for="nuevoApellidos">Abizenak *</label>
                                <input
                                    type="text"
                                    id="nuevoApellidos"
                                    class="admin-input"
                                    required
                                    autocomplete="off"
                                >
                            </div>

                        </div>

                    </section>


                    <section class="admin-form-section">

                        <div class="admin-form-section-head">
                            <h2>Sarbidea</h2>
                            <p>Saioa hasteko erabiliko duen emaila.</p>
                        </div>

                        <div class="admin-form-grid">

                            <div class="admin-form-group admin-form-full">

                                <label for="nuevoEmail">Emaila *</label>

                                <input
                                    type="email"
                                    id="nuevoEmail"
                                    class="admin-input"
                                    required
                                    autocomplete="off"
                                    placeholder="adibidea@bizilab.eus"
                                >

                                <small class="admin-help">
                                    Email hau izango da aholkulariak saioa hasteko
                                    erabiliko duen erabiltzailea. Ez da gonbidapenik
                                    bidaliko: hasierako pasahitza sortu ondoren
                                    erakutsiko da.
                                </small>

                            </div>

                        </div>

                    </section>


                    <section class="admin-form-section">

                        <div class="admin-form-section-head">
                            <h2>Lan-eremua</h2>
                            <p>Bizilabeko Ubikazioa eta espezialitatea.</p>
                        </div>

                        <div class="admin-form-grid">

                            <div class="admin-form-group">

                                <label for="nuevoBerritzegune">Bizilabeko Ubikazioa *</label>

                                <input
                                    type="text"
                                    id="nuevoBerritzegune"
                                    class="admin-input"
                                    list="berritzegunePropuestas"
                                    required
                                    autocomplete="off"
                                >

                                <datalist id="berritzegunePropuestas">
                                    ${opcionesHtml(berritzeguneak)}
                                </datalist>

                            </div>

                            <div class="admin-form-group">

                                <label for="nuevoEspecialidad">Espezialitatea *</label>

                                <select
                                    id="nuevoEspecialidad"
                                    class="admin-input"
                                    required
                                >
                                    <option value="">Aukeratu...</option>
                                    <option value="Inklusioa">Inklusioa</option>
                                    <option value="Bizikidetza">Bizikidetza</option>
                                    <option value="Posbentzioa">Posbentzioa</option>
                                </select>

                            </div>

                        </div>

                    </section>


                    <section class="admin-form-section">

                        <div class="admin-form-section-head">
                            <h2>Zentroak</h2>
                            <p>Aholkulariari esleituko zaizkion zentroak.</p>
                        </div>

                        <div class="admin-form-grid">

                            <div class="admin-form-group admin-form-full">

                                <label for="nuevoCentros">Zentroen kodeak</label>

                                <input
                                    type="text"
                                    id="nuevoCentros"
                                    class="admin-input"
                                    placeholder="014002, 014003, 014004"
                                    autocomplete="off"
                                >

                                <small class="admin-help">
                                    Zentroen kodeak koma, hutsune edo puntu eta komaz
                                    bereizita. Kodeak datu-basean dauden bezala idatzi
                                    behar dira.
                                </small>

                                <div
                                    id="nuevoCentrosPreview"
                                    class="admin-chip-list admin-chip-preview"
                                ></div>

                            </div>

                        </div>

                    </section>


                    <div
                        id="nuevoAholkulariaMessage"
                        class="admin-form-message"
                        aria-live="polite"
                    ></div>


                    <footer class="admin-form-actions">

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
                            ${ICONOS.mas}
                            Gehitu aholkularia
                        </button>

                    </footer>

                </form>

            </div>
        `;

        $("btnVolverListado")
            ?.addEventListener("click", renderAdministrazioa);

        $("btnCancelarNuevo")
            ?.addEventListener("click", renderAdministrazioa);

        $("nuevoAholkulariaForm")
            ?.addEventListener("submit", crearAholkularia);

        $("nuevoCentros")
            ?.addEventListener("input", pintarPreviewCentros);

        if (window.innerWidth > 800) {
            $("nuevoNombre")?.focus();
        }
    }


    // Separa los códigos por coma, punto y coma, espacio o salto de línea.
    // Se mantienen como TEXTO para no perder ceros iniciales (014002).
    function parsearCentros(texto) {

        return [
            ...new Set(
                String(texto || "")
                    .split(/[\s,;]+/)
                    .map(codigo => codigo.trim())
                    .filter(Boolean)
            )
        ];
    }


    function pintarPreviewCentros() {

        const preview = $("nuevoCentrosPreview");

        if (!preview) {
            return;
        }

        const codigos = parsearCentros($("nuevoCentros")?.value);

        preview.innerHTML = codigos
            .map(codigo => `<span class="admin-chip">${escapeHtml(codigo)}</span>`)
            .join("");
    }


    function mostrarFormularioMensaje(elemento, texto, tipo) {

        if (!elemento) {
            return;
        }

        elemento.className = `admin-form-message ${tipo}`;

        elemento.textContent = texto;
    }


    // ============================================================
    // CREAR AHOLKULARIA
    // ============================================================

    async function crearAholkularia(event) {

        event.preventDefault();

        const boton = $("btnCrearAholkularia");

        const mensaje = $("nuevoAholkulariaMessage");

        const resultado = $("nuevoAholkulariaResultado");

        if (resultado) {
            resultado.innerHTML = "";
        }


        // --------------------------------------------------------
        // DATOS
        // --------------------------------------------------------

        const nombre = valorDe("nuevoNombre");

        const apellidos = valorDe("nuevoApellidos");

        const berritzegune = valorDe("nuevoBerritzegune");

        const espezialitatea = $("nuevoEspecialidad")?.value || "";

        const email = valorDe("nuevoEmail").toLowerCase();

        const centros = parsearCentros($("nuevoCentros")?.value);


        // --------------------------------------------------------
        // VALIDACIÓN
        // --------------------------------------------------------

        if (
            !nombre ||
            !apellidos ||
            !berritzegune ||
            !espezialitatea ||
            !email
        ) {

            mostrarFormularioMensaje(
                mensaje,
                "Bete derrigorrezko eremu guztiak.",
                "error"
            );

            return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {

            mostrarFormularioMensaje(
                mensaje,
                "Email helbideak ez du formatu zuzena.",
                "error"
            );

            return;
        }


        // --------------------------------------------------------
        // BOTÓN
        // --------------------------------------------------------

        const contenidoBoton = boton ? boton.innerHTML : "";

        if (boton) {
            boton.disabled = true;
            boton.textContent = "Sortzen...";
        }

        mostrarFormularioMensaje(
            mensaje,
            "Aholkulariaren kontua sortzen...",
            "loading"
        );

        try {

            console.log("HLBP: create-aholkularia invoke...");

            // ----------------------------------------------------
            // EDGE FUNCTION
            // ----------------------------------------------------

            const { data, error } =
                await window.hlbpSupabase.functions.invoke(
                    "create-aholkularia",
                    {
                        body: {
                            nombre,
                            apellidos,
                            berritzegune,
                            espezialitatea,
                            email,
                            centros
                        }
                    }
                );

            if (error) {

                console.error("Edge Function error:", error);

                throw new Error(
                    await leerErrorFuncion(
                        error,
                        "Ezin izan da Aholkularia sortu."
                    )
                );
            }

            if (!data || data.success !== true) {

                throw new Error(
                    data?.error || "Ezin izan da Aholkularia sortu."
                );
            }

            console.log("HLBP: Aholkularia sortuta:", data);

            mostrarFormularioMensaje(mensaje, "", "");

            mostrarResultadoCreacion(
                email,
                data.initialPassword || ""
            );

            $("nuevoAholkulariaForm")?.reset();

            pintarPreviewCentros();

            window.scrollTo({ top: 0, behavior: "smooth" });

        } catch (error) {

            console.error("Errorea Aholkularia sortzean:", error);

            mostrarFormularioMensaje(
                mensaje,
                obtenerMensajeError(error),
                "error"
            );

        } finally {

            if (boton) {
                boton.disabled = false;
                boton.innerHTML = contenidoBoton;
            }
        }
    }


    function mostrarResultadoCreacion(email, password) {

        const resultado = $("nuevoAholkulariaResultado");

        if (!resultado) {
            return;
        }

        resultado.innerHTML = `
            <div class="admin-result">

                <div class="admin-result-title">
                    ${ICONOS.check}
                    Aholkularia behar bezala sortu da
                </div>

                <dl class="admin-result-data">

                    <div>
                        <dt>Emaila</dt>
                        <dd>${escapeHtml(email)}</dd>
                    </div>

                    <div>
                        <dt>Hasierako pasahitza</dt>
                        <dd>
                            ${password
                                ? `<code id="initialPasswordValue">${escapeHtml(password)}</code>
                                   <button
                                       type="button"
                                       class="admin-btn admin-btn-small admin-btn-secondary"
                                       id="btnCopyInitialPassword"
                                   >
                                       ${ICONOS.copiar}
                                       Kopiatu
                                   </button>`
                                : `<span class="admin-muted">Ez da pasahitzik jaso.</span>`}
                        </dd>
                    </div>

                </dl>

                <p class="admin-result-note">
                    Ez da emailik bidali. Aholkulariak email honekin eta
                    hasierako pasahitzarekin sartu beharko du. Gorde
                    pasahitza orain: ez da berriro erakutsiko.
                </p>

                <div class="admin-result-actions">
                    <button
                        type="button"
                        class="admin-btn admin-btn-secondary"
                        id="btnResultadoVolver"
                    >
                        ${ICONOS.volver}
                        Zerrendara itzuli
                    </button>
                </div>

            </div>
        `;

        $("btnResultadoVolver")
            ?.addEventListener("click", renderAdministrazioa);

        $("btnCopyInitialPassword")
            ?.addEventListener("click", async evento => {

                const boton = evento.currentTarget;

                try {

                    await navigator.clipboard.writeText(password);

                    boton.innerHTML = `${ICONOS.check} Kopiatuta`;

                    setTimeout(() => {
                        boton.innerHTML = `${ICONOS.copiar} Kopiatu`;
                    }, 2000);

                } catch (copyError) {

                    console.error("Error copiando contraseña:", copyError);

                    alert(`Hasierako pasahitza: ${password}`);
                }
            });
    }


    // ============================================================
    // PERSONA - VISTA INDIVIDUAL
    // ============================================================

    async function cargarPersona(id) {

        const pageContent = $("pageContent");

        if (!pageContent) {
            return;
        }

        pageContent.innerHTML = cargando(
            "Aholkulariaren informazioa kargatzen..."
        );

        try {

            // ----------------------------------------------------
            // PERSONA
            // ----------------------------------------------------

            const { data: persona, error: personaError } =
                await window.hlbpSupabase
                    .from("profiles")
                    .select(`
                        id,
                        email,
                        nombre,
                        apellidos,
                        role,
                        berritzegune,
                        espezialitatea,
                        activo
                    `)
                    .eq("id", id)
                    .maybeSingle();

            if (personaError) {
                throw personaError;
            }

            if (!persona) {
                throw new Error("Ez da Aholkularia aurkitu.");
            }


            // ----------------------------------------------------
            // REGISTROS
            // ----------------------------------------------------

            const registros = await obtenerTodas(
                "registros",
                `
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
                `,
                {
                    filtro: consulta => consulta.eq("aholkulari_id", id),
                    orden: [["fecha", false], ["id", true]]
                }
            );


            // ----------------------------------------------------
            // CENTROS ASIGNADOS
            // ----------------------------------------------------

            const { data: relaciones, error: relacionesError } =
                await window.hlbpSupabase
                    .from("aholkulari_centros")
                    .select("id, aholkulari_id, centro_id")
                    .eq("aholkulari_id", id);

            if (relacionesError) {
                throw relacionesError;
            }

            // Centros asignados + centros que aparecen en sus registros
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

            const asignadosIds = new Set(
                (relaciones || []).map(relacion => String(relacion.centro_id))
            );

            renderPersona(
                persona,
                registros,
                centros,
                centros.filter(centro => asignadosIds.has(String(centro.id)))
            );

        } catch (error) {

            console.error("Error cargando persona:", error);

            pageContent.innerHTML = `
                <div class="admin-page">
                    <div class="admin-panel">
                        ${estadoVacio(
                            ICONOS.aviso,
                            "Ezin izan da informazioa kargatu",
                            obtenerMensajeError(error),
                            `<button type="button" class="admin-btn admin-btn-primary" id="btnVolverError">Itzuli</button>`
                        )}
                    </div>
                </div>
            `;

            $("btnVolverError")?.addEventListener("click", volverAlListado);
        }
    }


    function volverAlListado() {

        window.location.href = "administrazioa.html";
    }


    // ============================================================
    // RENDER PERSONA
    // ============================================================

    function renderPersona(persona, registros, centros, centrosAsignados) {

        const pageContent = $("pageContent");

        if (!pageContent) {
            return;
        }

        estado.persona = persona;
        estado.registros = registros;
        estado.centros = centros;
        estado.centrosAsignados = centrosAsignados;

        const nombre = nombreCompleto(persona) || persona.email || "Aholkularia";

        const tareas = unicos(registros.map(registro => registro.tarea));
        const tipos = unicos(registros.map(registro => registro.tipo));
        const subtipos = unicos(registros.map(registro => registro.subtipo));

        const centrosMap = new Map(
            centros.map(centro => [String(centro.id), centro])
        );

        const centrosRegistros = unicos(
            registros.map(registro => registro.centro_id)
        );

        const opcionesCentros = centrosRegistros
            .map(id => {

                const centro = centrosMap.get(id);

                const etiqueta = centro
                    ? `${centro.codigo || ""} ${centro.nombre ? "· " + centro.nombre : ""}`.trim()
                    : id;

                return `<option value="${escapeHtml(id)}">${escapeHtml(etiqueta)}</option>`;
            })
            .join("");

        pageContent.innerHTML = `

            <div class="admin-page">

                <header class="admin-page-header">

                    <div>

                        <div class="admin-breadcrumb">
                            HLBP / Administrazioa / ${escapeHtml(nombre)}
                        </div>

                        <h1>${escapeHtml(nombre)}</h1>

                        <p>Aholkulariaren informazioa eta erregistroak.</p>

                    </div>

                    <div class="admin-header-actions">

                        <button
                            type="button"
                            class="admin-btn admin-btn-secondary"
                            id="btnVolverPersona"
                        >
                            ${ICONOS.volver}
                            Itzuli
                        </button>

                        <button
                            type="button"
                            class="admin-btn admin-btn-secondary"
                            id="btnExcelPersona"
                        >
                            ${ICONOS.descargar}
                            Excelera deskargatu
                        </button>

                        <button
                            type="button"
                            class="admin-btn admin-btn-primary"
                            id="btnEditarPersona"
                        >
                            ${ICONOS.editatu}
                            Editatu
                        </button>

                    </div>

                </header>


                <section class="admin-panel">

                    <div class="admin-panel-header">
                        <div>
                            <h2>Aholkulariaren datuak</h2>
                        </div>
                    </div>

                    <div class="person-info-grid">

                        <div class="person-info-item">
                            <span>Izena</span>
                            <strong>${escapeHtml(nombre)}</strong>
                        </div>

                        <div class="person-info-item">
                            <span>Emaila</span>
                            <strong>${escapeHtml(persona.email || "—")}</strong>
                        </div>

                        <div class="person-info-item">
                            <span>Bizilabeko Ubikazioa</span>
                            <strong>${escapeHtml(persona.berritzegune || "—")}</strong>
                        </div>

                        <div class="person-info-item">
                            <span>Espezialitatea</span>
                            <strong>${escapeHtml(persona.espezialitatea || "—")}</strong>
                        </div>

                        <div class="person-info-item">
                            <span>Zentroak</span>
                            <strong>${centrosAsignados.length}</strong>
                        </div>

                    </div>

                    <div class="person-centers">

                        <h3>Esleitutako zentroak</h3>

                        ${centrosAsignados.length
                            ? `<div class="admin-chip-list">
                                    ${centrosAsignados.map(centro => `
                                        <span
                                            class="admin-chip"
                                            title="${escapeHtml(centro.nombre || "")}"
                                        >
                                            ${escapeHtml(centro.codigo || centro.nombre || "—")}
                                        </span>
                                    `).join("")}
                               </div>`
                            : `<p class="admin-muted">Ez dago zentrorik esleituta.</p>`}

                    </div>

                </section>


                <section class="admin-panel">

                    <div class="admin-panel-header">
                        <div>
                            <h2>Erregistroak</h2>
                            <p id="personaRecordCount"></p>
                        </div>
                    </div>


                    <div class="admin-toolbar admin-toolbar-records">

                        <div class="admin-field admin-field-search">

                            <label for="recordSearch">Bilatu</label>

                            <div class="admin-search">
                                ${ICONOS.buscar}
                                <input
                                    type="search"
                                    id="recordSearch"
                                    placeholder="Bilatu erregistroetan"
                                    autocomplete="off"
                                >
                            </div>

                        </div>

                        <div class="admin-field">
                            <label for="recordFechaDesde">Data hasiera</label>
                            <input type="date" id="recordFechaDesde" class="admin-input">
                        </div>

                        <div class="admin-field">
                            <label for="recordFechaHasta">Data amaiera</label>
                            <input type="date" id="recordFechaHasta" class="admin-input">
                        </div>

                        <div class="admin-field">
                            <label for="recordCentro">Zentroa</label>
                            <select id="recordCentro" class="admin-input">
                                <option value="">Guztiak</option>
                                ${opcionesCentros}
                            </select>
                        </div>

                        <div class="admin-field">
                            <label for="recordTarea">Eginkizuna</label>
                            <select id="recordTarea" class="admin-input">
                                <option value="">Guztiak</option>
                                ${opcionesHtml(tareas)}
                            </select>
                        </div>

                        <div class="admin-field">
                            <label for="recordTipo">Mota</label>
                            <select id="recordTipo" class="admin-input">
                                <option value="">Guztiak</option>
                                ${opcionesHtml(tipos)}
                            </select>
                        </div>

                        <div class="admin-field">
                            <label for="recordSubtipo">Azpi-mota</label>
                            <select id="recordSubtipo" class="admin-input">
                                <option value="">Guztiak</option>
                                ${opcionesHtml(subtipos)}
                            </select>
                        </div>

                        <div class="admin-field">
                            <label for="recordEstado">Egoera</label>
                            <select id="recordEstado" class="admin-input">
                                <option value="">Guztiak</option>
                                <option value="Egin gabe">Egin gabe</option>
                                <option value="Eginda">Eginda</option>
                            </select>
                        </div>

                        <button
                            type="button"
                            class="admin-btn admin-btn-ghost"
                            id="recordClearFilters"
                        >
                            ${ICONOS.cerrar}
                            Garbitu
                        </button>

                    </div>


                    <div
                        id="personaRecordsContainer"
                        class="admin-table-container"
                    ></div>

                </section>

            </div>
        `;

        $("btnVolverPersona")?.addEventListener("click", volverAlListado);

        $("btnExcelPersona")?.addEventListener("click", descargarExcelPersona);

        $("btnEditarPersona")?.addEventListener("click", () => {
            mostrarFormularioEditarPersona(persona, centrosAsignados);
        });

        inicializarFiltrosRegistros();

        aplicarFiltrosRegistros();
    }


    // ============================================================
    // EDITAR PERSONA (DATUAK + ZENTROAK)
    // ============================================================

    async function mostrarFormularioEditarPersona(persona, centrosAsignadosActuales) {

        const pageContent = $("pageContent");

        if (!pageContent) {
            return;
        }

        pageContent.innerHTML = cargando("Zentroen zerrenda kargatzen...");

        let todosLosCentros = [];

        try {

            todosLosCentros = await obtenerTodas(
                "centros",
                "id, codigo, nombre, activo",
                { orden: [["codigo", true], ["id", true]] }
            );

        } catch (error) {

            console.error("Error cargando zentroak:", error);
        }

        renderFormularioEditarPersona(
            persona,
            todosLosCentros,
            centrosAsignadosActuales || []
        );
    }


    function renderFormularioEditarPersona(persona, todosLosCentros, centrosAsignadosIniciales) {

        const pageContent = $("pageContent");

        if (!pageContent) {
            return;
        }

        const nombre = nombreCompleto(persona) || persona.email || "Aholkularia";

        // Set de ids (como string) actualmente seleccionados.
        const seleccionados = new Set(
            centrosAsignadosIniciales.map(centro => String(centro.id))
        );

        const codigoMap = new Map(
            todosLosCentros
                .filter(centro => centro.codigo)
                .map(centro => [String(centro.codigo).trim().toLowerCase(), centro])
        );

        const centrosMap = new Map(
            todosLosCentros.map(centro => [String(centro.id), centro])
        );

        pageContent.innerHTML = `

            <div class="admin-page admin-page-narrow">

                <header class="admin-page-header">

                    <div>

                        <div class="admin-breadcrumb">
                            HLBP / Administrazioa / ${escapeHtml(nombre)} / Editatu
                        </div>

                        <h1>${escapeHtml(nombre)} editatu</h1>

                        <p>
                            Aholkulariaren datu guztiak eta esleitutako zentroak kudeatu.
                        </p>

                    </div>

                    <div class="admin-header-actions">

                        <button
                            type="button"
                            class="admin-btn admin-btn-secondary"
                            id="btnCancelarEdicion"
                        >
                            ${ICONOS.volver}
                            Utzi
                        </button>

                    </div>

                </header>


                <div id="editarPersonaResultado" aria-live="polite"></div>


                <form id="editarPersonaForm" class="admin-panel admin-form-card" novalidate>

                    <section class="admin-form-section">

                        <div class="admin-form-section-head">
                            <h2>Datu pertsonalak</h2>
                            <p>Aholkulariaren izena eta abizenak.</p>
                        </div>

                        <div class="admin-form-grid">

                            <div class="admin-form-group">
                                <label for="editarNombre">Izena *</label>
                                <input
                                    type="text"
                                    id="editarNombre"
                                    class="admin-input"
                                    value="${escapeHtml(persona.nombre || "")}"
                                    required
                                    autocomplete="off"
                                >
                            </div>

                            <div class="admin-form-group">
                                <label for="editarApellidos">Abizenak *</label>
                                <input
                                    type="text"
                                    id="editarApellidos"
                                    class="admin-input"
                                    value="${escapeHtml(persona.apellidos || "")}"
                                    required
                                    autocomplete="off"
                                >
                            </div>

                        </div>

                    </section>


                    <section class="admin-form-section">

                        <div class="admin-form-section-head">
                            <h2>Sarbidea</h2>
                            <p>Saioa hasteko emaila eta pasahitza.</p>
                        </div>

                        <div class="admin-form-grid">

                            <div class="admin-form-group">
                                <label for="editarEmail">Emaila *</label>
                                <input
                                    type="email"
                                    id="editarEmail"
                                    class="admin-input"
                                    value="${escapeHtml(persona.email || "")}"
                                    required
                                    autocomplete="off"
                                >
                                <small class="admin-help">
                                    Emaila aldatzen baduzu, aholkulariak email berri
                                    horrekin hasi beharko du saioa hurrengoan.
                                </small>
                            </div>

                            <div class="admin-form-group">
                                <label for="editarPasswordBerria">Pasahitz berria</label>
                                <input
                                    type="password"
                                    id="editarPasswordBerria"
                                    class="admin-input"
                                    autocomplete="new-password"
                                    minlength="6"
                                    placeholder="Hutsik utzi aldatu nahi ez baduzu"
                                >
                            </div>

                            <div class="admin-form-group">
                                <label for="editarPasswordErrepikatu">Errepikatu pasahitz berria</label>
                                <input
                                    type="password"
                                    id="editarPasswordErrepikatu"
                                    class="admin-input"
                                    autocomplete="new-password"
                                    minlength="6"
                                    placeholder="Hutsik utzi aldatu nahi ez baduzu"
                                >
                            </div>

                        </div>

                    </section>


                    <section class="admin-form-section">

                        <div class="admin-form-section-head">
                            <h2>Lan-eremua</h2>
                            <p>Bizilabeko Ubikazioa, espezialitatea eta kontuaren egoera.</p>
                        </div>

                        <div class="admin-form-grid">

                            <div class="admin-form-group">
                                <label for="editarBerritzegune">Bizilabeko Ubikazioa</label>
                                <input
                                    type="text"
                                    id="editarBerritzegune"
                                    class="admin-input"
                                    value="${escapeHtml(persona.berritzegune || "")}"
                                    autocomplete="off"
                                >
                            </div>

                            <div class="admin-form-group">
                                <label for="editarEspecialidad">Espezialitatea</label>
                                <select id="editarEspecialidad" class="admin-input">
                                    <option value="">Aukeratu...</option>
                                    <option value="Inklusioa" ${persona.espezialitatea === "Inklusioa" ? "selected" : ""}>Inklusioa</option>
                                    <option value="Bizikidetza" ${persona.espezialitatea === "Bizikidetza" ? "selected" : ""}>Bizikidetza</option>
                                    <option value="Posbentzioa" ${persona.espezialitatea === "Posbentzioa" ? "selected" : ""}>Posbentzioa</option>
                                </select>
                            </div>

                            <div class="admin-form-group">
                                <label for="editarActivo">Kontuaren egoera</label>
                                <select id="editarActivo" class="admin-input">
                                    <option value="true" ${persona.activo !== false ? "selected" : ""}>Aktibo</option>
                                    <option value="false" ${persona.activo === false ? "selected" : ""}>Ez-aktibo</option>
                                </select>
                            </div>

                        </div>

                    </section>


                    <section class="admin-form-section">

                        <div class="admin-form-section-head">
                            <h2>Zentroak</h2>
                            <p>Esleitutako zentroak gehitu edo kendu.</p>
                        </div>

                        <div class="admin-form-grid">

                            <div class="admin-form-group admin-form-full">

                                <label>Esleitutako zentroak</label>

                                <div id="editarCentrosChips" class="admin-chip-list admin-chip-editable"></div>

                            </div>

                            <div class="admin-form-group admin-form-full">

                                <label for="editarCentrosNuevos">Zentroak gehitu (kodeen bidez)</label>

                                <input
                                    type="text"
                                    id="editarCentrosNuevos"
                                    class="admin-input"
                                    list="editarCentrosPropuestas"
                                    placeholder="014002, 014003, 014004"
                                    autocomplete="off"
                                >

                                <datalist id="editarCentrosPropuestas">
                                    ${todosLosCentros
                                        .filter(centro => centro.codigo)
                                        .map(centro => `<option value="${escapeHtml(centro.codigo)}">${escapeHtml(centro.nombre || "")}</option>`)
                                        .join("")}
                                </datalist>

                                <small class="admin-help">
                                    Zentroen kodeak koma, hutsune edo puntu eta komaz bereizita.
                                    Kodeak datu-basean dauden bezala idatzi behar dira.
                                </small>

                                <div class="admin-form-inline-action">
                                    <button
                                        type="button"
                                        class="admin-btn admin-btn-small admin-btn-secondary"
                                        id="btnAnadirCentros"
                                    >
                                        ${ICONOS.mas}
                                        Zerrendara gehitu
                                    </button>
                                </div>

                                <div id="editarCentrosError" class="admin-form-message"></div>

                            </div>

                        </div>

                    </section>


                    <div id="editarPersonaMessage" class="admin-form-message" aria-live="polite"></div>

                    <footer class="admin-form-actions">

                        <button
                            type="button"
                            class="admin-btn admin-btn-secondary"
                            id="btnCancelarEdicion2"
                        >
                            Utzi
                        </button>

                        <button
                            type="submit"
                            class="admin-btn admin-btn-primary"
                            id="btnGuardarEdicion"
                        >
                            Aldaketak gorde
                        </button>

                    </footer>

                </form>

            </div>
        `;


        function pintarChipsCentros() {

            const contenedor = $("editarCentrosChips");

            if (!contenedor) {
                return;
            }

            if (seleccionados.size === 0) {

                contenedor.innerHTML = `<span class="admin-muted">Ez dago zentrorik esleituta.</span>`;

                return;
            }

            contenedor.innerHTML = [...seleccionados]
                .map(id => centrosMap.get(id))
                .filter(Boolean)
                .sort((a, b) =>
                    String(a.codigo || "").localeCompare(String(b.codigo || ""), "eu")
                )
                .map(centro => `
                    <span class="admin-chip admin-chip-removable" title="${escapeHtml(centro.nombre || "")}">
                        ${escapeHtml(centro.codigo || centro.nombre || "—")}
                        <button
                            type="button"
                            class="admin-chip-remove"
                            data-remove-centro="${escapeHtml(centro.id)}"
                            aria-label="Kendu ${escapeHtml(centro.codigo || centro.nombre || "")}"
                        >
                            ${ICONOS.x}
                        </button>
                    </span>
                `)
                .join("");

            contenedor.querySelectorAll("[data-remove-centro]").forEach(boton => {

                boton.addEventListener("click", () => {

                    seleccionados.delete(boton.dataset.removeCentro);

                    pintarChipsCentros();
                });
            });
        }


        pintarChipsCentros();


        $("btnAnadirCentros")?.addEventListener("click", () => {

            const errorContenedor = $("editarCentrosError");

            const input = $("editarCentrosNuevos");

            const codigos = parsearCentros(input?.value);

            if (errorContenedor) {
                errorContenedor.className = "admin-form-message";
                errorContenedor.textContent = "";
            }

            if (!codigos.length) {
                return;
            }

            const noEncontrados = [];

            codigos.forEach(codigo => {

                const centro = codigoMap.get(codigo.trim().toLowerCase());

                if (centro) {
                    seleccionados.add(String(centro.id));
                } else {
                    noEncontrados.push(codigo);
                }
            });

            pintarChipsCentros();

            if (input) {
                input.value = "";
            }

            if (noEncontrados.length && errorContenedor) {

                errorContenedor.className = "admin-form-message error";

                errorContenedor.textContent =
                    `Ez dira aurkitu kode hauek: ${noEncontrados.join(", ")}`;
            }
        });


        $("btnCancelarEdicion")?.addEventListener("click", () => {
            renderPersona(estado.persona, estado.registros, estado.centros, estado.centrosAsignados);
        });

        $("btnCancelarEdicion2")?.addEventListener("click", () => {
            renderPersona(estado.persona, estado.registros, estado.centros, estado.centrosAsignados);
        });


        $("editarPersonaForm")?.addEventListener("submit", async event => {

            event.preventDefault();

            await guardarEdicionPersona(
                persona,
                seleccionados,
                centrosAsignadosIniciales
            );
        });
    }


    async function guardarEdicionPersona(persona, seleccionados, centrosAsignadosIniciales) {

        const boton = $("btnGuardarEdicion");

        const mensaje = $("editarPersonaMessage");

        const nombre = valorDe("editarNombre");

        const apellidos = valorDe("editarApellidos");

        const email = valorDe("editarEmail").toLowerCase();

        const passwordBerria = valorDe("editarPasswordBerria");

        const passwordErrepikatu = valorDe("editarPasswordErrepikatu");

        const berritzegune = valorDe("editarBerritzegune");

        const espezialitatea = $("editarEspecialidad")?.value || "";

        const activo = $("editarActivo")?.value === "true";

        if (!nombre || !apellidos || !email) {

            mostrarFormularioMensaje(mensaje, "Izena, abizenak eta emaila bete behar dira.", "error");

            return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {

            mostrarFormularioMensaje(mensaje, "Email helbideak ez du formatu zuzena.", "error");

            return;
        }

        if (passwordBerria || passwordErrepikatu) {

            if (passwordBerria.length < 6) {

                mostrarFormularioMensaje(mensaje, "Pasahitz berriak gutxienez 6 karaktere izan behar ditu.", "error");

                return;
            }

            if (passwordBerria !== passwordErrepikatu) {

                mostrarFormularioMensaje(mensaje, "Pasahitz berriak ez datoz bat.", "error");

                return;
            }
        }

        const contenidoBoton = boton ? boton.innerHTML : "";

        if (boton) {
            boton.disabled = true;
            boton.textContent = "Gordetzen...";
        }

        mostrarFormularioMensaje(mensaje, "Gordetzen...", "loading");

        try {

            // ------------------------------------------------
            // SARBIDEA: emaila eta/edo pasahitza (Edge Function)
            // ------------------------------------------------
            //
            // Auth-eko emaila/pasahitza aldatzeko ezin da taula
            // zuzenean idatzi: "create-aholkularia" eta
            // "delete-aholkularia" bezalako Edge Function batek
            // (service role gakoarekin) egin behar du.
            // ------------------------------------------------

            const emailAldatu = email !== (persona.email || "").toLowerCase();

            if (emailAldatu || passwordBerria) {

                const kredentzialak = { userId: persona.id };

                if (emailAldatu) {
                    kredentzialak.email = email;
                }

                if (passwordBerria) {
                    kredentzialak.password = passwordBerria;
                }

                const { data: kredentzialakData, error: kredentzialakError } =
                    await window.hlbpSupabase.functions.invoke(
                        "update-aholkularia",
                        { body: kredentzialak }
                    );

                if (kredentzialakError) {

                    throw new Error(
                        await leerErrorFuncion(
                            kredentzialakError,
                            "Ezin izan dira sarbide-datuak eguneratu."
                        )
                    );
                }

                if (!kredentzialakData || kredentzialakData.success !== true) {

                    throw new Error(
                        kredentzialakData?.error || "Ezin izan dira sarbide-datuak eguneratu."
                    );
                }
            }

            // ------------------------------------------------
            // DATOS DEL PERFIL
            // ------------------------------------------------

            const { error: perfilError } =
                await window.hlbpSupabase
                    .from("profiles")
                    .update({
                        nombre,
                        apellidos,
                        berritzegune: berritzegune || null,
                        espezialitatea: espezialitatea || null,
                        activo
                    })
                    .eq("id", persona.id);

            if (perfilError) {
                throw perfilError;
            }

            // ------------------------------------------------
            // ZENTROAK: diferencia entre lo asignado antes y ahora
            // ------------------------------------------------

            const idsIniciales = new Set(
                centrosAsignadosIniciales.map(centro => String(centro.id))
            );

            const aAnadir = [...seleccionados].filter(id => !idsIniciales.has(id));

            const aQuitar = [...idsIniciales].filter(id => !seleccionados.has(id));

            if (aAnadir.length) {

                const { error: insertError } =
                    await window.hlbpSupabase
                        .from("aholkulari_centros")
                        .insert(
                            aAnadir.map(centroId => ({
                                aholkulari_id: persona.id,
                                centro_id: centroId
                            }))
                        );

                if (insertError) {
                    throw insertError;
                }
            }

            if (aQuitar.length) {

                const { error: deleteError } =
                    await window.hlbpSupabase
                        .from("aholkulari_centros")
                        .delete()
                        .eq("aholkulari_id", persona.id)
                        .in("centro_id", aQuitar);

                if (deleteError) {
                    throw deleteError;
                }
            }

            await cargarPersona(persona.id);

        } catch (error) {

            console.error("Errorea Aholkularia editatzean:", error);

            mostrarFormularioMensaje(mensaje, obtenerMensajeError(error), "error");

            if (boton) {
                boton.disabled = false;
                boton.innerHTML = contenidoBoton;
            }
        }
    }


    // ============================================================
    // FILTROS DE REGISTROS
    // ============================================================

    const IDS_FILTROS_REGISTROS = [
        "recordSearch",
        "recordFechaDesde",
        "recordFechaHasta",
        "recordCentro",
        "recordTarea",
        "recordTipo",
        "recordSubtipo",
        "recordEstado"
    ];


    function inicializarFiltrosRegistros() {

        IDS_FILTROS_REGISTROS.forEach(id => {

            const elemento = $(id);

            if (!elemento) {
                return;
            }

            elemento.addEventListener("input", aplicarFiltrosRegistros);
            elemento.addEventListener("change", aplicarFiltrosRegistros);
        });

        $("recordClearFilters")?.addEventListener("click", () => {

            IDS_FILTROS_REGISTROS.forEach(id => {

                const elemento = $(id);

                if (elemento) {
                    elemento.value = "";
                }
            });

            aplicarFiltrosRegistros();
        });
    }


    function aplicarFiltrosRegistros() {

        const registros = estado.registros || [];

        const centrosMap = new Map(
            (estado.centros || []).map(centro => [String(centro.id), centro])
        );

        const texto = valorDe("recordSearch").toLowerCase();
        const fechaDesde = valorDe("recordFechaDesde");
        const fechaHasta = valorDe("recordFechaHasta");
        const centro = valorDe("recordCentro");
        const tarea = valorDe("recordTarea");
        const tipo = valorDe("recordTipo");
        const subtipo = valorDe("recordSubtipo");
        const estadoRegistro = valorDe("recordEstado");

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

        const contador = $("personaRecordCount");

        if (contador) {

            contador.textContent =
                filtrados.length === registros.length
                    ? `${registros.length} erregistro`
                    : `${filtrados.length} / ${registros.length} erregistro`;
        }

        renderTablaRegistros(filtrados, registros.length);
    }


    // ============================================================
    // TABLA REGISTROS
    // ============================================================

    function renderTablaRegistros(registros, totalGeneral) {

        const container = $("personaRecordsContainer");

        if (!container) {
            return;
        }

        if (!registros.length) {

            container.innerHTML =
                totalGeneral === 0
                    ? estadoVacio(
                        ICONOS.registros,
                        "Ez dago erregistrorik",
                        "Aholkulari honek ez du erregistrorik sortu oraindik."
                    )
                    : estadoVacio(
                        ICONOS.buscar,
                        "Ez dago emaitzarik",
                        "Ez da erregistrorik aurkitu hautatutako irizpideekin."
                    );

            return;
        }

        const centrosMap = new Map(
            (estado.centros || []).map(centro => [String(centro.id), centro])
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

                    <td>${escapeHtml(registro.estudiante_id || "—")}</td>

                    <td>
                        <span class="admin-status ${hecho ? "admin-status-success" : "admin-status-pending"}">
                            ${escapeHtml(registro.estado || "—")}
                        </span>
                    </td>

                    <td>
                        <button
                            type="button"
                            class="admin-btn admin-btn-small admin-btn-danger"
                            data-record-id="${escapeHtml(registro.id)}"
                        >
                            ${ICONOS.papelera}
                            Ezabatu
                        </button>
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
                            <th>Ekintza</th>
                        </tr>
                    </thead>

                    <tbody>${filas}</tbody>

                </table>

            </div>
        `;

        container.onclick = evento => {

            const boton = evento.target.closest("[data-record-id]");

            if (boton) {
                eliminarRegistro(boton.dataset.recordId);
            }
        };
    }


    // ============================================================
    // ELIMINAR REGISTRO
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
                    .eq("id", id);

            if (error) {
                throw error;
            }

            estado.registros = estado.registros.filter(
                registro => String(registro.id) !== String(id)
            );

            aplicarFiltrosRegistros();

        } catch (error) {

            console.error("Error eliminando registro:", error);

            alert(obtenerMensajeError(error));
        }
    }


    // ============================================================
    // EXCEL
    // ============================================================

    function asegurarXLSX() {

        return new Promise((resolve, reject) => {

            if (typeof XLSX !== "undefined") {
                resolve();
                return;
            }

            const script = document.createElement("script");

            script.src =
                "https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js";

            script.onload = () => resolve();

            script.onerror = () =>
                reject(
                    new Error(
                        "Ezin izan da Excel esportatzeko liburutegia kargatu."
                    )
                );

            document.head.appendChild(script);
        });
    }


    async function descargarExcelGlobal() {

        try {

            await asegurarXLSX();

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
                { orden: [["fecha", false], ["id", true]] }
            );

            const perfiles = await obtenerTodas(
                "profiles",
                `
                    id,
                    email,
                    nombre,
                    apellidos,
                    berritzegune,
                    espezialitatea
                `
            );

            const centros = await obtenerTodas(
                "centros",
                "id, codigo, nombre, activo"
            );

            const perfilesMap = new Map(
                perfiles.map(perfil => [String(perfil.id), perfil])
            );

            const centrosMap = new Map(
                centros.map(centro => [String(centro.id), centro])
            );

            const filas = registros.map(registro => {

                const perfil = perfilesMap.get(String(registro.aholkulari_id)) || {};

                const centro = centrosMap.get(String(registro.centro_id)) || {};

                return {
                    "Aholkularia": nombreCompleto(perfil),
                    "Emaila": perfil.email || "",
                    "Bizilabeko Ubikazioa": perfil.berritzegune || "",
                    "Espezialitatea": perfil.espezialitatea || "",
                    "Zentroaren kodigoa": centro.codigo || "",
                    "Zentroa": centro.nombre || "",
                    "Eginkizuna": registro.tarea || "",
                    "Mota": registro.tipo || "",
                    "Azpi-mota": registro.subtipo || "",
                    "Ikasle kopurua": registro.estudiante_id || "",
                    "Zehaztu": registro.zehaztu || "",
                    "Egiteko data": registro.fecha || "",
                    "Amaiera-data": registro.fecha_fin || "",
                    "Egoera": registro.estado || "",
                    "Oharrak": registro.observaciones || "",
                    "Erregistro ID": registro.id || "",
                    "Sortze data": registro.created_at || ""
                };
            });

            const worksheet = XLSX.utils.json_to_sheet(filas);

            worksheet["!cols"] = [
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
                { wch: 38 },
                { wch: 24 }
            ];

            const workbook = XLSX.utils.book_new();

            XLSX.utils.book_append_sheet(workbook, worksheet, "Erregistroak");

            const fecha = new Date().toISOString().slice(0, 10);

            XLSX.writeFile(workbook, `HLBP_erregistroak_${fecha}.xlsx`);

        } catch (error) {

            console.error("Error exportando Excel global:", error);

            alert(obtenerMensajeError(error));
        }
    }


    async function descargarExcelPersona() {

        try {

            await asegurarXLSX();

            const persona = estado.persona;

            if (!persona) {
                alert("Ez dago Aholkulariaren daturik.");
                return;
            }

            const centrosMap = new Map(
                (estado.centros || []).map(centro => [String(centro.id), centro])
            );

            const filas = estado.registros.map(registro => {

                const centro = centrosMap.get(String(registro.centro_id)) || {};

                return {
                    "Aholkularia": nombreCompleto(persona),
                    "Emaila": persona.email || "",
                    "Bizilabeko Ubikazioa": persona.berritzegune || "",
                    "Espezialitatea": persona.espezialitatea || "",
                    "Zentroaren kodigoa": centro.codigo || "",
                    "Zentroa": centro.nombre || "",
                    "Eginkizuna": registro.tarea || "",
                    "Mota": registro.tipo || "",
                    "Azpi-mota": registro.subtipo || "",
                    "Ikasle kopurua": registro.estudiante_id || "",
                    "Zehaztu": registro.zehaztu || "",
                    "Egiteko data": registro.fecha || "",
                    "Amaiera-data": registro.fecha_fin || "",
                    "Egoera": registro.estado || "",
                    "Oharrak": registro.observaciones || "",
                    "Erregistro ID": registro.id || "",
                    "Sortze data": registro.created_at || ""
                };
            });

            const worksheet = XLSX.utils.json_to_sheet(filas);

            const workbook = XLSX.utils.book_new();

            XLSX.utils.book_append_sheet(workbook, worksheet, "Erregistroak");

            XLSX.writeFile(
                workbook,
                `HLBP_${slug(nombreCompleto(persona) || persona.email)}_erregistroak.xlsx`
            );

        } catch (error) {

            console.error("Error exportando Excel persona:", error);

            alert(obtenerMensajeError(error));
        }
    }


    // ============================================================
    // ERROR GENERAL
    // ============================================================

    function mostrarErrorAdministrazioa(error) {

        const app = $("app");

        if (!app) {
            return;
        }

        app.innerHTML = `
            <div class="app-error-state">

                <div class="app-error-icon">${ICONOS.aviso}</div>

                <h2>Ezin izan da Administrazioa kargatu</h2>

                <p>${escapeHtml(obtenerMensajeError(error))}</p>

                <button type="button" id="btnReintentarAdmin">
                    Berriro saiatu
                </button>

            </div>
        `;

        $("btnReintentarAdmin")
            ?.addEventListener("click", () => window.location.reload());
    }

})();
