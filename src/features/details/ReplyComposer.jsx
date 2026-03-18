import { useMemo, useRef } from 'react';
import TextBox from 'devextreme-react/text-box';
import Button from 'devextreme-react/button';
import SelectBox from 'devextreme-react/select-box';

function applyMacroPlaceholders(content, macroContext = {}) {
  return content
    .replaceAll('{{customer_name}}', macroContext.customerName || 'Customer')
    .replaceAll('{{order_number}}', macroContext.orderNumber || 'ORDER-UNKNOWN')
    .replaceAll('{{rma_number}}', macroContext.rmaNumber || 'RMA-UNKNOWN');
}

/**
 * @param {{
 *  draft: {to:string,cc:string,subject:string,body:string},
 *  macroTemplates?: Array<{id:string,title:string,category:string,body:string,isArchived?:boolean}>,
 *  macroContext?: {customerName?:string,orderNumber?:string,rmaNumber?:string},
 *  onUseMacro?: (templateId: string) => void,
 *  onChange: (field: 'to'|'cc'|'subject'|'body', value: string) => void,
 *  onSend: () => void,
 *  onCancel: () => void
 * }} props
 */
export default function ReplyComposer({ draft, macroTemplates = [], macroContext = {}, onUseMacro, onChange, onSend, onCancel }) {
  const bodyRef = useRef(/** @type {HTMLTextAreaElement | null} */ (null));

  const macroOptions = useMemo(
    () =>
      macroTemplates
        .filter((template) => !template.isArchived)
        .map((template) => ({
          ...template,
          displayLabel: `${template.category} · ${template.title}`
        })),
    [macroTemplates]
  );

  const handleShortcut = (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault();
      onSend();
    }
  };

  const insertMacroAtCursor = (templateId) => {
    if (!templateId) return;
    const template = macroTemplates.find((item) => item.id === templateId);
    if (!template) return;

    const hydratedMacro = applyMacroPlaceholders(template.body, macroContext);
    const textarea = bodyRef.current;
    const currentValue = draft.body ?? '';

    if (!textarea) {
      onChange('body', `${currentValue}${currentValue ? '\n\n' : ''}${hydratedMacro}`);
      onUseMacro?.(templateId);
      return;
    }

    const selectionStart = textarea.selectionStart ?? currentValue.length;
    const selectionEnd = textarea.selectionEnd ?? currentValue.length;
    const prefix = currentValue.slice(0, selectionStart);
    const suffix = currentValue.slice(selectionEnd);
    const nextBody = `${prefix}${hydratedMacro}${suffix}`;

    onChange('body', nextBody);
    onUseMacro?.(templateId);

    requestAnimationFrame(() => {
      const nextCursor = selectionStart + hydratedMacro.length;
      textarea.focus();
      textarea.setSelectionRange(nextCursor, nextCursor);
    });
  };

  return (
    <section className="reply-composer" onKeyDown={handleShortcut}>
      <TextBox label="To" labelMode="floating" stylingMode="filled" className="mb-2" value={draft.to} onValueChanged={(event) => onChange('to', event.value ?? '')} />
      <TextBox label="Cc" labelMode="floating" stylingMode="filled" className="mb-2" value={draft.cc} onValueChanged={(event) => onChange('cc', event.value ?? '')} />
      <TextBox label="Subject" labelMode="floating" stylingMode="filled" className="mb-2" value={draft.subject} onValueChanged={(event) => onChange('subject', event.value ?? '')} />
      <SelectBox
        label="Macro template"
        labelMode="floating"
        stylingMode="filled"
        className="mb-2"
        dataSource={macroOptions}
        valueExpr="id"
        displayExpr="displayLabel"
        placeholder="Insert a macro at the cursor"
        searchEnabled
        onValueChanged={(event) => insertMacroAtCursor(event.value)}
      />
      <label className="composer-textarea-label" htmlFor="reply-body">Body</label>
      <textarea
        id="reply-body"
        ref={bodyRef}
        className="composer-textarea"
        value={draft.body}
        onChange={(event) => onChange('body', event.target.value)}
        rows={8}
      />
      <div className="compose-actions">
        <Button text="Send" type="default" stylingMode="contained" onClick={onSend} />
        <Button text="Cancel" stylingMode="text" onClick={onCancel} />
      </div>
      <div className="composer-hint">Tip: press Cmd/Ctrl + Enter to send.</div>
      <div className="composer-hint">Placeholders: {'{{customer_name}}'}, {'{{order_number}}'}, {'{{rma_number}}'}.</div>
    </section>
  );
}
