import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useInView,
  AnimatePresence,
} from 'framer-motion';
import {
  ArrowRight, Zap, Package, ShoppingCart, Factory,
  Warehouse, Truck, BarChart3, ChevronDown,
  CheckCircle, Globe, Shield, Clock
} from 'lucide-react';
import './Landing.css';

/* ── Animated counter hook ── */
function useCounter(target, duration = 2) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = target / (duration * 60);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 1000 / 60);
    return () => clearInterval(timer);
  }, [inView, target, duration]);

  return [count, ref];
}

/* ── Feature modules data ── */
const MODULES = [
  { icon: ShoppingCart, label: 'Sales Management',    color: '#D1E5F5', text: '#546774', desc: 'End-to-end customer order lifecycle — from quotation to invoice with complete traceability.' },
  { icon: Package,      label: 'Inventory Control',   color: '#E8F5E9', text: '#2E7D32', desc: 'Real-time stock visibility across all warehouses with automated low-stock alerts.' },
  { icon: ShoppingCart, label: 'Purchase & Procurement', color: '#FFF8E1', text: '#F57C00', desc: 'Automated vendor management, PO creation, and goods receipt workflows.' },
  { icon: Factory,      label: 'Manufacturing',       color: '#EDE7F6', text: '#512DA8', desc: 'Bill of Materials, production scheduling, and work center monitoring in real time.' },
  { icon: Warehouse,    label: 'Warehouse Ops',       color: '#FCE4EC', text: '#C62828', desc: 'Multi-location stock tracking, transfer orders, and cycle counting made simple.' },
  { icon: Truck,        label: 'Logistics & Delivery',color: '#E0F2F1', text: '#00695C', desc: 'Delivery scheduling, shipment tracking, and carrier integration under one roof.' },
];

const STATS = [
  { value: 500,  suffix: '+', label: 'Businesses Trust Us' },
  { value: 98,   suffix: '%', label: 'Uptime Guaranteed' },
  { value: 3,    suffix: 'x', label: 'Faster Operations' },
  { value: 60,   suffix: '%', label: 'Cost Reduction' },
];

const WHY_ITEMS = [
  { icon: Globe,        title: 'Unified Ecosystem',    desc: 'Every department connected — sales, manufacturing, inventory and logistics in one platform.' },
  { icon: BarChart3,    title: 'Real-Time Intelligence',desc: 'Live dashboards and AI-driven insights help you act before problems arise.' },
  { icon: Shield,       title: 'Enterprise Security',  desc: 'Role-based access, audit trails, and data encryption protecting every operation.' },
  { icon: Clock,        title: 'Rapid Deployment',     desc: 'Go live in days, not months. Intuitive UI means minimal training overhead.' },
];

/* ── Floating particle ── */
function Particle({ x, y, size, delay, duration }) {
  return (
    <motion.div
      className="lp-particle"
      style={{ left: `${x}%`, top: `${y}%`, width: size, height: size }}
      animate={{
        y: [0, -30, 0],
        opacity: [0.3, 0.8, 0.3],
        scale: [1, 1.2, 1],
      }}
      transition={{ duration, delay, repeat: Infinity, ease: 'easeInOut' }}
    />
  );
}

/* ── Scroll reveal wrapper ── */
function RevealSection({ children, className = '', delay = 0 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 48 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {children}
    </motion.div>
  );
}

/* ── Stat counter card ── */
function StatCard({ value, suffix, label, index }) {
  const [count, ref] = useCounter(value, 1.8);
  return (
    <motion.div
      ref={ref}
      className="lp-stat-card"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: index * 0.12 }}
      whileHover={{ y: -6, transition: { duration: 0.2 } }}
    >
      <span className="lp-stat-value">
        {count}{suffix}
      </span>
      <span className="lp-stat-label">{label}</span>
    </motion.div>
  );
}

