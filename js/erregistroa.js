/* ============================================================
   HLBP - ERREGISTROA
   Registro de actuaciones
   ============================================================ */

document.addEventListener("DOMContentLoaded", async () => {

    console.log("HLBP: iniciando Erregistroa...");

    try {

        const autenticado = await HLBPSession.init();

        if (!autenticado) {
            window.location.replace("../index.html");
            return;
        }

        HLBPLayout.render();

        inicializarErregistroa();

    } catch (error) {

        console.error(
            "HLBP Erregistroa - error inicial:",
            error
        );

        mostrarPantallaError(
            "Ezin izan da Erregistroa kargatu."
        );

    }

});


/* ============================================================
   CATÁLOGO ORIGINAL HLBP
   ============================================================ */

const DATOS_EGINKIZUNAK = {

    "Inklusioa": [
        "Ebaluazio psikopedagogiko berriak",
        "Protokoloak",
        "Txostenak",
        "Eskolatze proposamen berriak",
        "CNE-en kudeaketa",
        "Jokabide kasuak",
        "ZIP gelako eginbeharrak",
        "LIP gelako eginbeharrak",
        "Etapa aldaketak"
    ],

    "Bizikidetza": [
        "Jokabide kasuak",
        "Ikasleen konbibentzia"
    ],

    "Posbentzioa": [
        "Prebentzio programak"
    ],

    "Admin": []

};


const EGINKIZUN_KONFIG = {

    "Ebaluazio psikopedagogiko berriak": {

        ikasleId: true,

        motak: [
            "Balidatzea",
            "Berria",
            "100.2A",
            "105 adimen kognitibia",
            "6. Mailako birrebaluazioa",
            "Besteak"
        ],

        motaZehaztu: [
            "Besteak"
        ]

    },


    "Protokoloak": {

        ikasleId: true,

        motak: [
            "AGH",
            "AG",
            "TDL",
            "IZE",
            "KSHO"
        ],

        azpiMotak: [
            "2. fasetik 3. fasera jarraipena",
            "3. faseko ebaluazioa"
        ]

    },


    "Txostenak": {

        ikasleId: true,

        motak: [
            "Ebaluazio psikopedagogikoa",
            "Osatuz programetarako txostena",
            "Osagarri programetarako txostena"
        ]

    },


    "Eskolatze proposamen berriak": {

        ikasleId: true,

        zehaztu: true

    },


    "CNE-en kudeaketa": {

        ikasleId: true,

        motak: [
            "Arlokoa",
            "Globala"
        ]

    },


    "Jokabide kasuak": {

        ikasleId: true

    },


    "ZIP gelako eginbeharrak": {

        ikasleId: false,

        zehaztu: true

    },


    "LIP gelako eginbeharrak": {

        ikasleId: false,

        zehaztu: true

    },


    "Etapa aldaketak": {

        ikasleId: true,

        zehaztu: true

    }

};


const EREMU_LEHENETSIAK = {

    ikasleId: true

};


/* ============================================================
   INICIALIZACIÓN
   ============================================================ */

async function inicializarErregistroa() {

    const pageContent =
        document.getElementById("pageContent");

    if (!pageContent) {

        console.error(
            "HLBP Erregistroa: pageContent no encontrado."
        );

        return;
    }


    pageContent.innerHTML = renderErregistroa();


    prepararFechaInicial();

    rellenarDatosUsuario();

    await cargarCentros();

    cargarTareas();

    inicializarEventos();


    console.log(
        "HLBP: Erregistroa cargado correctamente."
    );

}


/* ============================================================
   HTML DE LA PÁGINA
   ============================================================ */

