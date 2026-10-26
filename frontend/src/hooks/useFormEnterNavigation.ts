import React, { useEffect, useCallback } from 'react';

export interface FormEnterNavigationOptions {
  containerRef: React.RefObject<HTMLElement | null>;
  enabled?: boolean;
  onValidateField?: (fieldElement: HTMLElement) => { isValid: boolean; message?: string };
  onShowValidationToast?: (msg: string) => void;
}

/**
 * Global Enter-Key Navigation Hook (Oracle APEX & MS Access pattern)
 * Pressing Enter or NumpadEnter moves focus to the next logical data-entry field,
 * performing validation on the current field, skipping disabled/read-only/hidden elements,
 * and preserving native multiline newline behavior in <textarea>.
 */
export function useFormEnterNavigation({
  containerRef,
  enabled = true,
  onValidateField,
  onShowValidationToast,
}: FormEnterNavigationOptions) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!enabled) return;

      const isEnter = e.key === 'Enter' || e.code === 'NumpadEnter';
      if (!isEnter) return;

      const target = e.target as HTMLElement;
      if (!target || !containerRef.current || !containerRef.current.contains(target)) {
        return;
      }

      // 1. Textarea conflict avoidance: standard Enter in <textarea> should insert a newline!
      if (target.tagName.toLowerCase() === 'textarea' && !e.ctrlKey && !e.metaKey) {
        return; // Allow native multiline typing
      }

      // 2. Buttons conflict avoidance: Enter on an explicit button triggers its click action
      if (target.tagName.toLowerCase() === 'button' || target.getAttribute('role') === 'button') {
        return; // Allow native button trigger
      }

      // 3. Data-grid cells have their own dedicated row/column enter navigation handler
      if (target.hasAttribute('data-grid-cell')) {
        return;
      }

      // 4. Validate current input if validation is required
      if (onValidateField) {
        const result = onValidateField(target);
        if (!result.isValid) {
          e.preventDefault();
          e.stopPropagation();
          if (onShowValidationToast && result.message) {
            onShowValidationToast(result.message);
          }
          // Highlight invalid field
          target.classList.add('form-input-error');
          target.focus();
          return;
        } else {
          target.classList.remove('form-input-error');
        }
      }

      // Native HTML5 validation fallback
      if (target instanceof HTMLInputElement || target instanceof HTMLSelectElement) {
        if (!target.checkValidity()) {
          e.preventDefault();
          e.stopPropagation();
          target.reportValidity();
          target.focus();
          return;
        }
      }

      // 5. Query all eligible navigation targets inside the form container
      const selector = [
        'input:not([type="hidden"]):not([disabled]):not([readonly])',
        'select:not([disabled]):not([readonly])',
        'textarea:not([disabled]):not([readonly])',
      ].join(', ');

      const allInputs = Array.from(
        containerRef.current.querySelectorAll<HTMLElement>(selector)
      ).filter((el) => {
        // Exclude elements inside detail grids (they have their own table navigation)
        if (el.closest('[data-grid-container="true"]')) return false;
        // Exclude hidden elements or decorative items
        const isVisible = el.offsetWidth > 0 || el.offsetHeight > 0 || el.getClientRects().length > 0;
        return isVisible && !el.hasAttribute('data-nav-skip');
      });

      const currentIndex = allInputs.indexOf(target);
      if (currentIndex === -1) return;

      // Prevent accidental form submission
      e.preventDefault();
      e.stopPropagation();

      // Advance to next eligible input
      if (currentIndex < allInputs.length - 1) {
        const nextInput = allInputs[currentIndex + 1];
        nextInput.focus();
        if (nextInput instanceof HTMLInputElement && nextInput.type === 'text') {
          nextInput.select();
        }
      } else {
        // At final field: blur or cycle or focus save button
        target.blur();
      }
    },
    [containerRef, enabled, onValidateField, onShowValidationToast]
  );

  useEffect(() => {
    const node = containerRef.current || document;
    node.addEventListener('keydown', handleKeyDown as any);
    return () => {
      node.removeEventListener('keydown', handleKeyDown as any);
    };
  }, [containerRef, handleKeyDown]);
}

/**
 * Dedicated Enter-Key navigation handler for editable cells inside Master-Detail grids.
 * Moves focus to next editable column -> next row -> or automatically adds a new detail row on the last cell!
 */
export function handleDetailGridEnterNavigation({
  event,
  gridId,
  rowIndex,
  colIndex,
  totalRows,
  columns,
  allowAdd = true,
  onAddRow,
}: {
  event: React.KeyboardEvent;
  gridId: string;
  rowIndex: number;
  colIndex: number;
  totalRows: number;
  columns: Array<{ field: string; editable?: boolean }>;
  allowAdd?: boolean;
  onAddRow?: () => void;
}) {
  const isEnter = event.key === 'Enter' || event.code === 'NumpadEnter';
  if (!isEnter) return;

  event.preventDefault();
  event.stopPropagation();

  // Find editable columns
  const editableCols = columns.map((c, idx) => ({ ...c, originalIdx: idx })).filter((c) => c.editable !== false);
  const currentEditableIdx = editableCols.findIndex((c) => c.originalIdx === colIndex);

  // If there's a next column in the current row
  if (currentEditableIdx < editableCols.length - 1) {
    const nextCol = editableCols[currentEditableIdx + 1];
    const nextCell = document.querySelector<HTMLInputElement>(
      `[data-grid-id="${gridId}"][data-row-idx="${rowIndex}"][data-col-idx="${nextCol.originalIdx}"]`
    );
    if (nextCell) {
      nextCell.focus();
      nextCell.select?.();
      return;
    }
  }

  // At the end of the row, move to the next row
  if (rowIndex < totalRows - 1) {
    const firstCol = editableCols[0];
    const nextRowCell = document.querySelector<HTMLInputElement>(
      `[data-grid-id="${gridId}"][data-row-idx="${rowIndex + 1}"][data-col-idx="${firstCol ? firstCol.originalIdx : 0}"]`
    );
    if (nextRowCell) {
      nextRowCell.focus();
      nextRowCell.select?.();
      return;
    }
  }

  // If on the very last cell of the last row and insertion is allowed, automatically add a new row!
  if (rowIndex === totalRows - 1 && allowAdd && onAddRow) {
    onAddRow();
    // Focus the first cell of the newly added row on next microtask
    setTimeout(() => {
      const firstCol = editableCols[0];
      const newCell = document.querySelector<HTMLInputElement>(
        `[data-grid-id="${gridId}"][data-row-idx="${totalRows}"][data-col-idx="${firstCol ? firstCol.originalIdx : 0}"]`
      );
      if (newCell) {
        newCell.focus();
        newCell.select?.();
      }
    }, 50);
  }
}
