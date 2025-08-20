import axios from 'axios';

export async function fetchImageAsBase64(url: string): Promise<{ base64: string; mimeType: string }> {
  const response = await axios.get<ArrayBuffer>(url, { responseType: 'arraybuffer', timeout: 15000 });
  const contentType = response.headers['content-type'] || 'image/jpeg';
  const buffer = Buffer.from(response.data);
  const base64 = buffer.toString('base64');
  return { base64, mimeType: contentType };
}
