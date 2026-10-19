import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listEquipment, createLoan } from '../services/loanService.js';
import { validateLoanForm } from '../utils/loanForm.js';

export default function NewLoanPage() {
  const nav = useNavigate();
  const [equipment, setEquipment] = useState([]);
  const [form, setForm] = useState({
    borrowerName: '', equipmentId: '', quantity: 1,
    borrowDate: '', returnDate: '', purpose: '',
  });
  const [errors, setErrors] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    listEquipment()
      .then(setEquipment)
      .catch(err => setErrors([err.message || 'โหลดรายการอุปกรณ์ไม่สำเร็จ']));
  }, []);

  function set(k, v) { setForm(prev => ({ ...prev, [k]: v })); }

  async function onSubmit(e) {
    e.preventDefault();
    const clientErrors = validateLoanForm(form, equipment);
    if (clientErrors.length > 0) { setErrors(clientErrors); return; }

    setErrors([]); setSubmitting(true);
    try {
      const created = await createLoan({ ...form, quantity: Number(form.quantity) });
      nav(`/loans/${created.id}`);
    } catch (err) {
      setErrors(err.details ?? [err.message]);
    } finally {
      setSubmitting(false);
    }
  }

  const selectedEq = equipment.find(e => e.id === form.equipmentId);

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow dark">LOANS · NEW</p>
          <h1>ขอยืมอุปกรณ์</h1>
          <p>ยืมได้ไม่เกิน 14 วัน และไม่เกินจำนวนคงเหลือ</p>
        </div>
      </div>

      <section className="panel form-panel">
        <form onSubmit={onSubmit} noValidate>
          <label className="field">ชื่อผู้ยืม
            <input value={form.borrowerName}
              onChange={e => set('borrowerName', e.target.value)} />
          </label>
          <label className="field">อุปกรณ์
            <select value={form.equipmentId}
              onChange={e => set('equipmentId', e.target.value)}>
              <option value="">-- เลือก --</option>
              {equipment.map(eq => (
                <option key={eq.id} value={eq.id} disabled={eq.availableQty <= 0}>
                  {eq.name} (เหลือ {eq.availableQty}/{eq.totalQty})
                </option>
              ))}
            </select>
          </label>
          <label className="field">จำนวน
            <input type="number" min="1" max={selectedEq?.availableQty ?? 10}
              value={form.quantity} onChange={e => set('quantity', e.target.value)} />
          </label>
          <label className="field">วันยืม
            <input type="date" value={form.borrowDate}
              onChange={e => set('borrowDate', e.target.value)} />
          </label>
          <label className="field">วันคืน
            <input type="date" value={form.returnDate}
              onChange={e => set('returnDate', e.target.value)} />
          </label>
          <label className="field">วัตถุประสงค์
            <textarea rows="3" value={form.purpose}
              onChange={e => set('purpose', e.target.value)} />
          </label>
          {errors.length > 0 && (
            <ul role="alert" className="error">
              {errors.map((er, i) => <li key={i}>{er}</li>)}
            </ul>
          )}
          <button className="button primary" disabled={submitting}>
            {submitting ? 'กำลังส่ง…' : 'ส่งคำขอยืม'}
          </button>
        </form>
      </section>
    </>
  );
}