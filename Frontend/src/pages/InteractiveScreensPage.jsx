import InteractiveScreensHero      from '../components/site/InteractiveScreensHero'
import InteractiveScreensFeatures  from '../components/site/InteractiveScreensFeatures'
import InteractiveScreensUseCases  from '../components/site/InteractiveScreensUseCases'
import InteractiveScreensDemo      from '../components/site/InteractiveScreensDemo'
import InteractiveScreensSpecs     from '../components/site/InteractiveScreensSpecs'
import InteractiveScreensConfigurations from '../components/site/InteractiveScreensConfigurations'
import InteractiveScreensModels    from '../components/site/InteractiveScreensModels'
import InteractiveScreensComparison from '../components/site/InteractiveScreensComparison'
import InteractiveScreensFAQ       from '../components/site/InteractiveScreensFAQ'
import Testimonials                from '../components/site/Testimonials'
import InteractiveScreensCTA       from '../components/site/InteractiveScreensCTA'
import { usePageMeta } from '../hooks/usePageMeta'

// Picked up automatically once dropped into assets/promos/ (see promoSlides.js) — falls
// back to no og:image tag until then, same graceful-absence pattern used there.
const ogImageMatches = import.meta.glob('../assets/promos/interactive-screens.{jpeg,jpg,png,webp}', { eager: true, import: 'default' })
const ogImage = Object.values(ogImageMatches)[0] ?? null

export default function InteractiveScreensPage() {
  usePageMeta({
    title: 'Interactive Screens — Touch Displays for Classrooms & Boardrooms | Blue-Tech',
    description: 'Interactive touch displays built for classrooms and boardrooms — touch, stylus, built-in camera & mic, and screen mirroring on one screen.',
    ogImage,
  })

  return (
    <div>
      <InteractiveScreensHero />
      <InteractiveScreensFeatures />
      <InteractiveScreensUseCases />
      <InteractiveScreensDemo />
      <InteractiveScreensSpecs />
      <InteractiveScreensConfigurations />
      <InteractiveScreensModels />
      <InteractiveScreensComparison />
      <InteractiveScreensFAQ />
      <Testimonials />
      <InteractiveScreensCTA />
    </div>
  )
}
