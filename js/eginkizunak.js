/* ============================================================
   HLBP - EGINKIZUNAK ETA MOTAK
   ============================================================

   Fitxategi hau Erregistroa eta Historiala orrietan partekatzen da,
   biak sinkronizatuta egon daitezen (eginkizun/mota zerrenda bera).

   Eginkizun bakoitzak izan dezake:
     - motak: aukera-zerrenda bat (Mota eremua agertzeko), edo
       null, Mota eremurik ez badu.
     - zehaztu: true, "Zehaztu" eremu derrigorrezkoa behar badu
       (Mota eremuarekin batera ez da inoiz agertzen).

   ============================================================ */

const EGINKIZUNAK = {

    "Ebaluazio psikopedagogikoak": {

        motak: [
            "Balidatzea",
            "Berria",
            "100.2A",
            "105 adimen kognitiboa",
            "6. mailako birrebaluazioa",
            "Besteak"
        ]

    },


    "Protokoloak": {

        motak: [
            "AGH",
            "AG",
            "HGN",
            "IZE",
            "KSHO"
        ]

    },


    "Txostenak": {

        motak: [
            "Ebaluazio psikopedagogikoa",
            "Osatuz programetarako txostena",
            "Osagarri programetarako txostena",
            "OETH"
        ]

    },


    "Eskolaratze proposamenak": {

        motak: [
            "Berriak",
            "Hezkuntza bereziko ibilbideak"
        ]

    },


    "CNE-en kudeaketa": {

        motak: [
            "Arlokoa",
            "Orokorra"
        ]

    },


    "Jokabide kasuak": {

        motak: null

    },


    "ZIP gelako eginbeharrak": {

        motak: null,
        zehaztu: true

    },


    "LIP gelako eginbeharrak": {

        motak: null,
        zehaztu: true

    },


    "Koordinazio batzarrak": {

        motak: [
            "OT/Fisio",
            "HLE",
            "Gorren EHI/ZHI / Gorren taldekatze ikastetxeak",
            "Osatuz",
            "UTE",
            "CSM",
            "Bestelakoak"
        ]

    },


    "Eskaerapeko ikastetxeetako eskuhartzeak": {

        motak: null,
        zehaztu: true

    }

};


const EGINKIZUNA_ZERRENDA = Object.keys(EGINKIZUNAK);
