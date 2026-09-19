import { Link } from "react-router-dom";
export default function Footer() {
  return (
    <footer className="app-footer">

      
      <div className="footer-content">

        
        
        <span>© {new Date().getFullYear()} CrimeVision</span>

        
        
        <Link to="/privacy" className="footer-link">
          Privacy Policy
        </Link>
      </div>
    </footer>
  );
}
