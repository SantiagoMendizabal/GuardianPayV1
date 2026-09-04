import React, { useState, useEffect } from 'react';
import { Wifi, BatteryMedium, Sparkles, Smartphone, ShieldCheck, Cpu } from 'lucide-react';

export default function PhoneMockup({ children, isInspectorOpen, onToggleInspector }) {
  const [timeStr, setTimeStr] = useState("14:30");

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      setTimeStr(`${hours}:${minutes}`);
    };
    updateClock();
    const interval = setInterval(updateClock, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-[100dvh] w-full bg-white sm:bg-gradient-to-br sm:from-slate-950 sm:via-[#1b0825] sm:to-slate-900 text-slate-900 sm:text-slate-100 flex flex-col items-center justify-center p-0 sm:p-6 lg:p-8 select-none">
      
      {/* Top Banner for Demo Context (Visible ONLY on Desktop/Tablet) */}
      <div className="hidden sm:flex w-full max-w-lg mb-4 items-center justify-between px-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-yape-700 flex items-center justify-center shadow-lg shadow-yape-700/40">
            <ShieldCheck className="w-5 h-5 text-mint" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold tracking-tight text-white text-sm">GuardianPay</span>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-mint/20 text-mint border border-mint/30">IA Engine</span>
            </div>
            <p className="text-[11px] text-slate-400">Mobile-First Fintech Simulator</p>
          </div>
        </div>

        {/* Global Inspector Toggle */}
        <button
          onClick={onToggleInspector}
          className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-all duration-300 border cursor-pointer ${
            isInspectorOpen
              ? 'bg-mint text-slate-950 border-mint shadow-lg shadow-mint/25 scale-105'
              : 'bg-slate-800/80 hover:bg-slate-800 text-slate-200 border-slate-700'
          }`}
        >
          <Cpu className={`w-3.5 h-3.5 ${isInspectorOpen ? 'animate-spin' : 'text-mint'}`} />
          <span>Inspector IA</span>
          <span className={`w-2 h-2 rounded-full ${isInspectorOpen ? 'bg-slate-950' : 'bg-mint animate-pulse'}`} />
        </button>
      </div>

      {/* Main Smartphone Shell: On mobile it fills 100% of the screen without bezel; on desktop it renders as a phone frame */}
      <div className="relative w-full h-[100dvh] min-h-[100dvh] sm:h-[810px] sm:min-h-0 sm:max-w-[390px] bg-white sm:bg-slate-900 rounded-none sm:rounded-[50px] p-0 sm:p-[10px] shadow-none sm:shadow-[0_25px_70px_-15px_rgba(0,0,0,0.9),0_0_40px_rgba(116,34,132,0.25)] border-0 sm:border-[5px] sm:border-slate-800 ring-0 sm:ring-1 sm:ring-white/10 flex flex-col transition-all duration-300">
        
        {/* Outer Phone Volume Buttons (Visible ONLY on Desktop) */}
        <div className="hidden sm:block absolute -left-[9px] top-[115px] w-[4px] h-[26px] bg-slate-700 rounded-l-md" />
        <div className="hidden sm:block absolute -left-[9px] top-[155px] w-[4px] h-[45px] bg-slate-700 rounded-l-md" />
        <div className="hidden sm:block absolute -left-[9px] top-[210px] w-[4px] h-[45px] bg-slate-700 rounded-l-md" />
        <div className="hidden sm:block absolute -right-[9px] top-[165px] w-[4px] h-[65px] bg-slate-700 rounded-r-md" />

        {/* Phone Screen Container: Full viewport on mobile, inside bezel on desktop */}
        <div className="relative w-full h-full min-h-[100dvh] sm:min-h-0 bg-white text-slate-900 rounded-none sm:rounded-[40px] overflow-hidden flex flex-col sm:shadow-inner">
          
          {/* iOS / Smartphone Status Bar (Visible ONLY on Desktop inside the mockup) */}
          <div className="hidden sm:flex w-full h-11 pt-2.5 px-6 items-center justify-between text-xs z-30 bg-transparent shrink-0">
            <span className="font-bold text-[13px] tracking-tight text-slate-800">{timeStr}</span>

            {/* Dynamic Island / Notch */}
            <div className="w-[104px] h-[24px] bg-black rounded-full flex items-center justify-between px-2 shadow-md">
              <div className="w-2.5 h-2.5 rounded-full bg-slate-900/80 border border-slate-800 flex items-center justify-center">
                <div className="w-1 h-1 rounded-full bg-[#1a2d59]" />
              </div>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-mint animate-pulse" />
                <span className="text-[8px] font-mono text-slate-400">AI-SEC</span>
              </div>
            </div>

            {/* Signal & Battery Icons */}
            <div className="flex items-center gap-1.5 text-slate-800">
              <span className="text-[10px] font-extrabold tracking-tighter">5G</span>
              <Wifi className="w-3.5 h-3.5" />
              <div className="flex items-center">
                <BatteryMedium className="w-4 h-4 text-emerald-600" />
              </div>
            </div>
          </div>

          {/* Dynamic Screen Viewport */}
          <div className="flex-1 w-full overflow-y-auto relative flex flex-col">
            {children}
          </div>

          {/* Bottom Gesture Bar (Visible ONLY on Desktop mockup) */}
          <div className="hidden sm:flex w-full h-5 bg-white shrink-0 items-center justify-center pb-1">
            <div className="w-32 h-1 bg-slate-300 rounded-full" />
          </div>
        </div>
      </div>

      {/* Footer credits / quick hint (Visible ONLY on Desktop) */}
      <div className="hidden sm:flex mt-4 text-center text-xs text-slate-400 max-w-sm items-center justify-center gap-2">
        <Sparkles className="w-3.5 h-3.5 text-mint" />
        <span>Diseñado con paleta Yape <b className="text-white">#742284</b> & <b className="text-mint">#00D69E</b></span>
      </div>

    </div>
  );
}
