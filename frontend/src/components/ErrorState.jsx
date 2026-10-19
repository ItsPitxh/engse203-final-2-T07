export default function ErrorState({ message }) {
  return (
    <section className="state-card error-state">
      <p role="alert" className="error">{message || 'เกิดข้อผิดพลาด'}</p>
    </section>
  );
}