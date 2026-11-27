export const HEADLINE =
  "product engineer. I ship full stack features end to end and build the AI tooling that helps teams ship them.";

export const HEADLINE_HIGHLIGHT = "end to end";

const PROJECT_LABELS = {
  "ai-sdlc-rollout": "ai sdlc rollout",
  "business-insurance": "business insurance",
  "suunto-coach": "suunto-coach",
  "ticket-to-merge": "ticket → merge",
} as const;

export const copy = {
  allCaseStudies: "All case studies",
  backHome: "Home",
  caseNumber: (index: number, name: string) =>
    `case ${String(index + 1).padStart(2, "0")} · ${name}`,
  caseStudyLabel: "[ case study ]",
  codeOnRequest: "Code available on request",
  contactLinks: "Contact and profiles",
  depthNames: {
    1: "Green circle: local",
    2: "Blue square: deployed",
    3: "Black diamond: engineered with tests, CI and evals",
    4: "Double black diamond: used in production",
  },
  documentTitle: "Portfolio · product engineer",
  email: "Email",
  github: "GitHub",
  heroLabel: (maybeName: string | undefined) =>
    maybeName === undefined
      ? "[\u00A0product engineer · freestyle skier\u00A0]"
      : `[\u00A0${maybeName} · product engineer · freestyle skier\u00A0]`,
  home: "Home",
  linkedin: "LinkedIn",
  notFoundBody: "Nothing lives at this address. The run starts at the top.",
  notFoundDescription: "This page does not exist.",
  notFoundLabel: "[ off piste ]",
  notFoundTitle: "Not found",
  ogImageAlt:
    "Piste-style card: product engineer. I ship full stack features end to end and build the AI tooling that helps teams ship them.",
  projectLabel: (artifactName: string) =>
    Object.entries(PROJECT_LABELS).find(
      ([name]) => name === artifactName
    )?.[1] ?? artifactName,
  proofCards: "Proof",
  proofCta: "Read the case study",
  proofCtaShort: "case study",
  trailLegend: "Trail markers rate each case study by depth",
  resume: "Resume (PDF)",
  resumeHref: "/resume.pdf",
  shippedAll: "All shipped work",
  shippedArtifact: "Case study",
  shippedEmpty: "Nothing curated yet.",
  shippedHeading: "Shipped",
  shippedImpact: "Impact",
  shippedIntro:
    "Dated weekly wins, curated from merged pull requests and releases.",
  shippedLabel: "[ shipped log ]",
  shippedMarkdownTitle: "Shipped log",
  shippedProof: "Proof",
  shippedSkills: "Skills",
  shippedTitle: "Shipped · Portfolio",
  siteName: "Portfolio",
  workHeading: "Case studies",
  workIntro:
    "Each case study covers the context, my role, the key decisions, what went wrong, the results, and the tests, CI and evals behind it.",
  workLabel: "[ case studies ]",
  workTitle: (title: string) => `${title} · Portfolio`,
} as const;
