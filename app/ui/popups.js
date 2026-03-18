function buildSmartPreview(raw) {
  const txt = raw || '';
  const subject = (txt.match(/subject:\s*(.*)/i) || [])[1] || '';
  const from = (txt.match(/from:\s*(.*)/i) || [])[1] || '';
  const date = (txt.match(/date:\s*(.*)/i) || [])[1] || '';
  const links = (txt.match(/https?:\/\/[^\s]+/g) || []).slice(0, 3);
  const emails = (txt.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/ig) || []).slice(0, 3);
  const phones = (txt.match(/(?:\+?\d[\d\s().-]{7,}\d)/g) || []).slice(0, 2);
  const quoted = /\n>\s?/m.test(txt) || /-----Original Message-----/i.test(txt);
  return { subject, from, date, links, emails, phones, quoted };
}

export function initPopups(state, deps) {
  const $ = window.jQuery;
  $('#composePopup').dxPopup({
    title: 'Add Email', width: 640, height: 620, showCloseButton: true,
    contentTemplate: (c) => {
      c.append('<div id="emailModeField"></div><div id="senderField" class="mt-3"></div><div id="subField" class="mt-3"></div><div id="rawBodyField" class="mt-3"></div><div id="smartPreview"></div><div id="linkDeal" class="mt-3"></div><div class="composer-hint">Shortcut: Ctrl/Cmd + Enter to save.</div><div class="compose-actions"><div id="cancelEmailBtn"></div><div id="saveEmailBtn"></div></div>');
      const draft = JSON.parse(sessionStorage.getItem(state.addEmailDraftKey) || '{}');
      const saveDraft = () => {
        const payload = {
          mode: $('#emailModeField').dxRadioGroup('instance').option('value'),
          sender: $('#senderField').dxTextBox('instance').option('value') || '',
          subject: $('#subField').dxTextBox('instance').option('value') || '',
          rawBody: $('#rawBodyField').dxTextArea('instance').option('value') || '',
          dealId: $('#linkDeal').dxSelectBox('instance').option('value') || null
        };
        sessionStorage.setItem(state.addEmailDraftKey, JSON.stringify(payload));
        const smart = buildSmartPreview(payload.rawBody);
        $('#smartPreview').html(`<div class="smart-preview"><div><strong>Detected</strong></div><div>Subject: ${smart.subject || '—'}</div><div>Sender: ${smart.from || '—'}</div><div>Date: ${smart.date || '—'}</div><div>Quoted thread: ${smart.quoted ? 'Yes' : 'No'}</div><div>Links: ${smart.links.join(', ') || '—'}</div><div>Emails: ${smart.emails.join(', ') || '—'}</div><div>Phones: ${smart.phones.join(', ') || '—'}</div></div>`);
      };
      $('#emailModeField').dxRadioGroup({ layout: 'horizontal', items: [{ id: 'raw', label: 'Raw email body' }, { id: 'note', label: 'Internal note/comment' }], displayExpr: 'label', valueExpr: 'id', value: draft.mode || 'raw', onValueChanged: saveDraft });
      $('#senderField').dxTextBox({ label: 'Sender', labelMode: 'static', value: draft.sender || '', onValueChanged: saveDraft });
      $('#subField').dxTextBox({ label: 'Subject', labelMode: 'static', value: draft.subject || '', onValueChanged: saveDraft });
      $('#rawBodyField').dxTextArea({ height: 220, label: 'Paste or type the email here.', labelMode: 'static', value: draft.rawBody || '', onValueChanged: saveDraft });
      $('#linkDeal').dxSelectBox({ dataSource: state.deals, displayExpr: 'title', valueExpr: 'id', placeholder: 'Link to deal (optional)', value: draft.dealId || null, onValueChanged: saveDraft });
      $('#cancelEmailBtn').dxButton({ text: 'Cancel', stylingMode: 'outlined', onClick: () => $('#composePopup').dxPopup('instance').hide() });
      $('#saveEmailBtn').dxButton({ text: 'Save Email', type: 'success', onClick: () => deps.saveCapturedEmail() });
      saveDraft();
    }
  });

  $('#notePopup').dxPopup({ title: 'Add deal note', width: 420, height: 280, showCloseButton: true, contentTemplate: (c) => { c.append('<div id="noteArea"></div><div id="saveNote" class="mt-3"></div>'); $('#noteArea').dxTextArea({ height: 120, placeholder: 'Write note' }); $('#saveNote').dxButton({ text: 'Save note', type: 'success', onClick: () => deps.saveDealNote() }); } });
  $('#dealPopup').dxPopup({ title: 'Create deal', width: 520, height: 470, showCloseButton: true, contentTemplate: (c) => deps.renderDealPopup(c) });
  $('#linkPopup').dxPopup({ title: 'Link emails and deals', width: 520, height: 420, showCloseButton: true, contentTemplate: (c) => deps.renderLinkPopup(c) });
}
