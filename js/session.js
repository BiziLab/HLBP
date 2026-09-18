// ============================================================
// HLBP - Sesión y permisos
// ============================================================

window.HLBPSession = {

    user: null,
    profile: null,

    async init() {

        const user = await obtenerUsuarioActual();

        if (!user) {
            window.location.href = "../index.html";
            return false;
        }

        const profile = await obtenerPerfilActual();

        if (!profile) {
            await cerrarSesion();
            return false;
        }

        this.user = user;
        this.profile = profile;

        return true;
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
        return this.isAdmin() || this.isMaster();
    },


    getName() {

        if (!this.profile) {
            return "";
        }

        const nombre =
            this.profile.nombre || "";

        const apellidos =
            this.profile.apellidos || "";

        return `${nombre} ${apellidos}`.trim()
            || this.profile.email
            || "Usuario";
    },


    getRoleLabel() {

        if (this.isMaster()) {
            return "MASTER";
        }

        if (this.isAdmin()) {
            return "ADMIN";
        }

        return "AHL";
    }
};
