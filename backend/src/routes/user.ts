import { Router, Request, Response, RequestHandler } from 'express';
import { requireAuth } from '../middlewares/auth';
import User from '../models/user';

const router = Router();

router.use(requireAuth);

// PATCH /api/user/theme
router.patch('/theme', (async (req: Request, res: Response) => {
  try {
    const userId = (req as any).auth?.userId;
    const { theme } = req.body;

    if (!['light', 'dark'].includes(theme)) {
      return res.status(400).json({ error: 'Invalid theme value' });
    }

    await User.update({ theme }, { where: { id: userId } });

    res.json({ message: 'Theme updated successfully', theme });
  } catch (error) {
    console.error('Theme update error:', error);
    res.status(500).json({ error: 'Failed to update theme' });
  }
}) as RequestHandler);

export default router;