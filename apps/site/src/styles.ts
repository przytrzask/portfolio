const zoneGap = "gap-6 md:gap-[40vh]";

const focusRing =
  "outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue";

export const pageWork =
  "relative flex flex-col gap-6 overflow-x-clip pb-16 pt-6 font-sans text-ink md:gap-[8vh] md:pb-[20vh] md:pt-[4vh]";

export const runGroup = "group/run";

export const page = `${runGroup} relative isolate flex flex-col overflow-x-clip pb-16 pt-6 font-sans text-ink md:pb-[40vh] md:pt-0 ${zoneGap}`;

export const zoneStack = `flex list-none flex-col p-0 ${zoneGap}`;

export type Side = "left" | "right";

export type ZoneSize = "tall" | "fit";

const zoneBase = "flex items-center justify-center px-4 md:px-[6vw]";

const zoneHeight: Readonly<Record<ZoneSize, string>> = {
  fit: "md:py-[6vh]",
  tall: "md:min-h-[92vh]",
};

export const zone = (side: Side, size: ZoneSize): string =>
  `${zoneBase} ${zoneHeight[size]} ${side === "left" ? "md:justify-start" : "md:justify-end"}`;

const panelBase =
  "w-full rounded-[18px] border-2 border-ink bg-white/95 p-[22px] shadow-hard md:p-8";

export const panel = `${panelBase} md:w-[min(560px,52vw)]`;

export const panelWide = `${panelBase} md:w-[min(760px,72vw)]`;

export const label =
  "flex flex-wrap items-center gap-2 font-mono text-xs font-bold uppercase tracking-[.08em] text-slope";

export const h1 =
  "mb-[18px] mt-3.5 text-[clamp(30px,4.2vw,54px)] font-extrabold leading-[1.03] tracking-[-.02em] text-balance";

export const h1Work =
  "mb-[18px] mt-3.5 text-[clamp(28px,3.6vw,46px)] font-extrabold leading-[1.05] tracking-[-.02em] text-balance";

export const highlight =
  "bg-[linear-gradient(transparent_62%,var(--color-hi)_62%)] not-italic";

export const h2 =
  "mb-3.5 mt-3 text-[clamp(24px,3vw,38px)] font-extrabold leading-[1.05] tracking-[-.01em] text-balance";

export const h3Teaser =
  "mb-3 mt-3 text-[clamp(22px,2.6vw,32px)] font-extrabold leading-[1.08] tracking-[-.01em] text-balance";

export const body = "text-base leading-[1.55] text-body";

export const bodyGap = `${body} mt-3`;

export const links = "mt-1 flex flex-wrap gap-x-4 gap-y-2.5 font-mono text-sm";

export const textLink = `inline-flex items-center gap-1.5 border-b-2 border-blue pb-px text-ink no-underline transition-colors hover:bg-hi ${focusRing}`;

export const icon = "size-4 shrink-0";

export const iconSmall = "size-3.5 shrink-0";

export const cards = "mt-[22px] grid grid-cols-1 gap-2.5 md:grid-cols-3";

export const card = `flex h-full flex-col gap-1 rounded-xl border-2 border-ink bg-white p-3 text-ink no-underline transition-[translate,box-shadow] duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-hard-sm ${focusRing}`;

export const cardProject =
  "block truncate font-mono text-[11px] font-bold text-slope";

export const cardValue =
  "block font-mono text-[28px] font-bold leading-none tracking-[-.03em] tabular-nums";

export const cardLabel = "text-xs leading-snug text-[#33465f]";

export const cardCta =
  "mt-auto flex items-center gap-1 pt-1 font-mono text-[11px] font-bold uppercase tracking-[.06em] text-blue";

export const srOnly = "sr-only";

export const hint =
  "mt-4 hidden items-center gap-1.5 font-mono text-[13px] text-slope md:motion-safe:group-has-[ski-rider:state(running)]/run:flex";

export const rider =
  "pointer-events-none absolute inset-0 z-[-1] hidden overflow-hidden md:motion-safe:block";

export const legend = "mt-4 grid gap-2 font-mono text-[13px] text-body";

export const legendItem = "flex items-center gap-2.5";

export const marker = "inline-flex items-center gap-0.5";

export const markerWithName = "inline-flex items-center gap-2";

export const markerSign = {
  circle: "inline-block size-[13px] shrink-0 rounded-full bg-green",
  diamond: "mx-0.5 inline-block size-[11px] shrink-0 rotate-45 bg-ink",
  square: "inline-block size-[13px] shrink-0 bg-blue",
} as const;