function renderErregistroa() {

    return `

        <div class="erregistroa-page">

            <header class="erregistroa-header">

                <div class="erregistroa-header-content">

                    <h1 class="erregistroa-title">
                        Erregistroa
                    </h1>

                    <p class="erregistroa-subtitle">
                        Egindako eginkizun eta jardueren erregistro berria sortu.
                    </p>

                </div>


                <div class="erregistroa-header-badge">
                    Saioa aktibo
                </div>

            </header>


            <div
                id="erregistroaAlert"
                class="erregistroa-alert"
                aria-live="polite"
            ></div>


            <section class="erregistroa-card">


                <div class="erregistroa-card-header">

                    <div class="erregistroa-card-icon">
                        📝
                    </div>

                    <div>

                        <h2>
                            Erregistroaren datuak
                        </h2>

                        <p>
                            Bete eremuak eta gorde jarduera PostgreSQL datu-basean.
                        </p>

                    </div>

                </div>


                <form
                    id="erregistroaForm"
                    class="erregistroa-form"
                    novalidate
                >


                    <!-- ==================================================
                         IDENTIFICACIÓN
                         ================================================== -->

                    <section class="erregistroa-section">

                        <h3 class="erregistroa-section-title">
                            Identifikazioa
                        </h3>


                        <div class="erregistroa-grid">


                            <div class="erregistroa-field">

                                <label for="registroAholkularia">
                                    Aholkularia
                                </label>

                                <input
                                    type="text"
                                    id="registroAholkularia"
                                    readonly
                                >

                            </div>


                            <div class="erregistroa-field">

                                <label for="registroCentro">
                                    Ikastetxea
                                    <span class="erregistroa-required">*</span>
                                </label>

                                <select id="registroCentro" required>

                                    <option value="">
                                        Kargatzen...
                                    </option>

                                </select>

                            </div>


                        </div>

                    </section>


                    <!-- ==================================================
                         EGINKIZUNA
                         ================================================== -->

                    <section class="erregistroa-section">

                        <h3 class="erregistroa-section-title">
                            Eginkizuna
                        </h3>


                        <div class="erregistroa-grid">


                            <div class="erregistroa-field">

                                <label for="registroTarea">
                                    Eginkizuna
                                    <span class="erregistroa-required">*</span>
                                </label>

                                <select id="registroTarea" required>

                                    <option value="">
                                        Aukeratu eginkizuna...
                                    </option>

                                </select>

                            </div>


                            <div
                                class="erregistroa-field erregistroa-dynamic"
                                id="grupoMota"
                            >

                                <label for="registroMota">
                                    Mota
                                    <span class="erregistroa-required">*</span>
                                </label>

                                <select id="registroMota">

                                    <option value="">
                                        Aukeratu mota...
                                    </option>

                                </select>

                            </div>


                            <div
                                class="erregistroa-field erregistroa-dynamic"
                                id="grupoAzpiMota"
                            >

                                <label for="registroAzpiMota">
                                    Azpi-mota
                                    <span class="erregistroa-required">*</span>
                                </label>

                                <select id="registroAzpiMota">

                                    <option value="">
                                        Aukeratu azpi-mota...
                                    </option>

                                </select>

                            </div>


                            <div
                                class="erregistroa-field erregistroa-dynamic"
                                id="grupoIkaslea"
                            >

                                <label for="registroIkaslea">
                                    Ikaslearen ID
                                    <span class="erregistroa-required">*</span>
                                </label>

                                <input
                                    type="text"
                                    id="registroIkaslea"
                                    placeholder="Adib: IK-0234"
                                    autocomplete="off"
                                >

                                <span class="erregistroa-help">
                                    Ez erabili ikaslearen izen-abizenik. ID edo kodea bakarrik.
                                </span>

                            </div>


                            <div
                                class="erregistroa-field erregistroa-dynamic erregistroa-dynamic-wide"
                                id="grupoZehaztu"
                            >

                                <label for="registroZehaztu">
                                    Zehaztu
                                    <span class="erregistroa-required">*</span>
                                </label>

                                <textarea
                                    id="registroZehaztu"
                                    placeholder="Zehaztu eginbeharrak..."
                                ></textarea>

                            </div>


                        </div>

                    </section>


                    <!-- ==================================================
                         FECHAS / ESTADO
                         ================================================== -->

                    <section class="erregistroa-section">

                        <h3 class="erregistroa-section-title">
                            Data eta egoera
                        </h3>


                        <div class="erregistroa-grid">


                            <div class="erregistroa-field">

                                <label for="registroData">
                                    Egiteko data
                                    <span class="erregistroa-required">*</span>
                                </label>

                                <input
                                    type="date"
                                    id="registroData"
                                    required
                                >

                            </div>


                            <div class="erregistroa-field">

                                <label for="registroAmaieraData">
                                    Amaiera-data
                                </label>

                                <input
                                    type="date"
                                    id="registroAmaieraData"
                                >

                            </div>


                            <div class="erregistroa-field">

                                <label for="registroEgoera">
                                    Egoera
                                </label>

                                <select id="registroEgoera">

                                    <option value="Egin gabe">
                                        Egin gabe
                                    </option>

                                    <option value="Eginda">
                                        Eginda
                                    </option>

                                </select>

                            </div>


                        </div>

                    </section>


                    <!-- ==================================================
                         OBSERVACIONES
                         ================================================== -->

                    <section class="erregistroa-section">

                        <h3 class="erregistroa-section-title">
                            Oharrak
                        </h3>


                        <div class="erregistroa-field">

                            <label for="registroOharrak">
                                Oharrak
                            </label>

                            <textarea
                                id="registroOharrak"
                                placeholder="Gehitu ohar..."
                            ></textarea>

                            <span class="erregistroa-help">
                                Ez idatzi ikasleen izen-abizenik.
                            </span>

                        </div>


                        <div class="erregistroa-info">

                            <div class="erregistroa-info-icon">
                                ℹ
                            </div>

                            <p>
                                Erregistroa gordetzean, informazioa erabiltzaile
                                autentifikatuaren kontuarekin lotuko da eta
                                PostgreSQL datu-base zentralean gordeko da.
                            </p>

                        </div>

                    </section>


                    <!-- ==================================================
                         ACCIONES
                         ================================================== -->

                    <div class="erregistroa-actions">

                        <button
                            type="button"
                            id="garbituButton"
                            class="erregistroa-btn erregistroa-btn-secondary"
                        >
                            ↻ Garbitu
                        </button>


                        <button
                            type="submit"
                            id="gordeButton"
                            class="erregistroa-btn erregistroa-btn-primary"
                        >

                            <span
                                id="gordeText"
                            >
                                💾 Gorde
                            </span>

                            <span
                                id="gordeLoading"
                                class="erregistroa-loading"
                            >

                                <span class="erregistroa-spinner"></span>

                                Gordetzen...

                            </span>

                        </button>

                    </div>


                </form>

            </section>

        </div>

    `;
}


