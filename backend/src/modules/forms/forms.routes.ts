import { Router } from 'express';
import { formsController } from './forms.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requirePermission } from '../../middlewares/permission.middleware.js';

const router = Router();

// All Form Builder routes require authentication
router.use(authenticate);

// 1. Data Sources & Schema Discovery
router.get('/sources/list', requirePermission('form_builder', 'view'), (req, res, next) =>
  formsController.listEligibleDataSources(req, res, next)
);

router.get('/sources/schema', requirePermission('form_builder', 'view'), (req, res, next) =>
  formsController.getSourceSchema(req, res, next)
);

// 2. Lookup LOV Data Provider
router.get('/lookup/data', requirePermission('form_builder', 'view'), (req, res, next) =>
  formsController.getLookupData(req, res, next)
);

// 3. Categories
router.get('/categories', requirePermission('form_builder', 'view'), (req, res, next) =>
  formsController.getCategories(req, res, next)
);

// 4. Import Definition
router.post('/import', requirePermission('form_builder', 'add'), (req, res, next) =>
  formsController.importForm(req, res, next)
);

// 5. List Saved Forms
router.get('/', requirePermission('form_builder', 'view'), (req, res, next) =>
  formsController.listForms(req, res, next)
);

// 6. Create Form
router.post('/', requirePermission('form_builder', 'add'), (req, res, next) =>
  formsController.createForm(req, res, next)
);

// 7. Get Form by ID / Slug
router.get('/:id', requirePermission('form_builder', 'view'), (req, res, next) =>
  formsController.getFormById(req, res, next)
);

// 8. Update Form
router.put('/:id', requirePermission('form_builder', 'edit'), (req, res, next) =>
  formsController.updateForm(req, res, next)
);

// 9. Delete Form
router.delete('/:id', requirePermission('form_builder', 'delete'), (req, res, next) =>
  formsController.deleteForm(req, res, next)
);

// 10. Duplicate Form
router.post('/:id/duplicate', requirePermission('form_builder', 'add'), (req, res, next) =>
  formsController.duplicateForm(req, res, next)
);

// 11. Publish Form
router.post('/:id/publish', requirePermission('form_builder', 'edit'), (req, res, next) =>
  formsController.publishForm(req, res, next)
);

// 12. Unpublish Form
router.post('/:id/unpublish', requirePermission('form_builder', 'edit'), (req, res, next) =>
  formsController.unpublishForm(req, res, next)
);

// 13. Export Form
router.get('/:id/export', requirePermission('form_builder', 'view'), (req, res, next) =>
  formsController.exportForm(req, res, next)
);

// =========================================================================
// RUNTIME DATA CRUD ROUTES
// =========================================================================

// Fetch records for Single, Continuous, or Tabular forms
router.get('/:id/records', requirePermission('form_builder', 'view'), (req, res, next) =>
  formsController.fetchRecords(req, res, next)
);

// Fetch single record with populated master-detail child rows
router.get('/:id/records/:recordId', requirePermission('form_builder', 'view'), (req, res, next) =>
  formsController.getRecordWithDetails(req, res, next)
);

// Insert new record (master + child detail rows in single transaction)
router.post('/:id/records', requirePermission('form_builder', 'add'), (req, res, next) =>
  formsController.createRecordWithDetails(req, res, next)
);

// Update record (master + child detail rows in single transaction)
router.put('/:id/records/:recordId', requirePermission('form_builder', 'edit'), (req, res, next) =>
  formsController.updateRecordWithDetails(req, res, next)
);

// Delete record
router.delete('/:id/records/:recordId', requirePermission('form_builder', 'delete'), (req, res, next) =>
  formsController.deleteRecord(req, res, next)
);

export default router;
