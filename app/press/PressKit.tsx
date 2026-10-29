import Image from "next/image";
import type { Metadata } from "next";
import { baseUrl } from "app/sitemap";
import { isPending, profile } from "app/lib/profile";
import { articles } from "app/articles/articles";
import { ogImage, withDefaultOpenGraphImage, withDefaultTwitterImage } from "app/lib/seo";
import { CopyButton } from "app/components/CopyButton";

export type Lang = "en" | "pt";

const paths: Record<Lang, string> = { en: "/press", pt: "/press/pt-br" };

const bios = {
  en: {
    short:
      "Victor Bona is a Senior Software Engineer at Hopper and a distributed systems specialist. In 8 years he has built financial infrastructure at Amazon, Valari (YC W22) and Deel, founded and sold the Kubernetes platform Guara Cloud, and publishes independent research on observability and messaging systems. He is based in Blumenau, Brazil.",
    long: [
      "Victor Bona is a Senior Software Engineer at Hopper and a distributed systems specialist with 8 years of experience building software where correctness matters. At Amazon he worked on the Brazilian fintech team, building systems for the company's financial and regulatory obligations. As the first founding engineer at Valari (YC W22), a Latin American banking-as-a-service company, he designed its distributed architecture and rebuilt its ledger within one week after a third-party provider shut down. He later built payroll and HR features at Deel.",
      "In 2026 he founded Guara Cloud, a Kubernetes platform hosted in São Paulo and billed in reais, built it as its sole engineer and sold it the same year. He maintains open-source Rust projects, including the Nidus backend framework and the E-Navigator eBPF agent, and publishes reproducible research on distributed tracing and message brokers, with DOI-registered preprints on Zenodo. He is based in Blumenau, Brazil, and gives interviews in Portuguese and English.",
    ],
  },
  pt: {
    short:
      "Victor Bona é Engenheiro de Software Sênior na Hopper e especialista em sistemas distribuídos. Em 8 anos de carreira, construiu infraestrutura financeira na Amazon, na Valari (YC W22) e na Deel, fundou e vendeu a plataforma Kubernetes Guara Cloud e publica pesquisas independentes sobre observabilidade e sistemas de mensageria. Vive em Blumenau, Santa Catarina.",
    long: [
      "Victor Bona é Engenheiro de Software Sênior na Hopper e especialista em sistemas distribuídos, com 8 anos de experiência construindo software em que a correção é inegociável. Na Amazon, integrou o time de fintech no Brasil, desenvolvendo sistemas para as obrigações financeiras e regulatórias da empresa. Como primeiro engenheiro fundador da Valari (YC W22), empresa latino-americana de banking-as-a-service, desenhou a arquitetura distribuída e reconstruiu o ledger da empresa em uma semana após o encerramento de um fornecedor. Depois, desenvolveu funcionalidades de folha de pagamento e RH na Deel.",
      "Em 2026, fundou a Guara Cloud, plataforma Kubernetes hospedada em São Paulo e cobrada em reais, construiu-a como único engenheiro e a vendeu no mesmo ano. Mantém projetos open source em Rust, como o framework backend Nidus e o agente eBPF E-Navigator, e publica pesquisas reprodutíveis sobre rastreamento distribuído e brokers de mensagens, com preprints registrados com DOI no Zenodo. Vive em Blumenau (SC) e concede entrevistas em português e inglês.",
    ],
  },
};