/* ============================================================
   USUARIO
   ============================================================ */

function rellenarDatosUsuario() {

    const input = document.getElementById("registroAholkularia");

    if (!input) {
        return;
    }

    input.value = HLBPSession.profile ? HLBPSession.getName() : "";
}


/* ============================================================
   CENTROS
   ============================================================ */

async function cargarCentros() {

    const select =
        document.getElementById(
            "registroCentro"
        );

    if (!select) {
        return;
    }


    select.innerHTML = `
        <option value="">
            Kargatzen...
        </option>
    `;


    try {

        const userId =
            HLBPSession.user.id;


        /*
         * Primero intentamos obtener los centros asignados
         * al usuario actual.
         */

        const {
            data,
            error
        } = await window.hlbpSupabase

            .from("aholkulari_centros")

            .select(`
                centro_id,
                centros (
                    id,
                    codigo,
                    nombre,
                    municipio,
                    zona,
                    activo
                )
            `)

            .eq(
                "aholkulari_id",
                userId
            );


        if (error) {

            console.error(
                "Error cargando centros:",
                error
            );

            throw error;

        }


        let centros =
            (data || [])

                .map(item => item.centros)

                .filter(
                    centro =>
                        centro &&
                        centro.activo !== false
                );


        /*
         * Para ADMIN / MASTER, si no hay centros asignados,
         * mostramos los centros activos disponibles.
         */

        if (
            centros.length === 0 &&
            HLBPSession.isAdminOrMaster()
        ) {

            const {
                data: todosCentros,
                error: todosError
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

                .eq(
                    "activo",
                    true
                )

                .order(
                    "nombre",
                    {
                        ascending: true
                    }
                );


            if (todosError) {
                throw todosError;
            }


            centros =
                todosCentros || [];

        }


        centros.sort(
            (a, b) =>
                String(a.nombre || "")
                    .localeCompare(
                        String(b.nombre || ""),
                        "eu"
                    )
        );


        if (centros.length === 0) {

            select.innerHTML = `
                <option value="">
                    Ez dago zentrorik esleituta
                </option>
            `;

            mostrarAlerta(
                "warning",
                "Ez dago zentrorik esleituta zure erabiltzaileari."
            );

            return;

        }


        select.innerHTML = `
            <option value="">
                Aukeratu ikastetxea...
            </option>
        `;


        centros.forEach(
            centro => {

                const option =
                    document.createElement(
                        "option"
                    );

                option.value =
                    centro.id;

                option.textContent =
                    `${centro.nombre}${centro.codigo ? ` · ${centro.codigo}` : ""}`;

                select.appendChild(
                    option
                );

            }
        );


    } catch (error) {

        console.error(
            "HLBP: error obteniendo centros:",
            error
        );


        select.innerHTML = `
            <option value="">
                Ezin izan dira zentroak kargatu
            </option>
        `;


        mostrarAlerta(
            "error",
            "Ezin izan dira zentroak kargatu. Saiatu berriro."
        );

    }

}


/* ============================================================
   TAREAS
   ============================================================ */

function cargarTareas() {

    const select =
        document.getElementById(
            "registroTarea"
        );

    if (!select) {
        return;
    }


    const especialidad =
        HLBPSession.profile?.especialidad ||
        "";


    let tareas =
        DATOS_EGINKIZUNAK[
            especialidad
        ] || [];


    /*
     * ADMIN / MASTER pueden no tener especialidad.
     * En ese caso mostramos el catálogo completo.
     */

    if (
        tareas.length === 0 &&
        HLBPSession.isAdminOrMaster()
    ) {

        tareas =
            obtenerTodasLasTareas();

    }


    select.innerHTML = `
        <option value="">
            Aukeratu eginkizuna...
        </option>
    `;


    tareas.forEach(
        tarea => {

            const option =
                document.createElement(
                    "option"
                );

            option.value =
                tarea;

            option.textContent =
                tarea;

            select.appendChild(
                option
            );

        }
    );


    if (tareas.length === 0) {

        select.innerHTML = `
            <option value="">
                Ez dago eginkizunik esleituta
            </option>
        `;

    }

}


/* ============================================================
   TODAS LAS TAREAS
   ============================================================ */

function obtenerTodasLasTareas() {

    const resultado =
        new Set();


    Object.values(
        DATOS_EGINKIZUNAK
    ).forEach(
        tareas => {

            tareas.forEach(
                tarea =>
                    resultado.add(
                        tarea
                    )
            );

        }
    );


    return Array.from(
        resultado
    );

}


/* ============================================================
   EVENTOS
   ============================================================ */

function inicializarEventos() {

    const form =
        document.getElementById(
            "erregistroaForm"
        );


    const tareaSelect =
        document.getElementById(
            "registroTarea"
        );


    const motaSelect =
        document.getElementById(
            "registroMota"
        );


    const limpiarButton =
        document.getElementById(
            "garbituButton"
        );


    if (form) {

        form.addEventListener(
            "submit",
            async event => {

                event.preventDefault();

                await guardarRegistro();

            }
        );

    }


    if (tareaSelect) {

        tareaSelect.addEventListener(
            "change",
            updateEremuak
        );

    }


    if (motaSelect) {

        motaSelect.addEventListener(
            "change",
            updateMotaEremuak
        );

    }


    if (limpiarButton) {

        limpiarButton.addEventListener(
            "click",
            limpiarRegistro
        );

    }


    actualizarZehaztuEremua();

}


/* ============================================================
   CAMBIO DE EGINKIZUNA
   ============================================================ */

function updateEremuak() {

    const tarea =
        document.getElementById(
            "registroTarea"
        ).value;


    const cfg =
        EGINKIZUN_KONFIG[tarea] ||
        EREMU_LEHENETSIAK;


    const grupoMota =
        document.getElementById(
            "grupoMota"
        );


    const grupoAzpiMota =
        document.getElementById(
            "grupoAzpiMota"
        );


    const grupoIkaslea =
        document.getElementById(
            "grupoIkaslea"
        );


    const grupoZehaztu =
        document.getElementById(
            "grupoZehaztu"
        );


    const motaSelect =
        document.getElementById(
            "registroMota"
        );


    const azpiSelect =
        document.getElementById(
            "registroAzpiMota"
        );


    /*
     * MOTA
     */

    if (
        cfg.motak &&
        cfg.motak.length
    ) {

        motaSelect.innerHTML = `
            <option value="">
                Aukeratu mota...
            </option>
        `;


        cfg.motak.forEach(
            mota => {

                const option =
                    document.createElement(
                        "option"
                    );

                option.value =
                    mota;

                option.textContent =
                    mota;

                motaSelect.appendChild(
                    option
                );

            }
        );


        mostrarCampo(
            grupoMota
        );

    } else {

        motaSelect.innerHTML = `
            <option value="">
                Aukeratu mota...
            </option>
        `;


        ocultarCampo(
            grupoMota
        );

    }


    /*
     * AZPI-MOTA
     */

    azpiSelect.innerHTML = `
        <option value="">
            Aukeratu azpi-mota...
        </option>
    `;


    ocultarCampo(
        grupoAzpiMota
    );


    /*
     * IKASLEAREN ID
     */

    if (cfg.ikasleId) {

        mostrarCampo(
            grupoIkaslea
        );

    } else {

        ocultarCampo(
            grupoIkaslea
        );

        document.getElementById(
            "registroIkaslea"
        ).value = "";

    }


    /*
     * ZEHATZTU
     */

    if (cfg.zehaztu) {

        mostrarCampo(
            grupoZehaztu
        );

    } else {

        actualizarZehaztuEremua();

    }


    if (!cfg.zehaztu) {

        document.getElementById(
            "registroZehaztu"
        ).value = "";

    }

}


/* ============================================================
   CAMBIO DE MOTA
   ============================================================ */

function updateMotaEremuak() {

    const tarea =
        document.getElementById(
            "registroTarea"
        ).value;


    const mota =
        document.getElementById(
            "registroMota"
        ).value;


    const cfg =
        EGINKIZUN_KONFIG[tarea] ||
        {};


    const grupoAzpiMota =
        document.getElementById(
            "grupoAzpiMota"
        );


    const azpiSelect =
        document.getElementById(
            "registroAzpiMota"
        );


    azpiSelect.innerHTML = `
        <option value="">
            Aukeratu azpi-mota...
        </option>
    `;


    /*
     * El catálogo original tiene Azpi-mota
     * definido a nivel de tarea.
     */

    if (
        cfg.azpiMotak &&
        cfg.azpiMotak.length &&
        mota
    ) {

        cfg.azpiMotak.forEach(
            azpi => {

                const option =
                    document.createElement(
                        "option"
                    );

                option.value =
                    azpi;

                option.textContent =
                    azpi;

                azpiSelect.appendChild(
                    option
                );

            }
        );


        mostrarCampo(
            grupoAzpiMota
        );

    } else {

        ocultarCampo(
            grupoAzpiMota
        );

    }


    actualizarZehaztuEremua();

}


/* ============================================================
   ZEHATZTU
   ============================================================ */

function zehaztuBeharDa() {

    const tarea =
        document.getElementById(
            "registroTarea"
        ).value;


    const mota =
        document.getElementById(
            "registroMota"
        ).value;


    const cfg =
        EGINKIZUN_KONFIG[tarea] ||
        {};


    return Boolean(

        cfg.zehaztu ||

        (
            cfg.motaZehaztu &&
            cfg.motaZehaztu.includes(
                mota
            )
        )

    );

}


function actualizarZehaztuEremua() {

    const grupo =
        document.getElementById(
            "grupoZehaztu"
        );


    if (!grupo) {
        return;
    }


    if (zehaztuBeharDa()) {

        mostrarCampo(
            grupo
        );

    } else {

        ocultarCampo(
            grupo
        );

        const textarea =
            document.getElementById(
                "registroZehaztu"
            );

        if (textarea) {
            textarea.value = "";
        }

    }

}


/* ============================================================
   GUARDAR
   ============================================================ */

async function guardarRegistro() {

    const centroId =
        document.getElementById(
            "registroCentro"
        ).value;


    const tarea =
        document.getElementById(
            "registroTarea"
        ).value;


    const mota =
        document.getElementById(
            "registroMota"
        ).value;


    const azpiMota =
        document.getElementById(
            "registroAzpiMota"
        ).value;


    const ikaslea =
        document.getElementById(
            "registroIkaslea"
        ).value.trim();


    const zehaztu =
        document.getElementById(
            "registroZehaztu"
        ).value.trim();


    const fecha =
        document.getElementById(
            "registroData"
        ).value;


    const fechaFin =
        document.getElementById(
            "registroAmaieraData"
        ).value;


    const estado =
        document.getElementById(
            "registroEgoera"
        ).value;


    const observaciones =
        document.getElementById(
            "registroOharrak"
        ).value.trim();


    const cfg =
        EGINKIZUN_KONFIG[tarea] ||
        EREMU_LEHENETSIAK;


    /*
     * VALIDACIONES
     */

    if (!centroId) {

        mostrarAlerta(
            "error",
            "Ikastetxea aukeratu behar da."
        );

        return;

    }


    if (!tarea) {

        mostrarAlerta(
            "error",
            "Eginkizuna aukeratu behar da."
        );

        return;

    }


    if (!fecha) {

        mostrarAlerta(
            "error",
            "Egiteko data aukeratu behar da."
        );

        return;

    }


    if (
        fechaFin &&
        fechaFin < fecha
    ) {

        mostrarAlerta(
            "error",
            "Amaiera-data ezin da hasiera-data baino lehenagokoa izan."
        );

        return;

    }


    if (
        cfg.motak &&
        !mota
    ) {

        mostrarAlerta(
            "error",
            "Mota aukeratu behar da."
        );

        return;

    }


    if (
        cfg.azpiMotak &&
        !azpiMota
    ) {

        mostrarAlerta(
            "error",
            "Azpi-mota aukeratu behar da."
        );

        return;

    }


    if (
        cfg.ikasleId &&
        !ikaslea
    ) {

        mostrarAlerta(
            "error",
            "Ikaslearen ID bete behar da. Ez erabili izen-abizenik."
        );

        return;

    }


    if (
        zehaztuBeharDa() &&
        !zehaztu
    ) {

        mostrarAlerta(
            "error",
            "\"Zehaztu\" eremua bete behar da."
        );

        return;

    }


    /*
     * Deshabilitar botón
     */

    cambiarEstadoGuardado(
        true
    );


    try {

        const usuarioId =
            HLBPSession.user.id;


        /*
         * IMPORTANTE:
         * Estos nombres corresponden al modelo
         * PostgreSQL que estamos utilizando:
         *
         * usuario_id
         * centro_id
         * tarea
         * tipo
         * subtipo
         * alumno_id
         * zehaztu
         * fecha
         * fecha_fin
         * estado
         * observaciones
         */

        const nuevoRegistro = {

            usuario_id:
                usuarioId,

            centro_id:
                centroId,

            tarea:
                tarea,

            tipo:
                mota || null,

            subtipo:
                azpiMota || null,

            alumno_id:
                ikaslea || null,

            zehaztu:
                zehaztu || null,

            fecha:
                fecha,

            fecha_fin:
                fechaFin || null,

            estado:
                estado || "Egin gabe",

            observaciones:
                observaciones || null

        };


        console.log(
            "HLBP: guardando registro:",
            nuevoRegistro
        );


        const {
            data,
            error
        } = await window.hlbpSupabase

            .from("registros")

            .insert(
                nuevoRegistro
            )

            .select()
            .single();


        if (error) {

            console.error(
                "Error Supabase guardando registro:",
                error
            );

            throw error;

        }


        console.log(
            "HLBP: registro guardado:",
            data
        );


        mostrarAlerta(
            "success",
            "✓ Eginkizuna ondo gorde da!"
        );


        limpiarRegistro(
            false
        );


        /*
         * Mantener la fecha de hoy
         * después de limpiar.
         */

        prepararFechaInicial();


        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });


    } catch (error) {

        console.error(
            "HLBP: error guardando registro:",
            error
        );


        let mensaje =
            "Ezin izan da erregistroa gorde.";


        if (
            error &&
            error.message
        ) {

            console.error(
                "Detalle:",
                error.message
            );

        }


        mostrarAlerta(
            "error",
            mensaje
        );


    } finally {

        cambiarEstadoGuardado(
            false
        );

    }

}


