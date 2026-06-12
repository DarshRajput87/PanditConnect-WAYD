import Link from 'next/link'

export interface LegalSection {
  id: string
  title: string
  body: React.ReactNode
}

interface Props {
  badge: string
  title: string
  lastUpdated: string
  intro: string
  sections: LegalSection[]
}

// Shared shell for the Terms / Privacy pages: header band, sticky table of
// contents on desktop, numbered sections with anchor targets.
export function LegalArticle({ badge, title, lastUpdated, intro, sections }: Props) {
  return (
    <>
      <section className="border-b border-neutral-100 bg-neutral-50 py-16">
        <div className="mx-auto max-w-7xl px-4">
          <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-orange-500">{badge}</p>
          <h1 className="mb-3 text-3xl font-bold text-neutral-900 md:text-4xl">{title}</h1>
          <p className="mb-4 max-w-2xl text-neutral-500">{intro}</p>
          <p className="text-sm text-neutral-400">Last updated: {lastUpdated}</p>
        </div>
      </section>

      <section className="bg-white py-12">
        <div className="mx-auto flex max-w-7xl gap-12 px-4">
          {/* Table of contents */}
          <nav className="hidden w-64 flex-shrink-0 lg:block" aria-label="Table of contents">
            <div className="sticky top-20 space-y-1 rounded-2xl border border-neutral-100 p-4">
              <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">
                On this page
              </p>
              {sections.map((section, i) => (
                <Link
                  key={section.id}
                  href={`#${section.id}`}
                  className="block rounded-lg px-2 py-1.5 text-sm text-neutral-500 transition-colors hover:bg-orange-50 hover:text-orange-600"
                >
                  {i + 1}. {section.title}
                </Link>
              ))}
            </div>
          </nav>

          {/* Body */}
          <article className="min-w-0 max-w-3xl flex-1 space-y-10">
            {sections.map((section, i) => (
              <section key={section.id} id={section.id} className="scroll-mt-24">
                <h2 className="mb-3 text-xl font-semibold text-neutral-900">
                  {i + 1}. {section.title}
                </h2>
                <div className="space-y-3 text-sm leading-relaxed text-neutral-600 [&_li]:ml-5 [&_li]:list-disc [&_strong]:font-semibold [&_strong]:text-neutral-800 [&_ul]:space-y-1.5">
                  {section.body}
                </div>
              </section>
            ))}
          </article>
        </div>
      </section>
    </>
  )
}
