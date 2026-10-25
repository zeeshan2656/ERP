import { Request, Response, NextFunction } from 'express';
import { queriesService } from './queries.service.js';
import { sqlGeneratorService } from './sql-generator.service.js';
import {
  CreateQuerySchema,
  UpdateQuerySchema,
  ExecuteQuerySchema,
  VisualQueryDefinition,
} from './queries.schema.js';
import { logAuditEvent } from '../../middlewares/audit.middleware.js';

export class QueriesController {
  async listQueries(req: Request, res: Response, next: NextFunction) {
    try {
      const { search, category, status, page, limit } = req.query;
      const result = await queriesService.listQueries({
        search: search as string,
        category: category as string,
        status: status as string,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
      });

      res.json({
        success: true,
        data: result.items,
        pagination: result.pagination,
      });
    } catch (err) {
      next(err);
    }
  }

  async getCategories(req: Request, res: Response, next: NextFunction) {
    try {
      const categories = await queriesService.getCategories();
      res.json({
        success: true,
        data: categories,
      });
    } catch (err) {
      next(err);
    }
  }

  async getQueryById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const queryItem = await queriesService.getQueryById(id);
      res.json({
        success: true,
        data: queryItem,
      });
    } catch (err) {
      next(err);
    }
  }

  async createQuery(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = CreateQuerySchema.parse(req.body);
      const userId = req.user?.id || 'system';

      const created = await queriesService.createQuery(
        {
          name: parsed.name,
          description: parsed.description,
          category: parsed.category,
          status: parsed.status,
          visualDefinition: parsed.visualDefinition as unknown as VisualQueryDefinition,
          parameters: parsed.parameters as any,
        },
        userId
      );

      // Audit log
      await logAuditEvent({
        userId,
        action: 'QUERY_CREATED',
        entityType: 'saved_query',
        entityId: created.id,
        newValues: { name: created.name, slug: created.slug },
        ipAddress: req.ip,
      });

      res.status(201).json({
        success: true,
        data: created,
        message: `Query '${created.name}' created successfully.`,
      });
    } catch (err) {
      next(err);
    }
  }

  async updateQuery(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const parsed = UpdateQuerySchema.parse(req.body);
      const userId = req.user?.id || 'system';

      const updated = await queriesService.updateQuery(
        id,
        {
          name: parsed.name,
          description: parsed.description,
          category: parsed.category,
          status: parsed.status,
          visualDefinition: parsed.visualDefinition as unknown as VisualQueryDefinition | undefined,
          parameters: parsed.parameters as any,
        },
        userId
      );

      await logAuditEvent({
        userId,
        action: 'QUERY_UPDATED',
        entityType: 'saved_query',
        entityId: updated.id,
        newValues: { name: updated.name },
        ipAddress: req.ip,
      });

      res.json({
        success: true,
        data: updated,
        message: `Query '${updated.name}' updated successfully.`,
      });
    } catch (err) {
      next(err);
    }
  }

  async deleteQuery(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user?.id || 'system';

      const result = await queriesService.deleteQuery(id);

      await logAuditEvent({
        userId,
        action: 'QUERY_DELETED',
        entityType: 'saved_query',
        entityId: id,
        ipAddress: req.ip,
      });

      res.json({
        success: true,
        message: result.message,
      });
    } catch (err) {
      next(err);
    }
  }

  async duplicateQuery(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user?.id || 'system';

      const duplicated = await queriesService.duplicateQuery(id, userId);

      await logAuditEvent({
        userId,
        action: 'QUERY_DUPLICATED',
        entityType: 'saved_query',
        entityId: duplicated.id,
        newValues: { originalId: id, newName: duplicated.name },
        ipAddress: req.ip,
      });

      res.status(201).json({
        success: true,
        data: duplicated,
        message: `Query duplicated as '${duplicated.name}'.`,
      });
    } catch (err) {
      next(err);
    }
  }

  async previewQuery(req: Request, res: Response, next: NextFunction) {
    try {
      const { visualDefinition, parameters, parameterValues } = req.body;
      if (!visualDefinition) {
        res.status(400).json({ success: false, message: 'visualDefinition is required for preview.' });
        return;
      }

      const params = parameterValues || parameters || {};
      const result = await queriesService.previewQuery(visualDefinition, params);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async generateSql(req: Request, res: Response, next: NextFunction) {
    try {
      const { visualDefinition, parameters, parameterValues } = req.body;
      if (!visualDefinition) {
        res.status(400).json({ success: false, message: 'visualDefinition is required.' });
        return;
      }

      const params = parameterValues || parameters || {};
      const result = sqlGeneratorService.generate(visualDefinition, params);
      res.json({
        success: true,
        sql: result.sql,
        params: result.params,
        warnings: result.warnings,
      });
    } catch (err) {
      next(err);
    }
  }

  async executeSavedQuery(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const parsed = ExecuteQuerySchema.parse(req.body);
      const userId = req.user?.id;

      const params = parsed.parameterValues || parsed.parameters || {};
      const result = await queriesService.executeSavedQuery(
        id,
        params,
        { limit: parsed.limit, offset: parsed.offset },
        userId
      );

      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async getQueryMetadata(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const q = await queriesService.getQueryById(id);

      res.json({
        success: true,
        data: {
          id: q.id,
          name: q.name,
          slug: q.slug,
          category: q.category,
          outputColumns: q.outputColumns,
          parameters: q.parameters,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  async getExecutionHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const history = await queriesService.getExecutionHistory(id);

      res.json({
        success: true,
        data: history,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const queriesController = new QueriesController();