/* ============================================================
   LIMPIAR
   ============================================================ */

function limpiarRegistro(
    mostrarMensaje = true
) {

    const centro =
        document.getElementById(
            "registroCentro"
        );


    const tarea =
        document.getElementById(
            "registroTarea"
        );


    const mota =
        document.getElementById(
            "registroMota"
        );


    const azpi =
        document.getElementById(
            "registroAzpiMota"
        );


    const ikaslea =
        document.getElementById(
            "registroIkaslea"
        );


    const zehaztu =
        document.getElementById(
            "registroZehaztu"
        );


    const fechaFin =
        document.getElementById(
            "registroAmaieraData"
        );


    const estado =
        document.getElementById(
            "registroEgoera"
        );


    const observaciones =
        document.getElementById(
            "registroOharrak"
        );


    if (centro) {
        centro.value = "";
    }


    if (tarea) {
        tarea.value = "";
    }


    if (mota) {

        mota.innerHTML = `
            <option value="">
                Aukeratu mota...
            </option>
        `;

    }


    if (azpi) {

        azpi.innerHTML = `
            <option value="">
                Aukeratu azpi-mota...
            </option>
        `;

    }


    if (ikaslea) {
        ikaslea.value = "";
    }


    if (zehaztu) {
        zehaztu.value = "";
    }


    if (fechaFin) {
        fechaFin.value = "";
    }


    if (estado) {
        estado.value = "Egin gabe";
    }


    if (observaciones) {
        observaciones.value = "";
    }


    ocultarCampo(
        document.getElementById(
            "grupoMota"
        )
    );


    ocultarCampo(
        document.getElementById(
            "grupoAzpiMota"
        )
    );


    ocultarCampo(
        document.getElementById(
            "grupoZehaztu"
        )
    );


    const cfg =
        EREMU_LEHENETSIAK;


    if (cfg.ikasleId) {

        mostrarCampo(
            document.getElementById(
                "grupoIkaslea"
            )
        );

    }


    if (mostrarMensaje) {

        mostrarAlerta(
            "success",
            "Formularioa garbitu da."
        );

    }

}


