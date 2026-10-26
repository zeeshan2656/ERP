import { Request, Response, NextFunction } from 'express';
import { formsService } from './forms.service.js';
import {
  CreateFormSchema,
  UpdateFormSchema,
  FormRecordQuerySchema,
  LookupQuerySchema,
} from './forms.schema.js';

export class FormsController {
  /**
   * GET /api/v1/forms
   * List saved forms
   */
  async listForms(req: Request, res: Response, next: NextFunction) {
    try {
      const { search, category, status, form_type, page, limit } = req.query;
      const result = await formsService.listForms({
        search: search ? String(search) : undefined,
        category: category ? String(category) : undefined,
        status: status ? String(status) : undefined,
        form_type: form_type ? String(form_type) : undefined,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
      });

      return res.json({
        success: true,
        data: result.forms,
        pagination: result.pagination,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/forms/categories
   * Get categories
   */
  async getCategories(req: Request, res: Response, next: NextFunction) {
    try {
      const categories = await formsService.getCategories();
      return res.json({
        success: true,
        data: categories,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/forms/sources/list
   * List eligible data sources
   */
  async listEligibleDataSources(req: Request, res: Response, next: NextFunction) {
    try {
      const sources = await formsService.listEligibleDataSources();
      return res.json({
        success: true,
        data: sources,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/forms/sources/schema
   * Get schema for source
   */
  async getSourceSchema(req: Request, res: Response, next: NextFunction) {
    try {
      const { type, name } = req.query;
      if (!name) {
        return res.status(400).json({ success: false, message: 'Source name is required.' });
      }

      const sourceType = (type as any) || 'table';
      const schema = await formsService.getSourceSchema(sourceType, String(name));
      return res.json({
        success: true,
        data: schema,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/forms/lookup/data
   * Get LOV data
   */
  async getLookupData(req: Request, res: Response, next: NextFunction) {
    try {
      const query = LookupQuerySchema.parse(req.query);
      const data = await formsService.getLookupData(query);
      return res.json({
        success: true,
        data,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/forms/:id
   * Get form by ID / slug
   */
  async getFormById(req: Request, res: Response, next: NextFunction) {
    try {
      const form = await formsService.getFormById(req.params.id);
      return res.json({
        success: true,
        data: form,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/forms
   * Create new form
   */
  async createForm(req: Request, res: Response, next: NextFunction) {
    try {
      const input = CreateFormSchema.parse(req.body);
      const userId = (req as any).user?.id;
      const form = await formsService.createForm(input, userId);
      return res.status(201).json({
        success: true,
        data: form,
        message: `Form '${form.name}' created successfully.`,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PUT /api/v1/forms/:id
   * Update existing form
   */
  async updateForm(req: Request, res: Response, next: NextFunction) {
    try {
      const input = UpdateFormSchema.parse(req.body);
      const userId = (req as any).user?.id;
      const form = await formsService.updateForm(req.params.id, input, userId);
      return res.json({
        success: true,
        data: form,
        message: `Form '${form.name}' updated successfully.`,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /api/v1/forms/:id
   * Delete form
   */
  async deleteForm(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await formsService.deleteForm(req.params.id);
      return res.json(result);
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/forms/:id/duplicate
   * Duplicate form
   */
  async duplicateForm(req: Request, res: Response, next: NextFunction) {
    try {
      const { name } = req.body;
      const userId = (req as any).user?.id;
      const duplicated = await formsService.duplicateForm(req.params.id, name, userId);
      return res.status(201).json({
        success: true,
        data: duplicated,
        message: `Form duplicated as '${duplicated.name}'.`,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/forms/:id/publish
   * Publish form
   */
  async publishForm(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.id;
      const published = await formsService.publishForm(req.params.id, userId);
      return res.json({
        success: true,
        data: published,
        message: `Form '${published.name}' published successfully.`,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/forms/:id/unpublish
   * Unpublish form
   */
  async unpublishForm(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.id;
      const unpublished = await formsService.unpublishForm(req.params.id, userId);
      return res.json({
        success: true,
        data: unpublished,
        message: `Form '${unpublished.name}' reverted to draft.`,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/forms/:id/export
   * Export form definition
   */
  async exportForm(req: Request, res: Response, next: NextFunction) {
    try {
      const exported = await formsService.exportForm(req.params.id);
      return res.json({
        success: true,
        data: exported,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/forms/import
   * Import form definition
   */
  async importForm(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.id;
      const imported = await formsService.importForm(req.body, userId);
      return res.status(201).json({
        success: true,
        data: imported,
        message: `Form '${imported.name}' imported successfully.`,
      });
    } catch (err) {
      next(err);
    }
  }

  // =========================================================================
  // RUNTIME DATA CRUD CONTROLLERS
  // =========================================================================

  /**
   * GET /api/v1/forms/:id/records
   * Fetch records for runtime single, continuous, or tabular forms
   */
  async fetchRecords(req: Request, res: Response, next: NextFunction) {
    try {
      const query = FormRecordQuerySchema.parse(req.query);
      const result = await formsService.fetchRecords(req.params.id, query);
      return res.json({
        success: true,
        data: result.data,
        pagination: result.pagination,
        primaryKey: result.primaryKey,
        tableName: result.tableName,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/forms/:id/records/:recordId
   * Get single master record with populated detail grid child rows
   */
  async getRecordWithDetails(req: Request, res: Response, next: NextFunction) {
    try {
      const { id, recordId } = req.params;
      const result = await formsService.getRecordWithDetails(id, recordId);
      return res.json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/forms/:id/records
   * Insert new master record + optional detail rows in transaction
   */
  async createRecordWithDetails(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const payload = req.body; // { master: {...}, details: {...} }
      const result = await formsService.saveRecordWithDetails(id, payload);
      return res.status(201).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PUT /api/v1/forms/:id/records/:recordId
   * Update master record + synchronize detail rows in transaction
   */
  async updateRecordWithDetails(req: Request, res: Response, next: NextFunction) {
    try {
      const { id, recordId } = req.params;
      const payload = req.body;
      const result = await formsService.saveRecordWithDetails(id, payload, recordId);
      return res.json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /api/v1/forms/:id/records/:recordId
   * Delete record
   */
  async deleteRecord(req: Request, res: Response, next: NextFunction) {
    try {
      const { id, recordId } = req.params;
      const result = await formsService.deleteRecord(id, recordId);
      return res.json(result);
    } catch (err) {
      next(err);
    }
  }
}

export const formsController = new FormsController();
