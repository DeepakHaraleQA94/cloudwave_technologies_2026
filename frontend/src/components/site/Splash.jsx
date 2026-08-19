import React, { useEffect, useState } from "react";

const LOGO = "https://customer-assets-lxgj4vgw.emergentagent.net/job_skill-academy-pro-1/artifacts/4s54v4nh_ece05370-f2cc-46ce-8d40-161d4a4413bf.png";

export default function Splash() {
  const [show, setShow] = useState(() => sessionStorage.getItem("cw_splash") !== "1");
  const [fade, setFade] = useState(false);

  useEffect(() => {
    if (!show) return;
    const t1 = setTimeout(() => setFade(true), 1100);
    const t2 = setTimeout(() => { setShow(false); sessionStorage.setItem("cw_splash", "1"); }, 1600);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [show]);

  if (!show) return null;
  return (
    <div data-testid="splash-screen"
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-slate-950 transition-opacity duration-500 ${fade ? "opacity-0" : "opacity-100"}`}>
      <div className="absolute inset-0 bg-grid opacity-30" />
      <div className="relative flex flex-col items-center gap-7">
        <div className="relative grid h-44 w-44 place-items-center">
          <span className="cw-spin-slow absolute inset-0 rounded-full border-2 border-dashed border-white/15" />
          <span className="cw-spin-rev absolute inset-4 rounded-full border border-white/10" />
          <img src={LOGO} alt="CloudWave Technologies" className="h-28 w-28 rounded-full bg-white object-contain p-2 shadow-2xl" />
        </div>
        <div className="h-1 w-44 overflow-hidden rounded-full bg-white/10">
          <span className="cw-load block h-full w-1/3 rounded-full bg-primary" />
        </div>
      </div>
    </div>
  );
}
