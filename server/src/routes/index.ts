import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { ContractController } from '../controllers/contract.controller';
import { PaymentController } from '../controllers/payment.controller';
import { UserController } from '../controllers/user.controller';
import { authenticate, authorize } from '../middlewares/auth';
import { authLimiter } from '../middlewares/security';
import { Role } from '@prisma/client';

const router = Router();

const authController = new AuthController();
const contractController = new ContractController();
const paymentController = new PaymentController();
const userController = new UserController();

// ============ AUTH ROUTES ============
router.post('/auth/register', authLimiter, authController.register);
router.post('/auth/login', authLimiter, authController.login);
router.post('/auth/logout', authenticate, authController.logout);
router.post('/auth/refresh', authController.refresh);
router.get('/auth/me', authenticate, authController.me);
router.post('/auth/forgot-password', authLimiter, authController.requestPasswordReset);
router.post('/auth/reset-password', authLimiter, authController.resetPassword);

// 2FA
router.post('/auth/2fa/setup', authenticate, authController.setup2FA);
router.post('/auth/2fa/verify', authenticate, authController.verify2FA);
router.post('/auth/2fa/disable', authenticate, authController.disable2FA);

// ============ CONTRACT ROUTES ============
router.get('/contracts', authenticate, contractController.list);
router.get('/contracts/dashboard', authenticate, contractController.dashboard);
router.get('/contracts/calendar', authenticate, contractController.calendar);
router.get('/contracts/:id', authenticate, contractController.findById);
router.post('/contracts/:id/comments', authenticate, contractController.addComment);
router.post('/contracts', authenticate, authorize(Role.ADMIN, Role.GESTOR, Role.ENGENHEIRO), contractController.create);
router.put('/contracts/:id', authenticate, authorize(Role.ADMIN, Role.GESTOR, Role.ENGENHEIRO), contractController.update);
router.delete('/contracts/:id', authenticate, authorize(Role.ADMIN, Role.GESTOR), contractController.delete);

// ============ PAYMENT ROUTES ============
router.get('/payments/contract/:contractId', authenticate, paymentController.listByContract);
router.post('/payments', authenticate, authorize(Role.ADMIN, Role.GESTOR, Role.FINANCEIRO), paymentController.create);
router.put('/payments/:id', authenticate, authorize(Role.ADMIN, Role.GESTOR, Role.FINANCEIRO), paymentController.update);
router.delete('/payments/:id', authenticate, authorize(Role.ADMIN, Role.GESTOR), paymentController.delete);

// ============ USER ROUTES ============
router.get('/users', authenticate, authorize(Role.ADMIN), userController.list);
router.get('/users/:id', authenticate, authorize(Role.ADMIN), userController.findById);
router.put('/users/:id', authenticate, authorize(Role.ADMIN), userController.update);
router.put('/users/change-password', authenticate, userController.changePassword);
router.delete('/users/:id', authenticate, authorize(Role.ADMIN), userController.deactivate);

export { router };
