const express = require('express');
const router = express.Router();
const {
  getCurrentBranch,
  getAllBranches,
  getBranch,
  createBranch,
  updateBranch,
  deleteBranch
} = require('../controllers/branchController');
const { protect, authorize } = require('../middleware/auth');

// All routes are protected
router.use(protect);

// Current branch route
router.get('/current', getCurrentBranch);

// Admin only routes for viewing all branches
router.get('/', authorize('admin'), getAllBranches);
router.get('/:id', authorize('admin', 'central_staff'), getBranch);

// Admin only routes
router.post('/', authorize('admin'), createBranch);
router.put('/:id', authorize('admin'), updateBranch);
router.delete('/:id', authorize('admin'), deleteBranch);

module.exports = router;
