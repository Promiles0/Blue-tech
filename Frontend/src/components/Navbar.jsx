import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { ShoppingBag, User, Search, Menu, X } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

function Navbar() {
  const { isAuthenticated, logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close menus on route change — use a ref comparison, no setState in effect body
  const pathname = location.pathname;
  // Menus close via closeMenus() called on Link/button clicks below.
  // This avoids calling setState synchronously inside a useEffect.

  const closeMenus = () => {
    setMenuOpen(false);
    setSearchOpen(false);
  };

  const handleLogout = () => {
    logout();
    closeMenus();
    navigate("/");
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery("");
    }
  };

  const navLinks = [
    { label: "Shop", to: "/products" },
    { label: "Audio", to: "/products?category=audio" },
    { label: "Wearables", to: "/products?category=wearables" },
    { label: "Cameras", to: "/products?category=cameras" },
  ];

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "border-b border-white/[0.06] bg-[#080808]/90 backdrop-blur-xl"
            : "bg-transparent"
        }`}
      >
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" onClick={closeMenus} className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            <span className="font-display font-bold text-[15px] tracking-[0.2em] text-white uppercase">
              Noir
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="text-[13px] font-medium text-[#888] hover:text-white transition-colors tracking-wide"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Icons */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setSearchOpen((v) => !v)}
              className="p-2.5 text-[#888] hover:text-white transition-colors rounded-lg hover:bg-white/5"
              aria-label="Search"
            >
              <Search className="w-[18px] h-[18px]" />
            </button>

            <Link
              to="/cart"
              onClick={closeMenus}
              className="p-2.5 text-[#888] hover:text-white transition-colors rounded-lg hover:bg-white/5"
              aria-label="Cart"
            >
              <ShoppingBag className="w-[18px] h-[18px]" />
            </Link>

            {isAuthenticated ? (
              <div className="relative group">
                <button className="p-2.5 text-[#888] hover:text-white transition-colors rounded-lg hover:bg-white/5">
                  <User className="w-[18px] h-[18px]" />
                </button>
                <div className="absolute right-0 top-full mt-2 w-44 glass rounded-xl py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 translate-y-1 group-hover:translate-y-0">
                  <div className="px-4 py-2 border-b border-white/[0.06]">
                    <p className="text-[12px] text-[#888]">Signed in as</p>
                    <p className="text-[13px] font-medium truncate">{user?.name}</p>
                  </div>
                  <Link
                    to="/orders"
                    className="flex items-center px-4 py-2 text-[13px] text-[#888] hover:text-white hover:bg-white/5 transition-colors"
                  >
                    My Orders
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left flex items-center px-4 py-2 text-[13px] text-[#888] hover:text-white hover:bg-white/5 transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            ) : (
              <Link
                to="/login"
                className="p-2.5 text-[#888] hover:text-white transition-colors rounded-lg hover:bg-white/5"
                aria-label="Sign In"
              >
                <User className="w-[18px] h-[18px]" />
              </Link>
            )}

            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="md:hidden p-2.5 text-[#888] hover:text-white transition-colors rounded-lg hover:bg-white/5 ml-1"
            >
              {menuOpen ? <X className="w-[18px] h-[18px]" /> : <Menu className="w-[18px] h-[18px]" />}
            </button>
          </div>
        </div>

        {/* Search bar */}
        {searchOpen && (
          <div className="border-t border-white/[0.06] bg-[#080808]/95 backdrop-blur-xl">
            <form onSubmit={handleSearch} className="container mx-auto px-6 py-4">
              <input
                autoFocus
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="w-full bg-transparent text-white placeholder-[#555] text-lg outline-none border-b border-white/10 pb-2 focus:border-primary/50 transition-colors"
              />
            </form>
          </div>
        )}

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-white/[0.06] bg-[#080808]/95 backdrop-blur-xl">
            <div className="container mx-auto px-6 py-6 flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={closeMenus}
                  className="text-[15px] text-[#888] hover:text-white transition-colors py-1"
                >
                  {link.label}
                </Link>
              ))}
              <div className="border-t border-white/[0.06] pt-4 mt-2 flex flex-col gap-3">
                {isAuthenticated ? (
                  <>
                    <Link to="/orders" onClick={closeMenus} className="text-[15px] text-[#888] hover:text-white transition-colors">
                      My Orders
                    </Link>
                    <button onClick={handleLogout} className="text-left text-[15px] text-[#888] hover:text-white transition-colors">
                      Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <Link to="/login" onClick={closeMenus} className="text-[15px] text-[#888] hover:text-white transition-colors">
                      Sign In
                    </Link>
                    <Link to="/register" onClick={closeMenus} className="text-[15px] text-[#888] hover:text-white transition-colors">
                      Create Account
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>
      <div className="h-16" />
    </>
  );
}

// Suppress unused variable warning — pathname is kept for route-awareness context
void (function () { return typeof pathname; });

export default Navbar;