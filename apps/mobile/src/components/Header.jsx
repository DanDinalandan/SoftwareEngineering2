import FloatingBell from './FloatingBell.jsx';

export default function Header({ title, onBellClick }) {
  return (
    <header className="top-header">
      <h1 className="header-title">{title}</h1>
      
      <FloatingBell onClick={onBellClick} />
    </header>
  );
}