export const teaserTitleLink = `text-ink no-underline decoration-blue decoration-2 underline-offset-4 hover:underline ${focusRing}`;

export const proofLine =
  "mt-4 flex flex-wrap items-baseline gap-x-2 gap-y-1 border-t-2 border-dashed border-track pt-3 text-sm text-body";

export const proofValue = "font-mono text-lg font-bold text-ink tabular-nums";

export const log = "mt-3 list-none p-0";

export const logRow =
  "grid grid-cols-1 gap-0.5 border-b md:grid-cols-[7.5rem_1fr] md:gap-2.5 border-dashed border-track py-2 text-[15px] leading-snug text-body last:border-b-0";

export const logTime = "pt-0.5 font-mono text-[13px] text-slope tabular-nums";

export const logArea = "font-mono text-[13px] font-bold text-ink";

export const moreLink = `mt-5 inline-flex items-center gap-1.5 font-mono text-sm font-bold text-ink no-underline border-b-2 border-blue pb-px hover:bg-hi ${focusRing}`;

export const backLink = `inline-flex items-center gap-1.5 font-mono text-xs font-bold uppercase tracking-[.08em] text-ink no-underline border-b-2 border-blue pb-px hover:bg-hi ${focusRing}`;

export const headerTop =
  "mb-5 flex flex-wrap items-center justify-between gap-3";

export const meta =
  "mt-2 border-l-4 border-hi pl-3 text-sm leading-relaxed text-body [&_a]:border-b-2 [&_a]:border-blue [&_a]:text-ink [&_a]:no-underline [&_strong]:font-mono [&_strong]:text-xs [&_strong]:uppercase [&_strong]:tracking-[.06em] [&_strong]:text-slope";

export const workProof =
  "mt-4 flex flex-col items-start gap-2 font-mono text-sm text-body";

export const md = {
  blockquote: "my-4 border-l-4 border-track pl-4 text-body",
  diagram: `overflow-x-auto rounded-xl border-2 border-ink bg-white p-3 md:p-4 [&_svg]:mx-auto [&_svg]:block [&_svg]:h-auto [&_svg]:w-full [&_svg]:min-w-[30rem] ${focusRing}`,
  figcaption:
    "mt-2 font-mono text-xs font-bold uppercase tracking-[.06em] text-slope",
  figure: "my-4",
  code: "rounded bg-snow px-1 py-0.5 font-mono text-[0.88em] text-ink",
  h2: "mb-4 text-[clamp(24px,3vw,38px)] font-extrabold leading-[1.05] tracking-[-.01em]",
  h3: "mb-2 mt-7 flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-[.08em] text-slope first:mt-0 before:inline-block before:size-2 before:rotate-45 before:bg-blue",
  h4: "mb-2 mt-5 text-lg font-bold",
  li: "pl-1 marker:font-mono marker:text-slope [&>p]:mt-0",
  link: `border-b-2 border-blue text-ink no-underline hover:bg-hi ${focusRing}`,
  ol: "mt-3 grid list-decimal gap-2 pl-6 text-base leading-[1.55] text-body",
  p: "mt-3 text-base leading-[1.55] text-body first:mt-0",
  pre: "my-4 overflow-x-auto rounded-xl border-2 border-ink bg-ink p-4 font-mono text-[12.5px] leading-relaxed text-snow",
  strong: "font-bold text-ink",
  ul: "mt-3 grid list-disc gap-1.5 pl-6 text-base leading-[1.55] text-body",
} as const;

export const shippedArticle =
  "border-b-2 border-dashed border-track py-5 first:pt-2 last:border-b-0 last:pb-0";

export const shippedWhen =
  "flex flex-wrap items-center gap-x-2 font-mono text-[13px] text-slope";

export const shippedTitle =
  "mt-1.5 text-[clamp(19px,2vw,24px)] font-extrabold leading-tight text-ink";

export const shippedFields =
  "mt-3 grid grid-cols-1 gap-x-4 gap-y-1 text-[15px] leading-snug text-body md:grid-cols-[7rem_1fr]";

export const shippedFieldName =
  "pt-0.5 font-mono text-[11px] font-bold uppercase tracking-[.06em] text-slope md:pt-1";

export const shippedFieldValue =
  "mb-2 break-words md:mb-1 [&_a]:border-b-2 [&_a]:border-blue [&_a]:text-ink [&_a]:no-underline";

export const main = "min-h-screen";
