export const site = {
  name: "Venkateshwara DV Spaces",
  short: "DV Spaces",
  founder: "Dr. Anil Verma",
  statement:
    "Inspired by the divine heritage of Tirumala, we create elegant architectural and interior spaces that blend tradition with modern living.",
  services: ["Architecture Design", "Interior Design", "3D Visualization", "Turnkey Projects", "Villas & Commercial Spaces"],
  // Dr. Anil Verma's WhatsApp numbers. The first one receives the "Send on WhatsApp" messages.
  phones: ["+91 83745 93377", "+91 72078 88377"],
  whatsapp: "918374593377",
};

/** wa.me wants the number as digits only. */
export const waNumber = (phone: string) => phone.replace(/\D/g, "");

export const whatsappLink = (text: string) =>
  `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(text)}`;
