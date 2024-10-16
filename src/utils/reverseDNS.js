import dns from 'node:dns/promises';

export default async function reverseDNS(ip, timeoutMs = 1000) {
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error('DNS reverse lookup timed out'));
    }, timeoutMs);
  });

  try {
    const res = await Promise.race([dns.reverse(ip), timeoutPromise]);
    return Array.isArray(res) ? res[0] : res;
  } catch (e) {
    return null;
  }
}
