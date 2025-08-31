import {Router} from 'express';
import {
  getUsers,
  createUser,
  updateUser,
  toggleWholesaler,
  deleteUser
} from '../controllers/userController.js';

export const router = Router();

router.get('/', getUsers);
router.post('/', createUser);
router.put('/:id', updateUser);
router.patch('/:id/wholesaler', toggleWholesaler);
router.delete('/:id', deleteUser);


