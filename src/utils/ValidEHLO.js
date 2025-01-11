import { isIPv4, isIPv6 } from 'net'; // Node.js built-in module for IP validation

/**
 * Validate EHLO value (domain or IP literal).
 *
 * @param {string} ehloValue - The value provided after the EHLO command.
 * @returns {boolean} - Returns true if the value is valid, otherwise false.
 */
export default function isValidEHLO(ehloValue) {
  // Check if it's an IP literal enclosed in square brackets
  if (ehloValue.startsWith('[') && ehloValue.endsWith(']')) {
    const ip = ehloValue.slice(1, -1); // Remove the brackets
    return isIPv4(ip) || isIPv6(ip.replace('IPV6:', '')); // Check if it's a valid IPv4 or IPv6
  } else {
    if (isIPv4(ehloValue) || isIPv6(ehloValue)) return false;
  }

  // Check if it's a valid domain
  const domainRegex = /^[a-zA-Z0-9-]{1,63}(\.[a-zA-Z0-9-]{1,63})+$/;

  // Validate the domain according to DNS rules
  if (domainRegex.test(ehloValue)) {
    const labels = ehloValue.split('.');
    // Ensure no label starts or ends with a hyphen and no label is longer than 63 characters
    return labels.every(
      (label) =>
        !label.startsWith('-') && !label.endsWith('-') && label.length <= 63
    );
  }

  // If it's neither a valid domain nor a valid IP literal
  return false;
}
