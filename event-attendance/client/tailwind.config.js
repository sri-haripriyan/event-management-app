/** @type {import('tailwindcss').Config} */
export default {
	content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
	theme: {
		fontSize: {
			xs: ["12px", "16px"],
			sm: ["14px", "20px"],
			base: ["16px", "19.5px"],
			lg: ["18px", "21.94px"],
			xl: ["20px", "24.38px"],
			"2xl": ["24px", "29.26px"],
			"3xl": ["28px", "50px"],
			"4xl": ["48px", "58px"],
			"8xl": ["96px", "106px"],
		},
		inputStyle: ["bg-black p-2"],
		extend: {
			fontFamily: {
				palanquin: ["Palanquin", "sans-serif"],
				montserrat: ["Montserrat", "sans-serif"],
			},
			fontFamily: {
				poppins: ['"poppins"', "sans-serif"], // Add your custom font here
				roboto: ["Roboto", "sans-serif"], // Example for local fonts
				mochiy: ['"Mochiy Pop One"', "sans-serif"],
			},
			colors: {
				primary: "#1F1F1F",
				secondary: "#AB57Fa",
				background: "#31312f",
				lightrose: "#df73c4",
				lightblue: "#1cd0c7",
				accent: "#1abc9c",
				richblack: "#0D0C1D",
				oxford_blue: "#161B33",
				ultra_violet: "#474973",
				lavender_bush: "#F6E8EA",
			},
			boxShadow: {
				"3xl": "0 10px 40px rgba(0, 0, 0, 0.1)",
			},
			screens: {
				wide: "1440px",
			},
		},
	},
	plugins: [],
};
