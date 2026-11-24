import { site } from "./site";

// Privacy Policy and Terms and Conditions, word for word from the client's document
// (Venkateshwara_DV_Spaces_Privacy_Policy_and_Terms.pdf, effective 22 November 2026).
// The placeholders are filled with the client's phone numbers, address and emails, and
// Dr. Anil Verma as grievance officer.

export type LegalDoc = {
  title: string;
  sections: { heading: string; body: string }[];
  closing?: string[];
};

export const legalTagline = "Residential & Commercial Construction | Design | Interiors";
export const legalMeta = "Website: www.venkateshwaradv.com | Effective date: 22 November 2026 | India";

const phones = site.phones.join(", ");
const address = "Vedanthapuram, Mallamgunta, Tirupati, Andhra Pradesh";

export const privacyPolicy: LegalDoc = {
  title: "Privacy Policy",
  sections: [
    {
      heading: "1. Introduction",
      body: "Venkateshwara DV Spaces (the Company) respects the privacy of website visitors, clients, suppliers and contractors. This Policy explains how personal information is collected, used, shared, retained and protected in connection with residential and commercial construction, design, interiors, renovation and project management.",
    },
    {
      heading: "2. Information collected",
      body: "We may collect names, contact details, addresses, property locations, plot dimensions, drawings, design requirements, project photographs, enquiry and communication records, invoices, payment references, GST and identification information where required, and website/device/cookie information where those technologies are used.",
    },
    {
      heading: "3. Purposes",
      body: "We use information to respond to enquiries, conduct site visits, prepare estimates and drawings, execute projects, coordinate consultants and subcontractors, process payments, provide progress updates and warranty support, maintain records, comply with law, and send marketing communications where legally permitted.",
    },
    {
      heading: "4. Lawful processing and consent",
      body: "Information is processed on an applicable lawful basis, including consent where required. Consent may be withdrawn through our published contact channels, subject to lawful retention and processing requirements.",
    },
    {
      heading: "5. Confidentiality of projects",
      body: "Private drawings, property documents, budgets and client communications are disclosed only to persons with an appropriate need. Identifiable project photographs or confidential floor plans will not be publicly used for promotion without appropriate authorization.",
    },
    {
      heading: "6. Sharing",
      body: "Information may be shared with authorized staff, architects, engineers, consultants, approved suppliers, payment processors, accountants, technology providers and competent authorities where necessary and lawful. We do not sell customer personal information to third-party advertisers.",
    },
    {
      heading: "7. Security",
      body: "We apply reasonable organizational, technical and administrative safeguards, but cannot guarantee that electronic transmission or storage is entirely risk-free.",
    },
    {
      heading: "8. Retention",
      body: "Records are retained for business, contractual, legal, accounting and dispute-resolution needs, then securely deleted or anonymized when no longer required, subject to applicable law.",
    },
    {
      heading: "9. Cookies and external links",
      body: "The website may use essential cookies and, if implemented, analytics technologies. Appropriate notices and choices will be provided where required. Third-party websites and payment platforms follow their own policies.",
    },
    {
      heading: "10. Individual rights",
      body: "Subject to applicable law and commencement provisions, individuals may request information about processing, correction, updating, erasure where applicable, withdrawal of consent and grievance redressal. Identity verification and statutory exceptions may apply.",
    },
    {
      heading: "11. Children",
      body: "Our services are directed primarily to adults and authorized business representatives. We do not knowingly solicit children to enter independent construction contracts.",
    },
    {
      heading: "12. Applicable law",
      body: "We aim to comply with applicable Indian privacy and information technology laws, including relevant provisions of the Information Technology Act, 2000 and the Digital Personal Data Protection Act, 2023, and applicable rules as brought into force.",
    },
    {
      heading: "13. Changes",
      body: "This Policy may be updated; revised terms and their effective date will be published on the website.",
    },
    {
      heading: "14. Contact and grievance redressal",
      body: `Venkateshwara DV Spaces | Website: www.venkateshwaradv.com | Business address: ${address} | Privacy email: venkateshwaradv@venkateshwaradv.com | Telephone: ${phones} | Grievance officer/contact: ${site.founder}, architect@venkateshwaradv.com.`,
    },
  ],
};

