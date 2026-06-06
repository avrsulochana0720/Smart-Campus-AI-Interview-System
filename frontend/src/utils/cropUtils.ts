export const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous'); // needed to avoid cross-origin issues on CodeSandbox
    image.src = url;
  });

export async function getCroppedImg(
  imageSrc: string,
  pixelCrop: { x: number; y: number; width: number; height: number }
): Promise<Blob | null> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return null;
  }

  // Set a maximum dimension for the profile photo to optimize performance (e.g., 500px)
  const maxDimension = 500;
  let targetWidth = pixelCrop.width;
  let targetHeight = pixelCrop.height;

  if (targetWidth > maxDimension || targetHeight > maxDimension) {
    const aspectRatio = targetWidth / targetHeight;
    if (aspectRatio > 1) {
      targetWidth = maxDimension;
      targetHeight = maxDimension / aspectRatio;
    } else {
      targetHeight = maxDimension;
      targetWidth = maxDimension * aspectRatio;
    }
  }

  // set canvas size to match the target crop size
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  // draw the cropped image onto the canvas with scaling if necessary
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    targetWidth,
    targetHeight
  );

  // return it as a blob with optimized quality
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob);
    }, 'image/jpeg', 0.85); // 0.85 quality is a good balance for profile photos
  });
}