const copy = {
  en: {
    title: "Press kit",
    lede: "Everything needed to introduce, interview or feature Victor Bona. Bios are written in third person and can be used as is.",
    switchLabel: "Português",
    facts: [
      ["Role", `Senior Software Engineer, ${profile.worksFor}`],
      ["Focus", "Distributed systems, observability, financial infrastructure"],
      ["Experience", `${profile.yearsExperience} years · Amazon, Valari (YC W22), Deel, Hopper`],
      ["Based in", "Blumenau, Brazil (UTC−3)"],
      ["Interviews in", "Portuguese, English"],
    ],
    sections: {
      bio: "Biography",
      photos: "Photos",
      expertise: "Expertise",
      topics: "Suggested interview topics",
      results: "Verifiable results",
      publications: "Publications",
      talks: "Presentations",
      contact: "Invitations and contact",
    },
    shortBio: "Short bio",
    longBio: "Long bio",
    otherLang: "Também em português",
    copyLabel: "copy",
    copied: "copied",
    photoNote: "Square headshot, 768 × 768 px, WebP. Free to use with credit to Victor Bona.",
    photoDownload: "Download headshot",
    photoPending: "higher-resolution originals (print quality) available on request",
    talksPending: "no recorded talks listed yet",
    formats: "Available for podcasts, interviews, talks and panels, in Portuguese or English.",
    evidence: "evidence",
    contactCta: "Send an invitation",
    contactSubject: "Invitation: ",
    status: { preprint: "preprint", published: "published", draft: "draft", "independently published": "independently published" },
    expertise: [
      ["Distributed systems and messaging", "Delivery guarantees, recovery, event-driven architecture."],
      ["Observability", "Tracing, sampling costs, eBPF, telemetry storage."],
      ["Financial infrastructure", "Ledgers, banking-as-a-service, payroll."],
      ["Platform engineering", "Kubernetes, GitOps, running a PaaS end to end."],
      ["Systems programming in Rust", "Frameworks, storage engines, kernel-side agents."],
      ["Reproducible engineering research", "Benchmarks with published raw data, negative results included."],
    ],
    topics: [
      ["Rebuilding a bank ledger in one week", "What happens when a fintech loses the provider behind its money, and how to rebuild the source of truth under pressure."],
      ["Building and selling a cloud platform alone", "A Brazilian PaaS from first commit to sale in eight months, with one engineer and real paying tenants."],
      ["What “acknowledged” really means", "Measured differences between Redis Streams and NATS JetStream, and why durability claims need evidence."],
      ["The real cost of observability", "When trace sampling saves money, when it costs more, and how to decide before picking a rate."],
      ["From southern Brazil to global tech", "A career across Amazon, a YC startup, Deel and Hopper, built from Blumenau."],
      ["Engineering that publishes its losses", "Shipping open source with proof reports, failed benchmarks and non-claims next to the wins."],
    ],
    results: [
      ["Founded, built and sold Guara Cloud", "Sole engineer; in production from March 2026, sold the same year; 9 worker nodes and 58 tenant namespaces.", "/projects/guara-cloud"],
      ["Rebuilt Valari's ledger in one week", "After a third-party provider shut down, as founding engineer at a YC W22 fintech.", profile.links.linkedin],
      ["Nidus: 25 crates, 20 releases", "Rust backend framework; every release verified on crates.io; 647 tests passing at 1.2.0.", "/projects/nidus"],
      ["E-Navigator: 1,148 ms to 0.46 ms", "Median first-signal latency for new Kubernetes Pods, over five counterbalanced runs.", "/projects/e-navigator"],
      ["Peer-checkable research", "DOI-registered preprints with raw data, analysis code and Lean 4 proofs published.", "/articles"],
    ],
  },
  pt: {
    title: "Kit de imprensa",
    lede: "Tudo o que é preciso para apresentar, entrevistar ou citar Victor Bona. As biografias estão em terceira pessoa e podem ser usadas sem edição.",
    switchLabel: "English",
    facts: [
      ["Cargo", `Engenheiro de Software Sênior, ${profile.worksFor}`],
      ["Foco", "Sistemas distribuídos, observabilidade, infraestrutura financeira"],
      ["Experiência", `${profile.yearsExperience} anos · Amazon, Valari (YC W22), Deel, Hopper`],
      ["Base", "Blumenau, SC (UTC−3)"],
      ["Entrevistas em", "Português, inglês"],
    ],
    sections: {
      bio: "Biografia",
      photos: "Fotos",
      expertise: "Áreas de atuação",
      topics: "Pautas sugeridas",
      results: "Resultados verificáveis",
      publications: "Publicações",
      talks: "Palestras",
      contact: "Convites e contato",
    },
    shortBio: "Bio curta",
    longBio: "Bio longa",
    otherLang: "Also in English",
    copyLabel: "copiar",
    copied: "copiado",
    photoNote: "Retrato quadrado, 768 × 768 px, WebP. Uso livre com crédito a Victor Bona.",
    photoDownload: "Baixar foto",
    photoPending: "originais em alta resolução (qualidade de impressão) sob pedido",
    talksPending: "nenhuma palestra gravada listada ainda",
    formats: "Disponível para podcasts, entrevistas, palestras e painéis, em português ou inglês.",
    evidence: "evidência",
    contactCta: "Enviar convite",
    contactSubject: "Convite: ",
    status: { preprint: "preprint", published: "publicado", draft: "rascunho", "independently published": "publicação independente" },
    expertise: [
      ["Sistemas distribuídos e mensageria", "Garantias de entrega, recuperação, arquitetura orientada a eventos."],
      ["Observabilidade", "Tracing, custo de amostragem, eBPF, armazenamento de telemetria."],
      ["Infraestrutura financeira", "Ledgers, banking-as-a-service, folha de pagamento."],
      ["Engenharia de plataforma", "Kubernetes, GitOps, operação de um PaaS de ponta a ponta."],
      ["Programação de sistemas em Rust", "Frameworks, motores de armazenamento, agentes no kernel."],
      ["Pesquisa reprodutível em engenharia", "Benchmarks com dados brutos publicados, inclusive resultados negativos."],
    ],
    topics: [
      ["Reconstruir o ledger de um banco em uma semana", "O que acontece quando uma fintech perde o fornecedor por trás do dinheiro, e como reconstruir a fonte da verdade sob pressão."],
      ["Construir e vender uma plataforma de nuvem sozinho", "Um PaaS brasileiro do primeiro commit à venda em oito meses, com um engenheiro e clientes pagantes."],
      ["O que “confirmado” realmente significa", "Diferenças medidas entre Redis Streams e NATS JetStream, e por que promessas de durabilidade exigem evidência."],
      ["O custo real da observabilidade", "Quando a amostragem de traces economiza, quando custa mais, e como decidir antes de escolher uma taxa."],
      ["Do interior de Santa Catarina para a tecnologia global", "Uma carreira entre Amazon, uma startup da YC, Deel e Hopper, construída a partir de Blumenau."],
      ["Engenharia que publica seus erros", "Open source com relatórios de prova, benchmarks que falharam e limites declarados ao lado das conquistas."],
    ],
    results: [
      ["Fundou, construiu e vendeu a Guara Cloud", "Único engenheiro; em produção desde março de 2026, vendida no mesmo ano; 9 nós e 58 namespaces de clientes.", "/projects/guara-cloud"],
      ["Reconstruiu o ledger da Valari em uma semana", "Após o encerramento de um fornecedor, como engenheiro fundador de uma fintech YC W22.", profile.links.linkedin],
      ["Nidus: 25 crates, 20 releases", "Framework backend em Rust; cada release verificada no crates.io; 647 testes passando na 1.2.0.", "/projects/nidus"],
      ["E-Navigator: de 1.148 ms para 0,46 ms", "Latência mediana do primeiro sinal para novos Pods Kubernetes, em cinco execuções balanceadas.", "/projects/e-navigator"],
      ["Pesquisa verificável", "Preprints com DOI, dados brutos, código de análise e provas em Lean 4 publicados.", "/articles"],
    ],
  },
} as const;

