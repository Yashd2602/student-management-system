import { Router } from 'express';
import { upload } from '../middleware/upload.js';
import { validateStudent } from '../middleware/validate.js';
import {
  listStudents,
  getStudent,
  createStudent,
  updateStudent,
  deleteStudent,
  analytics,
} from '../controllers/studentController.js';

const router = Router();

// Bonus analytics endpoint (declared before /:id so "meta" isn't treated as an id).
router.get('/meta/analytics', analytics);

router.get('/', listStudents);                                  // GET    /students
router.get('/:id', getStudent);                                 // GET    /students/:id
router.post('/', upload.single('photo'), validateStudent, createStudent);   // POST   /students
router.put('/:id', upload.single('photo'), validateStudent, updateStudent); // PUT    /students/:id
router.delete('/:id', deleteStudent);                           // DELETE /students/:id

export default router;
