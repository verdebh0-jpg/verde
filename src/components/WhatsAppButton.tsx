"use client";

import { useLocale } from "./LocaleProvider";
import { WHATSAPP_LINK, WHATSAPP_NUMBER } from "@/lib/config";

export default function WhatsAppButton() {
  const { t } = useLocale();
  return (
    <a
      href={WHATSAPP_LINK}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="WhatsApp"
      className="fixed bottom-4 end-4 z-40 flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-3 text-white shadow-lg transition hover:scale-105"
    >
      <svg viewBox="0 0 32 32" className="h-6 w-6 fill-current" aria-hidden>
        <path d="M16.04 3C9.4 3 4 8.4 4 15.03c0 2.12.56 4.19 1.62 6L4 29l8.17-1.58a12 12 0 0 0 3.87.64C22.67 28.06 28 22.66 28 16.03 28 9.4 22.67 3 16.04 3Zm0 22.04c-1.2 0-2.38-.32-3.4-.93l-.24-.15-4.85.94.99-4.72-.16-.25a9.9 9.9 0 0 1-1.52-5.3c0-5.5 4.5-9.97 10.04-9.97 5.54 0 10.04 4.47 10.04 9.97 0 5.5-4.5 10.41-10.9 10.41Zm5.5-7.45c-.3-.15-1.8-.89-2.08-.99-.28-.1-.48-.15-.68.15-.2.3-.78.99-.96 1.19-.18.2-.35.22-.65.07-.3-.15-1.27-.47-2.42-1.5-.9-.8-1.5-1.78-1.68-2.08-.17-.3-.02-.46.13-.6.14-.13.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.68-1.64-.93-2.25-.24-.58-.5-.5-.68-.5h-.58c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.88 1.22 3.08.15.2 2.1 3.2 5.08 4.49.7.3 1.26.48 1.7.62.72.23 1.37.2 1.88.12.57-.08 1.8-.73 2.05-1.44.25-.7.25-1.31.18-1.44-.08-.12-.28-.2-.58-.35Z" />
      </svg>
      <span className="hidden text-sm font-semibold sm:inline" dir="ltr">
        {t("whatsapp")} · {WHATSAPP_NUMBER}
      </span>
    </a>
  );
}
