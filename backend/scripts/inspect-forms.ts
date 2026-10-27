import { formsService } from '../src/modules/forms/forms.service.js';

async function main() {
  const result = await formsService.listForms({ limit: 50 });
  console.log('ALL FORMS IN DB:');
  for (const f of result.forms) {
    const fullForm = await formsService.getFormById(f.id);
    console.log({
      id: fullForm.id,
      name: fullForm.name,
      form_type: fullForm.form_type,
      display_mode: fullForm.display_mode,
      canvasWidth: (fullForm.canvas_layout as any)?.width,
      canvasPadding: (fullForm.canvas_layout as any)?.padding,
      canvasGap: (fullForm.canvas_layout as any)?.gap,
      controls: (fullForm.controls as any)?.map((c: any) => ({ name: c.name, type: c.type, colSpan: c.colSpan, width: c.styling?.width })),
      masterDetailConfig: fullForm.master_detail_config,
    });
  }
  process.exit(0);
}

main().catch(console.error);
