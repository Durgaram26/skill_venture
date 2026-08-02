import logoOnly from '../assets/illustrations/logo_only.png';

export function BrandWordmark({ compact = false, onDark = false }: { compact?: boolean; onDark?: boolean }) {
  return (
    <span className={`sv-wordmark ${compact ? 'sv-wordmark--compact' : ''}`}>
      <span className="sv-wordmark-name">
        <img src={logoOnly} alt="" className="sv-brand-mark" />
        <span className={onDark ? 'sv-wordmark-skill sv-wordmark-skill--dark' : 'sv-wordmark-skill'}>Skill</span>
        <span className="sv-wordmark-ventures">Ventures</span>
      </span>
      {!compact ? (
        <span className="sv-wordmark-tagline">
          <i /> LEARN <b>•</b> GROW <b>•</b> SUCCEED <i />
        </span>
      ) : null}
    </span>
  );
}
