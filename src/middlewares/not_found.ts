import { Request, Response, NextFunction } from "express"

const not_found = (req: Request, res: Response, next: NextFunction): void => {
    res.status(404).json({msg: "Page not found, check url and try again" })
    next()
}

export default not_found