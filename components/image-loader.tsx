import Image from 'next/image'
import { useState } from 'react'

export default function OptimizedImage({
  src,
  alt,
  ...props
}: {
  src: string
  alt: string
  [key: string]: any
}) {
  const [isLoading, setLoading] = useState(true)

  return (
    <Image
      {...props}
      src={src}
      alt={alt}
      quality={75}
      className={`
        duration-700 ease-in-out
        ${isLoading ? 'blur-sm grayscale' : 'blur-0 grayscale-0'}
        ${props.className || ''}
      `}
      onLoadingComplete={() => setLoading(false)}
    />
  )
}
