import { Router } from 'express';
import { NotificationController } from '../../controllers/index.js';
import { NotificationService } from '../../service/index.js';
import { NotificationRepository } from '../../repositories/index.js';

const notificationRepository = new NotificationRepository();
const notificationService = new NotificationService(notificationRepository);
const notificationController = new NotificationController(notificationService);

export const notificationRouter = Router();

notificationRouter.get(
  '/',
  notificationController.list.bind(notificationController),
);

notificationRouter.patch(
  '/read-all',
  notificationController.markAllAsRead.bind(notificationController),
);

notificationRouter.get(
  '/:id',
  notificationController.getById.bind(notificationController),
);

notificationRouter.patch(
  '/:id/read',
  notificationController.markAsRead.bind(notificationController),
);
