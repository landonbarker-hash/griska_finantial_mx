import React, { useState } from "react";
import {
  TrendingUp,
  DollarSign,
  FileText,
  Clock,
  Download,
  Calculator,
  Truck,
  FileSpreadsheet,
  LogOut,
  MapPin,
  CheckCircle,
  AlertTriangle
} from "lucide-react";

interface PortalPageProps {
  onLogout: () => void;
}

export const PortalPage = ({ onLogout }: PortalPageProps) => {
  const [currency, setCurrency] = useState<"MXN" | "USD">("MXN");
  const [activeTab, setActiveTab] = useState<"overview" | "billing" | "calculator">("overview");

  // State for Calculator
  const [origin, setOrigin] = useState("Manzanillo, Colima");
  const [destination, setDestination] = useState("Monterrey, NL");
  const [cargoType, setCargoType] = useState("Liquids (Isotanque)");
  const [weight, setWeight] = useState(24000);
  const [calculatedQuote, setCalculatedQuote] = useState<any | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  // Conversion factor
  const fxRate = 20.0;
  const formatAmount = (amount: number) => {
    const converted = currency === "USD" ? amount / fxRate : amount;
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: currency
    }).format(converted);
  };

  // Mock Invoice Data
  const invoices = [
    { id: "F-2891", concept: "Flete Terrestre Laredo - Monterrey", date: "2026-06-12", amount: 48500, status: "Paid", tracking: "TRK-091A" },
    { id: "F-2890", concept: "Despacho Aduanal Manzanillo (CFDI)", date: "2026-06-10", amount: 15200, status: "Paid", tracking: "TRK-402B" },
    { id: "F-2889", concept: "Renta de Isotanques Veracruz - Altamira", date: "2026-06-08", amount: 124000, status: "Pending", tracking: "TRK-882C" },
    { id: "F-2888", concept: "Seguro de Carga Peligrosa Multimodal", date: "2026-06-05", amount: 32000, status: "Paid", tracking: "TRK-091A" },
    { id: "F-2887", concept: "Almacenaje en Terminal Altamira", date: "2026-05-28", amount: 78900, status: "Overdue", tracking: "TRK-301D" }
  ];

  // Handler for Quote Calculation
  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault();
    setIsCalculating(true);
    setTimeout(() => {
      // Simple formula
      const baseFreight = weight * 4.5;
      const customs = baseFreight * 0.15;
      const insurance = baseFreight * 0.05;
      const total = baseFreight + customs + insurance;

      setCalculatedQuote({
        freight: baseFreight,
        customs: customs,
        insurance: insurance,
        total: total
      });
      setIsCalculating(false);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col font-sans">
      
      {/* Top Header */}
      <header className="border-b border-zinc-900 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-30 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 select-none">
            {/* SVG Arrow */}
            <svg viewBox="0 0 24 24" className="w-10 h-10" fill="none">
              {/* Upper leg: Light Blue */}
              <path d="M 2 12 L 14 0 L 22 0 L 10 12 Z" fill="#8ec0f4" />
              {/* Lower-left leg: Medium Blue */}
              <path d="M 2 12 L 6 12 L 18 24 L 14 24 Z" fill="#2b82c9" />
              {/* Lower-right leg: Dark Blue */}
              <path d="M 6 12 L 10 12 L 22 24 L 18 24 Z" fill="#0f62ac" />
            </svg>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-white lowercase flex items-start">
                griska<span className="text-[11px] font-normal align-super ml-0.5 mt-0.5">®</span>
              </h1>
              <p className="text-[9px] text-zinc-500 uppercase tracking-widest font-semibold">Portal de Finanzas</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Currency Switcher */}
            <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-full p-0.5">
              <button
                onClick={() => setCurrency("MXN")}
                className={`px-3 py-1 text-xs font-semibold rounded-full transition-all cursor-pointer ${
                  currency === "MXN" ? "bg-teal-500 text-black shadow-md shadow-teal-500/10" : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                MXN
              </button>
              <button
                onClick={() => setCurrency("USD")}
                className={`px-3 py-1 text-xs font-semibold rounded-full transition-all cursor-pointer ${
                  currency === "USD" ? "bg-teal-500 text-black shadow-md shadow-teal-500/10" : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                USD
              </button>
            </div>

            {/* Profile */}
            <div className="h-px w-6 bg-zinc-800 hidden sm:block" />
            <div className="text-right hidden sm:block">
              <p className="text-xs font-semibold text-white">Mabe México S.A. de C.V.</p>
              <p className="text-[10px] text-zinc-400 font-accent">Cliente #MB-9810</p>
            </div>

            {/* Logout */}
            <button
              onClick={onLogout}
              className="p-2 rounded-full border border-zinc-800 hover:border-red-500/40 text-zinc-400 hover:text-red-400 hover:bg-red-500/5 transition-all duration-200 cursor-pointer"
              title="Cerrar Sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        
        {/* Navigation Tabs */}
        <div className="flex border-b border-zinc-900 gap-6">
          <button
            onClick={() => setActiveTab("overview")}
            className={`pb-3 text-sm font-medium border-b-2 transition-all cursor-pointer ${
              activeTab === "overview" ? "border-teal-500 text-white font-semibold" : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Resumen General
          </button>
          <button
            onClick={() => setActiveTab("billing")}
            className={`pb-3 text-sm font-medium border-b-2 transition-all cursor-pointer ${
              activeTab === "billing" ? "border-teal-500 text-white font-semibold" : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Facturación & CFDI
          </button>
          <button
            onClick={() => setActiveTab("calculator")}
            className={`pb-3 text-sm font-medium border-b-2 transition-all cursor-pointer ${
              activeTab === "calculator" ? "border-teal-500 text-white font-semibold" : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Cotizador de Fletes
          </button>
        </div>

        {activeTab === "overview" && (
          <>
            {/* Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              <div className="bg-zinc-950 border border-zinc-900/60 rounded-2xl p-5 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-16 h-16 bg-teal-500/2 rounded-full blur-xl group-hover:bg-teal-500/5 transition-all" />
                <div className="flex items-center justify-between mb-3 text-zinc-400">
                  <span className="text-xs font-semibold uppercase tracking-wider">Total Facturado</span>
                  <DollarSign className="w-4 h-4 text-teal-400" />
                </div>
                <div className="text-2xl font-bold text-white tracking-tight">{formatAmount(2458920)}</div>
                <div className="text-[10px] text-zinc-500 mt-2 flex items-center gap-1 font-accent">
                  <TrendingUp className="w-3 h-3 text-green-400" /> +12.4% vs mes anterior
                </div>
              </div>

              <div className="bg-zinc-950 border border-zinc-900/60 rounded-2xl p-5 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/2 rounded-full blur-xl group-hover:bg-amber-500/5 transition-all" />
                <div className="flex items-center justify-between mb-3 text-zinc-400">
                  <span className="text-xs font-semibold uppercase tracking-wider">Facturas Pendientes</span>
                  <Clock className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-2xl font-bold text-white tracking-tight">{formatAmount(124000)}</div>
                <div className="text-[10px] text-zinc-500 mt-2 flex items-center gap-1 font-accent">
                  1 pendiente de pago inmediato
                </div>
              </div>

              <div className="bg-zinc-950 border border-zinc-900/60 rounded-2xl p-5 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-16 h-16 bg-red-500/2 rounded-full blur-xl group-hover:bg-red-500/5 transition-all" />
                <div className="flex items-center justify-between mb-3 text-zinc-400">
                  <span className="text-xs font-semibold uppercase tracking-wider">Vencido (Overdue)</span>
                  <AlertTriangle className="w-4 h-4 text-red-400 animate-pulse" />
                </div>
                <div className="text-2xl font-bold text-red-400 tracking-tight">{formatAmount(78900)}</div>
                <div className="text-[10px] text-red-500/70 mt-2 flex items-center gap-1 font-accent">
                  Requiere atención aduanal / pago
                </div>
              </div>

              <div className="bg-zinc-950 border border-zinc-900/60 rounded-2xl p-5 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/2 rounded-full blur-xl group-hover:bg-blue-500/5 transition-all" />
                <div className="flex items-center justify-between mb-3 text-zinc-400">
                  <span className="text-xs font-semibold uppercase tracking-wider">Costo Fletes Activos</span>
                  <Truck className="w-4 h-4 text-blue-400" />
                </div>
                <div className="text-2xl font-bold text-white tracking-tight">{formatAmount(845600)}</div>
                <div className="text-[10px] text-zinc-500 mt-2 flex items-center gap-1 font-accent">
                  3 rutas de carga activa
                </div>
              </div>

            </div>

            {/* Dashboard Graphs & Tables Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Expense Breakdown Card */}
              <div className="lg:col-span-1 bg-zinc-950 border border-zinc-900 rounded-2xl p-6 flex flex-col justify-between">
                <div>
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-white mb-4">Desglose de Logística</h2>
                  <p className="text-xs text-zinc-400 mb-6">Porcentaje de gastos logísticos por tipo de transporte este trimestre.</p>
                  
                  {/* Custom SVG Donut Chart */}
                  <div className="flex justify-center items-center py-2 relative">
                    <svg className="w-40 h-40 transform -rotate-90">
                      <circle cx="80" cy="80" r="65" stroke="#18181b" strokeWidth="14" fill="transparent" />
                      
                      {/* Terrestre: 45% (Dasharray total = 2 * PI * 65 = ~408.4. 45% = 183.7) */}
                      <circle
                        cx="80" cy="80" r="65"
                        stroke="#14b8a6" strokeWidth="14" fill="transparent"
                        strokeDasharray="183.7 408.4"
                        strokeDashoffset="0"
                      />
                      
                      {/* Maritimo: 30% (30% = 122.5) */}
                      <circle
                        cx="80" cy="80" r="65"
                        stroke="#3b82f6" strokeWidth="14" fill="transparent"
                        strokeDasharray="122.5 408.4"
                        strokeDashoffset="-183.7"
                      />

                      {/* Aduanas: 15% (15% = 61.2) */}
                      <circle
                        cx="80" cy="80" r="65"
                        stroke="#f59e0b" strokeWidth="14" fill="transparent"
                        strokeDasharray="61.2 408.4"
                        strokeDashoffset="-306.2"
                      />

                      {/* Almacen: 10% (10% = 40.8) */}
                      <circle
                        cx="80" cy="80" r="65"
                        stroke="#71717a" strokeWidth="14" fill="transparent"
                        strokeDasharray="40.8 408.4"
                        strokeDashoffset="-367.4"
                      />
                    </svg>
                    
                    <div className="absolute text-center">
                      <span className="text-2xl font-bold text-white tracking-tight">100%</span>
                      <p className="text-[8px] text-zinc-500 uppercase tracking-widest font-accent">Costo Total</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-4 border-t border-zinc-900 mt-4">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-teal-500" />
                    <span className="text-zinc-400">Terrestre (45%)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                    <span className="text-zinc-400">Marítimo (30%)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <span className="text-zinc-400">Aduanas (15%)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-zinc-500" />
                    <span className="text-zinc-400">Almacén (10%)</span>
                  </div>
                </div>
              </div>

              {/* Quick Billing Overview */}
              <div className="lg:col-span-2 bg-zinc-950 border border-zinc-900 rounded-2xl p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-semibold uppercase tracking-wider text-white">Últimas Facturas (CFDI)</h2>
                    <button
                      onClick={() => setActiveTab("billing")}
                      className="text-xs text-teal-400 hover:text-teal-300 font-medium underline"
                    >
                      Ver todas
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-zinc-900 text-zinc-500 font-medium pb-2">
                          <th className="pb-3">Factura</th>
                          <th className="pb-3">Concepto</th>
                          <th className="pb-3">Fecha</th>
                          <th className="pb-3 text-right">Monto</th>
                          <th className="pb-3 text-center">Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {invoices.slice(0, 4).map((invoice) => (
                          <tr key={invoice.id} className="border-b border-zinc-900/60 hover:bg-white/[0.01]">
                            <td className="py-3 font-semibold text-white">{invoice.id}</td>
                            <td className="py-3 text-zinc-300 max-w-[200px] truncate">{invoice.concept}</td>
                            <td className="py-3 text-zinc-400">{invoice.date}</td>
                            <td className="py-3 text-right font-medium text-white">{formatAmount(invoice.amount)}</td>
                            <td className="py-3 text-center">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                  invoice.status === "Paid"
                                    ? "bg-green-500/10 text-green-400"
                                    : "bg-amber-500/10 text-amber-400"
                                }`}
                              >
                                {invoice.status === "Paid" ? "Pagado" : "Pendiente"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-zinc-900 mt-4 text-[10px] text-zinc-500">
                  <span>Mostrando las últimas 4 facturas emitidas por Grupo Griska.</span>
                  <span className="flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5 text-teal-500" /> Conexión con SAT Activa
                  </span>
                </div>
              </div>

            </div>
          </>
        )}

        {activeTab === "billing" && (
          <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-lg font-bold text-white font-display">Historial de Facturación</h2>
                <p className="text-xs text-zinc-400">Descarga tus archivos fiscales CFDI (XML y PDF) correspondientes a cada flete.</p>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => alert("Reporte de facturas exportado a Excel")}
                  className="flex items-center gap-2 px-4 py-2 border border-zinc-800 bg-zinc-900 text-zinc-200 text-xs font-semibold rounded-lg hover:bg-zinc-800 hover:border-zinc-700 transition-all cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" /> Exportar Reporte
                </button>
              </div>
            </div>

            {/* Invoices Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-500 font-semibold uppercase tracking-wider pb-3">
                    <th className="pb-3.5">Factura ID</th>
                    <th className="pb-3.5">Concepto del CFDI</th>
                    <th className="pb-3.5">Embarque Relacionado</th>
                    <th className="pb-3.5">Fecha</th>
                    <th className="pb-3.5 text-right">Monto</th>
                    <th className="pb-3.5 text-center">Estado</th>
                    <th className="pb-3.5 text-center">Descargas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900">
                  {invoices.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-white/[0.01] transition-colors">
                      <td className="py-4 font-semibold text-white">{invoice.id}</td>
                      <td className="py-4 text-zinc-200 font-medium">{invoice.concept}</td>
                      <td className="py-4 font-mono text-zinc-400">{invoice.tracking}</td>
                      <td className="py-4 text-zinc-400">{invoice.date}</td>
                      <td className="py-4 text-right font-semibold text-white">{formatAmount(invoice.amount)}</td>
                      <td className="py-4 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                            invoice.status === "Paid"
                              ? "bg-green-500/10 text-green-400"
                              : invoice.status === "Pending"
                              ? "bg-amber-500/10 text-amber-400 animate-pulse"
                              : "bg-red-500/10 text-red-400"
                          }`}
                        >
                          {invoice.status === "Paid" ? "Pagado" : invoice.status === "Pending" ? "Pendiente" : "Vencido"}
                        </span>
                      </td>
                      <td className="py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => alert(`Descargando PDF de la factura ${invoice.id}`)}
                            className="p-1.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all cursor-pointer"
                            title="Descargar PDF"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => alert(`Descargando XML de la factura ${invoice.id}`)}
                            className="p-1.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all cursor-pointer"
                            title="Descargar XML"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "calculator" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Calculator Inputs Form */}
            <div className="lg:col-span-1 bg-zinc-950 border border-zinc-900 rounded-2xl p-6">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-white mb-4 flex items-center gap-2">
                <Calculator className="w-4 h-4 text-teal-400" /> Presupuesto Tarifario
              </h2>
              <p className="text-xs text-zinc-400 mb-6">Cotiza al instante fletes de contenedores especializados, isotanques o carga general.</p>

              <form onSubmit={handleCalculate} className="space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label className="text-zinc-400 font-medium">Origen del Embarque</label>
                  <input
                    type="text"
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value)}
                    className="w-full bg-black border border-zinc-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-teal-500/50"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-zinc-400 font-medium">Destino de Entrega</label>
                  <input
                    type="text"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    className="w-full bg-black border border-zinc-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-teal-500/50"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-zinc-400 font-medium">Tipo de Carga</label>
                  <select
                    value={cargoType}
                    onChange={(e) => setCargoType(e.target.value)}
                    className="w-full bg-black border border-zinc-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-teal-500/50"
                  >
                    <option>Liquids (Isotanque)</option>
                    <option>Bulk Liquids (Flexitanque)</option>
                    <option>Carga Peligrosa Químicos</option>
                    <option>Carga Seca (General)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-zinc-400 font-medium">Peso Estimado (kg)</label>
                  <input
                    type="number"
                    value={weight}
                    onChange={(e) => setWeight(Number(e.target.value))}
                    className="w-full bg-black border border-zinc-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-teal-500/50"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isCalculating}
                  className="w-full bg-teal-400 text-black py-3 rounded-lg font-semibold hover:bg-teal-300 transition-all flex items-center justify-center gap-2 mt-4 cursor-pointer"
                >
                  {isCalculating ? "Calculando..." : "Calcular Tarifa"}
                </button>
              </form>
            </div>

            {/* Calculator Output Display */}
            <div className="lg:col-span-2 bg-zinc-950 border border-zinc-900 rounded-2xl p-6 flex flex-col justify-between">
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-white mb-4">Estimación de Costo de Flete</h2>
                
                {calculatedQuote ? (
                  <div className="space-y-6">
                    
                    {/* Summary row */}
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-teal-500/5 border border-teal-500/10">
                      <div className="w-10 h-10 rounded-full bg-teal-500/10 flex items-center justify-center">
                        <Calculator className="w-5 h-5 text-teal-400" />
                      </div>
                      <div>
                        <span className="text-[10px] text-zinc-400 uppercase font-accent">Total Estimado Estimación</span>
                        <div className="text-2xl font-bold text-teal-400 tracking-tight">{formatAmount(calculatedQuote.total)}</div>
                      </div>
                    </div>

                    {/* Breakdown */}
                    <div className="space-y-3 text-xs">
                      <h3 className="font-semibold text-white border-b border-zinc-900 pb-2">Desglose del Costo</h3>
                      
                      <div className="flex justify-between py-1">
                        <span className="text-zinc-400 flex items-center gap-2">
                          <Truck className="w-3.5 h-3.5 text-zinc-500" /> Tarifa de Flete Terrestre Base
                        </span>
                        <span className="font-medium text-white">{formatAmount(calculatedQuote.freight)}</span>
                      </div>

                      <div className="flex justify-between py-1">
                        <span className="text-zinc-400 flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-zinc-500" /> Gastos de Aduana y Despacho
                        </span>
                        <span className="font-medium text-white">{formatAmount(calculatedQuote.customs)}</span>
                      </div>

                      <div className="flex justify-between py-1">
                        <span className="text-zinc-400 flex items-center gap-2">
                          <FileText className="w-3.5 h-3.5 text-zinc-500" /> Seguro de Carga Especializada (0.5%)
                        </span>
                        <span className="font-medium text-white">{formatAmount(calculatedQuote.insurance)}</span>
                      </div>
                    </div>

                    <div className="bg-zinc-900/40 p-4 rounded-xl text-[10px] text-zinc-500 leading-relaxed border border-zinc-900/60">
                      <strong>Nota Legal:</strong> Esta cotización es puramente estimada con fines informativos y presupuestarios, basada en una tarifa base por kg de peso. No representa un contrato definitivo ni incluye cargos demorados o maniobras de puerto excepcionales.
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                    <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                      <Calculator className="w-6 h-6 text-zinc-600" />
                    </div>
                    <div>
                      <p className="text-xs text-zinc-300 font-medium">No hay estimaciones activas</p>
                      <p className="text-[10px] text-zinc-500">Introduce los datos de tu ruta a la izquierda y presiona calcular para ver el presupuesto.</p>
                    </div>
                  </div>
                )}
              </div>

              {calculatedQuote && (
                <div className="flex gap-3 pt-6 mt-6 border-t border-zinc-900">
                  <button
                    onClick={() => alert("Solicitud formal enviada a tu agente de carga de Griska.")}
                    className="flex-1 bg-white text-black py-2.5 rounded-lg text-xs font-semibold hover:bg-zinc-200 transition-all cursor-pointer"
                  >
                    Solicitar Reservación de Flete
                  </button>
                  <button
                    onClick={() => alert("Presupuesto en PDF guardado.")}
                    className="px-4 border border-zinc-800 hover:border-zinc-700 text-zinc-300 text-xs rounded-lg transition-all cursor-pointer"
                  >
                    Descargar Cotización
                  </button>
                </div>
              )}
            </div>

          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-900 bg-zinc-950 py-6 px-6 text-center text-xs text-zinc-600 font-accent uppercase tracking-wider">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span>© 2026 GRISKA. Todos los derechos reservados.</span>
          <div className="flex gap-4">
            <a href="https://griska.mx/" target="_blank" rel="noopener noreferrer" className="hover:text-zinc-400 transition-colors">Aviso de Privacidad</a>
            <a href="https://griska.mx/" target="_blank" rel="noopener noreferrer" className="hover:text-zinc-400 transition-colors">Términos de Servicio</a>
          </div>
        </div>
      </footer>

    </div>
  );
};
