

const IV_LENGTH_BYTES = 12;

let cachedKeyPromise: Promise<CryptoKey> | null = null;

function importKey(base64Key: string): Promise<CryptoKey> {
  if (!cachedKeyPromise) {
    const raw = base64ToBytes(base64Key);
    if (raw.length !== 32) {
      throw new Error(`Encryption key must decode to 32 bytes for AES-256, got ${raw.length}.`);
    }
    cachedKeyPromise = crypto.subtle.importKey('raw', raw, { name: 'AES-GCM' }, false, [
      'encrypt',
      'decrypt',
    ]);
  }
  return cachedKeyPromise;
}

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export async function encryptText(plaintext: string, base64Key: string): Promise<string> {
  const key = await importKey(base64Key);
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH_BYTES));
  const encoded = new TextEncoder().encode(plaintext);

  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded);

  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ciphertext), iv.length);
  return bytesToBase64(combined);
}

export async function decryptText(base64Payload: string, base64Key: string): Promise<string> {
  const key = await importKey(base64Key);
  const combined = base64ToBytes(base64Payload);
  if (combined.length <= IV_LENGTH_BYTES) {
    throw new Error('Encrypted payload is too short to contain an IV and ciphertext.');
  }

  const iv = combined.slice(0, IV_LENGTH_BYTES);
  const ciphertext = combined.slice(IV_LENGTH_BYTES);

  const plaintextBuffer = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);
  return new TextDecoder().decode(plaintextBuffer);
}
