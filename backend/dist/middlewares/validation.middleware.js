import { ZodError } from 'zod';
export function validate(schema) {
    return async (req, res, next) => {
        try {
            if (schema.body) {
                req.body = await schema.body.parseAsync(req.body);
            }
            if (schema.query) {
                req.query = (await schema.query.parseAsync(req.query));
            }
            if (schema.params) {
                req.params = (await schema.params.parseAsync(req.params));
            }
            next();
        }
        catch (error) {
            if (error instanceof ZodError) {
                res.status(422).json({
                    success: false,
                    message: 'Validation failed',
                    errors: error.errors.map((e) => ({
                        field: e.path.join('.'),
                        message: e.message,
                    })),
                });
                return;
            }
            next(error);
        }
    };
}
//# sourceMappingURL=validation.middleware.js.map