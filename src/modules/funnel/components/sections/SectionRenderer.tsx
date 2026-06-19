import Image from 'next/image';
import type {
  FunnelSection, FunnelTheme,
  HeroSection, PainSection, BenefitsSection,
  TestimonialSection, FormSection, FAQSection,
  MechanismSection, CTASection,
} from '../../types';

type Props = { section: FunnelSection; theme: FunnelTheme; onCtaClick?: () => void };

function HeroRender({ s, theme, onCtaClick }: { s: HeroSection; theme: FunnelTheme; onCtaClick?: () => void }) {
  const ctaClassName = 'mt-6 inline-block rounded-full px-6 py-3 text-sm font-semibold text-white';
  const ctaStyle = { backgroundColor: theme.primary_color };

  return (
    <div className="py-12 px-6 text-center" style={{ backgroundColor: theme.bg_color }}>
      {s.image_url && (
        <div className="relative mx-auto mb-6 h-40 w-full overflow-hidden rounded-lg">
          <Image src={s.image_url} alt="" fill unoptimized sizes="(max-width: 640px) 100vw, 640px" className="object-cover" />
        </div>
      )}
      <h1 className="text-2xl font-bold leading-tight" style={{ color: '#111827' }}>{s.headline}</h1>
      <p className="mt-3 text-base text-gray-500">{s.subheadline}</p>
      {onCtaClick ? (
        <button type="button" onClick={onCtaClick} className={ctaClassName} style={ctaStyle}>
          {s.cta_text}
        </button>
      ) : (
        <div className={ctaClassName} style={ctaStyle}>
          {s.cta_text}
        </div>
      )}
    </div>
  );
}

function PainRender({ s }: { s: PainSection }) {
  return (
    <div className="px-6 py-10">
      <h2 className="text-xl font-bold text-center text-gray-900">{s.title}</h2>
      <ul className="mt-4 space-y-3">
        {s.items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
            <span className="text-red-400 mt-0.5">✗</span> {item.text}
          </li>
        ))}
      </ul>
    </div>
  );
}

function BenefitsRender({ s, theme }: { s: BenefitsSection; theme: FunnelTheme }) {
  return (
    <div className="px-6 py-10 bg-gray-50">
      <h2 className="text-xl font-bold text-center text-gray-900">{s.title}</h2>
      <div className="mt-6 grid grid-cols-1 gap-4">
        {s.items.map((item, i) => (
          <div key={i} className="flex items-start gap-3">
            <div className="h-10 w-10 shrink-0 rounded-full flex items-center justify-center text-white text-sm font-bold"
              style={{ backgroundColor: theme.primary_color }}>
              {item.icon.slice(0, 1).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-gray-900">{item.title}</p>
              <p className="text-sm text-gray-500">{item.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TestimonialRender({ s }: { s: TestimonialSection }) {
  return (
    <div className="px-6 py-10">
      {s.title && <h2 className="text-xl font-bold text-center text-gray-900 mb-6">{s.title}</h2>}
      {s.items.length === 0 ? (
        <p className="text-center text-sm text-gray-400 italic">还没有评价</p>
      ) : (
        <div className="space-y-4">
          {s.items.map((item, i) => (
            <div key={i} className="rounded-lg bg-gray-50 p-4">
              <p className="text-sm text-gray-700 italic">&ldquo;{item.text}&rdquo;</p>
              <p className="mt-2 text-xs font-semibold text-gray-900">— {item.name}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FormRender({ s, theme }: { s: FormSection; theme: FunnelTheme }) {
  const labels: Record<string, string> = { name: '姓名', phone: '电话', email: '电子邮件', whatsapp: 'WhatsApp' };
  return (
    <div className="px-6 py-10">
      {s.title && <h2 className="text-xl font-bold text-center text-gray-900 mb-4">{s.title}</h2>}
      <div className="space-y-3">
        {s.fields.map((f) => (
          <input key={f} placeholder={labels[f] ?? f}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm" readOnly />
        ))}
      </div>
      <div className="mt-4 w-full rounded-full py-3 text-center text-sm font-semibold text-white"
        style={{ backgroundColor: theme.primary_color }}>
        {s.submit_text}
      </div>
    </div>
  );
}

function FAQRender({ s }: { s: FAQSection }) {
  return (
    <div className="px-6 py-10">
      <h2 className="text-xl font-bold text-center text-gray-900">{s.title}</h2>
      <div className="mt-6 space-y-4">
        {s.items.map((item, i) => (
          <div key={i} className="rounded-lg border border-gray-200 p-4">
            <p className="font-semibold text-gray-900 text-sm">{item.question}</p>
            <p className="mt-2 text-sm text-gray-500">{item.answer}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function MechanismRender({ s }: { s: MechanismSection }) {
  return (
    <div className="px-6 py-10 bg-gray-50">
      <h2 className="text-xl font-bold text-center text-gray-900">{s.title}</h2>
      {s.image_url && (
        <div className="relative mx-auto mt-4 h-40 w-full overflow-hidden rounded-lg">
          <Image src={s.image_url} alt="" fill unoptimized sizes="(max-width: 640px) 100vw, 640px" className="object-cover" />
        </div>
      )}
      <p className="mt-4 text-sm text-gray-600 text-center">{s.description}</p>
    </div>
  );
}

function CTARender({ s, theme, onCtaClick }: { s: CTASection; theme: FunnelTheme; onCtaClick?: () => void }) {
  const ctaClassName = 'mt-6 inline-block rounded-full bg-white px-6 py-3 text-sm font-semibold';
  const ctaStyle = { color: theme.primary_color };

  return (
    <div className="px-6 py-12 text-center" style={{ backgroundColor: theme.primary_color }}>
      <h2 className="text-xl font-bold text-white">{s.headline}</h2>
      {s.subheadline && <p className="mt-2 text-sm text-white/80">{s.subheadline}</p>}
      {onCtaClick ? (
        <button type="button" onClick={onCtaClick} className={ctaClassName} style={ctaStyle}>
          {s.button_text}
        </button>
      ) : (
        <div className={ctaClassName} style={ctaStyle}>
          {s.button_text}
        </div>
      )}
    </div>
  );
}

export function SectionRenderer({ section, theme, onCtaClick }: Props) {
  switch (section.type) {
    case 'hero': return <HeroRender s={section} theme={theme} onCtaClick={onCtaClick} />;
    case 'pain': return <PainRender s={section} />;
    case 'benefits': return <BenefitsRender s={section} theme={theme} />;
    case 'testimonial': return <TestimonialRender s={section} />;
    case 'form': return <FormRender s={section} theme={theme} />;
    case 'faq': return <FAQRender s={section} />;
    case 'mechanism': return <MechanismRender s={section} />;
    case 'cta': return <CTARender s={section} theme={theme} onCtaClick={onCtaClick} />;
    default: return null;
  }
}
