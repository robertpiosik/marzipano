const imageBitmapCache = new Map();

onmessage = async (event) => {
  const imageURL = event.data.imageURL;

  try {
    if (imageBitmapCache.has(imageURL)) {
      const imageBitmap = imageBitmapCache.get(imageURL);
      postMessage({
        imageURL,
        imageBitmap,
      });
      return;
    }

    const response = await fetch(imageURL);

    if (!response.ok) {
      throw new Error(
        `Failed to fetch image: ${response.status} ${response.statusText}`
      );
    }

    const blob = await response.blob();

    const imageBitmap = await createImageBitmap(blob, {
      imageOrientation: 'flipY',
    });

    imageBitmapCache.set(imageURL, imageBitmap);

    postMessage({
      imageURL,
      imageBitmap,
    });
  } catch {}
};
