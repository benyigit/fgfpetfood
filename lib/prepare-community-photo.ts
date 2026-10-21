// Resize before upload so mobile originals fit the serverless request limit.
export async function prepareCommunityPhoto(file: File): Promise<Blob> {
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    if (image.naturalWidth * image.naturalHeight > 60_000_000) throw new Error('Please choose a photo smaller than 60 megapixels.');
    const scale = Math.min(1, 1600 / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Your browser could not prepare this photo. Please try another browser.');
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/webp', .86));
    if (!blob || blob.size > 3.5 * 1024 * 1024) throw new Error('Please choose a smaller photo.');
    return blob;
  } catch (e) {
    if (e instanceof Error && e.name !== 'EncodingError') throw e;
    throw new Error('We could not read this photo. Please choose another image.');
  } finally { URL.revokeObjectURL(url); }
}
