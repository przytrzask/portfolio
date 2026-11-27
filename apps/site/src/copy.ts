export const HEADLINE =
  "product engineer. I ship full stack features end to end and build the AI tooling that helps teams ship them.";

export const copy = {
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
  heroLabel: "[ portfolio ]",
  home: "Home",
  linkedin: "LinkedIn",
  notFoundBody: (path: string) => `Nothing lives at ${path}.`,
  notFoundTitle: "Not found",
  proofCards: "Proof",
  proofCta: "Read the case study",
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
  shippedProof: "Proof",
  shippedSkills: "Skills",
  shippedTitle: "Shipped · Portfolio",
  workHeading: "Case studies",
  workIntro:
    "Each case study covers the context, my role, the key decisions, what went wrong, the results, and the tests, CI and evals behind it.",
  workLabel: "[ case studies ]",
  workTitle: (title: string) => `${title} · Portfolio`,
} as const;
