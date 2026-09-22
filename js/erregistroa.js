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

        /*
         * Erregistroa AHLentzat bakarrik dago.
         * ADMIN / MASTER erabiltzaileek ez dute
         * inolako erregistrorik sortu behar.
         */

        if (!HLBPSession.isAHL()) {

            window.location.replace("dashboard.html");
            return;
        }

        HLBPLayout.render();

        await inicializarErregistroa();

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
   EGINKIZUNAK ETA MOTAK

   Zerrenda hau js/eginkizunak.js fitxategian dago orain,
   Erregistroa eta Historiala orrien artean partekatzeko
   (ikus pages/erregistroa.html).
   ============================================================ */


/* ============================================================
   ESTADO
   ============================================================ */

let hlbpZentroakEsleituak = [];


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

    cargarEginkizunak();

    await cargarCentros();

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


                            <div class="erregistroa-field" id="grupoIkasleKopurua">

                                <label for="registroIkasleKopurua" id="labelIkasleKopurua">
                                    Ikasle kopurua
                                    <span class="erregistroa-required">*</span>
                                </label>

                                <input
                                    type="number"
                                    id="registroIkasleKopurua"
                                    min="0"
                                    step="1"
                                    inputmode="numeric"
                                    placeholder="Adib: 3"
                                >

                                <span class="erregistroa-help" id="helpIkasleKopurua">
                                    Jardueran parte hartu duten ikasleen kopurua.
                                </span>

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

                            <span id="gordeText">
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

    const input =
        document.getElementById("registroAholkularia");

    if (!input) {
        return;
    }

    input.value =
        HLBPSession.profile
            ? HLBPSession.getName()
            : "";

}


/* ============================================================
   CENTROS ASIGNADOS
   ============================================================ */

async function cargarCentros() {

    const select =
        document.getElementById("registroCentro");

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


        const { data, error } =
            await window.hlbpSupabase
                .from("aholkulari_centros")
                .select(`
                    centro_id,
                    centros (
                        id,
                        codigo,
                        nombre,
                        activo
                    )
                `)
                .eq("aholkulari_id", userId);


        if (error) {
            throw error;
        }


        const centros =
            (data || [])
                .map(item => item.centros)
                .filter(
                    centro =>
                        centro &&
                        centro.activo !== false
                );


        centros.sort(
            (a, b) =>
                String(a.nombre || "")
                    .localeCompare(
                        String(b.nombre || ""),
                        "eu"
                    )
        );


        hlbpZentroakEsleituak = centros;


        if (centros.length === 0) {

            select.innerHTML = `
                <option value="">
                    Ez dago zentrorik esleituta
                </option>
            `;

            mostrarAlerta(
                "warning",
                "Ez daukazu zentrorik esleituta. Jarri kontaktuan administratzailearekin."
            );

            bloqueatuFormulario(true);

            return;

        }


        select.innerHTML = "";

        centros.forEach(centro => {

            const option =
                document.createElement("option");

            option.value =
                centro.id;

            option.textContent =
                centro.codigo
                    ? `${centro.nombre} (${centro.codigo})`
                    : centro.nombre;

            select.appendChild(option);

        });


        /*
         * Ikastetxea aurrez hautatuta agertzen da,
         * baina aholkulariak bere zentroen artean
         * aldatu dezake.
         */

        select.value =
            centros[0].id;


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

        bloqueatuFormulario(true);

    }

}


function bloqueatuFormulario(bloqueatu) {

    const button =
        document.getElementById("gordeButton");

    if (button) {
        button.disabled = bloqueatu;
    }

}


/* ============================================================
   EGINKIZUNAK
   ============================================================ */

function cargarEginkizunak() {

    const select =
        document.getElementById("registroTarea");

    if (!select) {
        return;
    }


    select.innerHTML = `
        <option value="">
            Aukeratu eginkizuna...
        </option>
    `;


    EGINKIZUNA_ZERRENDA.forEach(tarea => {

        const option =
            document.createElement("option");

        option.value = tarea;
        option.textContent = tarea;

        select.appendChild(option);

    });

}


