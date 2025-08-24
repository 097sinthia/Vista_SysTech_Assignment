import { Request, Response, NextFunction } from 'express';

export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();
  
  // Log request
  console.log(`📥 ${req.method} ${req.originalUrl} - ${new Date().toISOString()}`);
  
  // Log request body for non-GET requests
  if (req.method !== 'GET' && req.body && Object.keys(req.body).length > 0) {
    console.log('📦 Request Body:', JSON.stringify(req.body, null, 2));
  }
  
  // Override res.end to log response
  const originalEnd = res.end;
  res.end = function(chunk?: any, encoding?: any, cb?: () => void) {
    const duration = Date.now() - start;
    const statusCode = res.statusCode;
    const statusEmoji = statusCode >= 200 && statusCode < 300 ? '✅' : 
                       statusCode >= 400 && statusCode < 500 ? '⚠️' : '❌';
    
    console.log(`${statusEmoji} ${req.method} ${req.originalUrl} - ${statusCode} (${duration}ms)`);
    
    return originalEnd.call(this, chunk, encoding, cb);
  };
  
  next();
};
