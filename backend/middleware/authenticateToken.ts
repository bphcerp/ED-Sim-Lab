import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import crypto from 'crypto'
import dotenv from 'dotenv';

dotenv.config();

const algorithm = 'aes-256-cbc';
const secretKey = process.env.JWT_SECRET_KEY!
const iv = crypto.randomBytes(16);

export function encrypt(text: string): { iv: string; encryptedData: string } {
    const cipher = crypto.createCipheriv(algorithm, Buffer.from(secretKey, 'utf-8'), iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return { iv: iv.toString('hex'), encryptedData: encrypted };
}

export function decrypt(encryptedData: string, iv: string): string {
    const decipher = crypto.createDecipheriv(algorithm, Buffer.from(secretKey, 'utf-8'), Buffer.from(iv, 'hex'));
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

const client = new OAuth2Client(process.env.OAUTH_CID);

export const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
  const encryptedToken: { encryptedData : string, iv : string }= req.cookies.token;

  if (!encryptedToken) {
    res.status(440).json({ authenticated: false, message: 'No token found' });
    return;
  }

  const token = decrypt(encryptedToken.encryptedData,encryptedToken.iv)

  jwt.verify(token, process.env.JWT_SECRET_KEY!, (err: any,decoded: any) => {
    if (err || !decoded) {
      client.verifyIdToken({
        idToken: token,
        audience: process.env.OAUTH_CID,
      })
      .then(() => {
        next();  // Proceed to the next middleware or route handler
      })
      .catch((error) => {
        console.error(error)
        res.status(400).json({ authenticated: false, message: 'Invalid or expired token' });
      });
    } else {
      next();  // Token is valid, move to next middleware or route handler
    }
  });
};