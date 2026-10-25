import { brandingService } from './branding.service.js';
export class BrandingController {
    async getBranding(req, res, next) {
        try {
            const data = await brandingService.getBranding();
            res.json({
                success: true,
                data,
            });
        }
        catch (err) {
            next(err);
        }
    }
    async updateBranding(req, res, next) {
        try {
            const result = await brandingService.updateBranding(req.body, req.user?.id);
            res.json(result);
        }
        catch (err) {
            next(err);
        }
    }
}
export const brandingController = new BrandingController();
//# sourceMappingURL=branding.controller.js.map