export default function Landing() {
  const navigate = useNavigate();
  const heroRef  = useRef(null);
  const { scrollY } = useScroll();

  /* ── Parallax transforms ── */
  const heroY    = useTransform(scrollY, [0, 600], [0, 180]);
  const heroO    = useTransform(scrollY, [0, 400], [1, 0]);
  const bgScale  = useTransform(scrollY, [0, 600], [1, 1.18]);
  const gridY    = useTransform(scrollY, [0, 800], [0, -80]);

  const smoothHeroY = useSpring(heroY,   { stiffness: 60, damping: 20 });
  const smoothBgS   = useSpring(bgScale, { stiffness: 60, damping: 20 });

  /* ── Magnetic cursor ── */
  const [cursor, setCursor] = useState({ x: 0, y: 0 });
  useEffect(() => {
    const move = (e) => setCursor({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', move);
    return () => window.removeEventListener('mousemove', move);
  }, []);

  /* ── Particles ── */
  const particles = [
    { x: 8,  y: 20, size: 4,  delay: 0,    duration: 6 },
    { x: 92, y: 15, size: 6,  delay: 1.2,  duration: 8 },
    { x: 20, y: 75, size: 3,  delay: 0.5,  duration: 5 },
    { x: 85, y: 65, size: 5,  delay: 2,    duration: 7 },
    { x: 50, y: 10, size: 4,  delay: 0.8,  duration: 9 },
    { x: 35, y: 85, size: 3,  delay: 1.5,  duration: 6 },
    { x: 72, y: 40, size: 6,  delay: 0.3,  duration: 8 },
    { x: 15, y: 50, size: 5,  delay: 2.4,  duration: 7 },
  ];

  return (
    <div className="lp-root">
      {/* ── Cursor glow ── */}
      <motion.div
        className="lp-cursor-glow"
        animate={{ x: cursor.x - 200, y: cursor.y - 200 }}
        transition={{ type: 'spring', stiffness: 80, damping: 30 }}
      />

      {/* ════════════════════════════════════════
          HERO SECTION
      ════════════════════════════════════════ */}
      <section className="lp-hero" ref={heroRef}>
        {/* Animated background grid */}
        <motion.div className="lp-grid-bg" style={{ y: gridY, scale: smoothBgS }} />

        {/* Ambient orbs */}
        <motion.div className="lp-orb lp-orb--tl"
          animate={{ scale: [1, 1.15, 1], x: [0, 20, 0], y: [0, -20, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div className="lp-orb lp-orb--br"
          animate={{ scale: [1, 0.9, 1], x: [0, -30, 0], y: [0, 20, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        />
        <motion.div className="lp-orb lp-orb--center"
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Floating particles */}
        {particles.map((p, i) => <Particle key={i} {...p} />)}

        {/* Navbar */}
        <motion.nav
          className="lp-nav"
          initial={{ opacity: 0, y: -24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <div className="lp-nav-logo">
            <div className="lp-nav-logo-mark"><Zap size={16} strokeWidth={2.5} /></div>
            <span className="lp-nav-brand">Nexus <span className="lp-nav-erp">ERP</span></span>
          </div>
          <div className="lp-nav-links">
            <a href="#features" className="lp-nav-link">Features</a>
            <a href="#about"    className="lp-nav-link">About</a>
            <a href="#why"      className="lp-nav-link">Why Us</a>
          </div>
          <motion.button
            className="lp-nav-cta"
            onClick={() => navigate('/login')}
            whileHover={{ scale: 1.04, y: -2 }}
            whileTap={{ scale: 0.97 }}
            id="nav-login-btn"
          >
            Sign In
          </motion.button>
        </motion.nav>

        {/* Hero content */}
        <motion.div
          className="lp-hero-content"
          style={{ y: smoothHeroY, opacity: heroO }}
        >
          {/* Badge */}
          <motion.div
            className="lp-hero-badge"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <motion.span
              className="lp-badge-dot"
              animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            Next-Generation Enterprise Platform
          </motion.div>

          {/* Main title */}
          <div className="lp-hero-title-wrap">
            {'Nexus ERP'.split('').map((char, i) => (
              <motion.span
                key={i}
                className={`lp-hero-char ${char === ' ' ? 'lp-hero-space' : ''}`}
                initial={{ opacity: 0, y: 60, rotateX: -40 }}
                animate={{ opacity: 1, y: 0, rotateX: 0 }}
                transition={{
                  duration: 0.7,
                  delay: 0.4 + i * 0.06,
                  ease: [0.34, 1.56, 0.64, 1],
                }}
              >
                {char}
              </motion.span>
            ))}
          </div>

          {/* Tagline */}
          <motion.p
            className="lp-hero-tagline"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.1 }}
          >
            From Demand to Delivery,{' '}
            <span className="lp-tagline-accent">Intelligently.</span>
          </motion.p>

          {/* Sub description */}
          <motion.p
            className="lp-hero-sub"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.3 }}
          >
            One intelligent ecosystem connecting Sales, Manufacturing,
            Inventory, and Procurement — eliminating spreadsheets and disconnected workflows.
          </motion.p>

          {/* CTA buttons */}
          <motion.div
            className="lp-hero-ctas"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 1.5 }}
          >
            <motion.button
              id="hero-get-started"
              className="lp-cta-primary"
              onClick={() => navigate('/login')}
              whileHover={{ scale: 1.04, y: -3, boxShadow: '0 20px 48px rgba(0,0,0,0.35)' }}
              whileTap={{ scale: 0.97 }}
            >
              Get Started
              <motion.span
                animate={{ x: [0, 4, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <ArrowRight size={18} strokeWidth={2} />
              </motion.span>
            </motion.button>
            <motion.button
              id="hero-explore-features"
              className="lp-cta-ghost"
              onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.97 }}
            >
              Explore Features
            </motion.button>
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          className="lp-scroll-indicator"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.2 }}
        >
          <motion.div
            className="lp-scroll-dot"
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
          />
          <span>Scroll to explore</span>
          <ChevronDown size={14} />
        </motion.div>
      </section>

      {/* ════════════════════════════════════════
          STATS STRIP
      ════════════════════════════════════════ */}
      <section className="lp-stats-strip">
        <div className="lp-stats-inner">
          {STATS.map((s, i) => (
            <StatCard key={i} index={i} {...s} />
          ))}
        </div>
      </section>

      {/* ════════════════════════════════════════
          ABOUT / WHAT WE PROVIDE
      ════════════════════════════════════════ */}
      <section id="about" className="lp-about">
        <RevealSection className="lp-section-label-wrap">
          <div className="lp-section-label">
            <span className="lp-section-dot" />
            What We Provide
          </div>
        </RevealSection>

        <RevealSection delay={0.1}>
          <h2 className="lp-about-heading">
            The Digital Backbone for{' '}
            <span className="lp-heading-serif">Growing Businesses</span>
          </h2>
        </RevealSection>

        <div className="lp-about-grid">
          {/* Left: full description */}
          <RevealSection className="lp-about-copy" delay={0.15}>
            <p className="lp-about-para lp-about-para--lead">
              ERP Nexus is a <strong>next-generation Mini ERP platform</strong> designed to
              transform the way businesses manage their operations. We connect Sales,
              Purchasing, Manufacturing, Inventory, and Procurement into one intelligent
              ecosystem, eliminating the chaos of spreadsheets, manual tracking, and
              disconnected workflows.
            </p>
            <p className="lp-about-para">
              Built with a vision to simplify business operations, ERP Nexus provides
              real-time inventory visibility, automated procurement, manufacturing tracking,
              and complete order traceability from demand to delivery. Our platform empowers
              businesses to make faster decisions, reduce operational bottlenecks, and
              achieve greater efficiency through a centralized digital solution.
            </p>
            <p className="lp-about-para">
              Whether it's managing customer orders, tracking stock movements, planning
              production, or automating replenishment, ERP Nexus ensures every department
              works together seamlessly. We are not just building software — we are creating
              the <strong>digital backbone</strong> that helps growing businesses scale with
              confidence and control.
            </p>

            <div className="lp-about-checks">
              {[
                'Real-time inventory visibility',
                'Automated procurement workflows',
                'Manufacturing & production tracking',
                'Complete order traceability',
              ].map((item, i) => (
                <motion.div
                  key={i}
                  className="lp-check-item"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.3 + i * 0.1 }}
                >
                  <CheckCircle size={16} className="lp-check-icon" strokeWidth={2} />
                  {item}
                </motion.div>
              ))}
            </div>
          </RevealSection>

          {/* Right: module tiles */}
          <div className="lp-about-tiles">
            {MODULES.slice(0, 4).map((mod, i) => {
              const Icon = mod.icon;
              return (
                <motion.div
                  key={i}
                  className="lp-module-tile"
                  style={{ '--tile-bg': mod.color, '--tile-text': mod.text }}
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  whileInView={{ opacity: 1, scale: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.15 + i * 0.1 }}
                  whileHover={{ y: -6, scale: 1.02 }}
                >
                  <div className="lp-tile-icon" style={{ background: mod.color }}>
                    <Icon size={20} color={mod.text} strokeWidth={1.75} />
                  </div>
                  <span className="lp-tile-label">{mod.label}</span>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          FEATURES / MODULES SECTION
      ════════════════════════════════════════ */}
      <section id="features" className="lp-features">
        <RevealSection className="lp-section-header">
          <div className="lp-section-label">
            <span className="lp-section-dot" />
            Core Modules
          </div>
          <h2 className="lp-features-heading">
            Everything Your Business Needs,
            <br />
            <span className="lp-heading-serif">In One Platform</span>
          </h2>
          <p className="lp-features-sub">
            Six tightly integrated modules working as a single intelligent system —
            no silos, no data gaps, no manual reconciliation.
          </p>
        </RevealSection>

        <div className="lp-features-grid">
          {MODULES.map((mod, i) => {
            const Icon = mod.icon;
            return (
              <motion.div
                key={i}
                className="lp-feature-card"
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.6, delay: i * 0.08 }}
                whileHover={{ y: -8, transition: { duration: 0.25 } }}
              >
                <motion.div
                  className="lp-feature-icon"
                  style={{ background: mod.color }}
                  whileHover={{ scale: 1.12, rotate: 5 }}
                  transition={{ duration: 0.2 }}
                >
                  <Icon size={24} color={mod.text} strokeWidth={1.75} />
                </motion.div>
                <h3 className="lp-feature-title">{mod.label}</h3>
                <p className="lp-feature-desc">{mod.desc}</p>
                <motion.div
                  className="lp-feature-arrow"
                  whileHover={{ x: 4 }}
                >
                  <ArrowRight size={16} strokeWidth={2} />
                </motion.div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ════════════════════════════════════════
          WHY NEXUS ERP
      ════════════════════════════════════════ */}
      <section id="why" className="lp-why">
        <div className="lp-why-inner">
          <RevealSection className="lp-why-left">
            <div className="lp-section-label lp-section-label--light">
              <span className="lp-section-dot lp-section-dot--light" />
              Why Choose Us
            </div>
            <h2 className="lp-why-heading">
              Built for Clarity.<br />
              Designed for Scale.
            </h2>
            <p className="lp-why-sub">
              We didn't just build another ERP. We reimagined what enterprise software
              should feel like — precise, intelligent, and beautiful.
            </p>
            <motion.button
              id="why-get-started-btn"
              className="lp-cta-primary lp-cta-primary--white"
              onClick={() => navigate('/login')}
              whileHover={{ scale: 1.04, y: -3 }}
              whileTap={{ scale: 0.97 }}
            >
              Start for Free
              <ArrowRight size={16} strokeWidth={2} />
            </motion.button>
          </RevealSection>

          <div className="lp-why-right">
            {WHY_ITEMS.map((item, i) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={i}
                  className="lp-why-card"
                  initial={{ opacity: 0, x: 40 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: i * 0.1 }}
                  whileHover={{ x: -4, transition: { duration: 0.2 } }}
                >
                  <div className="lp-why-icon">
                    <Icon size={20} strokeWidth={1.75} />
                  </div>
                  <div className="lp-why-text">
                    <h4 className="lp-why-card-title">{item.title}</h4>
                    <p className="lp-why-card-desc">{item.desc}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          FINAL CTA BANNER
      ════════════════════════════════════════ */}
      <section className="lp-cta-banner">
        <motion.div
          className="lp-cta-orb lp-cta-orb--l"
          animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div
          className="lp-cta-orb lp-cta-orb--r"
          animate={{ scale: [1, 0.85, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 10, repeat: Infinity, delay: 2 }}
        />

        <RevealSection className="lp-cta-content">
          <p className="lp-cta-eyebrow">Ready to Transform Your Operations?</p>
          <h2 className="lp-cta-heading">
            From Demand to Delivery,
            <br />
            <em>Intelligently.</em>
          </h2>
          <p className="lp-cta-sub">
            Join hundreds of businesses already scaling smarter with Nexus ERP.
          </p>
          <motion.button
            id="cta-banner-btn"
            className="lp-cta-primary lp-cta-primary--white"
            onClick={() => navigate('/login')}
            whileHover={{ scale: 1.06, y: -4, boxShadow: '0 24px 60px rgba(255,255,255,0.25)' }}
            whileTap={{ scale: 0.97 }}
          >
            Get Started — It's Free
            <ArrowRight size={18} strokeWidth={2} />
          </motion.button>
        </RevealSection>
      </section>

      {/* ── Footer ── */}
      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <div className="lp-footer-brand">
            <div className="lp-nav-logo-mark"><Zap size={14} strokeWidth={2.5} /></div>
            <span className="lp-footer-name">Nexus ERP</span>
          </div>
          <p className="lp-footer-tagline">From Demand to Delivery, Intelligently.</p>
          <p className="lp-footer-copy">© 2026 Nexus ERP. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
