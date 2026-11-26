import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middlewares/auth.middleware.js';
import { adminController } from '../controllers/admin.controller.js';

const adminRoutes = Router();

adminRoutes.post('/api/admin/parking-lots', requireAuth, requireAdmin, adminController.create);
adminRoutes.get('/api/admin/dashboard', requireAuth, requireAdmin, adminController.dashboard);

export default adminRoutes;
