import React from "react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="w-full border-t border-surface-container-high/60 bg-surface-container-low/60 backdrop-blur-sm py-8 px-6 sm:px-12 mt-auto z-10 text-on-surface-variant font-poppins">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 text-[13px]">
        {/* Brand & Copyright */}
        <div className="flex flex-col items-center md:items-start text-center md:text-left gap-1">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-primary-container to-surface-tint flex items-center justify-center text-white font-extrabold text-xs shadow-sm">
              A
            </div>
            <span className="font-bold text-on-surface text-base tracking-tight leading-none">
              ACN. Events
            </span>
          </div>
          <p className="text-xs text-on-surface-variant/80 mt-1">
            Connecting minds, accelerating communities.
          </p>
          <p className="text-xs text-on-surface-variant/70 mt-0.5">
            © 2026 ACN. Global Events. All rights reserved.
          </p>
        </div>

        {/* Links Navigation */}
        <div className="flex flex-wrap justify-center items-center gap-6 font-medium text-xs sm:text-sm text-on-surface-variant">
          <Link
            to="/events"
            className="hover:text-primary-container transition-colors"
          >
            Events
          </Link>
          <Link
            to="/about"
            className="hover:text-primary-container transition-colors"
          >
            About
          </Link>
          <Link
            to="/community"
            className="hover:text-primary-container transition-colors"
          >
            Community
          </Link>
          <a
            href="#terms"
            onClick={(e) => e.preventDefault()}
            className="hover:text-primary-container transition-colors"
          >
            Terms
          </a>
          <a
            href="#privacy"
            onClick={(e) => e.preventDefault()}
            className="hover:text-primary-container transition-colors"
          >
            Privacy
          </a>
          <a
            href="#support"
            onClick={(e) => e.preventDefault()}
            className="hover:text-primary-container transition-colors"
          >
            Support
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