export function pressMetadata(lang: Lang): Metadata {
  const c = copy[lang];
  const url = `${baseUrl}${paths[lang]}`;
  const title = `${c.title} - Victor Bona`;
  return {
    title: c.title,
    description: bios[lang].short,
    alternates: { canonical: url, languages: { en: `${baseUrl}${paths.en}`, "pt-BR": `${baseUrl}${paths.pt}` } },
    openGraph: withDefaultOpenGraphImage({
      title,
      description: bios[lang].short,
      url,
      type: "profile",
      locale: lang === "pt" ? "pt_BR" : "en_US",
      images: [ogImage(c.title, "press --kit")],
    }),
    twitter: withDefaultTwitterImage({ card: "summary_large_image", title, description: bios[lang].short, images: [ogImage(c.title, "press --kit")] }),
  };
}

const linkClass = "text-[var(--text)] decoration-[var(--lit)] decoration-1 underline-offset-4 hover:underline";
const meta = "font-mono text-xs tabular-nums text-[var(--dim)] sm:text-sm";

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id}>
      <h2 id={id} className="mb-5 cmd">
        <span aria-hidden="true">$ </span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function Bio({ heading, text, copyText, c, lang }: { heading: string; text: readonly string[]; copyText: string; c: (typeof copy)[Lang]; lang: Lang }) {
  return (
    <div lang={lang === "pt" ? "pt-BR" : "en"} className="border-t border-[var(--line)] py-5">
      <div className="mb-3 flex items-baseline justify-between gap-4">
        <h3 className={meta}>{heading}</h3>
        <CopyButton text={copyText} label={c.copyLabel} done={c.copied} />
      </div>
      <div className="max-w-[var(--measure)] space-y-4 text-[var(--text)]">
        {text.map((p) => (
          <p key={p.slice(0, 24)}>{p}</p>
        ))}
      </div>
    </div>
  );
}

