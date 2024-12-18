// Worker for downloading panorama tiles off thread with caching for both Blobs and ImageBitmaps

const imageBitmapCache = new Map() // In-memory cache for ImageBitmap objects

onmessage = async (event) => {
  const imageURL = event.data.imageURL

  try {
    // Check the ImageBitmap cache first
    if (imageBitmapCache.has(imageURL)) {
      const cachedImageBitmap = imageBitmapCache.get(imageURL)
      postMessage({
        imageURL: imageURL,
        imageBitmap: cachedImageBitmap // Return the cached ImageBitmap
      })
      return
    }

    // Try to get the image from the Blob cache
    const cachedResponse = await caches.match(imageURL)

    if (cachedResponse) {
      // Image found in Blob cache, use it
      const blob = await cachedResponse.blob()
      const imageBitmap = await createImageBitmap(blob, {
        imageOrientation: 'flipY'
      })

      // Cache the ImageBitmap
      imageBitmapCache.set(imageURL, imageBitmap)

      postMessage({
        imageURL: imageURL,
        imageBitmap: imageBitmap
      })
      return
    }

    // Image not in cache, fetch it
    const response = await fetch(imageURL)

    // Check for successful response
    if (!response.ok) {
      throw new Error(
        `Failed to fetch image: ${response.status} ${response.statusText}`
      )
    }

    // Cache the response for future use
    const cache = await caches.open('panorama-tiles-cache')
    // Important: Clone the response since it can only be consumed once
    await cache.put(imageURL, response.clone())

    // Get the blob and create the ImageBitmap
    const blob = await response.blob()
    const imageBitmap = await createImageBitmap(blob, {
      imageOrientation: 'flipY'
    })

    // Cache the ImageBitmap
    imageBitmapCache.set(imageURL, imageBitmap)

    postMessage({
      imageURL: imageURL,
      imageBitmap: imageBitmap
    })
  } catch (error) {
    console.error('Error in worker:', error)
    // Optionally send an error message back to the main thread
    postMessage({
      imageURL: imageURL,
      error: error.message
    })
  }
}
