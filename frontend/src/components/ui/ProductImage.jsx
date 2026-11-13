import { useState } from 'react'
import { UtensilsCrossed } from 'lucide-react'

/**
 * Product image with a graceful onError fallback to a neutral utensils glyph.
 */
export default function ProductImage({ src, alt = '', className = '', imgClassName = '' }) {
  const [failed, setFailed] = useState(!src)

  return (
    <div className={`relative overflow-hidden bg-lex-800 ${className}`}>
      {!failed && src ? (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onError={() => setFailed(true)}
          className={`h-full w-full object-cover ${imgClassName}`}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-lex-800 to-lex-900 text-lex-gold/40">
          <UtensilsCrossed className="h-1/3 max-h-8 w-1/3 max-w-8" />
        </div>
      )}
    </div>
  )
}
