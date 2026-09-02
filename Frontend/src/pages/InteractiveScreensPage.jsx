import InteractiveScreensHero      from '../components/site/InteractiveScreensHero'
import InteractiveScreensFeatures  from '../components/site/InteractiveScreensFeatures'
import InteractiveScreensUseCases  from '../components/site/InteractiveScreensUseCases'
import InteractiveScreensDemo      from '../components/site/InteractiveScreensDemo'
import InteractiveScreensSpecs     from '../components/site/InteractiveScreensSpecs'
import InteractiveScreensConfigurations from '../components/site/InteractiveScreensConfigurations'
import InteractiveScreensModels    from '../components/site/InteractiveScreensModels'
import InteractiveScreensCTA       from '../components/site/InteractiveScreensCTA'

export default function InteractiveScreensPage() {
  return (
    <div>
      <InteractiveScreensHero />
      <InteractiveScreensFeatures />
      <InteractiveScreensUseCases />
      <InteractiveScreensDemo />
      <InteractiveScreensSpecs />
      <InteractiveScreensConfigurations />
      <InteractiveScreensModels />
      <InteractiveScreensCTA />
    </div>
  )
}
