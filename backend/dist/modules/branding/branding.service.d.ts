import { UpdateBrandingInput } from './branding.schema.js';
export declare class BrandingService {
    getBranding(): Promise<{
        productName: string;
        companyName: string;
        tagline: string;
        footerText: string;
        logoLightUrl: string;
        logoDarkUrl: string;
        faviconUrl: string;
        loginBackgroundUrl: string;
    }>;
    updateBranding(input: UpdateBrandingInput, actorUserId?: string): Promise<{
        success: boolean;
        message: string;
        data: {
            productName: string;
            companyName: string;
            tagline: string;
            footerText: string;
            logoLightUrl: string;
            logoDarkUrl: string;
            faviconUrl: string;
            loginBackgroundUrl: string;
        };
    }>;
}
export declare const brandingService: BrandingService;