/* ============================================================
   FECHA INICIAL
   ============================================================ */

function prepararFechaInicial() {

    const input =
        document.getElementById(
            "registroData"
        );


    if (!input) {
        return;
    }


    if (!input.value) {

        const hoy =
            new Date();


        const year =
            hoy.getFullYear();


        const month =
            String(
                hoy.getMonth() + 1
            ).padStart(
                2,
                "0"
            );


        const day =
            String(
                hoy.getDate()
            ).padStart(
                2,
                "0"
            );


        input.value =
            `${year}-${month}-${day}`;

    }

}


/* ============================================================
   BOTÓN GUARDAR - ESTADO
   ============================================================ */

function cambiarEstadoGuardado(
    cargando
) {

    const button =
        document.getElementById(
            "gordeButton"
        );


    const text =
        document.getElementById(
            "gordeText"
        );


    const loading =
        document.getElementById(
            "gordeLoading"
        );


    if (!button) {
        return;
    }


    button.disabled =
        cargando;


    if (cargando) {

        if (text) {
            text.style.display = "none";
        }

        if (loading) {
            loading.classList.add(
                "show"
            );
        }

    } else {

        if (text) {
            text.style.display = "inline";
        }

        if (loading) {
            loading.classList.remove(
                "show"
            );
        }

    }

}


