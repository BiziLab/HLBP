// ============================================================
// HLBP - GESTIÓN DE SESIÓN
// ============================================================

window.HLBPSession = {

    user: null,
    profile: null,
    initialized: false,

    async init() {

        // Evitar inicializar dos veces
        if (this.initialized) {
            return !!this.user;
        }

        this.initialized = true;

        try {

            // Comprobar usuario REAL en Supabase
            const {
                data,
                error
            } = await window.hlbpSupabase.auth.getUser();

            if (error) {
                console.error(
                    "Error comprobando sesión:",
                    error
                );

                this.user = null;
                this.profile = null;

                return false;
            }

            // No existe sesión
            if (!data || !data.user) {

                console.log(
                    "HLBP: no hay sesión activa."
                );

                this.user = null;
                this.profile = null;

                return false;
            }

            // Usuario autenticado
            this.user = data.user;

            console.log(
                "HLBP: usuario autenticado:",
                this.user.email
            );


            // ----------------------------------------------------
            // Obtener perfil desde PostgreSQL
            // ----------------------------------------------------

            const {
                data: profile,
                error: profileError
            } = await window.hlbpSupabase
                .from("profiles")
                .select("*")
                .eq("id", this.user.id)
                .maybeSingle();


            if (profileError) {

                console.error(
                    "Error obteniendo perfil:",
                    profileError
                );

                // El usuario existe en Auth,
                // pero no tiene perfil válido.
                this.profile = null;

                return false;
            }


            if (!profile) {

                console.error(
                    "El usuario no tiene perfil en profiles."
                );

                this.profile = null;

                return false;
            }


            this.profile = profile;


            console.log(
                "HLBP: perfil cargado:",
                this.profile
            );


            return true;


        } catch (error) {

            console.error(
                "Error inicializando sesión:",
                error
            );

            this.user = null;
            this.profile = null;

            return false;
        }
    },


    isAHL() {
        return this.profile?.role === "AHL";
    },


    isAdmin() {
        return this.profile?.role === "ADMIN";
    },


    isMaster() {
        return this.profile?.role === "MASTER";
    },


    isAdminOrMaster() {
        return (
            this.isAdmin() ||
            this.isMaster()
        );
    },


    getName() {

        if (!this.profile) {
            return "";
        }

        const nombre =
            this.profile.nombre || "";

        const apellidos =
            this.profile.apellidos || "";

        return `${nombre} ${apellidos}`.trim();

    },


    getRoleLabel() {

        if (!this.profile) {
            return "";
        }

        switch (this.profile.role) {

            case "MASTER":
                return "Administrador Master";

            case "ADMIN":
                return "Administrador";

            case "AHL":
                return "Aholkularia";

            default:
                return this.profile.role || "";

        }
    }

};
