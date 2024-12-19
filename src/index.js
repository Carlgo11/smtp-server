/**
 * @file SMTP Server Project
 * @description A customizable and lightweight SMTP server built for handling email transmissions efficiently.
 * This server is designed to be modular, allowing for easy customization through event handling and callbacks.
 * @license GPLv3
 */

import Server from './core/SMTPServer.js';
import Logger from './utils/Logger.js';
import Listen from './core/Event.js';
import Response from './models/Response.js';
import {registerCommand} from './commands/CommandHandler.js';
/**
 * @exports SMTPServer
 * @exports Response
 * @exports Listen
 * @exports Logger
 */
export { Server, Response, Listen, Logger , registerCommand};
