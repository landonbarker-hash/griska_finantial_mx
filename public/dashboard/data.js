// Este es tu archivo de configuración de datos.
// Puedes editar estos valores para que el dashboard muestre información real o actualizada.
// Solo asegúrate de respetar el formato (comillas, comas, etc).

const DASHBOARD_DATA = {
    // --- MÉTRICAS DSO (Days Sales Outstanding) ---
    dso: {
        actual: 38.4,   // DSO del mes actual
        prev: 36.1,     // DSO del mes anterior
        best: 24.0,     // Mejor DSO posible dadas las condiciones actuales
        target: 36.3    // Objetivo fijado para el DSO
    },

    // --- REPORTE DE ANTIGÜEDAD (Aging) - Valores en Moneda ---
    aging: {
        current: 1842000, // Deuda al Corriente (No Vencida)
        d30: 987500,      // Vencido 1 a 30 días
        d60: 643200,      // Vencido 31 a 60 días
        d90: 471350,      // Vencido 61 a 90 días
        d90p: 343300      // Vencido más de 90 días
    },

    // --- MÉTRICAS DE RESUMEN EJECUTIVO ---
    totalAR: 4287350,   // Cartera Total ($) - Cuentas por Cobrar Total
    collected: 1923100, // Lo recaudado en el mes hasta el momento ($) MTD

    // --- GRÁFICA TENDENCIA DSO (Últimos 6 meses) ---
    months: ['Oct', 'Nov', 'Dic', 'Ene', 'Feb', 'Mar'], // Etiquetas de los meses
    dsoHistory: [34.2, 35.8, 33.9, 37.1, 36.1, 38.4], // Valores reales históricos de DSO

    // --- LISTA DE CLIENTES ---
    // name: Nombre, balance: Deuda Total, overdue: Días Vencido, limitExc: Límite de Crédito Excedido %
    // trend: Tendencia (up: Deteriorando, down: Mejorando, stable: Estable)
    // score: Calificación de Riesgo (0-100), seg: Segmentación (strategic, alert, stable, lowrisk)
    clients: [
        { name: 'Constructora Alfa', balance: 487200, overdue: 91, limitExc: 34, trend: 'up', score: 91, seg: 'alert' },
        { name: 'Tech Solutions S.A.', balance: 312500, overdue: 67, limitExc: 0, trend: 'up', score: 78, seg: 'alert' },
        { name: 'Distribuidora Beta', balance: 198400, overdue: 78, limitExc: 22, trend: 'up', score: 85, seg: 'lowrisk' },
        { name: 'Grupo Inversiones C.', balance: 156800, overdue: 45, limitExc: 0, trend: 'stable', score: 52, seg: 'stable' },
        { name: 'Importaciones Delta', balance: 134200, overdue: 93, limitExc: 18, trend: 'up', score: 88, seg: 'lowrisk' },
        { name: 'Metalúrgica Norte', balance: 98700, overdue: 31, limitExc: 0, trend: 'down', score: 32, seg: 'stable' },
        { name: 'Farmacorp Ltda.', balance: 87600, overdue: 60, limitExc: 11, trend: 'stable', score: 61, seg: 'alert' },
        { name: 'Megasuper Retail', balance: 743000, overdue: 12, limitExc: 0, trend: 'down', score: 18, seg: 'strategic' },
        { name: 'Industrias Omega', balance: 621500, overdue: 8, limitExc: 0, trend: 'down', score: 12, seg: 'strategic' },
        { name: 'Servicios Globales', balance: 412000, overdue: 22, limitExc: 0, trend: 'stable', score: 28, seg: 'strategic' },
        { name: 'Banco Regional', balance: 312000, overdue: 5, limitExc: 0, trend: 'down', score: 9, seg: 'strategic' },
        { name: 'MicroEmpresas CR', balance: 87000, overdue: 14, limitExc: 0, trend: 'stable', score: 22, seg: 'stable' },
        { name: 'Panadería Central', balance: 42000, overdue: 36, limitExc: 8, trend: 'up', score: 58, seg: 'lowrisk' },
        { name: 'Auto Repuestos JM', balance: 63000, overdue: 88, limitExc: 15, trend: 'up', score: 80, seg: 'lowrisk' },
    ],

    // --- PROYECCIONES DE RECAUDO ---
    // client: Cliente, week: Fecha Estimada (Semana), amount: Monto esperado ($), prob: Probabilidad (high, med, low)
    projection: [
        { client: 'Megasuper Retail', week: 'Mar 04', amount: 284000, prob: 'high' },
        { client: 'Industrias Omega', week: 'Mar 06', amount: 210000, prob: 'high' },
        { client: 'Servicios Globales', week: 'Mar 07', amount: 156000, prob: 'high' },
        { client: 'Banco Regional', week: 'Mar 08', amount: 190000, prob: 'high' },
        { client: 'Metalúrgica Norte', week: 'Mar 10', amount: 98700, prob: 'high' },
        { client: 'Grupo Inversiones C.', week: 'Mar 12', amount: 156800, prob: 'high' },
        { client: 'MicroEmpresas CR', week: 'Mar 14', amount: 87000, prob: 'high' },
        { client: 'Farmacorp Ltda.', week: 'Mar 15', amount: 87600, prob: 'med' },
        { client: 'Tech Solutions S.A.', week: 'Mar 18', amount: 113000, prob: 'med' },
        { client: 'Constructora Alfa', week: 'Mar 20', amount: 172000, prob: 'med' },
        { client: 'Distribuidora Beta', week: 'Mar 22', amount: 134440, prob: 'med' },
        { client: 'Importaciones Delta', week: 'Mar 25', amount: 91510, prob: 'low' },
        { client: 'Panadería Central', week: 'Mar 26', amount: 42000, prob: 'low' },
        { client: 'Auto Repuestos JM', week: 'Mar 28', amount: 63000, prob: 'low' },
        { client: 'Constructora Alfa', week: 'Mar 31', amount: 77840, prob: 'low' },
    ],

    // --- CASH APPLICATIONS & REFUNDS ---
    cashapp: {
        kpis: { unapplied: 345000, suspense: 55000, autoMatch: 82.5, manTime: 4 },
        suspense: { noRef: 45, invalidAmt: 25, noClient: 20, doublePay: 10 },
        items: [
            { ref: 'TRF-9921', amount: 45000, date: '12 Feb 2026', days: 19, client: 'Industrias Omega?', status: 'Investigando' },
            { ref: 'DEP-0023', amount: 12500, date: '14 Feb 2026', days: 17, client: 'Desconocido', status: 'Pendiente' },
            { ref: 'TRF-9812', amount: 8900, date: '15 Feb 2026', days: 16, client: 'Tech Solutions S.A.', status: 'Contactado' },
            { ref: 'CHK-4412', amount: 5600, date: '15 Feb 2026', days: 16, client: 'Metalúrgica Norte', status: 'En Análisis' },
            { ref: 'TRF-1022', amount: 120000, date: '16 Feb 2026', days: 15, client: 'Megasuper Retail?', status: 'Pendiente' }
        ],
        refunds: {
            total: 125400,
            history: [12000, 15000, 11000, 18000, 14000, 16000],
            // Simulated historical data for interannual comparison
            interannualHistory: {
                currentYear: [85000, 92000, 78000, 110000, 95000, 120000],
                prevYear: [65000, 72000, 58000, 80000, 75000, 90000],
                year2024: [55000, 62000, 48000, 70000, 65000, 80000],
                year2023: [45000, 52000, 38000, 60000, 55000, 70000]
            },
            items: [
                { rftNumber: 'RFT - 94', created: '05-mar-26', subsidiary: '311 - Germany', amount: 32188.71, currency: 'EUR', age: 55, responsable: 'Ernesto', link: 'https://griska.atlassian.net/browse/RFT-94', status: 'Pendiente' },
                { rftNumber: 'RFT - 110', created: '31-mar-26', subsidiary: '102 - US', amount: 19800.00, currency: 'USD', age: 29, responsable: 'Ernesto', link: 'https://griska.atlassian.net/browse/RFT-110', status: 'Validando' },
                { rftNumber: 'RFT - 129', created: '28-abr-26', subsidiary: '421 - Finland', amount: 8332.80, currency: 'EUR', age: 1, responsable: 'Ernesto', link: 'https://griska.atlassian.net/browse/RFT-129', status: 'Pendiente' },
                { rftNumber: 'RFT - 130', created: '28-abr-26', subsidiary: '241 - Singapore', amount: 548.10, currency: 'USD', age: 1, responsable: 'Ernesto', link: 'https://griska.atlassian.net/browse/RFT-130', status: 'Pendiente' }
            ]
        },
        // --- COMPARATIVA ANUAL DE APLICACIÓN DE EFECTIVO ---
        appliedCashHistory: {
            currentYear: [1850000, 1920000, 1780000, 2100000, 1950000, 2200000], // Montos aplicados por mes (2026)
            prevYear: [1650000, 1720000, 1580000, 1800000, 1750000, 1900000],    // Montos aplicados por mes (2025)
            year2024: [1550000, 1620000, 1480000, 1700000, 1650000, 1800000],    // Montos aplicados por mes (2024)
            year2023: [1450000, 1520000, 1380000, 1600000, 1550000, 1700000]     // Montos aplicados por mes (2023)
        },
        // --- ADICIONALES PARA PERFIL FINANCIERO Y TESORERÍA ---
        treasury: {
            workingCapital: 1250000,       // Capital de Trabajo Actual ($)
            workingCapitalTarget: 1500000, // Objetivo de Capital de Trabajo ($)
            financingLines: {
                total: 2000000,            // Total de líneas de crédito ($)
                used: 850000,              // Crédito utilizado ($)
                available: 1150000         // Crédito disponible ($)
            },
            cashFlowMTD: {
                net: 450000,               // Flujo Neto del Mes ($)
                inflow: 1920000,           // Ingresos
                outflow: 1470000           // Egresos
            }
        },
        fxExposure: {
            rateUSD: 17.50,               // Tipo de cambio USD/MXN
            usdAssets: 2450000,            // Activos en USD expuestos
            usdLiabilities: 1150000,       // Pasivos en USD expuestos
            netExposure: 1300000,          // Exposición Neta ($)
            hedgingAmount: 500000,         // Coberturas contratadas (Forwards)
            fxRateHistory: [17.10, 17.25, 17.05, 17.40, 17.65, 17.50] // Historial 6 meses
        },
        budgetControl: {
            months: ['Nov', 'Dic', 'Ene', 'Feb', 'Mar', 'Abr'],
            budget: [120000, 125000, 140000, 130000, 135000, 145000],  // Presupuesto operativo
            actual: [115000, 128000, 138000, 125000, 132000, 142000]   // Gasto real
        },
        profitability: {
            clients: [
                { name: 'Megasuper Retail', profitPct: 24, profitAmt: 178320 },
                { name: 'Industrias Omega', profitPct: 18, profitAmt: 111870 },
                { name: 'Servicios Globales', profitPct: 15, profitAmt: 61800 },
                { name: 'Banco Regional', profitPct: 22, profitAmt: 68640 },
                { name: 'Constructora Alfa', profitPct: 8, profitAmt: 38976 }
            ],
            routes: [
                { name: 'México - Laredo (Consolidado)', margin: 28, volume: 145 },
                { name: 'México - USA (Tanqueras / Químicos)', margin: 34, volume: 82 },
                { name: 'Marítimo (Veracruz - Rotterdam)', margin: 22, volume: 110 },
                { name: 'Aéreo (CDMX - Houston)', margin: 19, volume: 64 }
            ]
        },
        ceiHistory: [88.5, 91.2, 89.8, 92.5, 90.1, 93.4], // Historial de efectividad de cobranza (CEI %)
        logistics: {
            freightVolumeYTD: 2450,        // Total de despachos / TEUs
            billingErrorRate: 0.85,        // Tasa de errores en facturación (%)
            billingErrorTarget: 0.50       // Objetivo (%)
        },
        // --- UNAPPLIED PAYMENTS ANALYSIS ---
                                unappliedPayments: {
            monthlyData: [{"region":"Americas","total":81510.11,"year":"2025","month":"MARCH"},{"region":"Americas","total":68260.17,"year":"2025","month":"SEPTEMBER"},{"region":"Americas","total":53617.07,"year":"2026","month":"FEBRUARY"},{"region":"Americas","total":32613.85,"year":"2025","month":"FEBRUARY"},{"region":"Americas","total":54969.77,"year":"2022","month":"OCTOBER"},{"region":"Americas","total":38892.38,"year":"2025","month":"JULY"},{"region":"Americas","total":33733.25,"year":"2025","month":"JUNE"},{"region":"Americas","total":172988.03,"year":"2026","month":"APRIL"},{"region":"Americas","total":33240.26,"year":"2025","month":"AUGUST"},{"region":"Americas","total":34063.85,"year":"2026","month":"MARCH"},{"region":"Americas","total":19002.43,"year":"2023","month":"MAY"},{"region":"Americas","total":53121.68,"year":"2022","month":"APRIL"},{"region":"Americas","total":56113.88,"year":"2022","month":"DECEMBER"},{"region":"Americas","total":30771.5,"year":"2026","month":"MAY"},{"region":"Americas","total":24620.82,"year":"2025","month":"DECEMBER"},{"region":"Americas","total":14480,"year":"2024","month":"NOVEMBER"},{"region":"Americas","total":24739.41,"year":"2022","month":"MAY"},{"region":"Americas","total":19780,"year":"2023","month":"AUGUST"},{"region":"Americas","total":16194.95,"year":"2023","month":"JUNE"},{"region":"Americas","total":15807.13,"year":"2022","month":"SEPTEMBER"},{"region":"Americas","total":28967.42,"year":"2023","month":"SEPTEMBER"},{"region":"Americas","total":29921.13,"year":"2023","month":"JULY"},{"region":"Americas","total":17049,"year":"2025","month":"JANUARY"},{"region":"Americas","total":12019.22,"year":"2026","month":"JANUARY"},{"region":"Americas","total":14581.88,"year":"2022","month":"JUNE"},{"region":"Americas","total":11550,"year":"2022","month":"JULY"},{"region":"Americas","total":19508.52,"year":"2023","month":"JANUARY"},{"region":"Americas","total":12302.49,"year":"2023","month":"OCTOBER"},{"region":"Americas","total":6500,"year":"2023","month":"APRIL"},{"region":"Americas","total":15550,"year":"2025","month":"OCTOBER"},{"region":"Americas","total":5400,"year":"2024","month":"FEBRUARY"},{"region":"Americas","total":5375,"year":"2025","month":"APRIL"},{"region":"Americas","total":13611.69,"year":"2025","month":"NOVEMBER"},{"region":"Americas","total":12589.4,"year":"2024","month":"JUNE"},{"region":"Americas","total":4855.71,"year":"2025","month":"MAY"},{"region":"Americas","total":4803,"year":"2022","month":"AUGUST"},{"region":"Americas","total":4489.03,"year":"2023","month":"MARCH"},{"region":"Americas","total":11961.01,"year":"2022","month":"NOVEMBER"},{"region":"Americas","total":11972.14,"year":"2024","month":"OCTOBER"},{"region":"Americas","total":1379.91,"year":"2024","month":"AUGUST"},{"region":"Americas","total":4353.51,"year":"2023","month":"FEBRUARY"},{"region":"Americas","total":593.75,"year":"2024","month":"JANUARY"},{"region":"Americas","total":250,"year":"2023","month":"NOVEMBER"},{"region":"Americas","total":315.14,"year":"2024","month":"MAY"},{"region":"Americas","total":586.62,"year":"2024","month":"DECEMBER"},{"region":"Sysomos","total":134221.13,"year":"2020","month":"JANUARY"},{"region":"Sysomos","total":39300.7,"year":"2019","month":"AUGUST"},{"region":"Sysomos","total":18191.92,"year":"2019","month":"NOVEMBER"},{"region":"Sysomos","total":6843.29,"year":"2019","month":"JUNE"},{"region":"Sysomos","total":8861.44,"year":"2019","month":"JULY"},{"region":"Sysomos","total":6945.01,"year":"2019","month":"FEBRUARY"},{"region":"Sysomos","total":10680.79,"year":"2019","month":"OCTOBER"},{"region":"Sysomos","total":4997.75,"year":"2019","month":"MARCH"},{"region":"Sysomos","total":25999.45,"year":"2019","month":"SEPTEMBER"},{"region":"Sysomos","total":13506.28,"year":"2019","month":"APRIL"},{"region":"Sysomos","total":4994.96,"year":"2019","month":"MAY"},{"region":"Sysomos","total":433.06,"year":"2019","month":"DECEMBER"},{"region":"Sysomos","total":4478.71,"year":"2019","month":"JANUARY"},{"region":"Sysomos","total":248.17,"year":"2020","month":"FEBRUARY"},{"region":"Americas","total":131.16,"year":"2024","month":"JULY"},{"region":"APAC","total":20152.82,"year":"2024","month":"OCTOBER"},{"region":"APAC","total":35844.45,"year":"2026","month":"APRIL"},{"region":"APAC","total":6426.86,"year":"2023","month":"JANUARY"},{"region":"APAC","total":5501.65,"year":"2022","month":"DECEMBER"},{"region":"APAC","total":4418.61,"year":"2025","month":"JUNE"},{"region":"APAC","total":1584.48,"year":"2025","month":"DECEMBER"},{"region":"APAC","total":108980.52,"year":"2023","month":"JUNE"},{"region":"APAC","total":1583.64,"year":"2023","month":"NOVEMBER"},{"region":"APAC","total":750.58,"year":"2025","month":"JANUARY"},{"region":"APAC","total":392.98,"year":"2022","month":"SEPTEMBER"},{"region":"APAC","total":436.85,"year":"2022","month":"MAY"},{"region":"APAC","total":884.65,"year":"2023","month":"MAY"},{"region":"APAC","total":2587.41,"year":"2025","month":"JULY"},{"region":"APAC","total":272.97,"year":"2023","month":"MARCH"},{"region":"APAC","total":11814.19,"year":"2025","month":"FEBRUARY"},{"region":"APAC","total":12541.79,"year":"2026","month":"JANUARY"},{"region":"APAC","total":4461.23,"year":"2025","month":"NOVEMBER"},{"region":"APAC","total":5324.86,"year":"2026","month":"MAY"},{"region":"APAC","total":1909.02,"year":"2026","month":"FEBRUARY"},{"region":"APAC","total":17.05,"year":"2026","month":"MARCH"},{"region":"EMEA","total":49980.8,"year":"2023","month":"JUNE"},{"region":"EMEA","total":423423.25,"year":"2026","month":"MARCH"},{"region":"EMEA","total":34270.27,"year":"2022","month":"DECEMBER"},{"region":"EMEA","total":55142.76,"year":"2023","month":"NOVEMBER"},{"region":"EMEA","total":24599.36,"year":"2025","month":"DECEMBER"},{"region":"EMEA","total":5583.05,"year":"2022","month":"JUNE"},{"region":"EMEA","total":32987,"year":"2023","month":"MARCH"},{"region":"EMEA","total":40820.21,"year":"2024","month":"FEBRUARY"},{"region":"EMEA","total":7939.37,"year":"2025","month":"FEBRUARY"},{"region":"EMEA","total":89245.03,"year":"2025","month":"JANUARY"},{"region":"EMEA","total":35108.89,"year":"2026","month":"MAY"},{"region":"EMEA","total":36558.83,"year":"2024","month":"DECEMBER"},{"region":"EMEA","total":36755.45,"year":"2023","month":"SEPTEMBER"},{"region":"EMEA","total":25126.78,"year":"2022","month":"NOVEMBER"},{"region":"EMEA","total":50655.95,"year":"2024","month":"JUNE"},{"region":"EMEA","total":79064.81,"year":"2025","month":"OCTOBER"},{"region":"EMEA","total":23987.32,"year":"2022","month":"AUGUST"},{"region":"EMEA","total":32531.86,"year":"2023","month":"MAY"},{"region":"EMEA","total":24444.29,"year":"2024","month":"JANUARY"},{"region":"EMEA","total":14584.67,"year":"2023","month":"APRIL"},{"region":"EMEA","total":54966.47,"year":"2025","month":"SEPTEMBER"},{"region":"EMEA","total":63302.4,"year":"2026","month":"APRIL"},{"region":"EMEA","total":36761.58,"year":"2023","month":"JANUARY"},{"region":"EMEA","total":4011.36,"year":"2024","month":"AUGUST"},{"region":"EMEA","total":11838.75,"year":"2024","month":"MAY"},{"region":"EMEA","total":3333.22,"year":"2023","month":"JULY"},{"region":"EMEA","total":9414.01,"year":"2022","month":"OCTOBER"},{"region":"EMEA","total":19342.35,"year":"2023","month":"AUGUST"},{"region":"EMEA","total":33566.24,"year":"2025","month":"JUNE"},{"region":"EMEA","total":14923.3,"year":"2022","month":"APRIL"},{"region":"EMEA","total":19014.03,"year":"2025","month":"JULY"},{"region":"EMEA","total":4161.51,"year":"2025","month":"MAY"},{"region":"EMEA","total":23563.4,"year":"2025","month":"MARCH"},{"region":"EMEA","total":2387.92,"year":"2024","month":"NOVEMBER"},{"region":"EMEA","total":10876.14,"year":"2023","month":"OCTOBER"},{"region":"EMEA","total":9213.46,"year":"2024","month":"SEPTEMBER"},{"region":"EMEA","total":25236,"year":"2024","month":"JULY"},{"region":"EMEA","total":9422.18,"year":"2023","month":"FEBRUARY"},{"region":"EMEA","total":18677.36,"year":"2023","month":"DECEMBER"},{"region":"EMEA","total":8192.47,"year":"2024","month":"APRIL"},{"region":"EMEA","total":8588.83,"year":"2026","month":"FEBRUARY"},{"region":"EMEA","total":11197.73,"year":"2026","month":"JANUARY"},{"region":"EMEA","total":4379.28,"year":"2022","month":"MAY"},{"region":"EMEA","total":4655.45,"year":"2024","month":"OCTOBER"},{"region":"EMEA","total":3954.57,"year":"2022","month":"JULY"},{"region":"EMEA","total":2131.46,"year":"2025","month":"NOVEMBER"},{"region":"EMEA","total":14795.55,"year":"2022","month":"SEPTEMBER"},{"region":"EMEA","total":940.9,"year":"2025","month":"AUGUST"},{"region":"EMEA","total":1667.64,"year":"2024","month":"MARCH"},{"region":"EMEA","total":3019.35,"year":"2025","month":"APRIL"}],
            topItems: [{"date":"03/18/2026","region":"EMEA","customer":"DUMMY CUSTOMER_CASHAPPS 382 - Middle East 2","amount":228603.73},{"date":"01/27/2020","region":"Sysomos","customer":"Shiseido Americas Corporation","amount":130323.38},{"date":"03/20/2025","region":"Americas","customer":"DUMMY CUSTOMER_CASHAPPS 102 - US","amount":81229.11},{"date":"03/05/2026","region":"EMEA","customer":"Schindler Digital Innovation GmbH","amount":77986.53},{"date":"09/22/2025","region":"Americas","customer":"Microsoft Corporation","amount":54445.55},{"date":"04/28/2026","region":"Americas","customer":"DUMMY CUSTOMER_CASHAPPS 111 - Canada","amount":49625.78},{"date":"10/08/2025","region":"EMEA","customer":"Confederation Of African Football - AFCON","amount":43595.27},{"date":"03/04/2026","region":"EMEA","customer":"German Naval Yards Kiel GmbH","amount":37643.09},{"date":"02/18/2026","region":"Americas","customer":"Brick Media","amount":35534},{"date":"08/12/2019","region":"Sysomos","customer":"Shiseido Americas Corporation","amount":34295.63},{"date":"02/03/2025","region":"Americas","customer":"DUMMY CUSTOMER_CASHAPPS 102 - US","amount":32613.85},{"date":"06/02/2023","region":"EMEA","customer":"IBFD","amount":28300.69},{"date":"02/14/2024","region":"EMEA","customer":"DUMMY CUSTOMER_CASHAPPS 321 - UK","amount":27610.27},{"date":"11/20/2023","region":"EMEA","customer":"PERNOD RICARD SA","amount":27575.63},{"date":"10/17/2022","region":"Americas","customer":"ComplySci","amount":27218.77},{"date":"03/26/2026","region":"EMEA","customer":"DUMMY CUSTOMER_CASHAPPS 334-Linfluence France","amount":26853.57},{"date":"06/16/2023","region":"APAC","customer":"Temasek Capital Management Pte. Ltd.","amount":26612.22},{"date":"07/18/2025","region":"Americas","customer":"DUMMY CUSTOMER_CASHAPPS 102 - US","amount":25699.72},{"date":"06/16/2023","region":"APAC","customer":"Danone Specialized Nutrition (Malaysia)","amount":25232.16},{"date":"06/30/2025","region":"Americas","customer":"DUMMY CUSTOMER_CASHAPPS 102 - US","amount":24128}],
            history: {"apac":[6331.47,118148.64,20152.82,25616.49,55637.17],"sysomos":[0,0,0,0,0],"years":["2022","2023","2024","2025","2026"],"americas":[247647.77,161269.48,47448.12,369312.24,303459.68],"emea":[136434.15,320395.38,219682.33,342211.92,541621.09]}
        }
    }
};