export function PressKit({ lang }: { lang: Lang }) {
  const c = copy[lang];
  const other: Lang = lang === "en" ? "pt" : "en";
  const papers = [...articles].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  const subject = encodeURIComponent(c.contactSubject);

  return (
    <div lang={lang === "pt" ? "pt-BR" : "en"} className="space-y-16">
      <header className="grid items-end gap-8 border-b border-[var(--line)] pb-10 sm:grid-cols-[1fr_auto]">
        <div className="min-w-0">
          <p className="font-mono text-sm text-[var(--dim)]">
            <a href={paths[other]} hrefLang={other === "pt" ? "pt-BR" : "en"} className={`${linkClass} text-[var(--lit)]`}>
              {c.switchLabel}
            </a>
          </p>
          <h1 className="mt-4 text-[clamp(2.2rem,5vw,3.5rem)] font-semibold leading-[1.02] tracking-[-0.03em] text-[var(--text)]">
            {profile.name} <span className="text-[var(--dim)]">· {c.title}</span>
          </h1>
          <p className="mt-4 max-w-[60ch] text-[var(--dim)]">{c.lede}</p>
        </div>
        <a href={`mailto:${profile.email}?subject=${subject}`} className="justify-self-start border border-[var(--lit)] px-5 py-3 font-mono font-semibold text-[var(--lit)] transition-colors duration-150 hover:bg-[var(--lit)] hover:text-black">
          {c.contactCta}
        </a>
      </header>

      <dl className="grid max-w-3xl grid-cols-1 gap-x-10 border border-[var(--line)] bg-[var(--panel)] px-5 py-4 text-sm leading-7 sm:grid-cols-[auto_1fr] sm:px-6">
        {c.facts.map(([k, v]) => (
          <div key={k} className="contents">
            <dt className="font-mono text-[var(--dim)]">{k}</dt>
            <dd className="mb-2 text-[var(--text)] sm:mb-0">{v}</dd>
          </div>
        ))}
      </dl>

      <Section id="bio" title={c.sections.bio}>
        <Bio heading={c.shortBio} text={[bios[lang].short]} copyText={bios[lang].short} c={c} lang={lang} />
        <Bio heading={c.longBio} text={bios[lang].long} copyText={bios[lang].long.join("\n\n")} c={c} lang={lang} />
        <details className="border-t border-[var(--line)] py-5">
          <summary className={`cursor-pointer ${meta} hover:text-[var(--text)]`}>{c.otherLang}</summary>
          <Bio heading={copy[other].shortBio} text={[bios[other].short]} copyText={bios[other].short} c={copy[other]} lang={other} />
          <Bio heading={copy[other].longBio} text={bios[other].long} copyText={bios[other].long.join("\n\n")} c={copy[other]} lang={other} />
        </details>
      </Section>

      <Section id="photos" title={c.sections.photos}>
        {profile.headshot && (
          <figure className="grid items-end gap-6 sm:grid-cols-[14rem_1fr]">
            <div className="relative aspect-square w-56 overflow-hidden border border-[var(--line-strong)]">
              <Image src={profile.headshot} alt={profile.name} fill sizes="14rem" className="object-cover" />
            </div>
            <figcaption className="space-y-3">
              <p className="text-[var(--dim)]">{c.photoNote}</p>
              <a href={profile.headshot} download="victor-bona-headshot.webp" className={`font-mono ${linkClass}`}>
                {c.photoDownload} ↓
              </a>
              <p className={meta}>
                <span className="text-[var(--warn)]">[pending]</span> {c.photoPending}
              </p>
            </figcaption>
          </figure>
        )}
      </Section>

      <Section id="expertise" title={c.sections.expertise}>
        <ul className="grid gap-x-8 sm:grid-cols-2">
          {c.expertise.map(([name, detail]) => (
            <li key={name} className="border-t border-[var(--line)] py-4">
              <p className="font-semibold text-[var(--text)]">{name}</p>
              <p className="mt-1 text-[var(--dim)]">{detail}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="topics" title={c.sections.topics}>
        <ol className="border-b border-[var(--line)]">
          {c.topics.map(([name, hook], i) => (
            <li key={name} className="grid grid-cols-[2.5rem_minmax(0,1fr)] border-t border-[var(--line)] py-4">
              <span className="pt-0.5 font-mono text-sm tabular-nums text-[var(--lit)]">{String(i + 1).padStart(2, "0")}</span>
              <div>
                <p className="text-lg font-semibold leading-snug text-[var(--text)]">{name}</p>
                <p className="mt-1 max-w-[var(--measure)] text-[var(--dim)]">{hook}</p>
              </div>
            </li>
          ))}
        </ol>
      </Section>

      <Section id="results" title={c.sections.results}>
        <ul className="border-b border-[var(--line)]">
          {c.results.map(([name, detail, href]) => (
            <li key={name} className="grid gap-1 border-t border-[var(--line)] py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-6">
              <div>
                <p className="font-semibold text-[var(--text)]">{name}</p>
                <p className="mt-1 max-w-[var(--measure)] text-[var(--dim)]">{detail}</p>
              </div>
              <a href={href} className={`${meta} hover:text-[var(--text)] hover:underline`} {...(href.startsWith("http") && { target: "_blank", rel: "noopener noreferrer" })}>
                {c.evidence} →
              </a>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="publications" title={c.sections.publications}>
        <ul className="border-b border-[var(--line)]">
          {papers.map((a) => (
            <li key={a.slug} className="border-t border-[var(--line)] py-3">
              <a href={`/articles/${a.slug}`} lang="en" className={linkClass}>
                {a.title}
              </a>
              <p className={`mt-1 ${meta}`}>
                {a.publishedAt.slice(0, 4)} · {c.status[a.status]}
                {a.doi && (
                  <>
                    {" · "}
                    <a href={`https://doi.org/${a.doi}`} target="_blank" rel="noopener noreferrer" className="break-all hover:text-[var(--text)] hover:underline">
                      doi:{a.doi}
                    </a>
                  </>
                )}
              </p>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="talks" title={c.sections.talks}>
        {isPending(profile.talks) ? (
          <p className={meta}>
            <span className="text-[var(--warn)]">[pending]</span> {c.talksPending}
          </p>
        ) : (
          <ul>
            {profile.talks.map((t) => (
              <li key={t.title} className="border-t border-[var(--line)] py-3">
                {t.url ? <a href={t.url} className={linkClass}>{t.title}</a> : t.title}
                <p className={`mt-1 ${meta}`}>{t.venue} · {t.date}</p>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-4 text-[var(--dim)]">{c.formats}</p>
      </Section>

      <Section id="contact" title={c.sections.contact}>
        <dl className="grid max-w-xl grid-cols-[auto_1fr] gap-x-10 font-mono text-sm leading-8">
          <dt className="text-[var(--dim)]">email</dt>
          <dd className="min-w-0 truncate">
            <a href={`mailto:${profile.email}?subject=${subject}`} className={linkClass}>{profile.email}</a>
          </dd>
          <dt className="text-[var(--dim)]">linkedin</dt>
          <dd className="min-w-0 truncate">
            <a href={profile.links.linkedin} target="_blank" rel="noopener noreferrer" className={linkClass}>in/victorbona</a>
          </dd>
          <dt className="text-[var(--dim)]">x</dt>
          <dd>
            <a href={profile.links.x} target="_blank" rel="noopener noreferrer" className={linkClass}>@BonaVictor</a>
          </dd>
          <dt className="text-[var(--dim)]">timezone</dt>
          <dd className="text-[var(--text)]">America/Sao_Paulo (UTC−3)</dd>
        </dl>
      </Section>
    </div>
  );
}
