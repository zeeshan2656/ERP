import { Router } from 'express';
import { queriesController } from './queries.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requirePermission } from '../../middlewares/permission.middleware.js';

const router = Router();

// All query routes require authentication
router.use(authenticate);

// 1. List Queries
router.get('/', requirePermission('query_builder', 'view'), (req, res, next) =>
  queriesController.listQueries(req, res, next)
);

// 2. Preview Unsaved Visual Query
router.post('/preview', requirePermission('query_builder', 'view'), (req, res, next) =>
  queriesController.previewQuery(req, res, next)
);

// 3. Generate SQL Preview
router.post('/generate-sql', requirePermission('query_builder', 'view'), (req, res, next) =>
  queriesController.generateSql(req, res, next)
);

// 4. Create Query
router.post('/', requirePermission('query_builder', 'add'), (req, res, next) =>
  queriesController.createQuery(req, res, next)
);

// 5. Get Distinct Categories
router.get('/categories', requirePermission('query_builder', 'view'), (req, res, next) =>
  queriesController.getCategories(req, res, next)
);

// 6. Get Query by ID / Slug
router.get('/:id', requirePermission('query_builder', 'view'), (req, res, next) =>
  queriesController.getQueryById(req, res, next)
);

// 6. Update Query
router.put('/:id', requirePermission('query_builder', 'edit'), (req, res, next) =>
  queriesController.updateQuery(req, res, next)
);

// 7. Delete Query
router.delete('/:id', requirePermission('query_builder', 'delete'), (req, res, next) =>
  queriesController.deleteQuery(req, res, next)
);

// 8. Duplicate Query
router.post('/:id/duplicate', requirePermission('query_builder', 'add'), (req, res, next) =>
  queriesController.duplicateQuery(req, res, next)
);

// 9. Execute Saved Query (with parameters, for reports, LOVs, and previews)
router.post('/:id/execute', requirePermission('query_builder', 'view'), (req, res, next) =>
  queriesController.executeSavedQuery(req, res, next)
);

// 10. Query Metadata for Consumer Modules (Report Builder, LOVs)
router.get('/:id/metadata', requirePermission('query_builder', 'view'), (req, res, next) =>
  queriesController.getQueryMetadata(req, res, next)
);

// 11. Execution History
router.get('/:id/history', requirePermission('query_builder', 'view'), (req, res, next) =>
  queriesController.getExecutionHistory(req, res, next)
);

export default router;
