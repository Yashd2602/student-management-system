// Server-side validation for student payloads. Keeps validation logic in one
// place so both POST (create) and PUT (update) can reuse it.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MOBILE_RE = /^[0-9]{7,15}$/; // digits only, 7-15 long
const GENDERS = ['Male', 'Female', 'Other'];

export function validateStudent(req, res, next) {
  const errors = {};
  const body = req.body || {};

  const name = (body.name || '').trim();
  if (!name) errors.name = 'Name is required';
  else if (name.length > 120) errors.name = 'Name must be 120 characters or fewer';

  const course = (body.course || '').trim();
  if (!course) errors.course = 'Course is required';

  const year = Number(body.year);
  if (!body.year && body.year !== 0) errors.year = 'Year is required';
  else if (!Number.isInteger(year) || year < 1 || year > 10)
    errors.year = 'Year must be a whole number between 1 and 10';

  const dob = (body.date_of_birth || '').trim();
  if (!dob) errors.date_of_birth = 'Date of birth is required';
  else if (Number.isNaN(Date.parse(dob))) errors.date_of_birth = 'Date of birth is invalid';
  else if (new Date(dob) > new Date()) errors.date_of_birth = 'Date of birth cannot be in the future';

  const email = (body.email || '').trim();
  if (!email) errors.email = 'Email is required';
  else if (!EMAIL_RE.test(email)) errors.email = 'Email is not valid';

  const mobile = (body.mobile || '').trim();
  if (!mobile) errors.mobile = 'Mobile number is required';
  else if (!MOBILE_RE.test(mobile)) errors.mobile = 'Mobile must be 7-15 digits';

  const gender = (body.gender || '').trim();
  if (!gender) errors.gender = 'Gender is required';
  else if (!GENDERS.includes(gender)) errors.gender = 'Gender must be Male, Female or Other';

  // address is optional
  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ message: 'Validation failed', errors });
  }
  next();
}
