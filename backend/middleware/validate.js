import { validationResult } from "express-validator";

// Place after express-validator rules. Returns 400 with a list of field errors.
const validate = (req, res, next) => {
  const result = validationResult(req);
  if (result.isEmpty()) return next();

  const errors = result.array().map((e) => ({ field: e.path, message: e.msg }));
  return res.status(400).json({ success: false, message: errors[0].message, errors });
};

export default validate;
