import { CircleCheck } from 'lucide-react'
import { FEATURE_ICONS } from './featureIcons.js'

const BY_KEY = Object.fromEntries(FEATURE_ICONS.map((i) => [i.key, i.Icon]))

export default function FeatureIcon({ icon, size = 20 }) {
  const Icon = BY_KEY[icon] ?? CircleCheck
  return <Icon size={size} aria-hidden="true" />
}
