import React, { useEffect, useState } from 'react';
import { 
  Check, 
  ShieldCheck, 
  Share2, 
  ArrowLeft, 
  Download, 
  Home, 
  Smartphone, 
  Calendar, 
  Hash,
  Copy,
  Printer,
  Database,
  CreditCard,
  Send,
  CheckCircle2,
  Cpu,
  Clock,
  ExternalLink,
  ChevronRight,
  FileText,
  Image as ImageIcon
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function VoucherScreen({
  transaction,
  user,
  onReturnHome,
  onNewTransfer
}) {
  const {
    amount = 25,
    recipient = "Lucía Gómez",
    recipientPhone = "981234567",
    operationCode = "OP-84920194",
    date = "Hoy, 14:30",
    riskScore = 1.3,
    riskLevel = "BAJO"
  } = transaction || {};

  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    try {
      confetti({
        particleCount: 65,
        spread: 60,
        origin: { y: 0.65 },
        colors: ['#00D69E', '#742284', '#ffffff', '#25efb9']
      });
    } catch (e) {
      // ignore
    }
  }, []);

  const handleCopyCode = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(operationCode);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadPDF = () => {
    window.print();
  };

  const handleDownloadPNG = () => {
    setDownloading(true);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 900;
      canvas.height = 1200;
      const ctx = canvas.getContext('2d');

      // 1. Fondo blanco
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 900, 1200);

      // 2. Cabecera Púrpura BCP/GuardianPay
      ctx.fillStyle = '#742284';
      ctx.fillRect(0, 0, 900, 160);

      // Logo y Marca
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 36px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText('> GuardianPay', 60, 80);

      ctx.fillStyle = '#00D69E';
      ctx.font = 'bold 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText('BANCA POR INTERNET • CONSTANCIA OFICIAL', 60, 118);

      // 3. Círculo Check verde menta
      ctx.beginPath();
      ctx.arc(450, 235, 46, 0, Math.PI * 2);
      ctx.fillStyle = '#00D69E';
      ctx.fill();

      // Checkmark icon
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 7;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(432, 235);
      ctx.lineTo(445, 248);
      ctx.lineTo(470, 220);
      ctx.stroke();

      // 4. Textos de Confirmación
      ctx.fillStyle = '#742284';
      ctx.font = 'bold 30px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('¡Transferencia Exitosa!', 450, 320);

      ctx.fillStyle = '#64748b';
      ctx.font = '18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText(`Dinero enviado a ${recipient}`, 450, 355);

      // 5. Caja de Monto
      ctx.fillStyle = '#f8fafc';
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(80, 390, 740, 115, 18);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('IMPORTE TOTAL TRANSFERIDO', 120, 430);

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 44px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText(`S/ ${numAmount}`, 120, 480);

      ctx.fillStyle = '#059669';
      ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText('Comisión: S/ 0.00 (Gratis)', 780, 455);

      // 6. Filas de Datos Transaccionales
      const drawRow = (label, value, y) => {
        ctx.fillStyle = '#64748b';
        ctx.font = 'bold 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(label, 80, y);

        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(value, 820, y);

        ctx.strokeStyle = '#f1f5f9';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(80, y + 16);
        ctx.lineTo(820, y + 16);
        ctx.stroke();
      };

      drawRow('N° de Operación:', operationCode, 560);
      drawRow('Fecha y Hora:', date, 625);
      drawRow('Cuenta de Cargo:', `Ahorros Soles (**** ${user?.accountNumber ? user.accountNumber.slice(-4) : "9941"})`, 690);
      drawRow('Titular Destino:', recipient, 755);
      drawRow('Celular Destino:', `+51 ${recipientPhone}`, 820);
      drawRow('Canal de Pago:', 'GuardianPay Core Banking (API v3.0)', 885);
      drawRow('Auditoría Antifraude:', `Aprobado por IA (${riskScore}% Riesgo)`, 950);
      drawRow('Certificación Digital:', 'Firma Digital Autorizada SBS', 1015);

      // 7. Pie de Certificación
      ctx.fillStyle = '#94a3b8';
      ctx.font = '14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Constancia oficial digital válida de acuerdo a normativa SBS y Fintech PE.', 450, 1085);
      ctx.fillText(`Firma digital generada: ${new Date().toISOString()} • GuardianPay Security Suite`, 450, 1115);

      // 8. Disparar Descarga
      const link = document.createElement('a');
      link.download = `Comprobante_${operationCode}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Error generando comprobante PNG:', err);
      alert('Hubo un inconveniente al generar la imagen. Puedes usar la opción Guardar como PDF.');
    } finally {
      setDownloading(false);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Comprobante de Transferencia GuardianPay',
        text: `Transferencia exitosa de S/ ${Math.abs(Number(amount)).toFixed(2)} a ${recipient}. N° Operación: ${operationCode}`,
        url: window.location.href
      }).catch(() => {});
    } else {
      handleCopyCode();
      alert(`¡Datos del comprobante copiados al portapapeles!\n\nOperación: ${operationCode}\nMonto: S/ ${Math.abs(Number(amount)).toFixed(2)}\nDestinatario: ${recipient}`);
    }
  };

  const numAmount = Math.abs(Number(amount) || 0).toFixed(2);

  return (
    <div className="flex-1 flex flex-col justify-between text-slate-800 animate-fade-in overflow-y-auto">
      
      {/* ========================================================================= */}
      {/* 1. MÓVIL (< 1024px): VOUCHER ESTILO YAPE MÓVIL                             */}
      {/* ========================================================================= */}
      <div className="lg:hidden flex-1 flex flex-col justify-between bg-gradient-to-b from-yape-700 via-yape-800 to-yape-900 text-white p-4 print:hidden">
        
        {/* Top Bar Móvil */}
        <div className="flex items-center justify-between pt-1 pb-2">
          <button
            type="button"
            onClick={onReturnHome}
            className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-bold uppercase tracking-wider text-yape-200">
            Comprobante de Envío
          </span>
          <button
            type="button"
            onClick={handleShare}
            className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>

        {/* Tarjeta Voucher Móvil */}
        <div className="relative bg-white text-slate-900 rounded-3xl p-5 shadow-2xl shadow-black/40 my-auto">
          
          <div className="flex flex-col items-center -mt-10 mb-3">
            <div className="w-16 h-16 rounded-full bg-mint text-slate-950 flex items-center justify-center shadow-md border-4 border-white">
              <Check className="w-9 h-9 stroke-[3]" />
            </div>
            <h2 className="text-lg font-black tracking-tight text-yape-700 mt-2">
              ¡Transferencia Exitosa!
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Dinero enviado a {recipient}
            </p>
          </div>

          <div className="text-center py-2.5 bg-yape-50/70 rounded-2xl border border-yape-100 mb-4">
            <span className="text-xs font-bold text-slate-500 block mb-0.5">Monto Total</span>
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-sm font-black text-yape-700">S/</span>
              <span className="text-3xl font-black tracking-tight text-yape-700 font-sans">
                {numAmount}
              </span>
            </div>
          </div>

          <div className="mb-4 bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-emerald-500 text-white flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div className="text-[11px] font-bold text-emerald-800">
                  Operación verificada por IA
                </div>
                <div className="text-[10px] text-emerald-600">
                  Score de Riesgo: <b>{riskScore}% ({riskLevel})</b>
                </div>
              </div>
            </div>
            <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-emerald-200/60 text-emerald-800">
              Aprobada
            </span>
          </div>

          <div className="space-y-2.5 text-xs border-t border-slate-100 pt-3">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-medium flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-slate-400" />
                Destinatario
              </span>
              <div className="text-right">
                <span className="font-bold text-slate-800">{recipient}</span>
                <span className="block text-[10px] text-slate-500 font-sans font-bold">{recipientPhone}</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-medium flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Fecha y Hora
              </span>
              <span className="font-bold text-slate-800">{date}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-medium flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-slate-400" />
                N° Operación
              </span>
              <span className="font-sans font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                {operationCode}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-medium">Canal de Pago</span>
              <span className="font-bold text-yape-700">GuardianPay Core</span>
            </div>
          </div>

          <div className="relative mt-4 pt-3 border-t border-dashed border-slate-200 text-center">
            <p className="text-[10px] text-slate-400">
              Comprobante oficial válido de acuerdo a normativa Fintech
            </p>
          </div>
        </div>

        {/* Botones Móvil */}
        <div className="pt-3 space-y-2">
          <button
            type="button"
            onClick={handleDownloadPNG}
            disabled={downloading}
            className="w-full py-3.5 rounded-2xl bg-mint hover:bg-mint-dark active:scale-[0.98] text-slate-950 font-black text-sm shadow-xl shadow-mint/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>{downloading ? "Generando Imagen..." : "Descargar Comprobante (PNG)"}</span>
          </button>

          <button
            type="button"
            onClick={onReturnHome}
            className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Volver al Inicio</span>
          </button>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 2. ESCRITORIO (>= 1024px): PORTAL BANCARIO BCP - CONSTANCIA OFICIAL        */}
      {/* ========================================================================= */}
      <div className="hidden lg:block w-full print:block">
        
        {/* Top Breadcrumb Bar */}
        <div className="flex items-center justify-between mb-5 print:hidden">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onReturnHome}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-yape-700 bg-white hover:bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200 shadow-2xs transition-all cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Volver a Mis Productos</span>
            </button>
            <span className="text-slate-300">|</span>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
              <span>Operaciones</span>
              <span>&gt;</span>
              <span className="text-yape-700 font-bold">Constancia de Transferencia</span>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 text-xs font-bold px-3 py-1.5 rounded-xl border border-emerald-200 shadow-2xs">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Operación Certificada y Liquidada en Línea</span>
          </div>
        </div>

        {/* Título de Sección */}
        <div className="mb-6 print:hidden">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Constancia de Transferencia Inmediata</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">La transferencia ha sido procesada y debitada exitosamente de tu cuenta bancaria.</p>
        </div>

        {/* Grid 12 Columnas Desktop (En impresión se convierte en bloque centrado) */}
        <div className="grid grid-cols-12 gap-8 items-start print:block print:w-full">
          
          {/* COLUMNA IZQUIERDA (7 COLS): VOUCHER OFICIAL IMPRIMIBLE */}
          <div className="col-span-7 space-y-4 print:w-full print:m-0">
            
            {/* Tarjeta de Comprobante Estilo Certificado Bancario */}
            <div className="printable-voucher-card bg-white rounded-3xl border border-slate-200 shadow-sm p-8 relative overflow-hidden print:p-6 print:border-2 print:border-yape-700 print:shadow-none print:rounded-2xl">
              
              {/* Sello de agua sutil de fondo */}
              <div className="absolute -top-10 -right-10 w-44 h-44 rounded-full bg-yape-500/5 blur-2xl pointer-events-none print:hidden" />
              
              {/* Encabezado del Voucher */}
              <div className="flex items-start justify-between border-b border-slate-100 pb-5 mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-mint text-slate-950 flex items-center justify-center font-black shadow-sm">
                    <Check className="w-7 h-7 stroke-[3]" />
                  </div>
                  <div>
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                      Operación Exitosa
                    </span>
                    <h2 className="text-xl font-black text-slate-900 mt-1 tracking-tight">
                      Transferencia Realizada
                    </h2>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Canal</span>
                  <span className="text-xs font-extrabold text-yape-700">GuardianPay Web / Core</span>
                </div>
              </div>

              {/* Monto Principal */}
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 flex items-center justify-between mb-6 print:bg-slate-100/60">
                <div>
                  <span className="text-xs font-semibold text-slate-500 block">Importe Total Transferido</span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-base font-black text-slate-800">S/</span>
                    <span className="text-3xl font-black font-sans text-slate-900 tracking-tight">
                      {numAmount}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[11px] font-bold text-slate-400 block">Comisión</span>
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">
                    S/ 0.00 (Gratis)
                  </span>
                </div>
              </div>

              {/* Fila de Datos Transaccionales */}
              <div className="space-y-3.5 text-xs divide-y divide-slate-100">
                
                {/* N° Operación con botón copiar */}
                <div className="flex items-center justify-between pt-2">
                  <span className="text-slate-400 font-medium flex items-center gap-2">
                    <Hash className="w-3.5 h-3.5 text-slate-400" />
                    Número de Operación
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-sans font-black text-slate-800 bg-slate-100 px-2.5 py-1 rounded-lg text-xs tracking-wide">
                      {operationCode}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyCode}
                      className="p-1 rounded-md hover:bg-slate-100 text-slate-500 hover:text-yape-700 transition-colors cursor-pointer print:hidden"
                      title="Copiar código"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    {copied && <span className="text-[10px] font-bold text-emerald-600 print:hidden">¡Copiado!</span>}
                  </div>
                </div>

                {/* Fecha y Hora */}
                <div className="flex items-center justify-between pt-3">
                  <span className="text-slate-400 font-medium flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    Fecha y Hora de Confirmación
                  </span>
                  <span className="font-bold text-slate-800">{date}</span>
                </div>

                {/* Cuenta de Origen */}
                <div className="flex items-center justify-between pt-3">
                  <span className="text-slate-400 font-medium flex items-center gap-2">
                    <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                    Cuenta de Cargo
                  </span>
                  <div className="text-right">
                    <span className="font-bold text-slate-800">Cuenta de Ahorros Soles</span>
                    <span className="block text-[11px] text-slate-400 font-sans">
                      **** {user?.accountNumber ? user.accountNumber.slice(-4) : "9941"}
                    </span>
                  </div>
                </div>

                {/* Destinatario y Celular */}
                <div className="flex items-center justify-between pt-3">
                  <span className="text-slate-400 font-medium flex items-center gap-2">
                    <Smartphone className="w-3.5 h-3.5 text-slate-400" />
                    Titular y Celular de Destino
                  </span>
                  <div className="text-right">
                    <span className="font-bold text-slate-800">{recipient}</span>
                    <span className="block text-[11px] text-slate-500 font-sans font-bold">
                      +51 {recipientPhone}
                    </span>
                  </div>
                </div>

                {/* Auditoría IA */}
                <div className="flex items-center justify-between pt-3">
                  <span className="text-slate-400 font-medium flex items-center gap-2">
                    <Cpu className="w-3.5 h-3.5 text-slate-400" />
                    Auditoría Antifraude
                  </span>
                  <span className="font-bold text-emerald-600 font-sans">
                    Aprobado por IA (Score: {riskScore}% - {riskLevel})
                  </span>
                </div>

              </div>

              {/* Certificación de Seguridad */}
              <div className="mt-6 pt-4 border-t border-dashed border-slate-200 flex items-center justify-between text-[11px] text-slate-400">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>Constancia digital firmada criptográficamente</span>
                </div>
                <span className="font-sans font-medium text-slate-400">Validez SBS Fintech PE</span>
              </div>

            </div>

            {/* Botones de Acción del Voucher */}
            <div className="flex items-center gap-3 print:hidden">
              <button
                type="button"
                onClick={handleDownloadPNG}
                disabled={downloading}
                className="flex-1 py-3 px-4 rounded-xl bg-mint hover:bg-mint-dark text-slate-950 font-black text-xs shadow-md shadow-mint/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Download className="w-4 h-4 text-slate-950" />
                <span>{downloading ? "Generando Imagen..." : "Descargar Imagen (PNG)"}</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadPDF}
                className="flex-1 py-3 px-4 rounded-xl bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs border border-slate-200 shadow-2xs flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Printer className="w-4 h-4 text-yape-700" />
                <span>Guardar PDF / Imprimir</span>
              </button>

              <button
                type="button"
                onClick={handleShare}
                className="py-3 px-4 rounded-xl bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs border border-slate-200 shadow-2xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                title="Compartir comprobante"
              >
                <Share2 className="w-4 h-4 text-yape-700" />
                <span>Compartir</span>
              </button>
            </div>

          </div>

          {/* COLUMNA DERECHA (5 COLS): RESUMEN FINANCIERO Y AUDITORÍA IA (Oculta en impresión) */}
          <div className="col-span-5 space-y-4 print:hidden">
            
            {/* Card 1: Saldo Disponible Actualizado */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-3">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Saldo Actualizado
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-sm font-black text-slate-800">S/</span>
                <span className="text-3xl font-black font-sans text-slate-900 tracking-tight">
                  {user?.balance !== undefined ? Number(user.balance).toFixed(2) : "1,240.00"}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-emerald-600 bg-emerald-50 px-3 py-2 rounded-xl">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                <span className="font-semibold">Transacción confirmada y saldo actualizado</span>
              </div>
            </div>

            {/* Card 2: Auditoría del Modelo de Machine Learning */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-yape-700" />
                  <span className="text-xs font-black uppercase tracking-wider text-slate-800">
                    Auditoría IA Antifraude
                  </span>
                </div>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  Aprobada
                </span>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Modelo Activo:</span>
                  <span className="font-bold text-slate-800 font-sans">Random Forest v2.0 (82.0% ROC-AUC)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Puntaje de Riesgo:</span>
                  <span className="font-bold text-emerald-600 font-sans">{riskScore}% ({riskLevel})</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Tiempo de Inferencia:</span>
                  <span className="font-bold text-slate-700 font-sans">&lt; 50 ms</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Certificación Regulatoria:</span>
                  <span className="font-bold text-slate-800 font-sans text-xs">Bitácora Oficial SBS Conforme</span>
                </div>
              </div>
            </div>

            {/* Card 3: Acciones Rápidas */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                ¿Qué deseas hacer ahora?
              </span>

              {onNewTransfer && (
                <button
                  type="button"
                  onClick={onNewTransfer}
                  className="w-full py-3.5 px-4 rounded-xl bg-yape-700 hover:bg-yape-800 text-white font-black text-xs shadow-md shadow-yape-700/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Send className="w-4 h-4 text-mint" />
                  <span>Realizar Otra Transferencia</span>
                </button>
              )}

              <button
                type="button"
                onClick={onReturnHome}
                className="w-full py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Home className="w-4 h-4" />
                <span>Volver a Mis Productos</span>
              </button>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
