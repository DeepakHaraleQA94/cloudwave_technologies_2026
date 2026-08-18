import React from "react";
import { Link } from "react-router-dom";
import { Cloud, Mail, Phone, MapPin, Clock, Facebook, Instagram, Linkedin, Youtube, Twitter, MessageCircle } from "lucide-react";
import { useSite } from "@/context/SiteContext";
import { mediaUrl } from "@/lib/api";

export default function Footer() {
  const { settings } = useSite();
  const socials = [
    { k: "facebook", Icon: Facebook }, { k: "instagram", Icon: Instagram },
    { k: "linkedin", Icon: Linkedin }, { k: "youtube", Icon: Youtube }, { k: "twitter", Icon: Twitter },
  ].filter((s) => settings[s.k]);

  return (
    <footer className="border-t border-border bg-slate-950 text-slate-300">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-2 lg:grid-cols-4 lg:px-8">
        <div>
          <div className="flex items-center gap-2.5">
            {settings.logo_url ? (
              <img src={mediaUrl(settings.logo_url)} alt={settings.institute_name || "CloudWave Technologies"} className="h-9 w-auto object-contain bg-white/90 rounded-md p-1" />
            ) : (
              <>
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground">
                  <Cloud className="h-5 w-5" />
                </span>
                <span className="font-heading text-lg font-bold text-white">{settings.institute_name || "CloudWave"}<span className="text-brand-accent">.</span></span>
              </>
            )}
          </div>
          <p className="mt-4 text-sm leading-relaxed text-slate-400">{settings.footer_text || settings.tagline}</p>
          <div className="mt-4 flex gap-2">
            {socials.map(({ k, Icon }) => (
              <a key={k} href={settings[k]} target="_blank" rel="noreferrer" data-testid={`footer-social-${k}`}
                className="grid h-9 w-9 place-items-center rounded-lg bg-white/5 text-slate-300 transition-colors hover:bg-primary hover:text-white">
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>

        <div>
          <h4 className="font-heading text-sm font-semibold uppercase tracking-wider text-white">Quick Links</h4>
          <ul className="mt-4 space-y-2 text-sm">
            {[["About Us","/about"],["Courses","/courses"],["Upcoming Batches","/batches"],["Placements","/placements"],["Blog","/blog"],["FAQ","/faq"]].map(([l,to]) => (
              <li key={to}><Link to={to} className="text-slate-400 transition-colors hover:text-white">{l}</Link></li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="font-heading text-sm font-semibold uppercase tracking-wider text-white">Explore</h4>
          <ul className="mt-4 space-y-2 text-sm">
            {[["Photo Gallery","/gallery"],["Videos","/videos"],["Events","/events"],["Reviews","/reviews"],["Contact","/contact"],["Enquire Now","/enquiry"]].map(([l,to]) => (
              <li key={to}><Link to={to} className="text-slate-400 transition-colors hover:text-white">{l}</Link></li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="font-heading text-sm font-semibold uppercase tracking-wider text-white">Get in Touch</h4>
          <ul className="mt-4 space-y-3 text-sm text-slate-400">
            {settings.address && <li className="flex gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-accent" /> {settings.address}</li>}
            {settings.phone && <li className="flex gap-2"><Phone className="h-4 w-4 shrink-0 text-brand-accent" /> <a href={`tel:${settings.phone}`} className="hover:text-white">{settings.phone}{settings.phone_alt ? `, ${settings.phone_alt}` : ""}</a></li>}
            {settings.email && <li className="flex gap-2"><Mail className="h-4 w-4 shrink-0 text-brand-accent" /> <a href={`mailto:${settings.email}`} className="hover:text-white break-all">{settings.email}</a></li>}
            {settings.whatsapp && <li className="flex gap-2"><MessageCircle className="h-4 w-4 shrink-0 text-brand-accent" /> <a href={`https://wa.me/${settings.whatsapp}`} target="_blank" rel="noreferrer" className="hover:text-white">WhatsApp Us</a></li>}
            {settings.working_hours && <li className="flex gap-2"><Clock className="h-4 w-4 shrink-0 text-brand-accent" /> {settings.working_hours}</li>}
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-5 text-xs text-slate-500 sm:flex-row sm:px-6 lg:px-8">
          <p>© {new Date().getFullYear()} {settings.institute_name || "CloudWave Technologies"}. All rights reserved.</p>
          <div className="flex gap-4">
            <Link to="/privacy" className="hover:text-white">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-white">Terms &amp; Conditions</Link>
            <Link to="/admin/login" className="hover:text-white">Admin</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
