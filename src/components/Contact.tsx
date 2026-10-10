'use client';

import { useLang } from '@/context/LangContext';

type Phone = { label: string; value: string };

// "+90 545 521 30 38" -> "905455213038" for wa.me links
function waHref(value: string): string {
  const digits = value.replace(/\D/g, '');
  return digits.startsWith('0') ? `90${digits.slice(1)}` : digits;
}

function Column({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-paper/20 pt-4">
      <p className="eyebrow-sm mb-4 text-paper/55">{label}</p>
      {children}
    </div>
  );
}

function Location({ label, address, phones }: { label: string; address: string; phones: Phone[] }) {
  // A location that has not been filled in yet (e.g. the atelier address) is
  // hidden outright rather than shown as an empty heading.
  const filled = phones.filter((p) => p.value.trim());
  if (!address.trim() && filled.length === 0) return null;

  return (
    <Column label={label}>
      {address.trim() && <p className="text-sm leading-relaxed text-paper/85">{address}</p>}
      <div className="mt-3 space-y-1">
        {filled.map((p, i) => (
          <p key={i} className="text-sm text-paper/85">
            <span className="text-paper/55">{p.label} </span>
            {p.value}
          </p>
        ))}
      </div>
    </Column>
  );
}

export default function Contact() {
  const { t } = useLang();

  return (
    <section id="contact" className="edge scroll-mt-24 bg-ink py-24 text-paper sm:py-32">
      <div className="mb-14 flex flex-wrap items-end justify-between gap-6 sm:mb-20">
        <h2 className="font-display text-4xl leading-none sm:text-6xl">{t.contact.heading}</h2>
        <p className="eyebrow-sm max-w-xs pb-1 text-paper/60">{t.contact.subheading}</p>
      </div>

      <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
        {t.contact.emailValues.some((e) => e.trim()) && (
          <Column label={t.contact.email}>
            <div className="space-y-1.5">
              {t.contact.emailValues
                .filter((e) => e.trim())
                .map((e) => (
                  <a key={e} href={`mailto:${e}`} className="wipe draw block w-fit text-sm text-paper/85 transition-colors hover:text-paper">
                    {e}
                  </a>
                ))}
            </div>
          </Column>
        )}

        <Location label={t.contact.store.label} address={t.contact.store.address} phones={t.contact.store.phones} />
        <Location label={t.contact.factory.label} address={t.contact.factory.address} phones={t.contact.factory.phones} />

        {t.contact.messaging.value.trim() && (
          <Column label={t.contact.messaging.label}>
            <a
              href={`https://wa.me/${waHref(t.contact.messaging.value)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="wipe draw block w-fit text-sm text-paper/85 transition-colors hover:text-paper"
            >
              {t.contact.messaging.value}
            </a>
          </Column>
        )}
      </div>
    </section>
  );
}
