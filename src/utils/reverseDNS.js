import dns from 'node:dns/promises';

export default async function reverseDNS(ip, timeoutMs = 1000) {
  // If timeoutMs is 0, let the DNS query run indefinitely
  if (timeoutMs === 0) {
    try {
      const res = await dns.reverse(ip);
      return Array.isArray(res) ? res[0] : res;
    } catch (e) {
      return null;
    }
  }

  // Otherwise, create a timed promise that rejects after timeoutMs
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error('DNS reverse lookup timed out'));
    }, timeoutMs);
  });

  // Race the DNS request against the timed promise
  try {
    const res = await Promise.race([dns.reverse(ip), timeoutPromise]);
    return Array.isArray(res) ? res[0] : res;
  } catch (e) {
    return null;
  }
}
