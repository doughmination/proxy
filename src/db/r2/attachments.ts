/**
  * R2 Attachements
  */

export async function storeAttachment(
  bucket: R2Bucket,
  routeId: string,
  messageId: string,
  filename: string,
  contentType: string,
  data: ArrayBuffer,
): Promise<string> {
  // Do not allow a supplied filename to create a different path.
  const safeFilename =
    filename.replace(/[^a-zA-Z0-9._-]/g, "_") || "attachment";

  const key = `${routeId}/${messageId}/${safeFilename}`;

  await bucket.put(key, data, {
    httpMetadata: {
      contentType,
    },
  });

  return key;
}
