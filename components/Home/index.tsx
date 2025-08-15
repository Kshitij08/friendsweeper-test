'use client'

import { HomePage } from './HomePage'

export function Demo() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 space-y-8">
      <h1 className="text-3xl font-bold text-center">
        Base Farcaster MiniApp Template
      </h1>
      <HomePage />
    </div>
  )
}
