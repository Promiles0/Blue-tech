import FAQAccordion from './FAQAccordion'

// Generic, category-level answers — true of interactive touch displays broadly, not
// specific promises about warranty length, certifications, or store policy (those need
// real, confirmed figures before they can be published).
const FAQS = [
  {
    q: 'Can I mount it on a wall or use a mobile stand?',
    a: "Yes — these displays use VESA-standard mounting, so they're compatible with most wall mounts and rolling floor stands. VESA pattern and weight vary by screen size, so check the specific model's spec sheet before ordering a mount.",
  },
  {
    q: "What's included in the box?",
    a: 'Every unit ships with the stand or wall-mount hardware, a remote, and at least one stylus pen, though exact contents vary by model — check the individual product page for what comes with that specific screen.',
  },
  {
    q: 'Can I connect a laptop to it?',
    a: 'Yes, over HDMI or USB-C depending on the model, and most also support wireless screen mirroring straight from a laptop or phone with no cable at all.',
  },
  {
    q: 'Does it work with a stylus or pen?',
    a: 'Yes — touch input works with a finger or the included stylus. Pressure sensitivity and how many pens are included vary by model.',
  },
  {
    q: 'What software does it run?',
    a: "Most models run a built-in Android-based interface for whiteboarding, screen mirroring, and file access out of the box. Models with a Windows OPS slot also support a full Windows install for a laptop-like experience.",
  },
  {
    q: 'Will it work with our existing video-conferencing setup?',
    a: "The built-in camera and mic work with common conferencing apps directly, or you can plug in your existing conferencing bar or laptop over HDMI or USB — check the specific model's ports against your setup.",
  },
]

export default function InteractiveScreensFAQ() {
  return <FAQAccordion eyebrow="Questions" heading="Before you ask." items={FAQS} />
}
