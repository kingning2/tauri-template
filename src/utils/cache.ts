import { isString } from './general'

import type { LocalCacheKey } from './cache-types'

class LocalCache {
  setCache<T = unknown>(key: LocalCacheKey, value: T) {
    if (typeof window === 'undefined') {
      return undefined
    }
    localStorage.setItem(key, JSON.stringify(value))
  }

  getCache<T = unknown>(key: LocalCacheKey): T | null {
    if (typeof window === 'undefined') {
      return null
    }
    const value = localStorage.getItem(key)
    return isString(value) ? JSON.parse(value) : value
  }
}

export const localCache = new LocalCache()
