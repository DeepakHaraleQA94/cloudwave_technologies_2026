import React from "react";
import { MessageCircle } from "lucide-react";
import { useSite } from "@/context/SiteContext";

export default function WhatsAppButton() {
  const { settings } = useSite();
  if (!settings.whatsapp) return null;
  const msg = encodeURIComponent("Hello, I would like to know more about your courses.");
  return (
    <a href={`https://wa.me/${settings.whatsapp}?text=${msg}`} target="_blank" rel="noreferrer"
      data-testid="floating-whatsapp-btn" aria-label="Chat on WhatsApp"
      className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-xl transition-transform hover:scale-110">
      <MessageCircle className="h-7 w-7" />
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#25D366] opacity-30" />
    </a>
  );
}
