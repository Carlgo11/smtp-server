import context from '../core/ServerContext.js';
import Response from '../models/Response.js';
import events from '../core/Event.js';

/**
 * Handles the MAIL command in the SMTP session.
 *
 * @param {string[]} args - Arguments provided with the MAIL command.
 * @param {object} session - The SMTP session object.
 * @module MAIL
 * @async
 * @returns {Promise<void>}
 */
export default async function MAIL(args, session) {
  try {
    if (session.state !== session.states.STARTTLS)
      return session.send(
        session.tls
          ? new Response(null, 501, [5, 5, 1])
          : new Response('Must issue a STARTTLS command first.', 530, [5, 7, 0]),
      );

    const commandString = args.join(' ');
    const { sender, esmtpParams } = await parseMailFromCommand(commandString);

    validateSMTPUTF8(sender, esmtpParams);

    /**
     * MAIL FROM: command sent
     *
     * @event MAIL
     * @param {Session} session - Current session
     * @param {String} sender - Address of the email sender
     * @param {Object} esmtpParams - ESMTP extensions declared as parameters in the MAIL FROM command.
     */
    events.emit('MAIL', session, sender, esmtpParams);

    // Wait on external validation
    const result = await context.onMAILFROM(sender, session, esmtpParams);

    session.mailFrom = sender;

    // Transition to new session state
    session.transitionTo(session.states.MAIL_FROM);

    session.send(
      result instanceof Response
        ? result
        : new Response(`Originator <${sender}> ok`, 250, [2, 1, 0]),
    );
  } catch (err) {
    session.send(
      err instanceof Response ? err:new Response(null, 451, [4, 3, 0]));
  }
}

/**
 * Parses the MAIL FROM command and extracts the sender and ESMTP parameters.
 *
 * @param {string} command - The full MAIL FROM command string.
 * @returns {{ sender: string|null, esmtpParams: object }}
 * @throws {Response} - Throws an error response if the syntax is invalid.
 */
async function parseMailFromCommand(command) {
  const mailFromRegex = /^FROM:\s*(<[^<>]*>)\s*(.*)$/i;
  const match = command.match(mailFromRegex);

  if (!match) {
    throw new Response('Syntax error in MAIL FROM command', 501, [5, 5, 2]);
  }

  const senderAddress = match[1];
  const esmtpParamsString = match[2];

  const sender = validateAddress(senderAddress);

  const esmtpParams = await parseESMTPParameters(esmtpParamsString);

  return { sender, esmtpParams };
}

/**
 * Validates and retrieves the email address from the MAIL FROM command.
 *
 * @param {string} address - Email address enclosed in angle brackets.
 * @returns {string|null} - Validated email address or null if empty.
 * @throws {Response} - Throws an error response if the address is invalid.
 * @function validateAddress
 * @returns {void}
 */
function validateAddress(address) {
  if (!address.startsWith('<') || !address.endsWith('>')) {
    throw new Response('Syntax error in mailbox address', 501, [5, 5, 2]);
  }

  const email = address.slice(1, -1).trim();

  // Allow empty reverse-path for null sender
  if (email === '') {
    return null;
  }

  // Use a robust email validation function that supports UTF-8
  if (!isValidEmailAddress(email)) {
    throw new Response('Invalid email address', 501, [5, 1, 3]);
  }

  return email;
}

/**
 * Parses ESMTP parameters from the MAIL FROM command.
 *
 * @param {string} paramsString - String containing ESMTP parameters.
 * @returns {object} - Parsed ESMTP parameters.
 * @throws {Response} - Throws an error response if parameters are invalid.
 * @module MAIL
 */
