// Animation features for framer-motion's <LazyMotion>: loaded right after the first paint
// instead of inside the main bundle. domMax because the site uses layout animations
// (category pills, cart list, saved addresses).
import { domMax } from 'framer-motion'
export default domMax