export const termsAndConditions: LegalDoc = {
  title: "Terms and Conditions",
  sections: [
    {
      heading: "1. Acceptance and contracts",
      body: "Using the website or submitting an enquiry is subject to these website terms. Construction work, financial obligations and project remedies are governed by a separately accepted quotation, work order or signed agreement. The signed agreement prevails where inconsistent, subject to applicable law.",
    },
    {
      heading: "2. Services",
      body: "Services may include residential houses, villas, apartments, commercial buildings, offices, retail spaces, architectural and structural design coordination, civil works, interiors, modular kitchens, renovation, extensions, finishing and turnkey project management. Actual deliverables depend on the written scope.",
    },
    {
      heading: "3. Estimates and pricing",
      body: "Quotations rely on available measurements, drawings, site conditions and specifications. Unless stated otherwise, they are valid for 30 days. Changes before acceptance may reflect revised scope or costs; changes after execution require a written variation or other authorized contractual adjustment. Taxes apply as legally required.",
    },
    {
      heading: "4. Project documentation",
      body: "Before commencement, parties should agree on scope, approved drawings, specifications, bill of quantities or price schedule, payment milestones, dates, responsibilities for approvals, variations and dispute procedures.",
    },
    {
      heading: "5. Payments",
      body: "Payments follow the signed project schedule. An illustrative structure, only if expressly adopted, is 30% mobilization, 30% structural/civil milestone, 30% finishing milestone and 10% final inspection and handover. Pay only into the officially designated business account against receipts. Overdue payment may justify suspension after contractual notice and opportunity to remedy.",
    },
    {
      heading: "6. Client duties",
      body: "The client provides lawful access, accurate property and site information, relevant ownership/authorization documents, approvals allocated to the client, timely decisions, payment and disclosure of known hazards or structural issues.",
    },
    {
      heading: "7. Company duties",
      body: "The Company will exercise reasonable skill, care and diligence, follow agreed specifications, coordinate work, provide reasonable updates, comply with applicable safety requirements and address defects under applicable contract or law.",
    },
    {
      heading: "8. Materials and substitutions",
      body: "Materials must meet agreed brands, grades and specifications. Proposed substitutes and associated cost or schedule changes require client approval unless the agreement validly provides otherwise.",
    },
    {
      heading: "9. Drawings and safety",
      body: "Work requiring professional certification must be designed, checked or approved by appropriately qualified professionals. Approved plans, building rules and safety requirements must be followed; unauthorized structural alterations are prohibited.",
    },
    {
      heading: "10. Timelines and delays",
      body: "Completion dates are specified in the agreement. Client variations, delayed access or approvals, concealed site conditions, extraordinary weather, supply disruption, payment delay or force majeure may justify documented schedule changes under the contract. Material delays should be promptly communicated.",
    },
    {
      heading: "11. Variations",
      body: "Additional, omitted or changed work should be recorded in a written variation stating scope, quantities, price, time impact and authorization. Verbal instructions should be confirmed in writing.",
    },
    {
      heading: "12. Residential projects",
      body: "Included items such as foundations, RCC, masonry, plaster, flooring, waterproofing, electrical and plumbing works must be listed in the quotation. Exclusions such as furniture, appliances, boundary walls, borewells, landscaping, utilities and approval fees must be identified.",
    },
    {
      heading: "13. Commercial projects",
      body: "Fire safety, accessibility, ventilation, electrical load, utilities and occupancy permissions may require specialist design and approvals. Responsibilities must be allocated in writing. No approval or license is guaranteed unless expressly contracted.",
    },
    {
      heading: "14. Unforeseen conditions",
      body: "Concealed services, unstable soil, undocumented foundations, contamination or structural defects may require further assessment. Additional work should be approved before execution except reasonable urgent protection of people or property as permitted by law.",
    },
    {
      heading: "15. Site access and insurance",
      body: "Visitors must follow site safety instructions. Site security, insurance, labor safety and third-party responsibilities should be specified in the agreement without excluding mandatory statutory duties.",
    },
    {
      heading: "16. Completion and handover",
      body: "Parties should jointly inspect substantially completed work, document pending or defective items, and agree on rectification. Keys, relevant certificates, warranties, final accounts and other handover records are provided as contractually and legally required.",
    },
    {
      heading: "17. Defects and warranty",
      body: "Workmanship warranty periods and exclusions are defined in the signed agreement. Manufacturer warranties apply to relevant products. Mandatory statutory remedies, including applicable structural defect liability, are not reduced. Voluntary warranties may exclude misuse or unauthorized modifications where lawful.",
    },
    {
      heading: "18. Cancellation and refunds",
      body: "Termination follows the agreement and applicable law. A final account should reconcile completed work, legitimate committed costs, amounts paid and refunds or balances due. Advance payments are not automatically forfeited; charges must be lawful and reasonable. Refund timing should be confirmed in writing.",
    },
    {
      heading: "19. Copyright and design rights",
      body: "Drawings, 3D elevations, visualizations, interior concepts, branding and website content may be protected intellectual property. Ownership and licensed client use are governed by the design agreement; paying a design fee does not automatically transfer all intellectual property rights.",
    },
    {
      heading: "20. Photography and website representations",
      body: "Identifiable client properties and confidential drawings require appropriate permission for marketing. Website images, renders and descriptions are illustrative unless expressly included as binding deliverables.",
    },
    {
      heading: "21. Liability",
      body: "Liability is governed by the signed agreement and applicable law. Nothing excludes non-excludable liability, mandatory consumer protections, statutory construction duties or liability for fraud.",
    },
    {
      heading: "22. Force majeure",
      body: "A party affected by events beyond reasonable control should promptly notify the other party and mitigate disruption. Extensions and termination rights follow the agreement and law.",
    },
    {
      heading: "23. Disputes",
      body: "Parties should first attempt written, good-faith resolution. Mediation, arbitration where validly agreed in writing, or competent courts and statutory forums may be used. Mandatory consumer and RERA remedies remain available where applicable.",
    },
    {
      heading: "24. Governing law",
      body: "Indian law applies. Competent courts and authorities have jurisdiction subject to mandatory legal rules and project circumstances.",
    },
    {
      heading: "25. Amendments",
      body: "Website terms may be updated prospectively. Updates do not unilaterally change signed project agreements.",
    },
    {
      heading: "26. Contact",
      body: `Venkateshwara DV Spaces | www.venkateshwaradv.com | Business address: ${address} | Email: venkateshwaradv@venkateshwaradv.com, architect@venkateshwaradv.com | Phone: ${phones}.`,
    },
  ],
  closing: ["© 2026 Venkateshwara DV Spaces. All Rights Reserved."],
};
