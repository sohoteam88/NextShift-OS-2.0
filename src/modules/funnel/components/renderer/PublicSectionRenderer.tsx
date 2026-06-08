import Image from 'next/image';
import type { FunnelSection, FunnelTheme } from '../../types';
import { PublicFormSection } from './PublicFormSection';
import { WhatsAppCTA } from './WhatsAppCTA';

type Context = {
  theme: FunnelTheme;
  funnelSlug: string;
  funnelId: string;
  funnelTitle: string;
  whatsappPhone?: string;
  quizResult?: { score: number; title: string };
};

type Props = { section: FunnelSection; ctx: Context };

const ICON_MAP: Record<string, string> = {
  heart: '❤️', target: '🎯', clock: '⏰', star: '⭐', shield: '🛡️', zap: '⚡', check: '✅', sparkles: '✨',
  book: '📚', 'shopping-cart': '🛒', default: '•',
};

export function PublicSectionRenderer({ section, ctx }: Props) {
  const { theme, funnelSlug, funnelId, funnelTitle, whatsappPhone } = ctx;
  const primary = theme.primary_color;

  switch (section.type) {
    case 'hero': {
      const onCta = section.cta_type === 'whatsapp' && (section.cta_target || whatsappPhone)
        ? undefined
        : undefined;
      void onCta;

      return (
        <div className="relative px-6 py-14 text-center" style={{ backgroundColor: primary + '12' }}>
          {section.image_url && (
            <div className="relative mx-auto mb-6 h-48 w-full overflow-hidden rounded-2xl">
              <Image src={section.image_url} alt="" fill unoptimized sizes="(max-width: 640px) 100vw, 640px" className="object-cover" />
            </div>
          )}
          <h1 className="text-2xl font-extrabold leading-tight tracking-tight text-gray-900">
            {section.headline}
          </h1>
          <p className="mt-3 text-base text-gray-600">{section.subheadline}</p>
          <div className="mt-7">
            {section.cta_type === 'whatsapp' ? (
              <WhatsAppCTA
                phone={section.cta_target || whatsappPhone || ''}
                label={section.cta_text}
                primaryColor={primary}
                funnelTitle={funnelTitle}
                slug={funnelSlug}
              />
            ) : (
              <a href={section.cta_type === 'form' ? '#form' : section.cta_target}
                className="inline-block rounded-full px-8 py-4 text-base font-bold text-white"
                style={{ backgroundColor: primary }}>
                {section.cta_text}
              </a>
            )}
          </div>
        </div>
      );
    }

    case 'pain':
      return (
        <div className="px-6 py-10">
          <h2 className="mb-6 text-xl font-bold text-gray-900">{section.title}</h2>
          <ul className="space-y-4">
            {section.items.map((item, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="mt-0.5 text-xl">😩</span>
                <span className="text-base text-gray-700">{item.text}</span>
              </li>
            ))}
          </ul>
        </div>
      );

    case 'benefits':
      return (
        <div className="px-6 py-10" style={{ backgroundColor: theme.bg_color }}>
          <h2 className="mb-7 text-center text-xl font-bold text-gray-900">{section.title}</h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            {section.items.map((item, i) => (
              <div key={i} className="rounded-2xl bg-white p-5 shadow-sm">
                <span className="text-3xl">{ICON_MAP[item.icon] ?? ICON_MAP.default}</span>
                <p className="mt-2 font-bold text-gray-900">{item.title}</p>
                <p className="mt-1 text-sm text-gray-500">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      );

    case 'testimonial':
      if (!section.items.length) return null;
      return (
        <div className="px-6 py-10 bg-gray-50">
          {section.title && <h2 className="mb-6 text-center text-xl font-bold text-gray-900">{section.title}</h2>}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {section.items.map((item, i) => (
              <div key={i} className="rounded-2xl bg-white p-5 shadow-sm">
                <p className="text-sm italic text-gray-700">&ldquo;{item.text}&rdquo;</p>
                <div className="mt-3 flex items-center gap-2">
                  {item.avatar_url
                    ? (
                      <div className="relative h-8 w-8 overflow-hidden rounded-full">
                        <Image src={item.avatar_url} alt={item.name} fill unoptimized sizes="32px" className="object-cover" />
                      </div>
                    )
                    : <div className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white" style={{ backgroundColor: primary }}>{item.name[0]}</div>
                  }
                  <span className="text-sm font-semibold text-gray-900">{item.name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      );

    case 'form':
      return (
        <div id="form">
          <PublicFormSection
            section={section}
            theme={theme}
            funnelSlug={funnelSlug}
            funnelId={funnelId}
            quizResult={ctx.quizResult}
          />
        </div>
      );

    case 'faq':
      return <PublicFAQAccordion section={section} />;

    case 'mechanism':
      return (
        <div className="px-6 py-10 bg-gray-50">
          <h2 className="mb-4 text-xl font-bold text-center text-gray-900">{section.title}</h2>
          {section.image_url && (
            <div className="relative mx-auto mb-4 h-48 w-full overflow-hidden rounded-2xl">
              <Image src={section.image_url} alt="" fill unoptimized sizes="(max-width: 640px) 100vw, 640px" className="object-cover" />
            </div>
          )}
          <p className="text-base text-gray-600 text-center">{section.description}</p>
        </div>
      );

    case 'cta':
      return (
        <div className="px-6 py-14 text-center" style={{ backgroundColor: primary }}>
          <h2 className="text-2xl font-extrabold text-white">{section.headline}</h2>
          {section.subheadline && <p className="mt-2 text-white/80">{section.subheadline}</p>}
          <div className="mt-7">
            {section.button_type === 'whatsapp' ? (
              <WhatsAppCTA
                phone={section.button_target || whatsappPhone || ''}
                label={section.button_text}
                primaryColor="#ffffff"
                funnelTitle={funnelTitle}
                slug={funnelSlug}
              />
            ) : (
              <a href={section.button_type === 'form' ? '#form' : section.button_target}
                className="inline-block rounded-full bg-white px-8 py-4 text-base font-bold"
                style={{ color: primary }}>
                {section.button_text}
              </a>
            )}
          </div>
        </div>
      );

    default:
      return null;
  }
}

function PublicFAQAccordion({ section }: { section: import('../../types').FAQSection }) {
  'use client';
  // Static accordion for SSR — uses CSS details/summary
  return (
    <div className="px-6 py-10">
      <h2 className="mb-6 text-xl font-bold text-gray-900">{section.title}</h2>
      <div className="space-y-3">
        {section.items.map((item, i) => (
          <details key={i} className="rounded-xl border border-gray-200 bg-white">
            <summary className="cursor-pointer list-none px-5 py-4 text-sm font-semibold text-gray-900 hover:bg-gray-50">
              {item.question}
            </summary>
            <p className="px-5 pb-4 text-sm text-gray-600">{item.answer}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
