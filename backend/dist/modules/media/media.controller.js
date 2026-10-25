import { mediaService } from './media.service.js';
import { AppError } from '../../middlewares/error.middleware.js';
export class MediaController {
    async upload(req, res, next) {
        try {
            if (!req.file) {
                throw new AppError('No file uploaded. Please attach a file.', 400);
            }
            const category = req.body.category || 'uploads';
            const result = await mediaService.uploadFile(req.file.buffer, req.file.originalname, req.file.mimetype, category, req.user?.id);
            res.status(201).json({
                success: true,
                message: 'File uploaded successfully to persistent storage.',
                data: result,
            });
        }
        catch (err) {
            next(err);
        }
    }
    async streamMedia(req, res, next) {
        try {
            // Collect wildcard or full relative path from params (e.g. 'branding/logo.svg')
            const filePath = req.params[0] || req.params.filename;
            if (!filePath) {
                throw new AppError('File path is required.', 400);
            }
            const { stream, mimeType } = await mediaService.getFileByPath(filePath);
            res.setHeader('Content-Type', mimeType);
            res.setHeader('Cache-Control', 'public, max-age=86400, immutable');
            stream.pipe(res);
        }
        catch (err) {
            next(err);
        }
    }
}
export const mediaController = new MediaController();
//# sourceMappingURL=media.controller.js.map