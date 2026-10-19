export default function ErrorState({ message }) {
  return <p role="alert" className="error">{message || 'เกิดข้อผิดพลาด'}</p>;
}