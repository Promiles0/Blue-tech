import React from 'react';
import { ShoppingBag, ArrowRight, Star, ShieldCheck, Zap, Globe } from 'lucide-react';

function App() {
  return (
    <div className="min-h-screen bg-background text-slate-100 selection:bg-primary/30">
      
      {/* --- HERO SECTION --- */}
      <header className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Background Decorative Blobs */}
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-accent/10 rounded-full blur-[120px]" />

        <div className="container mx-auto px-6 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-full mb-8 backdrop-blur-sm animate-bounce">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-xs font-semibold tracking-wider uppercase">New Collection 2026 is here</span>
          </div>
          
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-6 bg-gradient-to-b from-white to-slate-500 bg-clip-text text-transparent">
            FUTURE OF <br /> 
            <span className="text-primary italic">SHOPPING.</span>
          </h1>
          
          <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            Experience the next generation of e-commerce. Premium quality, 
            lightning fast delivery, and an interface that feels like magic.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
            <button className="px-8 py-4 bg-primary hover:bg-primary/80 text-white font-bold rounded-2xl transition-all flex items-center gap-2 group">
              Start Shopping 
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button className="px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold rounded-2xl transition-all">
              View Categories
            </button>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-50">
          <span className="text-[10px] uppercase tracking-[0.3em] font-bold">Scroll</span>
          <div className="w-[1px] h-12 bg-gradient-to-b from-primary to-transparent" />
        </div>
      </header>

      {/* --- FEATURED PRODUCTS --- */}
      <section className="py-24 container mx-auto px-6">
        <div className="flex items-end justify-between mb-12">
          <div>
            <h2 className="text-4xl font-bold tracking-tight mb-4">Featured <span className="text-primary">Styles</span></h2>
            <p className="text-slate-500">Hand-picked excellence for your modern lifestyle.</p>
          </div>
          <button className="hidden sm:block text-primary font-bold hover:underline">View All Collection</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[1, 2, 3].map((item) => (
            <div key={item} className="glass-card rounded-[2rem] p-4 group cursor-pointer hover:border-primary/30 transition-all">
              <div className="relative aspect-square rounded-[1.5rem] bg-slate-800 overflow-hidden mb-6">
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
                  <button className="w-full py-3 bg-white text-background font-bold rounded-xl translate-y-4 group-hover:translate-y-0 transition-transform">
                    Add to Cart
                  </button>
                </div>
                {/* Image Placeholder with Icon */}
                <div className="absolute inset-0 flex items-center justify-center opacity-20">
                  <ShoppingBag className="w-20 h-20" />
                </div>
              </div>
              
              <div className="px-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-primary uppercase tracking-widest">Premium Edition</span>
                  <div className="flex items-center gap-1 text-accent">
                    <Star className="w-3 h-3 fill-current" />
                    <span className="text-xs font-bold">4.9</span>
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-1">Cyberpunk Watch v{item}.0</h3>
                <p className="text-slate-500 text-sm mb-4">Limited edition stealth black series.</p>
                <div className="text-2xl font-black text-white">$249.00</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* --- TRUST BADGES --- */}
      <section className="py-20 border-y border-white/5 bg-white/[0.01]">
        <div className="container mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-10">
          <div className="flex flex-col items-center text-center gap-4">
            <ShieldCheck className="w-10 h-10 text-primary" />
            <h4 className="font-bold">Secure Payments</h4>
          </div>
          <div className="flex flex-col items-center text-center gap-4">
            <Zap className="w-10 h-10 text-primary" />
            <h4 className="font-bold">Fast Delivery</h4>
          </div>
          <div className="flex flex-col items-center text-center gap-4">
            <Star className="w-10 h-10 text-primary" />
            <h4 className="font-bold">Premium Quality</h4>
          </div>
          <div className="flex flex-col items-center text-center gap-4">
            <Globe className="w-10 h-10 text-primary" />
            <h4 className="font-bold">Global Shipping</h4>
          </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="py-12 text-center text-slate-600 text-sm">
        <p>&copy; 2026 LUXE E-COMMERCE PLATFORM. ALL RIGHTS RESERVED.</p>
      </footer>
    </div>
  );
}

export default App;
