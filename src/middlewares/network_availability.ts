import { Request, Response, NextFunction } from 'express';
import dns from 'dns';

const check_network_availability = async (req: Request, res: Response, next: NextFunction) => {
    try {
        dns.resolve('www.google.com', (err) => {
            if (err) {
                return res.status(503).json({msgor: 'Network unavailable, check network connection and try again' });
            } else {
                next();
            }
        });
    } catch (error) {
        // Error occurred while checking network status
        console.error('Error checking network availability:', error);
        return res.status(500).json({msgor: 'Internal server error' });
    }
};

export default check_network_availability;
