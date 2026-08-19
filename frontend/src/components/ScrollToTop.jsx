import { useState, useEffect } from "react";
import { IoIosArrowDropupCircle } from "react-icons/io";

const ScrollToTop = () => {
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowButton(window.scrollY > 300);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      {showButton && (
        <button
          onClick={scrollToTop}
          className=" fixed bottom-5 right-5 text-slate-700 bg-slate-300 rounded-full   transition-all">
          <IoIosArrowDropupCircle size={35} />
        </button>
      )}
    </>
  );
};

export default ScrollToTop;
