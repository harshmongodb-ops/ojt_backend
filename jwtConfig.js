// Secret key used to sign/verify JWTs (see utils/jwtUtils.js and utils/authMiddleware.js).
//
// Generated fresh from crypto on every server start, exactly as taught - which
// also means every previously-issued token stops verifying after a restart.
// If you want tokens to survive a restart, move this into .env as JWT_SECRET
// and read it with process.env.JWT_SECRET instead.

import crypto from 'crypto'

export const secretKey = crypto.randomBytes(32).toString('hex')
