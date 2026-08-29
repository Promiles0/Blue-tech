import gamingBuilds    from '../assets/promos/gaming-builds.jpeg'
import businessLaptops from '../assets/promos/business-laptops.jpeg'
import studentDeals    from '../assets/promos/student-deals.jpeg'
import tradeIn         from '../assets/promos/trade-in.jpeg'
import carePlans       from '../assets/promos/care-plans.jpeg'

// `slug` drives both the carousel link (/promotions/:slug) and the
// placeholder landing page's lookup, so keep this the single source of
// truth for both. `gradient` stays as the overlay tint / fallback while
// `image` loads.
export const PROMO_SLIDES = [
  {
    slug: 'gaming-builds',
    title: 'Built for the frame rate.',
    subtitle: 'High-refresh gaming laptops, curated.',
    image: gamingBuilds,
    gradient: 'linear-gradient(135deg, #161c3a 0%, #354380 60%, #5a73b0 100%)',
  },
  {
    slug: 'business-laptops',
    title: 'Work that keeps up with you.',
    subtitle: 'Thin, quiet, built for long days.',
    image: businessLaptops,
    gradient: 'linear-gradient(135deg, #12142a 0%, #22284a 55%, #354380 100%)',
  },
  {
    slug: 'student-deals',
    title: 'Back to class, sorted.',
    subtitle: 'Student pricing on select laptops.',
    image: studentDeals,
    gradient: 'linear-gradient(135deg, #0f1730 0%, #2a3568 55%, #4a5f9e 100%)',
  },
  {
    slug: 'trade-in',
    title: 'Trade up, not down.',
    subtitle: 'Get credit toward your next machine.',
    image: tradeIn,
    gradient: 'linear-gradient(135deg, #16123a 0%, #2f2f66 55%, #4d4a91 100%)',
  },
  {
    slug: 'care-plans',
    title: 'Protection that outlasts the box.',
    subtitle: 'Extended warranty & care plans.',
    image: carePlans,
    gradient: 'linear-gradient(135deg, #0e1a2f 0%, #1d3350 55%, #2f567f 100%)',
  },
]