/* ============================================================
   CAMPOS VISIBLES
   ============================================================ */

function mostrarCampo(
    elemento
) {

    if (!elemento) {
        return;
    }


    elemento.classList.add(
        "visible"
    );

}


function ocultarCampo(
    elemento
) {

    if (!elemento) {
        return;
    }


    elemento.classList.remove(
        "visible"
    );

}


/* ============================================================
   ALERTAS
   ============================================================ */

function mostrarAlerta(
    tipo,
    mensaje
) {

    const alert =
        document.getElementById(
            "erregistroaAlert"
        );


    if (!alert) {
        return;
    }


    let icono =
        "ℹ";


    if (tipo === "success") {
        icono = "✓";
    }

    if (tipo === "error") {
        icono = "!";
    }

    if (tipo === "warning") {
        icono = "!";
    }


    alert.className =
        `erregistroa-alert ${tipo} show`;


    alert.innerHTML = `

        <div class="erregistroa-alert-icon">
            ${icono}
        </div>

        <div>
            ${escapeHtml(mensaje)}
        </div>

    `;


    clearTimeout(
        window.hlbpAlertTimeout
    );


    window.hlbpAlertTimeout =
        setTimeout(
            () => {

                alert.classList.remove(
                    "show"
                );

            },
            5000
        );

}


/* ============================================================
   ERROR DE PANTALLA
   ============================================================ */

function mostrarPantallaError(
    mensaje
) {

    const app =
        document.getElementById(
            "app"
        );


    if (!app) {
        return;
    }


    app.innerHTML = `

        <div style="
            padding:40px;
            text-align:center;
            color:#991b1b;
        ">

            <h2>
                Errorea
            </h2>

            <p>
                ${escapeHtml(mensaje)}
            </p>

        </div>

    `;

}


/* ============================================================
   ESCAPE HTML
   ============================================================ */

function escapeHtml(
    value
) {

    return String(
        value ?? ""
    )

        .replaceAll(
            "&",
            "&amp;"
        )

        .replaceAll(
            "<",
            "&lt;"
        )

        .replaceAll(
            ">",
            "&gt;"
        )

        .replaceAll(
            '"',
            "&quot;"
        )

        .replaceAll(
            "'",
            "&#039;"
        );

}