/* ============================================================
   EVENTOS
   ============================================================ */

function inicializarEventos() {

    const form =
        document.getElementById("erregistroaForm");

    const tareaSelect =
        document.getElementById("registroTarea");

    const limpiarButton =
        document.getElementById("garbituButton");


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


    if (limpiarButton) {

        limpiarButton.addEventListener(
            "click",
            () => limpiarRegistro()
        );

    }

}


/* ============================================================
   CAMBIO DE EGINKIZUNA
   ============================================================ */

function updateEremuak() {

    const tarea =
        document.getElementById("registroTarea").value;

    const cfg =
        EGINKIZUNAK[tarea] || {};

    const grupoMota =
        document.getElementById("grupoMota");

    const grupoAzpiMota =
        document.getElementById("grupoAzpiMota");

    const grupoZehaztu =
        document.getElementById("grupoZehaztu");

    const motaSelect =
        document.getElementById("registroMota");

    const azpiMotaSelect =
        document.getElementById("registroAzpiMota");

    const zehaztuInput =
        document.getElementById("registroZehaztu");


    /*
     * MOTA
     */

    if (cfg.motak && cfg.motak.length) {

        motaSelect.innerHTML = `
            <option value="">
                Aukeratu mota...
            </option>
        `;

        cfg.motak.forEach(mota => {

            const option =
                document.createElement("option");

            option.value = mota;
            option.textContent = mota;

            motaSelect.appendChild(option);

        });

        mostrarCampo(grupoMota);

    } else {

        motaSelect.innerHTML = `
            <option value="">
                Aukeratu mota...
            </option>
        `;

        ocultarCampo(grupoMota);

    }


    /*
     * AZPI-MOTA
     * (Protokoloak eginkizunean bakarrik agertzen da,
     * hautatutako motatik independente).
     */

    if (cfg.azpiMotak && cfg.azpiMotak.length) {

        azpiMotaSelect.innerHTML = `
            <option value="">
                Aukeratu azpi-mota...
            </option>
        `;

        cfg.azpiMotak.forEach(azpiMota => {

            const option =
                document.createElement("option");

            option.value = azpiMota;
            option.textContent = azpiMota;

            azpiMotaSelect.appendChild(option);

        });

        mostrarCampo(grupoAzpiMota);

    } else {

        azpiMotaSelect.innerHTML = `
            <option value="">
                Aukeratu azpi-mota...
            </option>
        `;

        ocultarCampo(grupoAzpiMota);

    }


    /*
     * ZEHAZTU
     */

    if (cfg.zehaztu) {

        mostrarCampo(grupoZehaztu);

    } else {

        ocultarCampo(grupoZehaztu);

        if (zehaztuInput) {
            zehaztuInput.value = "";
        }

    }


    /*
     * IKASLE KOPURUA / IKASLEAREN HNA-NIE
     */

    aplicarModoIkasleKopurua(tarea);

}


/* ============================================================
   IKASLE KOPURUA / IKASLEAREN HNA-NIE

   Eginkizunaren arabera, eremu berak "Ikasle kopurua" (zenbakia)
   edo "Ikaslearen HNA/NIE" (testua) eskatzen du.
   ============================================================ */

function aplicarModoIkasleKopurua(tarea) {

    const label =
        document.getElementById("labelIkasleKopurua");

    const input =
        document.getElementById("registroIkasleKopurua");

    const help =
        document.getElementById("helpIkasleKopurua");

    if (!label || !input || !help) {
        return;
    }

    const eskatuKopurua =
        tarea === "" ||
        EGINKIZUNAK_IKASLE_KOPURUA.includes(tarea);

    if (eskatuKopurua) {

        label.innerHTML = `
            Ikasle kopurua
            <span class="erregistroa-required">*</span>
        `;

        input.type = "number";
        input.min = "0";
        input.step = "1";
        input.inputMode = "numeric";
        input.placeholder = "Adib: 3";

        help.textContent =
            "Jardueran parte hartu duten ikasleen kopurua.";

    } else {

        label.innerHTML = `
            Ikaslearen HNA/NIE
            <span class="erregistroa-required">*</span>
        `;

        input.type = "text";
        input.removeAttribute("min");
        input.removeAttribute("step");
        input.inputMode = "text";
        input.placeholder = "Adib: 12345678A";

        help.textContent =
            "Jarduera egin zaion ikaslearen HNA edo NIE zenbakia.";

    }

}


