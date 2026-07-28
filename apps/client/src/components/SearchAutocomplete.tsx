import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { ListingSummary } from '@skillventures/shared-types';
import { api } from '../lib/api';

function IconSearch(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden className={props.className}>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" strokeLinecap="round" />
    </svg>
  );
}

type InstitutionHit = {
  id: string;
  name: string;
  city: string;
  state: string;
  verificationStatus: string;
};

type SearchAutocompleteProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
  placeholder?: string;
  inputId?: string;
  className?: string;
  dark?: boolean;
  showSubmitButton?: boolean;
};

export function SearchAutocomplete({
  value,
  onChange,
  onSubmit,
  placeholder = 'Search courses, bootcamps, institutions…',
  inputId,
  className,
  dark,
  showSubmitButton = false,
}: SearchAutocompleteProps) {
  const navigate = useNavigate();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [programs, setPrograms] = useState<ListingSummary[]>([]);
  const [institutions, setInstitutions] = useState<InstitutionHit[]>([]);

  useEffect(() => {
    if (!open || value.trim().length < 1) {
      setSuggestions([]);
      setPrograms([]);
      setInstitutions([]);
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(() => {
      setLoading(true);
      void api
        .suggestSearch(value)
        .then((data) => {
          if (cancelled) return;
          setSuggestions(data.suggestions);
          setPrograms(data.programs);
          setInstitutions(data.institutions ?? []);
        })
        .catch(() => {
          if (!cancelled) {
            setSuggestions([]);
            setPrograms([]);
            setInstitutions([]);
          }
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 220);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [value, open]);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, []);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setOpen(false);
    onSubmit(value.trim());
  }

  function pickSuggestion(term: string) {
    onChange(term);
    setOpen(false);
    onSubmit(term);
  }

  function pickProgram(slug: string) {
    setOpen(false);
    navigate(`/listings/${slug}`);
  }

  function pickInstitution(id: string) {
    setOpen(false);
    navigate(`/institutions/${id}`);
  }

  const showPanel =
    open &&
    value.trim().length >= 1 &&
    (loading || suggestions.length > 0 || programs.length > 0 || institutions.length > 0);

  return (
    <div ref={rootRef} className={`sv-search-autocomplete ${className ?? ''}`}>
      <form onSubmit={handleSubmit} className="sv-header-search">
        <span className="sv-header-search-icon">
          <IconSearch />
        </span>
        <input
          id={inputId}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          aria-label="Search programs and institutions"
          aria-expanded={showPanel}
          aria-autocomplete="list"
          autoComplete="off"
        />
        {showSubmitButton ? (
          <button type="submit" className="sv-search-submit">
            <span>Search</span>
          </button>
        ) : null}
      </form>

      {showPanel ? (
        <div className={`sv-search-dropdown ${dark ? 'sv-search-dropdown--dark' : ''}`} role="listbox">
          {loading &&
          suggestions.length === 0 &&
          programs.length === 0 &&
          institutions.length === 0 ? (
            <p className="sv-search-dropdown-empty">Searching…</p>
          ) : null}

          {institutions.length > 0 ? (
            <div className="sv-search-dropdown-section">
              <p className="sv-search-dropdown-label">Institutions</p>
              {institutions.map((inst) => (
                <button
                  key={inst.id}
                  type="button"
                  className="sv-search-suggestion"
                  role="option"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => pickInstitution(inst.id)}
                >
                  <span className="sv-search-inst-mark" aria-hidden>
                    {inst.name.slice(0, 1)}
                  </span>
                  <span className="min-w-0 text-left">
                    <span className="block truncate font-semibold">{inst.name}</span>
                    <span className="block truncate text-xs text-mute">
                      {inst.city}
                      {inst.state ? `, ${inst.state}` : ''}
                      {inst.verificationStatus === 'verified' ? ' · Verified' : ''}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          ) : null}

          {suggestions.length > 0 ? (
            <div className="sv-search-dropdown-section">
              <p className="sv-search-dropdown-label">Suggestions</p>
              {suggestions.map((term) => (
                <button
                  key={term}
                  type="button"
                  className="sv-search-suggestion"
                  role="option"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => pickSuggestion(term)}
                >
                  <IconSearch className="h-4 w-4 shrink-0 opacity-50" />
                  <span>{term}</span>
                </button>
              ))}
            </div>
          ) : null}

          {programs.length > 0 ? (
            <div className="sv-search-dropdown-section sv-search-dropdown-programs">
              <p className="sv-search-dropdown-label">Programs</p>
              {programs.map((program) => {
                const cover = program.images?.[0];
                return (
                  <button
                    key={program.id}
                    type="button"
                    className="sv-search-program"
                    role="option"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => pickProgram(program.slug)}
                  >
                    {cover ? (
                      <img src={cover} alt="" className="sv-search-program-thumb" />
                    ) : (
                      <span className="sv-search-program-thumb sv-search-program-thumb--placeholder" />
                    )}
                    <span className="min-w-0 text-left">
                      <span className="block truncate font-semibold text-ink">{program.title}</span>
                      <span className="block truncate text-xs text-mute">
                        {program.type} · {program.category}
                      </span>
                    </span>
                  </button>
                );
              })}
              <Link
                to={`/listings?q=${encodeURIComponent(value.trim())}`}
                className="sv-search-see-all"
                onClick={() => setOpen(false)}
              >
                See all results for “{value.trim()}”
              </Link>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
