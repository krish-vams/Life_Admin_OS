import { isValidUuid } from "../utils/validation.js";

export function validateUuidParam(paramName = "id") {
  return (req, res, next, value) => {
    if (!isValidUuid(value)) {
      return res.status(400).json({ message: `${paramName} must be a valid identifier.` });
    }

    return next();
  };
}
