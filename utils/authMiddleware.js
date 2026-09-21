import jwt from 'jsonwebtoken'
import { secretKey } from '../jwtConfig.js'

function authenticateToken(req, res, next) {
    const authHeader = req.header('Authorization')
    if (!authHeader) {
        return res.status(401).json({ error: 'Authorization Missing' })
    }

    const [bearer, token] = authHeader.split(' ')
    if (bearer !== 'Bearer' || !token) {
        return res.status(401).json({ error: 'Invalid Token format' })
    }

    jwt.verify(token, secretKey, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Forbidden Invalid Token' })
        }
        req.user = user
        next()
    })
}

export default authenticateToken
