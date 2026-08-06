import React from 'react';

const INFO_PAGES = [
  { href: '/privacy', label: 'Privacy' },
  { href: '/terms', label: 'Terms' },
  { href: '/help', label: 'Help' },
];

export function InfoPage({ active, icon, eyebrow, title, intro, lastUpdated, sections, children }) {
  return (
    <div className="min-h-screen bg-background text-on-background font-body-md relative overflow-hidden selection:bg-primary-container selection:text-on-primary">
      <div className="absolute inset-0 ambient-bg pointer-events-none" aria-hidden="true"></div>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-outline-variant/60 shadow-soft">
        <div className="w-full px-4 sm:px-6 md:px-12 h-16 flex md:grid md:grid-cols-[1fr_auto_1fr] items-center justify-between md:justify-items-stretch gap-2 sm:gap-4">
          <a href="/" aria-label="Being Us – home" className="flex items-center gap-1.5 min-w-0">
            <span className="material-symbols-outlined text-primary text-2xl fill-1 shrink-0">play_circle</span>
            <span className="font-display-lg text-lg sm:text-xl font-bold tracking-tight text-on-background truncate">Being Us.</span>
          </a>

          <nav aria-label="Information pages" className="hidden md:block justify-self-center">
            <ul className="flex items-center gap-8 font-label-lg">
              {INFO_PAGES.map((p) => (
                <li key={p.href}>
                  <a href={p.href}
                    aria-current={p.href === active ? 'page' : undefined}
                    className={`relative capitalize py-1 transition-colors after:absolute after:left-0 after:right-0 after:-bottom-0.5 after:h-0.5 after:rounded-full after:bg-primary after:transition-transform after:duration-300 after:ease-expo ${p.href === active ? 'text-primary after:scale-x-100' : 'text-on-surface-variant hover:text-primary after:scale-x-0'}`}>
                    {p.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex items-center justify-self-end shrink-0 min-w-0">
            <a href="/" className="btn btn-secondary px-4 py-2 text-sm">
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              <span className="hidden sm:inline">Back to Home</span>
            </a>
          </div>
        </div>
      </header>

      <main id="main-content" className="pt-24 sm:pt-28 pb-20 px-5 sm:px-8 md:px-16 max-w-5xl mx-auto relative z-10">
        {/* Hero */}
        <section className="mb-12 sm:mb-16 text-center animate-fade-in-up">
          <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full bg-error-container text-on-error-container font-label-sm mb-5 text-xs sm:text-sm">
            <span className="material-symbols-outlined text-[16px]">{icon}</span>
            {eyebrow}
          </div>
          <h1 className="font-display-lg text-4xl sm:text-5xl md:text-6xl leading-[1.1] mb-4 text-on-background text-balance">{title}</h1>
          <p className="font-body-lg text-on-surface-variant max-w-2xl mx-auto text-sm sm:text-base md:text-lg leading-relaxed">{intro}</p>
          {lastUpdated && (
            <p className="font-label-sm text-on-surface-variant mt-5 text-xs uppercase tracking-widest">Last updated · {lastUpdated}</p>
          )}
        </section>

        {/* TOC + Content */}
        {sections && sections.length > 0 && (
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
            <nav aria-label="On this page" className="hidden lg:block lg:w-60 shrink-0">
              <div className="sticky top-24 flex flex-col gap-1 border border-outline-variant rounded-2xl bg-surface-container-lowest p-4 shadow-soft">
                <span className="font-label-sm text-on-surface-variant uppercase tracking-widest mb-2">On this page</span>
                {sections.map((s) => (
                  <a key={s.id} href={`#${s.id}`}
                    className="font-body-md text-sm text-on-surface-variant hover:text-primary py-1.5 rounded-lg hover:bg-surface-container transition-colors">
                    {s.title}
                  </a>
                ))}
              </div>
            </nav>

            <div className="flex-1 min-w-0 flex flex-col gap-6">
              {sections.map((section) => (
                <section key={section.id} id={section.id} aria-labelledby={`${section.id}-title`}
                  className="card p-6 sm:p-8 scroll-mt-24">
                  <h2 id={`${section.id}-title`} className="font-headline-md text-2xl text-on-background mb-5 flex items-center gap-3">
                    <span className="w-10 h-10 rounded-xl bg-error-container text-primary flex items-center justify-center shrink-0 shadow-soft">
                      <span className="material-symbols-outlined text-[20px]">{section.icon}</span>
                    </span>
                    {section.title}
                  </h2>
                  <div className="flex flex-col gap-5">
                    {section.blocks.map((block, i) => (
                      <div key={i}>
                        {block.heading && (
                          <h3 className="font-title-md text-on-background mb-1.5">{block.heading}</h3>
                        )}
                        {block.paragraphs && block.paragraphs.map((p, j) => (
                          <p key={j} className="font-body-md text-on-surface-variant text-sm sm:text-base leading-relaxed mb-2 last:mb-0">{p}</p>
                        ))}
                        {block.list && (
                          <ul className="mt-2 space-y-2">
                            {block.list.map((li, k) => (
                              <li key={k} className="flex items-start gap-3 font-body-md text-on-surface-variant text-sm sm:text-base">
                                <span className="material-symbols-outlined text-primary text-[18px] fill-1 shrink-0 mt-0.5">check_circle</span>
                                <span>{li}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                        {block.qa && (
                          <div className="flex flex-col gap-4">
                            {block.qa.map((qa, q) => (
                              <div key={q} className="flex items-start gap-3 rounded-2xl bg-surface-container-lowest border border-outline-variant p-4 sm:p-5">
                                <span className="w-9 h-9 rounded-xl bg-error-container text-primary flex items-center justify-center shrink-0 mt-0.5">
                                  <span className="material-symbols-outlined text-[18px]">{qa.icon || 'help'}</span>
                                </span>
                                <div className="min-w-0">
                                  <h3 className="font-title-sm text-on-background mb-1">{qa.q}</h3>
                                  {Array.isArray(qa.a) ? (
                                    <ul className="space-y-1.5">
                                      {qa.a.map((a, aIdx) => (
                                        <li key={aIdx} className="font-body-md text-on-surface-variant text-sm leading-relaxed flex items-start gap-2">
                                          <span className="material-symbols-outlined text-[14px] text-primary mt-0.5 shrink-0">arrow_right</span>
                                          <span>{a}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  ) : (
                                    <p className="font-body-md text-on-surface-variant text-sm leading-relaxed">{qa.a}</p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </div>
        )}

        {/* Custom content (e.g. help contact card) */}
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-surface-container-lowest py-8 sm:py-12 border-t border-outline-variant relative z-10">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 md:px-16 flex flex-col md:flex-row justify-between items-center gap-4 sm:gap-6">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-xl sm:text-2xl fill-1">play_circle</span>
            <span className="font-display-lg text-lg sm:text-xl font-bold tracking-tight text-on-background">Being Us.</span>
          </div>
          <p className="font-body-sm text-on-surface-variant text-sm">© 2026 Being Us. All rights reserved.</p>
          <div className="flex gap-4 sm:gap-6">
            {INFO_PAGES.map((p) => (
              <a key={p.href} href={p.href}
                className={`text-on-surface-variant hover:text-primary transition-colors font-label-sm text-sm ${p.href === active ? 'text-primary' : ''}`}>
                {p.label}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