async function parseESMTPParameters(paramsString) {
  const params = {};
  const tokens = paramsString.trim().split(/\s+/);

  await Promise.all(
    tokens.map((token) => {
      const [key, value] = token.split('=');
      const upperKey = key.toUpperCase();

      // Validate known ESMTP parameters
      switch (upperKey) {
        case 'SIZE':
          if (!/^\d+$/.test(value))
            throw new Response('Invalid SIZE parameter', 501, [5, 5, 4]);
          params.SIZE = parseInt(value, 10);
          break;
        case 'BODY':
          if (!/^(7BIT|8BITMIME)$/i.test(value))
            throw new Response('Invalid BODY parameter', 501, [5, 5, 4]);
          params.BODY = value.toUpperCase();
          break;
        case 'SMTPUTF8':
          params.SMTPUTF8 = true;
          break;
        case 'REQUIRETLS':
          params.REQUIRETLS = true;
          break;
        case '':
          break;
        default:
          throw new Response(`Unrecognized parameter: ${key}`, 501, [5, 5, 4]);
      }
    }));

  return params;
}

/**
 * Validates the use of SMTPUTF8 based on the presence of UTF-8 characters.
 *
 * @param {string|null} sender - The sender's email address.
 * @param {object} esmtpParams - Parsed ESMTP parameters.
 * @throws {Response} - Throws an error if SMTPUTF8 is required but not used.
 */
function validateSMTPUTF8(sender, esmtpParams) {
  const containsUTF8 = sender && /[^\x00-\x7F]/.test(sender);

  if (containsUTF8 && !esmtpParams.SMTPUTF8)
    throw new Response(
      'SMTPUTF8 is required for internationalized email addresses', 550,
      [5, 6, 7]);

  // Ensure the server supports SMTPUTF8 if the client requested it
  if (esmtpParams.SMTPUTF8 && !context.extensions.includes('SMTPUTF8'))
    throw new Response('SMTPUTF8 not supported', 504, [5, 5, 4]);
}

/**
 * Validates the email address format according to RFC 6531.
 *
 * @param {string} address - The email address to validate.
 * @returns {boolean} - True if valid, false otherwise.
 */
function isValidEmailAddress(address){
  return address.match(/^(?<localPart>(?<dotString>[0-9a-z!#$%&'*+-\/=?^_`{|}~\u{80}-\u{10FFFF}]+(\.[0-9a-z!#$%&'*+-\/=?^_`\{|\}~\u{80}-\u{10FFFF}]+)*)|(?<quotedString>"([\x20-\x21\x23-\x5B\x5D-\x7E\u{80}-\u{10FFFF}]|\\[\x20-\x7E])*"))(?<!.{64,})@(?<domainOrAddressLiteral>(?<addressLiteral>\[((?<IPv4>\d{1,3}(\.\d{1,3}){3})|(?<IPv6Full>IPv6:[0-9a-f]{1,4}(:[0-9a-f]{1,4}){7})|(?<IPv6Comp>IPv6:([0-9a-f]{1,4}(:[0-9a-f]{1,4}){0,5})?::([0-9a-f]{1,4}(:[0-9a-f]{1,4}){0,5})?)|(?<IPv6v4Full>IPv6:[0-9a-f]{1,4}(:[0-9a-f]{1,4}){5}:\d{1,3}(\.\d{1,3}){3})|(?<IPv6v4Comp>IPv6:([0-9a-f]{1,4}(:[0-9a-f]{1,4}){0,3})?::([0-9a-f]{1,4}(:[0-9a-f]{1,4}){0,3}:)?\d{1,3}(\.\d{1,3}){3})|(?<generalAddressLiteral>[a-z0-9-]*[[a-z0-9]:[\x21-\x5A\x5E-\x7E]+))\])|(?<Domain>(?!.{256,})(([0-9a-z\u{80}-\u{10FFFF}]([0-9a-z-\u{80}-\u{10FFFF}]*[0-9a-z\u{80}-\u{10FFFF}])?))(\.([0-9a-z\u{80}-\u{10FFFF}]([0-9a-z-\u{80}-\u{10FFFF}]*[0-9a-z\u{80}-\u{10FFFF}])?))*))$/iu) !== null;
}