/* ============================================================
   GUARDAR
   ============================================================ */

async function guardarRegistro() {

    const centroId =
        document.getElementById("registroCentro").value;

    const tarea =
        document.getElementById("registroTarea").value;

    const mota =
        document.getElementById("registroMota").value;

    const azpiMota =
        document.getElementById("registroAzpiMota").value;

    const zehaztu =
        document.getElementById("registroZehaztu").value.trim();

    const ikasleKopuruaRaw =
        document.getElementById("registroIkasleKopurua").value.trim();

    const fecha =
        document.getElementById("registroData").value;

    const fechaFin =
        document.getElementById("registroAmaieraData").value;

    const estado =
        document.getElementById("registroEgoera").value;

    const observaciones =
        document.getElementById("registroOharrak").value.trim();


    const cfg =
        EGINKIZUNAK[tarea] || {};


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


    if (cfg.motak && !mota) {

        mostrarAlerta(
            "error",
            "Mota aukeratu behar da."
        );

        return;

    }


    if (cfg.azpiMotak && !azpiMota) {

        mostrarAlerta(
            "error",
            "Azpi-mota aukeratu behar da."
        );

        return;

    }


    if (cfg.zehaztu && !zehaztu) {

        mostrarAlerta(
            "error",
            "\"Zehaztu\" eremua bete behar da."
        );

        return;

    }


    const eskatuIkasleKopurua =
        EGINKIZUNAK_IKASLE_KOPURUA.includes(tarea);


    if (ikasleKopuruaRaw === "") {

        mostrarAlerta(
            "error",
            eskatuIkasleKopurua
                ? "Ikasle kopurua bete behar da."
                : "Ikaslearen HNA/NIE bete behar da."
        );

        return;

    }


    let estudianteValue;


    if (eskatuIkasleKopurua) {

        const ikasleKopurua =
            Number(ikasleKopuruaRaw);


        if (
            !Number.isInteger(ikasleKopurua) ||
            ikasleKopurua < 0
        ) {

            mostrarAlerta(
                "error",
                "Ikasle kopuruak zenbaki oso positibo bat izan behar du."
            );

            return;

        }

        estudianteValue = ikasleKopurua;

    } else {

        estudianteValue = ikasleKopuruaRaw;

    }


    if (!fecha) {

        mostrarAlerta(
            "error",
            "Egiteko data aukeratu behar da."
        );

        return;

    }


    if (fechaFin && fechaFin < fecha) {

        mostrarAlerta(
            "error",
            "Amaiera-data ezin da hasiera-data baino lehenagokoa izan."
        );

        return;

    }


    /*
     * Deshabilitar botón
     */

    cambiarEstadoGuardado(true);


    try {

        const aholkulariId =
            HLBPSession.user.id;


        /*
         * IMPORTANTE:
         * Estos nombres corresponden al modelo
         * PostgreSQL que estamos utilizando:
         *
         * aholkulari_id
         * centro_id
         * tarea
         * tipo        (= Mota)
         * subtipo     (= Azpi-mota)
         * zehaztu
         * estudiante_id  (= Ikasle kopurua zenbakia, edo
         *                  Ikaslearen HNA/NIE testua, eginkizunaren
         *                  arabera)
         * fecha
         * fecha_fin
         * estado
         * observaciones
         */

        const nuevoRegistro = {

            aholkulari_id:
                aholkulariId,

            centro_id:
                centroId,

            tarea:
                tarea,

            tipo:
                mota || null,

            subtipo:
                azpiMota || null,

            zehaztu:
                zehaztu || null,

            estudiante_id:
                estudianteValue,

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


        const { data, error } =
            await window.hlbpSupabase
                .from("registros")
                .insert(nuevoRegistro)
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


        limpiarRegistro(false);

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

        mostrarAlerta(
            "error",
            "Ezin izan da erregistroa gorde."
        );

    } finally {

        cambiarEstadoGuardado(false);

    }

}


/* ============================================================
   LIMPIAR
   ============================================================ */

function limpiarRegistro(mostrarMensaje = true) {

    const tarea =
        document.getElementById("registroTarea");

    const mota =
        document.getElementById("registroMota");

    const azpiMota =
        document.getElementById("registroAzpiMota");

    const zehaztu =
        document.getElementById("registroZehaztu");

    const ikasleKopurua =
        document.getElementById("registroIkasleKopurua");

    const fechaFin =
        document.getElementById("registroAmaieraData");

    const estado =
        document.getElementById("registroEgoera");

    const observaciones =
        document.getElementById("registroOharrak");


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


    if (azpiMota) {

        azpiMota.innerHTML = `
            <option value="">
                Aukeratu azpi-mota...
            </option>
        `;

    }


    if (zehaztu) {
        zehaztu.value = "";
    }


    if (ikasleKopurua) {
        ikasleKopurua.value = "";
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


    /*
     * El centro NO se reinicia: se mantiene
     * preseleccionado el primer centro asignado.
     */

    if (hlbpZentroakEsleituak.length > 0) {

        const centroSelect =
            document.getElementById("registroCentro");

        if (centroSelect) {
            centroSelect.value = hlbpZentroakEsleituak[0].id;
        }

    }


    ocultarCampo(
        document.getElementById("grupoMota")
    );

    ocultarCampo(
        document.getElementById("grupoAzpiMota")
    );

    ocultarCampo(
        document.getElementById("grupoZehaztu")
    );

    aplicarModoIkasleKopurua("");


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
        document.getElementById("registroData");

    if (!input) {
        return;
    }


    if (!input.value) {

        const hoy = new Date();

        const year = hoy.getFullYear();

        const month =
            String(hoy.getMonth() + 1).padStart(2, "0");

        const day =
            String(hoy.getDate()).padStart(2, "0");

        input.value =
            `${year}-${month}-${day}`;

    }

}


/* ============================================================
   BOTÓN GUARDAR - ESTADO
   ============================================================ */

function cambiarEstadoGuardado(cargando) {

    const button =
        document.getElementById("gordeButton");

    const text =
        document.getElementById("gordeText");

    const loading =
        document.getElementById("gordeLoading");

    if (!button) {
        return;
    }


    button.disabled = cargando;


    if (cargando) {

        if (text) {
            text.style.display = "none";
        }

        if (loading) {
            loading.classList.add("show");
        }

    } else {

        if (text) {
            text.style.display = "inline";
        }

        if (loading) {
            loading.classList.remove("show");
        }

    }

}


/* ============================================================
   CAMPOS VISIBLES
   ============================================================ */

function mostrarCampo(elemento) {

    if (!elemento) {
        return;
    }

    elemento.classList.add("visible");

}


function ocultarCampo(elemento) {

    if (!elemento) {
        return;
    }

    elemento.classList.remove("visible");

}


/* ============================================================
   ALERTAS
   ============================================================ */

function mostrarAlerta(tipo, mensaje) {

    const alert =
        document.getElementById("erregistroaAlert");

    if (!alert) {
        return;
    }


    let icono = "ℹ";

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


    clearTimeout(window.hlbpAlertTimeout);

    window.hlbpAlertTimeout = setTimeout(() => {

        alert.classList.remove("show");

    }, 5000);

}


/* ============================================================
   ERROR DE PANTALLA
   ============================================================ */

function mostrarPantallaError(mensaje) {

    const app =
        document.getElementById("app");

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

function escapeHtml(value) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}
