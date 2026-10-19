import "./Header.css";

function Header({ title, subtitle }) {
  return (
    <header className="header">
      <div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>

      <div className="header-right">
        <div className="notification">♢</div>

        <div className="profile">
          <div className="profile-avatar">A</div>

          <div>
            <strong>Administrator</strong>
            <span>Transplant Coordinator</span>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;