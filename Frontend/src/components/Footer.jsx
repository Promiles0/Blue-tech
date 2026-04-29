import { Link } from "react-router-dom";

const shopLinks = [
  { label: "All products", to: "/products" },
  { label: "Audio", to: "/products?category=audio" },
  { label: "Wearables", to: "/products?category=wearables" },
  { label: "Cameras", to: "/products?category=cameras" },
];

const accountLinks = [
  { label: "Profile", to: "/profile" },
  { label: "Orders", to: "/orders" },
  { label: "Wishlist", to: "/wishlist" },
  { label: "Sign in", to: "/login" },
];

const companyLinks = [
  { label: "About", to: "/about" },
  { label: "Press", to: "/press" },
  { label: "Contact", to: "/contact" },
  { label: "Sustainability", to: "/sustainability" },
];

function FooterColumn({ title, links }) {
  return (
    <div>
      <p className="text-[11px] font-display font-semibold tracking-[0.16em] text-[#444] uppercase mb-5">
        {title}
      </p>
      <ul className="flex flex-col gap-3">
        {links.map((link) => (
          <li key={link.label}>
            <Link
              to={link.to}
              className="text-[13px] text-[#666] hover:text-[#bbb] transition-colors"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Footer() {
  return (
    <footer className="border-t border-white/[0.06] mt-auto">
      {/* Main footer content */}
      <div className="container mx-auto px-6 py-16 grid grid-cols-2 md:grid-cols-4 gap-12">
        {/* Brand */}
        <div className="col-span-2 md:col-span-1">
          <Link to="/" className="flex items-center gap-2 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            <span className="font-display font-bold text-[15px] tracking-[0.2em] text-white uppercase">
              Noir
            </span>
          </Link>
          <p className="text-[13px] text-[#555] leading-relaxed max-w-[200px]">
            Considered objects for a quieter, more deliberate digital life.
          </p>
        </div>

        <FooterColumn title="Shop" links={shopLinks} />
        <FooterColumn title="Account" links={accountLinks} />
        <FooterColumn title="Company" links={companyLinks} />
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/[0.04]">
        <div className="container mx-auto px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[12px] text-[#444]">
            © 2026 NOIR Studio. All rights reserved.
          </p>
          <p className="text-[12px] text-[#444]">Crafted with deliberate care.</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;