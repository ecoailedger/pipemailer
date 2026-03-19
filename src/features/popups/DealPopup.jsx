import { useEffect, useMemo, useState } from 'react';
import Popup from 'devextreme-react/popup';
import TextBox from 'devextreme-react/text-box';
import NumberBox from 'devextreme-react/number-box';
import SelectBox from 'devextreme-react/select-box';
import Button from 'devextreme-react/button';

function getInitialDealForm(stages) {
  return { title: '', contact: '', stage: stages[0] ?? 'Leads', value: 10000 };
}

function getInitialReturnForm(stages, emailId = null) {
  return {
    rmaNumber: '',
    orderNumber: '',
    sku: '',
    quantity: 1,
    returnReason: '',
    condition: '',
    disposition: '',
    refundAmount: 0,
    goodsReceivedDate: '',
    inspectionOutcome: '',
    refundMethod: '',
    creditNoteId: '',
    refundPostedAt: '',
    stage: stages[0] ?? 'Leads',
    emailId
  };
}

/**
 * @param {{
 *  open: boolean,
 *  stages: string[],
 *  defaultEmailId?: number | null,
 *  onClose: () => void,
 *  onSave: (payload: Record<string, unknown>) => void
 * }} props
 */
export default function DealPopup({ open, stages, defaultEmailId = null, onClose, onSave }) {
  const [entityType, setEntityType] = useState('deal');
  const [dealForm, setDealForm] = useState(getInitialDealForm(stages));
  const [returnForm, setReturnForm] = useState(getInitialReturnForm(stages, defaultEmailId));
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setEntityType('deal');
    setDealForm(getInitialDealForm(stages));
    setReturnForm(getInitialReturnForm(stages, defaultEmailId));
    setError('');
  }, [open, stages, defaultEmailId]);

  const title = useMemo(() => (entityType === 'return' ? 'Create Return Case' : 'Create Deal'), [entityType]);

  const save = () => {
    if (entityType === 'deal') {
      if (!dealForm.title?.trim() || !dealForm.contact?.trim()) {
        setError('Deal name and contact are required.');
        return;
      }
      setError('');
      onSave({ ...dealForm, entityType: 'deal' });
      return;
    }

    const requiredTextFields = [
      'rmaNumber',
      'orderNumber',
      'sku',
      'returnReason',
      'condition',
      'disposition'
    ];

    const hasMissingText = requiredTextFields.some((field) => !String(returnForm[field] ?? '').trim());
    if (hasMissingText) {
      setError('All return case fields are required.');
      return;
    }

    if (!Number.isFinite(Number(returnForm.quantity)) || Number(returnForm.quantity) <= 0) {
      setError('Quantity must be greater than zero.');
      return;
    }

    if (!Number.isFinite(Number(returnForm.refundAmount)) || Number(returnForm.refundAmount) < 0) {
      setError('Refund amount must be zero or higher.');
      return;
    }

    setError('');
    onSave({ ...returnForm, entityType: 'return' });
  };

  return (
    <Popup visible={open} title={title} width={520} height={560} onHiding={onClose} showCloseButton>
      <div className="p-4">
        <SelectBox
          items={[
            { id: 'deal', label: 'Deal' },
            { id: 'return', label: 'Return case' }
          ]}
          displayExpr="label"
          valueExpr="id"
          label="Create"
          labelMode="floating"
          stylingMode="filled"
          className="mb-3"
          value={entityType}
          onValueChanged={(event) => {
            setEntityType(event.value ?? 'deal');
            setError('');
          }}
        />

        {entityType === 'deal' ? (
          <>
            <TextBox label="Deal name" labelMode="floating" stylingMode="filled" className="mb-3" value={dealForm.title} onValueChanged={(event) => setDealForm((prev) => ({ ...prev, title: event.value ?? '' }))} />
            <TextBox label="Contact" labelMode="floating" stylingMode="filled" className="mb-3" value={dealForm.contact} onValueChanged={(event) => setDealForm((prev) => ({ ...prev, contact: event.value ?? '' }))} />
            <SelectBox items={stages} label="Stage" labelMode="floating" stylingMode="filled" className="mb-3" value={dealForm.stage} onValueChanged={(event) => setDealForm((prev) => ({ ...prev, stage: event.value ?? prev.stage }))} />
            <NumberBox label="Value" labelMode="floating" stylingMode="filled" format="$ #,##0" className="mb-3" value={dealForm.value} onValueChanged={(event) => setDealForm((prev) => ({ ...prev, value: Number(event.value) || 0 }))} />
          </>
        ) : (
          <>
            <TextBox label="RMA Number" labelMode="floating" stylingMode="filled" className="mb-3" value={returnForm.rmaNumber} onValueChanged={(event) => setReturnForm((prev) => ({ ...prev, rmaNumber: event.value ?? '' }))} />
            <TextBox label="Order Number" labelMode="floating" stylingMode="filled" className="mb-3" value={returnForm.orderNumber} onValueChanged={(event) => setReturnForm((prev) => ({ ...prev, orderNumber: event.value ?? '' }))} />
            <TextBox label="SKU" labelMode="floating" stylingMode="filled" className="mb-3" value={returnForm.sku} onValueChanged={(event) => setReturnForm((prev) => ({ ...prev, sku: event.value ?? '' }))} />
            <NumberBox label="Quantity" labelMode="floating" stylingMode="filled" className="mb-3" value={returnForm.quantity} onValueChanged={(event) => setReturnForm((prev) => ({ ...prev, quantity: Number(event.value) || 0 }))} />
            <TextBox label="Return Reason" labelMode="floating" stylingMode="filled" className="mb-3" value={returnForm.returnReason} onValueChanged={(event) => setReturnForm((prev) => ({ ...prev, returnReason: event.value ?? '' }))} />
            <TextBox label="Condition" labelMode="floating" stylingMode="filled" className="mb-3" value={returnForm.condition} onValueChanged={(event) => setReturnForm((prev) => ({ ...prev, condition: event.value ?? '' }))} />
            <TextBox label="Disposition" labelMode="floating" stylingMode="filled" className="mb-3" value={returnForm.disposition} onValueChanged={(event) => setReturnForm((prev) => ({ ...prev, disposition: event.value ?? '' }))} />
            <TextBox label="Goods Received Date" mode="date" labelMode="floating" stylingMode="filled" className="mb-3" value={returnForm.goodsReceivedDate} onValueChanged={(event) => setReturnForm((prev) => ({ ...prev, goodsReceivedDate: event.value ?? '' }))} />
            <TextBox label="Inspection Outcome" labelMode="floating" stylingMode="filled" className="mb-3" value={returnForm.inspectionOutcome} onValueChanged={(event) => setReturnForm((prev) => ({ ...prev, inspectionOutcome: event.value ?? '' }))} />
            <TextBox label="Refund Method" labelMode="floating" stylingMode="filled" className="mb-3" value={returnForm.refundMethod} onValueChanged={(event) => setReturnForm((prev) => ({ ...prev, refundMethod: event.value ?? '' }))} />
            <TextBox label="Credit Note ID" labelMode="floating" stylingMode="filled" className="mb-3" value={returnForm.creditNoteId} onValueChanged={(event) => setReturnForm((prev) => ({ ...prev, creditNoteId: event.value ?? '' }))} />
            <TextBox label="Refund Posted Timestamp" mode="datetime-local" labelMode="floating" stylingMode="filled" className="mb-3" value={returnForm.refundPostedAt} onValueChanged={(event) => setReturnForm((prev) => ({ ...prev, refundPostedAt: event.value ?? '' }))} />
            <NumberBox label="Refund Amount" labelMode="floating" stylingMode="filled" format="$ #,##0.00" className="mb-3" value={returnForm.refundAmount} onValueChanged={(event) => setReturnForm((prev) => ({ ...prev, refundAmount: Number(event.value) || 0 }))} />
            <SelectBox items={stages} label="Stage" labelMode="floating" stylingMode="filled" className="mb-3" value={returnForm.stage} onValueChanged={(event) => setReturnForm((prev) => ({ ...prev, stage: event.value ?? prev.stage }))} />
          </>
        )}

        {error ? <div style={{ color: '#d93025', marginBottom: 8 }}>{error}</div> : null}

        <div className="d-flex gap-2 mt-4">
          <Button text="Save" type="default" stylingMode="contained" onClick={save} />
          <Button text="Cancel" stylingMode="text" onClick={onClose} />
        </div>
      </div>
    </Popup>
  );
}
